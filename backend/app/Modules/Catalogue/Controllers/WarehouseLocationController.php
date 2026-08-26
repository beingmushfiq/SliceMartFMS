<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Modules\Catalogue\Actions\CreateWarehouseLocationAction;
use App\Modules\Catalogue\Actions\DeleteWarehouseLocationAction;
use App\Modules\Catalogue\Actions\UpdateWarehouseLocationAction;
use App\Modules\Catalogue\Requests\StoreWarehouseLocationRequest;
use App\Modules\Catalogue\Requests\UpdateWarehouseLocationRequest;
use App\Modules\Catalogue\Resources\WarehouseLocationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class WarehouseLocationController extends Controller
{
    public function index(Request $request, Warehouse $warehouse): JsonResponse
    {
        $allowed = ['type', 'is_active', 'q', 'sort', 'page', 'per_page'];
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'Unknown query parameter(s): '.implode(', ', $unknown), httpStatus: 422, retryable: false);
        }

        if (TenantContext::isBound() && $warehouse->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }

        $query = $warehouse->locations();
        foreach (['type'] as $field) {
            $value = $request->input($field);
            if (is_string($value)) {
                $query->where($field, $value);
            }
        }

        $active = $request->input('is_active');
        if (is_string($active)) {
            $query->where('is_active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
        }

        $search = $request->input('q');
        if (is_string($search) && mb_strlen($search) >= 2) {
            $like = '%'.$search.'%';
            $query->where(fn ($q) => $q->where('code', 'like', $like)->orWhere('name', 'like', $like));
        }

        $sortRaw = $request->input('sort', 'id');
        $sort = is_string($sortRaw) ? $sortRaw : 'id';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'code', 'name', 'type', 'is_active', 'created_at', 'updated_at'], true)) {
                $query->orderBy($field, $desc ? 'desc' : 'asc');
            }
        }
        $query->orderBy('id');

        $perPageRaw = $request->input('per_page', 25);
        /** @phpstan-ignore cast.int */ $perPage = is_int($perPageRaw) ? $perPageRaw : (int) $perPageRaw;
        if ($perPage > 100) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'per_page must not exceed 100.', httpStatus: 422, retryable: false);
        }

        $pageRaw = $request->input('page', 1);
        /** @phpstan-ignore cast.int */ $page = is_int($pageRaw) ? $pageRaw : (int) $pageRaw;
        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json(['success' => true, 'data' => WarehouseLocationResource::collection($paginated->items()), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', ''), 'pagination' => ['page' => $paginated->currentPage(), 'per_page' => $paginated->perPage(), 'total' => $paginated->total(), 'total_pages' => $paginated->lastPage(), 'has_more' => $paginated->hasMorePages()], 'applied' => ['filters' => [], 'sort' => $sort, 'search' => is_string($search) ? $search : null]]]);
    }

    public function show(Request $request, Warehouse $warehouse, WarehouseLocation $location): JsonResponse
    {
        if (TenantContext::isBound() && $warehouse->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }

        if ($location->warehouse_id !== $warehouse->id) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }

        if ($request->query('include') === 'parent') {
            $location->load('parent');
        }

        return response()->json(['success' => true, 'data' => new WarehouseLocationResource($location), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function store(StoreWarehouseLocationRequest $request, Warehouse $warehouse, CreateWarehouseLocationAction $action): JsonResponse
    {
        if (TenantContext::isBound() && $warehouse->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }

        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, 'warehouse' => $warehouse, ...$request->validated()]);

        return response()->json(['success' => true, 'data' => new WarehouseLocationResource($result['location']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]], 201)->header('Location', '/v1/warehouses/'.$warehouse->uuid.'/locations/'.$result['location']->uuid);
    }

    public function update(UpdateWarehouseLocationRequest $request, Warehouse $warehouse, WarehouseLocation $location, UpdateWarehouseLocationAction $action): JsonResponse
    {
        if (TenantContext::isBound() && $warehouse->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        if ($location->warehouse_id !== $warehouse->id) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }

        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, 'warehouse' => $warehouse, 'location' => $location, ...$request->validated()]);

        return response()->json(['success' => true, 'data' => new WarehouseLocationResource($result['location']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function destroy(Request $request, Warehouse $warehouse, WarehouseLocation $location, DeleteWarehouseLocationAction $action): JsonResponse
    {
        if (TenantContext::isBound() && $warehouse->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        if ($location->warehouse_id !== $warehouse->id) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }

        /** @var \App\Models\User $user */
        $user = $request->user();
        $action->execute(['user' => $user, 'warehouse' => $warehouse, 'location' => $location]);

        return response()->json(['success' => true, 'data' => null, 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }
}
