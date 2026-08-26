<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Unit;
use App\Modules\Catalogue\Actions\CreateUnitAction;
use App\Modules\Catalogue\Actions\DeleteUnitAction;
use App\Modules\Catalogue\Actions\UpdateUnitAction;
use App\Modules\Catalogue\Requests\StoreUnitRequest;
use App\Modules\Catalogue\Requests\UpdateUnitRequest;
use App\Modules\Catalogue\Resources\UnitResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

final class UnitController extends Controller
{
    /**
     * GET /v1/units
     */
    public function index(Request $request): JsonResponse
    {
        // §5.6 — reject unknown query params
        $allowed = ['type', 'is_active', 'is_base', 'q', 'sort', 'page', 'per_page'];
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ErrorResponse::make(
                request: $request,
                code: 'VALIDATION_FAILED',
                message: 'Unknown query parameter(s): '.implode(', ', $unknown),
                httpStatus: 422,
                retryable: false,
            );
        }

        $query = Unit::query();

        // Whitelisted filters
        $typeVal = $request->input('type');
        if (is_string($typeVal)) {
            $query->where('type', $typeVal);
        }
        $activeVal = $request->input('is_active');
        if (is_string($activeVal)) {
            $query->where('is_active', filter_var($activeVal, FILTER_VALIDATE_BOOLEAN));
        }
        $baseVal = $request->input('is_base');
        if (is_string($baseVal)) {
            $query->where('is_base', filter_var($baseVal, FILTER_VALIDATE_BOOLEAN));
        }

        // Search: q param, min 2 chars, searches code and name
        $qParam = $request->input('q');
        if (is_string($qParam) && mb_strlen($qParam) >= 2) {
            $search = '%'.$qParam.'%';
            $query->where(fn ($qr) => $qr->where('code', 'like', $search)->orWhere('name', 'like', $search));
        }

        // Sort: comma-separated, -prefix for desc, whitelist, id tiebreaker
        $sortRaw = $request->input('sort', 'id');
        $sortParam = is_string($sortRaw) ? $sortRaw : 'id';
        $sortAllowed = ['id', 'code', 'name', 'type', 'is_base', 'is_active', 'created_at', 'updated_at'];
        foreach (explode(',', $sortParam) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, $sortAllowed, true)) {
                $query->orderBy($field, $desc ? 'desc' : 'asc');
            }
        }
        $query->orderBy('id', 'asc'); // deterministic tiebreaker

        // Pagination
        $perPageRaw = $request->input('per_page', 25);
        /** @phpstan-ignore cast.int */
        $perPage = is_int($perPageRaw) ? $perPageRaw : (int) $perPageRaw;
        if ($perPage > 100) {
            return ErrorResponse::make(
                request: $request,
                code: 'VALIDATION_FAILED',
                message: 'per_page must not exceed 100.',
                httpStatus: 422,
                retryable: false,
            );
        }
        $pageRaw = $request->input('page', 1);
        /** @phpstan-ignore cast.int */
        $page = is_int($pageRaw) ? $pageRaw : (int) $pageRaw;

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        /** @var array<string, mixed> $filters */
        $filters = [];
        foreach (['type', 'is_active', 'is_base', 'q'] as $f) {
            if ($request->filled($f)) {
                $filters[$f] = $request->input($f);
            }
        }

        $searchApplied = $request->input('q');

        return response()->json([
            'success' => true,
            'data' => UnitResource::collection($paginated->items()),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'pagination' => [
                    'page' => $paginated->currentPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'total_pages' => $paginated->lastPage(),
                    'has_more' => $paginated->hasMorePages(),
                ],
                'applied' => [
                    'filters' => $filters,
                    'sort' => $sortParam,
                    'search' => is_string($searchApplied) ? $searchApplied : null,
                ],
            ],
        ]);
    }

    /**
     * GET /v1/units/{unit}
     */
    public function show(Request $request, Unit $unit): JsonResponse
    {
        // Tenant isolation: route model binding doesn't use the global scope
        // (tenant.resolve runs after SubstituteBindings), so verify here.
        if (TenantContext::isBound() && $unit->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false,
            );
        }

        return response()->json([
            'success' => true,
            'data' => new UnitResource($unit),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            ],
        ]);
    }

    /**
     * GET /v1/units/options
     */
    public function options(Request $request): JsonResponse
    {
        $query = Unit::query()->where('is_active', true)->orderBy('name');

        $typeVal = $request->input('type');
        if (is_string($typeVal)) {
            $query->where('type', $typeVal);
        }

        /** @var Collection<int, array{id: string, label: string}> $items */
        $items = $query->get()->map(static fn (Unit $u) => [
            'id' => (string) $u->uuid,
            'label' => ((string) $u->name).' ('.((string) $u->code).')',
        ])->values();

        return response()->json([
            'success' => true,
            'data' => $items->all(),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            ],
        ]);
    }

    /**
     * POST /v1/units
     */
    public function store(StoreUnitRequest $request, CreateUnitAction $action): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validated();

        /** @var array{unit: Unit} $result */
        $result = $action->execute([
            'user' => $user,
            /** @phpstan-ignore cast.string */
            'code' => (string) ($validated['code'] ?? ''),
            /** @phpstan-ignore cast.string */
            'name' => (string) ($validated['name'] ?? ''),
            /** @phpstan-ignore cast.string */
            'type' => (string) ($validated['type'] ?? ''),
            'is_base' => (bool) ($validated['is_base'] ?? false),
            /** @phpstan-ignore cast.int */
            'precision' => (int) ($validated['precision'] ?? 2),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        $unit = $result['unit'];

        return response()->json([
            'success' => true,
            'data' => new UnitResource($unit),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            ],
        ], 201)->header('Location', '/v1/units/'.$unit->uuid);
    }

    /**
     * PATCH /v1/units/{unit}
     */
    public function update(UpdateUnitRequest $request, UpdateUnitAction $action, Unit $unit): JsonResponse
    {
        // Tenant isolation guard.
        if (TenantContext::isBound() && $unit->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false,
            );
        }

        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validated();
        /** @var array{user: \App\Models\User, unit: Unit, code?: string, name?: string, type?: string, is_base?: bool, precision?: int, is_active?: bool} $payload */
        $payload = ['user' => $user, 'unit' => $unit];
        foreach (['code', 'name', 'type'] as $stringKey) {
            if (array_key_exists($stringKey, $validated)) {
                /** @phpstan-ignore cast.string */
                $payload[$stringKey] = (string) $validated[$stringKey];
            }
        }
        foreach (['is_base', 'is_active'] as $boolKey) {
            if (array_key_exists($boolKey, $validated)) {
                $payload[$boolKey] = (bool) $validated[$boolKey];
            }
        }
        if (array_key_exists('precision', $validated)) {
            /** @phpstan-ignore cast.int */
            $payload['precision'] = (int) $validated['precision'];
        }

        /** @var array{unit: Unit} $result */
        $result = $action->execute($payload);

        return response()->json([
            'success' => true,
            'data' => new UnitResource($result['unit']),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            ],
        ]);
    }

    /**
     * DELETE /v1/units/{unit}
     */
    public function destroy(Request $request, DeleteUnitAction $action, Unit $unit): JsonResponse
    {
        // Tenant isolation guard.
        if (TenantContext::isBound() && $unit->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false,
            );
        }

        /** @var \App\Models\User $user */
        $user = $request->user();

        $action->execute([
            'user' => $user,
            'unit' => $unit,
        ]);

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            ],
        ]);
    }
}
