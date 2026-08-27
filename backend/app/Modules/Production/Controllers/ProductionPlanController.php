<?php

declare(strict_types=1);

namespace App\Modules\Production\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\ProductionPlan;
use App\Models\User;
use App\Modules\Production\Actions\ApproveProductionPlanAction;
use App\Modules\Production\Actions\CreateProductionPlanAction;
use App\Modules\Production\Actions\DeleteProductionPlanAction;
use App\Modules\Production\Actions\UpdateProductionPlanAction;
use App\Modules\Production\Requests\StoreProductionPlanRequest;
use App\Modules\Production\Requests\UpdateProductionPlanRequest;
use App\Modules\Production\Resources\ProductionPlanResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ProductionPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['status', 'source', 'plan_date', 'period_start', 'period_end', 'q', 'sort', 'page', 'per_page'];
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

        $query = ProductionPlan::query()->with(['items.product', 'items.billOfMaterial', 'items.unit', 'approver']);

        foreach (['status', 'source', 'plan_date'] as $field) {
            $value = $request->input($field);
            if (is_string($value)) {
                $query->where($field, $value);
            }
        }

        $search = $request->input('q');
        if (is_string($search) && mb_strlen($search) >= 2) {
            $like = '%'.$search.'%';
            $query->where(fn ($q) => $q->where('plan_number', 'like', $like)->orWhere('notes', 'like', $like));
        }

        $sortRaw = $request->input('sort', 'id');
        $sort = is_string($sortRaw) ? $sortRaw : 'id';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'plan_number', 'plan_date', 'period_start', 'period_end', 'status', 'created_at'], true)) {
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
            'data' => ProductionPlanResource::collection($paginated->items()),
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
                    'search' => is_string($search) ? $search : null,
                ],
            ],
        ]);
    }

    public function show(Request $request, ProductionPlan $productionPlan): JsonResponse
    {
        if (TenantContext::isBound() && $productionPlan->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false
            );
        }

        $productionPlan->load(['items.product', 'items.billOfMaterial', 'items.unit', 'approver']);

        return response()->json([
            'success' => true,
            'data' => new ProductionPlanResource($productionPlan),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function store(StoreProductionPlanRequest $request, CreateProductionPlanAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, ...$request->validated()]);

        return response()->json([
            'success' => true,
            'data' => new ProductionPlanResource($result['productionPlan']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ], 201)->header('Location', '/v1/production/plans/'.$result['productionPlan']->uuid);
    }

    public function update(UpdateProductionPlanRequest $request, UpdateProductionPlanAction $action, ProductionPlan $productionPlan): JsonResponse
    {
        if (TenantContext::isBound() && $productionPlan->tenant_id !== TenantContext::current()->tenantId()) {
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
            'productionPlan' => $productionPlan,
            ...$request->validated(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new ProductionPlanResource($result['productionPlan']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function approve(Request $request, ApproveProductionPlanAction $action, ProductionPlan $productionPlan): JsonResponse
    {
        if (TenantContext::isBound() && $productionPlan->tenant_id !== TenantContext::current()->tenantId()) {
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
            'productionPlan' => $productionPlan,
        ]);

        return response()->json([
            'success' => true,
            'data' => new ProductionPlanResource($result['productionPlan']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function destroy(Request $request, DeleteProductionPlanAction $action, ProductionPlan $productionPlan): JsonResponse
    {
        if (TenantContext::isBound() && $productionPlan->tenant_id !== TenantContext::current()->tenantId()) {
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
            'productionPlan' => $productionPlan,
        ]);

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }
}
