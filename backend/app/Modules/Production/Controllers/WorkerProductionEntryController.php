<?php

declare(strict_types=1);

namespace App\Modules\Production\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WorkerProductionEntry;
use App\Modules\Production\Actions\CreateWorkerProductionEntryAction;
use App\Modules\Production\Actions\DeleteWorkerProductionEntryAction;
use App\Modules\Production\Actions\UpdateWorkerProductionEntryAction;
use App\Modules\Production\Actions\VerifyWorkerProductionEntryAction;
use App\Modules\Production\Requests\StoreWorkerProductionEntryRequest;
use App\Modules\Production\Requests\UpdateWorkerProductionEntryRequest;
use App\Modules\Production\Resources\WorkerProductionEntryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class WorkerProductionEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['employee_id', 'production_batch_id', 'product_id', 'status', 'work_date', 'date_from', 'date_to', 'sort', 'page', 'per_page'];
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

        $query = WorkerProductionEntry::query()->with(['productionBatch', 'employee', 'product', 'unit', 'enteredByUser', 'verifiedByUser']);

        $employeeUuid = $request->input('employee_id');
        if (is_string($employeeUuid)) {
            $query->whereHas('employee', fn ($emp) => $emp->where('employees.uuid', $employeeUuid));
        }

        $batchUuid = $request->input('production_batch_id');
        if (is_string($batchUuid)) {
            $query->whereHas('productionBatch', fn ($batch) => $batch->where('production_batches.uuid', $batchUuid));
        }

        $productUuid = $request->input('product_id');
        if (is_string($productUuid)) {
            $query->whereHas('product', fn ($prod) => $prod->where('products.uuid', $productUuid));
        }

        $status = $request->input('status');
        if (is_string($status)) {
            $query->where('status', $status);
        }

        $workDate = $request->input('work_date');
        if (is_string($workDate)) {
            $query->where('work_date', $workDate);
        }

        $dateFrom = $request->input('date_from');
        if (is_string($dateFrom)) {
            $query->where('work_date', '>=', $dateFrom);
        }

        $dateTo = $request->input('date_to');
        if (is_string($dateTo)) {
            $query->where('work_date', '<=', $dateTo);
        }

        $sortRaw = $request->input('sort', 'id');
        $sort = is_string($sortRaw) ? $sortRaw : 'id';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'work_date', 'quantity', 'status', 'created_at'], true)) {
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
            'data' => WorkerProductionEntryResource::collection($paginated->items()),
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

    public function summary(Request $request): JsonResponse
    {
        $query = WorkerProductionEntry::query();

        $employeeUuid = $request->input('employee_id');
        if (is_string($employeeUuid)) {
            $query->whereHas('employee', fn ($emp) => $emp->where('employees.uuid', $employeeUuid));
        }

        $dateFrom = $request->input('date_from');
        if (is_string($dateFrom)) {
            $query->where('work_date', '>=', $dateFrom);
        }

        $dateTo = $request->input('date_to');
        if (is_string($dateTo)) {
            $query->where('work_date', '<=', $dateTo);
        }

        $totalQuantity = (float) (clone $query)->sum('quantity');
        $totalRework = (float) (clone $query)->sum('rework_quantity');
        $totalRejected = (float) (clone $query)->sum('rejected_quantity');
        $totalHours = (float) (clone $query)->sum('hours_worked');
        $totalIncentive = (float) (clone $query)->sum('incentive_amount');
        $totalEarned = (float) (clone $query)->selectRaw('SUM(COALESCE(rate * quantity, 0) + COALESCE(incentive_amount, 0)) as total')->value('total');
        $entryCount = (clone $query)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_quantity' => number_format($totalQuantity, 4, '.', ''),
                'total_good_quantity' => number_format($totalQuantity, 4, '.', ''),
                'total_rework_quantity' => number_format($totalRework, 4, '.', ''),
                'total_rejected_quantity' => number_format($totalRejected, 4, '.', ''),
                'total_hours_worked' => number_format($totalHours, 4, '.', ''),
                'total_incentive_amount' => number_format($totalIncentive, 4, '.', ''),
                'total_earned' => number_format($totalEarned, 2, '.', ''),
                'total_entries' => $entryCount,
            ],
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function show(Request $request, WorkerProductionEntry $workerProductionEntry): JsonResponse
    {
        if (TenantContext::isBound() && $workerProductionEntry->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false
            );
        }

        $workerProductionEntry->load(['productionBatch', 'employee', 'product', 'unit', 'enteredByUser', 'verifiedByUser']);

        return response()->json([
            'success' => true,
            'data' => new WorkerProductionEntryResource($workerProductionEntry),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function store(StoreWorkerProductionEntryRequest $request, CreateWorkerProductionEntryAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, ...$request->validated()]);

        return response()->json([
            'success' => true,
            'data' => new WorkerProductionEntryResource($result['workerProductionEntry']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ], 201)->header('Location', '/v1/production/worker-entries/'.$result['workerProductionEntry']->uuid);
    }

    public function update(UpdateWorkerProductionEntryRequest $request, UpdateWorkerProductionEntryAction $action, WorkerProductionEntry $workerProductionEntry): JsonResponse
    {
        if (TenantContext::isBound() && $workerProductionEntry->tenant_id !== TenantContext::current()->tenantId()) {
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
            'workerProductionEntry' => $workerProductionEntry,
            ...$request->validated(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new WorkerProductionEntryResource($result['workerProductionEntry']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function verify(Request $request, VerifyWorkerProductionEntryAction $action, WorkerProductionEntry $workerProductionEntry): JsonResponse
    {
        if (TenantContext::isBound() && $workerProductionEntry->tenant_id !== TenantContext::current()->tenantId()) {
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
            'workerProductionEntry' => $workerProductionEntry,
        ]);

        return response()->json([
            'success' => true,
            'data' => new WorkerProductionEntryResource($result['workerProductionEntry']),
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }

    public function destroy(Request $request, DeleteWorkerProductionEntryAction $action, WorkerProductionEntry $workerProductionEntry): JsonResponse
    {
        if (TenantContext::isBound() && $workerProductionEntry->tenant_id !== TenantContext::current()->tenantId()) {
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
            'workerProductionEntry' => $workerProductionEntry,
        ]);

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')],
        ]);
    }
}
