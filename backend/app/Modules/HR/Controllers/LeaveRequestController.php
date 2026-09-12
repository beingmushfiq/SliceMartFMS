<?php

declare(strict_types=1);

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\LeaveBalance;
use App\Modules\HR\Models\LeaveRequest;
use App\Modules\HR\Models\LeaveType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LeaveRequestController extends Controller
{
    public function leaveTypes(Request $request): JsonResponse
    {
        $types = LeaveType::query()->where('is_active', true)->get();

        return response()->json([
            'data' => $types,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = LeaveRequest::query()->with(['employee.department', 'leaveType']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        $leaves = $query->orderByDesc('start_date')->paginate(30);

        return response()->json($leaves);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer',
            'leave_type_id' => 'required|integer',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'total_days' => 'required|numeric|min:0.5',
            'is_half_day' => 'nullable|boolean',
            'status' => 'nullable|string|in:pending,approved,rejected',
            'reason' => 'nullable|string',
        ]);

        $requestNumber = 'LV-'.date('Ym').'-'.str_pad((string) random_int(1000, 99999), 5, '0', STR_PAD_LEFT);
        $status = $validated['status'] ?? 'approved';
        $userId = (int) ($request->user()?->id ?? 1);

        $leave = LeaveRequest::create([
            ...$validated,
            'request_number' => $requestNumber,
            'total_days' => (string) $validated['total_days'],
            'is_half_day' => $validated['is_half_day'] ?? false,
            'status' => $status,
            'approved_by' => $status === 'approved' ? $userId : null,
            'approved_at' => $status === 'approved' ? now() : null,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        return response()->json([
            'data' => $leave->load(['employee', 'leaveType']),
            'message' => 'Leave application submitted for approval.',
        ], 201);
    }

    public function approve(int $id, Request $request): JsonResponse
    {
        $leave = LeaveRequest::with(['employee', 'leaveType'])->findOrFail($id);

        $userId = (int) ($request->user()?->id ?? 1);

        DB::transaction(function () use ($leave, $userId): void {
            $leave->update([
                'status' => 'approved',
                'approved_by' => $userId,
                'approved_at' => now(),
                'updated_by' => $userId,
            ]);

            // Deduct from leave balance if record exists
            $year = (int) date('Y', strtotime($leave->start_date));
            $balance = LeaveBalance::where('employee_id', $leave->employee_id)
                ->where('leave_type_id', $leave->leave_type_id)
                ->where('year', $year)
                ->first();

            if ($balance) {
                $days = (float) $leave->total_days;
                $balance->used_days = (string) (((float) $balance->used_days) + $days);
                $balance->balance_days = (string) max(0.0, ((float) $balance->balance_days) - $days);
                /** @var LeaveBalance $balance */
                $balance->save();
            }
        });

        return response()->json([
            'data' => $leave,
            'message' => "Leave request {$leave->request_number} approved successfully.",
        ]);
    }

    public function reject(int $id, Request $request): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:255',
        ]);

        $leave->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'] ?? 'Request declined by HR management.',
            'approved_by' => (int) ($request->user()?->id ?? 1),
            'approved_at' => now(),
            'updated_by' => (int) ($request->user()?->id ?? 1),
        ]);

        return response()->json([
            'data' => $leave,
            'message' => "Leave request {$leave->request_number} rejected.",
        ]);
    }

    public function balances(Request $request): JsonResponse
    {
        $year = (int) $request->query('year', date('Y'));

        $query = LeaveBalance::with(['employee.department', 'leaveType'])
            ->where('year', $year);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        $balances = $query->get();

        return response()->json([
            'year' => $year,
            'data' => $balances,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);
        $leave->delete();

        return response()->json([
            'success' => true,
            'message' => 'Leave request cancelled / deleted.',
        ]);
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $ids = array_map('intval', $validated['ids']);
        $userId = is_numeric(Auth::id()) ? (int) Auth::id() : 1;

        $count = LeaveRequest::whereIn('id', $ids)->where('status', 'pending')->update([
            'status' => 'approved',
            'approved_by' => $userId,
            'approved_at' => now(),
            'updated_by' => $userId,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Approved {$count} pending leave requests.",
        ]);
    }

    public function bulkReject(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
            'rejection_reason' => 'nullable|string',
        ]);

        $ids = array_map('intval', $validated['ids']);
        $userId = is_numeric(Auth::id()) ? (int) Auth::id() : 1;

        $count = LeaveRequest::whereIn('id', $ids)->where('status', 'pending')->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'] ?? 'Bulk rejected by HR administrator.',
            'updated_by' => $userId,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Rejected {$count} leave requests.",
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $ids = array_map('intval', $validated['ids']);
        $count = LeaveRequest::whereIn('id', $ids)->delete();

        return response()->json([
            'success' => true,
            'message' => "Deleted {$count} leave requests.",
        ]);
    }
}
