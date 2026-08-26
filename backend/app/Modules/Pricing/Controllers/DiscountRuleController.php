<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\DiscountRule;
use App\Modules\Pricing\Actions\CreateDiscountRuleAction;
use App\Modules\Pricing\Actions\DeleteDiscountRuleAction;
use App\Modules\Pricing\Actions\UpdateDiscountRuleAction;
use App\Modules\Pricing\Requests\StoreDiscountRuleRequest;
use App\Modules\Pricing\Requests\UpdateDiscountRuleRequest;
use App\Modules\Pricing\Resources\DiscountRuleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class DiscountRuleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['scope', 'discount_type', 'is_active', 'q', 'sort', 'page', 'per_page'];
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'Unknown query parameter(s): '.implode(', ', $unknown), httpStatus: 422, retryable: false);
        }
        $query = DiscountRule::query();
        foreach (['scope', 'discount_type'] as $field) {
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
            $query->where('name', 'like', '%'.$search.'%');
        }
        $sortRaw = $request->input('sort', 'id');
        $sort = is_string($sortRaw) ? $sortRaw : 'id';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'name', 'scope', 'priority', 'is_active', 'created_at', 'updated_at'], true)) {
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
        $filters = [];
        foreach (['scope', 'discount_type', 'is_active', 'q'] as $filter) {
            if ($request->filled($filter)) {
                $filters[$filter] = $request->input($filter);
            }
        }

        return response()->json(['success' => true, 'data' => DiscountRuleResource::collection($paginated->items()), 'meta' => [
            'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            'pagination' => ['page' => $paginated->currentPage(), 'per_page' => $paginated->perPage(), 'total' => $paginated->total(), 'total_pages' => $paginated->lastPage(), 'has_more' => $paginated->hasMorePages()],
            'applied' => ['filters' => $filters, 'sort' => $sort, 'search' => is_string($search) ? $search : null],
        ]]);
    }

    public function show(Request $request, DiscountRule $discountRule): JsonResponse
    {
        if (TenantContext::isBound() && $discountRule->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }

        return response()->json(['success' => true, 'data' => new DiscountRuleResource($discountRule), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function store(StoreDiscountRuleRequest $request, CreateDiscountRuleAction $action): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, ...$request->validated()]);

        return response()->json(['success' => true, 'data' => new DiscountRuleResource($result['discountRule']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]], 201)->header('Location', '/v1/discount-rules/'.$result['discountRule']->uuid);
    }

    public function update(UpdateDiscountRuleRequest $request, UpdateDiscountRuleAction $action, DiscountRule $discountRule): JsonResponse
    {
        if (TenantContext::isBound() && $discountRule->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, 'discountRule' => $discountRule, ...$request->validated()]);

        return response()->json(['success' => true, 'data' => new DiscountRuleResource($result['discountRule']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function destroy(Request $request, DeleteDiscountRuleAction $action, DiscountRule $discountRule): JsonResponse
    {
        if (TenantContext::isBound() && $discountRule->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $action->execute(['user' => $user, 'discountRule' => $discountRule]);

        return response()->json(['success' => true, 'data' => null, 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }
}
