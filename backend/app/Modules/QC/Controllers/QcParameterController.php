<?php

declare(strict_types=1);

namespace App\Modules\QC\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\QcParameter;
use App\Models\User;
use App\Modules\QC\Actions\CreateQcParameterAction;
use App\Modules\QC\Actions\DeleteQcParameterAction;
use App\Modules\QC\Actions\UpdateQcParameterAction;
use App\Modules\QC\Requests\StoreQcParameterRequest;
use App\Modules\QC\Requests\UpdateQcParameterRequest;
use App\Modules\QC\Resources\QcParameterResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class QcParameterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['product_id', 'type', 'is_mandatory', 'q', 'sort', 'page', 'per_page'];
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ErrorResponse::make(
                request: $request,
                code: 'VALIDATION_FAILED',
                message: 'Unknown query parameter(s): '.implode(', ', $unknown),
                httpStatus: 422,
                retryable: false
            );
        }

        $query = QcParameter::query()->with(['product', 'unit']);

        $productUuid = $request->input('product_id');
        if (is_string($productUuid)) {
            $query->whereHas('product', fn ($prod) => $prod->where('products.uuid', $productUuid));
        }

        $type = $request->input('type');
        if (is_string($type)) {
            $query->where('type', $type);
        }

        if ($request->has('is_mandatory')) {
            $query->where('is_mandatory', $request->boolean('is_mandatory') ? 1 : 0);
        }

        $search = $request->input('q');
        if (is_string($search) && mb_strlen($search) >= 2) {
            $query->where('name', 'like', '%'.$search.'%');
        }

        $sortRaw = $request->input('sort', 'sort_order');
        $sort = is_string($sortRaw) ? $sortRaw : 'sort_order';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'name', 'type', 'sort_order', 'created_at'], true)) {
                $query->orderBy($field, $desc ? 'desc' : 'asc');
            }
        }
        $query->orderBy('id');

        $perPageRaw = $request->input('per_page', 25);
        /** @phpstan-ignore cast.int */
        $perPage = is_int($perPageRaw) ? $perPageRaw : (int) $perPageRaw;
        if ($perPage > 100) {
            return ErrorResponse::make(
                request: $request,
                code: 'VALIDATION_FAILED',
                message: 'per_page must not exceed 100.',
                httpStatus: 422,
                retryable: false
            );
        }

        $pageRaw = $request->input('page', 1);
        /** @phpstan-ignore cast.int */
        $page = is_int($pageRaw) ? $pageRaw : (int) $pageRaw;
        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => QcParameterResource::collection($paginated->items()),
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
                    'filters' => [],
                    'sort' => $sort,
                ],
            ],
        ]);
    }

    public function show(Request $request, QcParameter $qcParameter): JsonResponse
    {
        if (TenantContext::isBound() && $qcParameter->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false
            );
        }

        $qcParameter->load(['product', 'unit']);

        return response()->json([
            'success' => true,
            'data' => new QcParameterResource($qcParameter),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function store(StoreQcParameterRequest $request, CreateQcParameterAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, ...$request->validated()]);

        return response()->json([
            'success' => true,
            'data' => new QcParameterResource($result['qcParameter']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ], 201)->header('Location', '/v1/qc/parameters/'.$result['qcParameter']->uuid);
    }

    public function update(UpdateQcParameterRequest $request, UpdateQcParameterAction $action, QcParameter $qcParameter): JsonResponse
    {
        if (TenantContext::isBound() && $qcParameter->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false
            );
        }

        /** @var User $user */
        $user = $request->user();
        $result = $action->execute([
            'user' => $user,
            'qcParameter' => $qcParameter,
            ...$request->validated(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new QcParameterResource($result['qcParameter']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function destroy(Request $request, DeleteQcParameterAction $action, QcParameter $qcParameter): JsonResponse
    {
        if (TenantContext::isBound() && $qcParameter->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false
            );
        }

        /** @var User $user */
        $user = $request->user();
        $action->execute([
            'user' => $user,
            'qcParameter' => $qcParameter,
        ]);

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }
}
