<?php

declare(strict_types=1);

namespace App\Modules\QC\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\QcInspection;
use App\Models\User;
use App\Modules\QC\Actions\ApproveQcInspectionAction;
use App\Modules\QC\Actions\CreateQcInspectionAction;
use App\Modules\QC\Actions\DeleteQcInspectionAction;
use App\Modules\QC\Actions\UpdateQcInspectionAction;
use App\Modules\QC\Requests\StoreQcInspectionRequest;
use App\Modules\QC\Requests\UpdateQcInspectionRequest;
use App\Modules\QC\Resources\QcInspectionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class QcInspectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['production_batch_id', 'production_output_id', 'inspector_id', 'result', 'status', 'inspection_date', 'date_from', 'date_to', 'q', 'sort', 'page', 'per_page'];
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

        $query = QcInspection::query()->with(['productionBatch.product', 'productionOutput.product', 'inspector', 'results.qcParameter', 'defects.defectReason', 'approvedByUser']);

        $batchUuid = $request->input('production_batch_id');
        if (is_string($batchUuid)) {
            $query->whereHas('productionBatch', fn ($batch) => $batch->where('production_batches.uuid', $batchUuid));
        }

        $outputUuid = $request->input('production_output_id');
        if (is_string($outputUuid)) {
            $query->whereHas('productionOutput', fn ($out) => $out->where('production_outputs.uuid', $outputUuid));
        }

        $inspectorUuid = $request->input('inspector_id');
        if (is_string($inspectorUuid)) {
            $query->whereHas('inspector', fn ($emp) => $emp->where('employees.uuid', $inspectorUuid));
        }

        foreach (['result', 'status', 'inspection_date'] as $field) {
            $value = $request->input($field);
            if (is_string($value)) {
                $query->where($field, $value);
            }
        }

        $dateFrom = $request->input('date_from');
        if (is_string($dateFrom)) {
            $query->where('inspection_date', '>=', $dateFrom);
        }

        $dateTo = $request->input('date_to');
        if (is_string($dateTo)) {
            $query->where('inspection_date', '<=', $dateTo);
        }

        $search = $request->input('q');
        if (is_string($search) && mb_strlen($search) >= 2) {
            $query->where('inspection_number', 'like', '%'.$search.'%');
        }

        $sortRaw = $request->input('sort', 'id');
        $sort = is_string($sortRaw) ? $sortRaw : 'id';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'inspection_number', 'inspection_date', 'result', 'status', 'created_at'], true)) {
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
            'data' => QcInspectionResource::collection($paginated->items()),
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

    public function show(Request $request, QcInspection $qcInspection): JsonResponse
    {
        if (TenantContext::isBound() && $qcInspection->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false
            );
        }

        $qcInspection->load(['productionBatch.product', 'productionOutput.product', 'inspector', 'results.qcParameter', 'defects.defectReason', 'approvedByUser']);

        return response()->json([
            'success' => true,
            'data' => new QcInspectionResource($qcInspection),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function store(StoreQcInspectionRequest $request, CreateQcInspectionAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, ...$request->validated()]);

        return response()->json([
            'success' => true,
            'data' => new QcInspectionResource($result['qcInspection']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ], 201)->header('Location', '/v1/qc/inspections/'.$result['qcInspection']->uuid);
    }

    public function update(UpdateQcInspectionRequest $request, UpdateQcInspectionAction $action, QcInspection $qcInspection): JsonResponse
    {
        if (TenantContext::isBound() && $qcInspection->tenant_id !== TenantContext::current()->tenantId()) {
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
            'qcInspection' => $qcInspection,
            ...$request->validated(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new QcInspectionResource($result['qcInspection']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function approve(Request $request, ApproveQcInspectionAction $action, QcInspection $qcInspection): JsonResponse
    {
        if (TenantContext::isBound() && $qcInspection->tenant_id !== TenantContext::current()->tenantId()) {
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
            'qcInspection' => $qcInspection,
        ]);

        return response()->json([
            'success' => true,
            'data' => new QcInspectionResource($result['qcInspection']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function destroy(Request $request, DeleteQcInspectionAction $action, QcInspection $qcInspection): JsonResponse
    {
        if (TenantContext::isBound() && $qcInspection->tenant_id !== TenantContext::current()->tenantId()) {
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
            'qcInspection' => $qcInspection,
        ]);

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }
}
