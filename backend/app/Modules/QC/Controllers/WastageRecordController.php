<?php

declare(strict_types=1);

namespace App\Modules\QC\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WastageRecord;
use App\Modules\QC\Actions\CreateWastageRecordAction;
use App\Modules\QC\Actions\DeleteWastageRecordAction;
use App\Modules\QC\Actions\UpdateWastageRecordAction;
use App\Modules\QC\Requests\StoreWastageRecordRequest;
use App\Modules\QC\Requests\UpdateWastageRecordRequest;
use App\Modules\QC\Resources\WastageRecordResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class WastageRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['production_batch_id', 'product_id', 'stage', 'is_recoverable', 'warehouse_id', 'q', 'sort', 'page', 'per_page'];
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

        $query = WastageRecord::query()->with(['product', 'unit', 'reasonCode', 'productionBatch', 'warehouse', 'recordedByUser']);

        $productUuid = $request->input('product_id');
        if (is_string($productUuid)) {
            $query->whereHas('product', fn ($prod) => $prod->where('products.uuid', $productUuid));
        }

        $batchUuid = $request->input('production_batch_id');
        if (is_string($batchUuid)) {
            $query->whereHas('productionBatch', fn ($batch) => $batch->where('production_batches.uuid', $batchUuid));
        }

        $stage = $request->input('stage');
        if (is_string($stage)) {
            $query->where('stage', $stage);
        }

        if ($request->has('is_recoverable')) {
            $query->where('is_recoverable', $request->boolean('is_recoverable') ? 1 : 0);
        }

        $search = $request->input('q');
        if (is_string($search) && mb_strlen($search) >= 2) {
            $query->where('wastage_number', 'like', '%'.$search.'%');
        }

        $sortRaw = $request->input('sort', 'id');
        $sort = is_string($sortRaw) ? $sortRaw : 'id';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'wastage_number', 'stage', 'quantity', 'created_at'], true)) {
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
            'data' => WastageRecordResource::collection($paginated->items()),
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

    public function show(Request $request, WastageRecord $wastageRecord): JsonResponse
    {
        if (TenantContext::isBound() && $wastageRecord->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false
            );
        }

        $wastageRecord->load(['product', 'unit', 'reasonCode', 'productionBatch', 'warehouse', 'recordedByUser']);

        return response()->json([
            'success' => true,
            'data' => new WastageRecordResource($wastageRecord),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function store(StoreWastageRecordRequest $request, CreateWastageRecordAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, ...$request->validated()]);

        return response()->json([
            'success' => true,
            'data' => new WastageRecordResource($result['wastageRecord']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ], 201)->header('Location', '/v1/qc/wastage-records/'.$result['wastageRecord']->uuid);
    }

    public function update(UpdateWastageRecordRequest $request, UpdateWastageRecordAction $action, WastageRecord $wastageRecord): JsonResponse
    {
        if (TenantContext::isBound() && $wastageRecord->tenant_id !== TenantContext::current()->tenantId()) {
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
            'wastageRecord' => $wastageRecord,
            ...$request->validated(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new WastageRecordResource($result['wastageRecord']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function destroy(Request $request, DeleteWastageRecordAction $action, WastageRecord $wastageRecord): JsonResponse
    {
        if (TenantContext::isBound() && $wastageRecord->tenant_id !== TenantContext::current()->tenantId()) {
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
            'wastageRecord' => $wastageRecord,
        ]);

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }
}
