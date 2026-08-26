<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\BillOfMaterial;
use App\Modules\Catalogue\Actions\CreateBillOfMaterialAction;
use App\Modules\Catalogue\Actions\DeleteBillOfMaterialAction;
use App\Modules\Catalogue\Actions\UpdateBillOfMaterialAction;
use App\Modules\Catalogue\Requests\StoreBillOfMaterialRequest;
use App\Modules\Catalogue\Requests\UpdateBillOfMaterialRequest;
use App\Modules\Catalogue\Resources\BillOfMaterialResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BillOfMaterialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['product_id', 'status', 'effective_from', 'q', 'sort', 'page', 'per_page'];
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'Unknown query parameter(s): '.implode(', ', $unknown), httpStatus: 422, retryable: false);
        }
        $query = BillOfMaterial::query()->with(['product', 'outputUnit', 'items.product', 'items.unit']);
        foreach (['status', 'effective_from'] as $field) {
            $value = $request->input($field);
            if (is_string($value)) {
                $query->where($field, $value);
            }
        }
        $productUuid = $request->input('product_id');
        if (is_string($productUuid)) {
            $query->whereHas('product', fn ($product) => $product->where('products.uuid', $productUuid));
        }
        $search = $request->input('q');
        if (is_string($search) && mb_strlen($search) >= 2) {
            $like = '%'.$search.'%';
            $query->where(fn ($q) => $q->where('version', 'like', $like)->orWhere('name', 'like', $like));
        }
        $sortRaw = $request->input('sort', 'id');
        $sort = is_string($sortRaw) ? $sortRaw : 'id';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'version', 'name', 'status', 'effective_from', 'created_at', 'updated_at'], true)) {
                $query->orderBy($field, $desc ? 'desc' : 'asc');
            }
        }
        $query->orderBy('id');
        $perPageRaw = $request->input('per_page', 25);
        /** @phpstan-ignore cast.int */
        $perPage = is_int($perPageRaw) ? $perPageRaw : (int) $perPageRaw;
        if ($perPage > 100) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'per_page must not exceed 100.', httpStatus: 422, retryable: false);
        }
        $pageRaw = $request->input('page', 1);
        /** @phpstan-ignore cast.int */
        $page = is_int($pageRaw) ? $pageRaw : (int) $pageRaw;
        $paginated = $query->paginate($perPage, ['*'], 'page', $page);
        return response()->json(['success' => true, 'data' => BillOfMaterialResource::collection($paginated->items()), 'meta' => [
            'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            'pagination' => ['page' => $paginated->currentPage(), 'per_page' => $paginated->perPage(), 'total' => $paginated->total(), 'total_pages' => $paginated->lastPage(), 'has_more' => $paginated->hasMorePages()],
            'applied' => ['filters' => [], 'sort' => $sort, 'search' => is_string($search) ? $search : null],
        ]]);
    }

    public function show(Request $request, BillOfMaterial $billOfMaterial): JsonResponse
    {
        if (TenantContext::isBound() && $billOfMaterial->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        $billOfMaterial->load(['product', 'outputUnit', 'items.product', 'items.unit']);
        return response()->json(['success' => true, 'data' => new BillOfMaterialResource($billOfMaterial), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function store(StoreBillOfMaterialRequest $request, CreateBillOfMaterialAction $action): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, ...$request->validated()]);
        return response()->json(['success' => true, 'data' => new BillOfMaterialResource($result['billOfMaterial']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]], 201)->header('Location', '/v1/bill-of-materials/'.$result['billOfMaterial']->uuid);
    }

    public function update(UpdateBillOfMaterialRequest $request, UpdateBillOfMaterialAction $action, BillOfMaterial $billOfMaterial): JsonResponse
    {
        if (TenantContext::isBound() && $billOfMaterial->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, 'billOfMaterial' => $billOfMaterial, ...$request->validated()]);
        return response()->json(['success' => true, 'data' => new BillOfMaterialResource($result['billOfMaterial']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function destroy(Request $request, DeleteBillOfMaterialAction $action, BillOfMaterial $billOfMaterial): JsonResponse
    {
        if (TenantContext::isBound() && $billOfMaterial->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $action->execute(['user' => $user, 'billOfMaterial' => $billOfMaterial]);
        return response()->json(['success' => true, 'data' => null, 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }
}
