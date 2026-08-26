<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Modules\Catalogue\Actions\CreateCategoryAction;
use App\Modules\Catalogue\Actions\DeleteCategoryAction;
use App\Modules\Catalogue\Actions\UpdateCategoryAction;
use App\Modules\Catalogue\Requests\StoreCategoryRequest;
use App\Modules\Catalogue\Requests\UpdateCategoryRequest;
use App\Modules\Catalogue\Resources\CategoryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

final class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['parent_id', 'is_active', 'q', 'sort', 'page', 'per_page', 'include'];
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'Unknown query parameter(s): '.implode(', ', $unknown), httpStatus: 422, retryable: false);
        }
        $query = Category::query();
        $parentUuid = $request->input('parent_id');
        if (is_string($parentUuid)) {
            $parent = Category::withoutGlobalScope('tenant')->where('tenant_id', TenantContext::current()->tenantId())->where('uuid', $parentUuid)->first();
            if ($parent === null) {
                return response()->json(['success' => true, 'data' => [], 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', ''), 'pagination' => ['page' => 1, 'per_page' => 25, 'total' => 0, 'total_pages' => 1, 'has_more' => false], 'applied' => ['filters' => ['parent_id' => $parentUuid], 'sort' => 'id', 'search' => null]]]);
            }
            $query->where('parent_id', $parent->getKey());
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
            if (in_array($field, ['id', 'code', 'name', 'is_active', 'created_at', 'updated_at'], true)) {
                $query->orderBy($field, $desc ? 'desc' : 'asc');
            }
        }
        $query->orderBy('id');
        $include = $request->input('include');
        $includeValues = is_string($include) ? explode(',', $include) : [];
        if (in_array('parent', $includeValues, true)) {
            $query->with('parent');
        }
        if (in_array('children', $includeValues, true)) {
            $query->with('children');
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
        foreach (['parent_id', 'is_active', 'q'] as $filter) {
            if ($request->filled($filter)) {
                $filters[$filter] = $request->input($filter);
            }
        }

        return response()->json(['success' => true, 'data' => CategoryResource::collection($paginated->items()), 'meta' => [
            'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            'pagination' => ['page' => $paginated->currentPage(), 'per_page' => $paginated->perPage(), 'total' => $paginated->total(), 'total_pages' => $paginated->lastPage(), 'has_more' => $paginated->hasMorePages()],
            'applied' => ['filters' => $filters, 'sort' => $sort, 'search' => is_string($search) ? $search : null],
        ]]);
    }

    public function show(Request $request, Category $category): JsonResponse
    {
        if (TenantContext::isBound() && $category->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        $includeRaw = $request->query('include', '');
        $include = is_string($includeRaw) ? explode(',', $includeRaw) : [];
        if (in_array('parent', $include, true)) {
            $category->load('parent');
        }
        if (in_array('children', $include, true)) {
            $category->load('children');
        }

        return response()->json(['success' => true, 'data' => new CategoryResource($category), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function options(Request $request): JsonResponse
    {
        $items = Category::query()->where('is_active', true)->orderBy('name')->get()->map(static fn (Category $category) => ['id' => (string) $category->uuid, 'label' => (string) $category->path])->values();

        /** @var Collection<int, array{id: string, label: string}> $items */
        return response()->json(['success' => true, 'data' => $items->all(), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function store(StoreCategoryRequest $request, CreateCategoryAction $action): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $validated = $request->validated();
        $result = $action->execute(['user' => $user, 'parent_id' => is_string($validated['parent_id'] ?? null) ? $validated['parent_id'] : null, 'code' => is_string($validated['code'] ?? null) ? $validated['code'] : '', 'name' => is_string($validated['name'] ?? null) ? $validated['name'] : '', 'is_active' => isset($validated['is_active']) ? (bool) $validated['is_active'] : true]);

        return response()->json(['success' => true, 'data' => new CategoryResource($result['category']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]], 201)->header('Location', '/v1/categories/'.$result['category']->uuid);
    }

    public function update(UpdateCategoryRequest $request, UpdateCategoryAction $action, Category $category): JsonResponse
    {
        if (TenantContext::isBound() && $category->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $validated = $request->validated();
        /** @var array{user: \App\Models\User, category: Category, parent_id?: string|null, code?: string, name?: string, is_active?: bool} $payload */
        $payload = ['user' => $user, 'category' => $category];
        foreach (['code', 'name'] as $key) {
            if (array_key_exists($key, $validated)) {
                $payload[$key] = is_string($validated[$key]) ? $validated[$key] : '';
            }
        }
        if (array_key_exists('parent_id', $validated)) {
            $payload['parent_id'] = is_string($validated['parent_id']) ? $validated['parent_id'] : null;
        }
        if (array_key_exists('is_active', $validated)) {
            $payload['is_active'] = (bool) $validated['is_active'];
        }
        $result = $action->execute($payload);

        return response()->json(['success' => true, 'data' => new CategoryResource($result['category']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function destroy(Request $request, DeleteCategoryAction $action, Category $category): JsonResponse
    {
        if (TenantContext::isBound() && $category->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $action->execute(['user' => $user, 'category' => $category]);

        return response()->json(['success' => true, 'data' => null, 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }
}
