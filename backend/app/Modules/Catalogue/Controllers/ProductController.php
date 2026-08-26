<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Modules\Catalogue\Actions\CreateProductAction;
use App\Modules\Catalogue\Actions\DeleteProductAction;
use App\Modules\Catalogue\Actions\UpdateProductAction;
use App\Modules\Catalogue\Requests\StoreProductRequest;
use App\Modules\Catalogue\Requests\UpdateProductRequest;
use App\Modules\Catalogue\Resources\ProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['type', 'status', 'category_id', 'brand_id', 'is_online', 'q', 'sort', 'page', 'per_page', 'include'];
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'Unknown query parameter(s): '.implode(', ', $unknown), httpStatus: 422, retryable: false);
        }
        $tenantId = TenantContext::current()->tenantId();
        $query = Product::query();
        foreach (['type', 'status'] as $field) {
            $value = $request->input($field);
            if (is_string($value)) {
                $query->where($field, $value);
            }
        }
        foreach (['category_id', 'brand_id'] as $field) {
            $value = $request->input($field);
            if (is_string($value)) {
                $query->where($field, function ($subquery) use ($field, $value, $tenantId): void {
                    $relation = $field === 'category_id' ? 'categories' : 'brands';
                    $subquery->from($relation)->select('id')->where($relation.'.tenant_id', $tenantId)->where($relation.'.uuid', $value);
                });
            }
        }
        $online = $request->input('is_online');
        if (is_string($online)) {
            $query->where('is_online', filter_var($online, FILTER_VALIDATE_BOOLEAN));
        }
        $search = $request->input('q');
        if (is_string($search) && mb_strlen($search) >= 2) {
            $like = '%'.$search.'%';
            $query->where(fn ($q) => $q->where('sku', 'like', $like)->orWhere('name', 'like', $like)->orWhere('barcode', 'like', $like));
        }
        $sortRaw = $request->input('sort', 'id');
        $sort = is_string($sortRaw) ? $sortRaw : 'id';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'sku', 'name', 'type', 'status', 'created_at', 'updated_at'], true)) {
                $query->orderBy($field, $desc ? 'desc' : 'asc');
            }
        }
        $query->orderBy('id');
        $include = $request->input('include');
        if (is_string($include)) {
            $relations = array_intersect(explode(',', $include), ['category', 'brand', 'baseUnit', 'purchaseUnit', 'salesUnit', 'taxProfile']);
            if ($relations !== []) {
                $query->with(array_values($relations));
            }
        }
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
        $filters = [];
        foreach (['type', 'status', 'category_id', 'brand_id', 'is_online', 'q'] as $field) {
            if ($request->filled($field)) {
                $filters[$field] = $request->input($field);
            }
        }

        return response()->json(['success' => true, 'data' => ProductResource::collection($paginated->items()), 'meta' => [
            'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            'pagination' => ['page' => $paginated->currentPage(), 'per_page' => $paginated->perPage(), 'total' => $paginated->total(), 'total_pages' => $paginated->lastPage(), 'has_more' => $paginated->hasMorePages()],
            'applied' => ['filters' => $filters, 'sort' => $sort, 'search' => is_string($search) ? $search : null],
        ]]);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        if (TenantContext::isBound() && $product->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        $includeRaw = $request->query('include', '');
        if (is_string($includeRaw)) {
            $relations = array_intersect(explode(',', $includeRaw), ['category', 'brand', 'baseUnit', 'purchaseUnit', 'salesUnit', 'taxProfile']);
            if ($relations !== []) {
                $product->load(array_values($relations));
            }
        }

        return response()->json(['success' => true, 'data' => new ProductResource($product), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function options(Request $request): JsonResponse
    {
        $items = Product::query()->where('status', 'active')->orderBy('name')->get()->map(static fn (Product $product) => ['id' => (string) $product->uuid, 'label' => $product->name.' ('.$product->sku.')'])->values();

        return response()->json(['success' => true, 'data' => $items->all(), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function store(StoreProductRequest $request, CreateProductAction $action): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, ...$request->validated()]);

        return response()->json(['success' => true, 'data' => new ProductResource($result['product']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]], 201)->header('Location', '/v1/products/'.$result['product']->uuid);
    }

    public function update(UpdateProductRequest $request, UpdateProductAction $action, Product $product): JsonResponse
    {
        if (TenantContext::isBound() && $product->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, 'product' => $product, ...$request->validated()]);

        return response()->json(['success' => true, 'data' => new ProductResource($result['product']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function destroy(Request $request, DeleteProductAction $action, Product $product): JsonResponse
    {
        if (TenantContext::isBound() && $product->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $action->execute(['user' => $user, 'product' => $product]);

        return response()->json(['success' => true, 'data' => null, 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }
}
