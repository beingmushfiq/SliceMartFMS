<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Models\User;
use App\Modules\Catalogue\Actions\CreatePartyAction;
use App\Modules\Catalogue\Actions\DeletePartyAction;
use App\Modules\Catalogue\Actions\UpdatePartyAction;
use App\Modules\Catalogue\Requests\StorePartyRequest;
use App\Modules\Catalogue\Requests\UpdatePartyRequest;
use App\Modules\Catalogue\Resources\PartyResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

final class PartyController extends Controller
{
    /**
     * GET /v1/parties
     */
    public function index(Request $request): JsonResponse
    {
        $allowed = [
            'is_supplier', 'is_customer', 'is_dealer', 'is_agent',
            'type', 'status', 'assigned_to', 'q', 'sort', 'page', 'per_page',
        ];
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

        $query = Party::query();

        // Role filters
        foreach (['is_supplier', 'is_customer', 'is_dealer', 'is_agent'] as $role) {
            $val = $request->input($role);
            if (is_string($val)) {
                $query->where($role, filter_var($val, FILTER_VALIDATE_BOOLEAN));
            }
        }

        // Enum / String filters
        foreach (['type', 'status'] as $field) {
            $val = $request->input($field);
            if (is_string($val)) {
                $query->where($field, $val);
            }
        }

        // Assignee UUID filter
        $assigneeUuid = $request->input('assigned_to');
        if (is_string($assigneeUuid) && $assigneeUuid !== '') {
            $assignee = User::withoutGlobalScope('tenant')
                ->where('tenant_id', TenantContext::current()->tenantId())
                ->where('uuid', $assigneeUuid)
                ->first();
            if ($assignee !== null) {
                $query->where('assigned_to', $assignee->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // Search: code, name, phone, email
        $qParam = $request->input('q');
        if (is_string($qParam) && mb_strlen($qParam) >= 2) {
            $search = '%'.$qParam.'%';
            $query->where(fn ($qr) => $qr->where('code', 'like', $search)
                ->orWhere('name', 'like', $search)
                ->orWhere('phone', 'like', $search)
                ->orWhere('email', 'like', $search));
        }

        // Sort
        $sortRaw = $request->input('sort', 'id');
        $sortParam = is_string($sortRaw) ? $sortRaw : 'id';
        $sortAllowed = ['id', 'code', 'name', 'type', 'status', 'credit_limit', 'current_balance', 'created_at', 'updated_at'];
        foreach (explode(',', $sortParam) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, $sortAllowed, true)) {
                $query->orderBy($field, $desc ? 'desc' : 'asc');
            }
        }
        $query->orderBy('id', 'asc');

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
        foreach (['is_supplier', 'is_customer', 'is_dealer', 'is_agent', 'type', 'status', 'assigned_to', 'q'] as $f) {
            if ($request->filled($f)) {
                $filters[$f] = $request->input($f);
            }
        }

        $searchApplied = $request->input('q');

        return response()->json([
            'success' => true,
            'data' => PartyResource::collection($paginated->items()),
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
     * GET /v1/parties/{party}
     */
    public function show(Request $request, Party $party): JsonResponse
    {
        if (TenantContext::isBound() && $party->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false,
            );
        }

        $party->load(['addresses', 'contacts', 'priceList', 'taxProfile', 'assignee']);

        return response()->json([
            'success' => true,
            'data' => new PartyResource($party),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            ],
        ]);
    }

    /**
     * GET /v1/parties/options
     */
    public function options(Request $request): JsonResponse
    {
        $query = Party::query()->where('status', 'active')->orderBy('name');

        foreach (['is_supplier', 'is_customer', 'is_dealer', 'is_agent'] as $role) {
            $val = $request->input($role);
            if (is_string($val)) {
                $query->where($role, filter_var($val, FILTER_VALIDATE_BOOLEAN));
            }
        }

        /** @var Collection<int, array{id: string, label: string}> $items */
        $items = $query->get()->map(static fn (Party $p) => [
            'id' => (string) $p->uuid,
            'label' => ((string) $p->name).' ('.((string) $p->code).')',
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
     * POST /v1/parties
     */
    public function store(StorePartyRequest $request, CreatePartyAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $result = $action->execute([
            'user' => $user,
            ...$request->validated(),
        ]);

        $party = $result['party'];

        return response()->json([
            'success' => true,
            'data' => new PartyResource($party),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            ],
        ], 201)->header('Location', '/v1/parties/'.$party->uuid);
    }

    /**
     * PATCH /v1/parties/{party}
     */
    public function update(UpdatePartyRequest $request, UpdatePartyAction $action, Party $party): JsonResponse
    {
        if (TenantContext::isBound() && $party->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false,
            );
        }

        /** @var User $user */
        $user = $request->user();

        $result = $action->execute([
            'user' => $user,
            'party' => $party,
            ...$request->validated(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new PartyResource($result['party']),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            ],
        ]);
    }

    /**
     * DELETE /v1/parties/{party}
     */
    public function destroy(Request $request, DeletePartyAction $action, Party $party): JsonResponse
    {
        if (TenantContext::isBound() && $party->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false,
            );
        }

        /** @var User $user */
        $user = $request->user();

        $action->execute([
            'user' => $user,
            'party' => $party,
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
