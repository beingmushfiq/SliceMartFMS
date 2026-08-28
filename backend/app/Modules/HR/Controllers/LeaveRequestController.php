<?php

declare(strict_types=1);

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\LeaveRequest;
use App\Modules\HR\Models\LeaveType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $query = LeaveRequest::query()->with(['employee', 'leaveType']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        $leaves = $query->orderByDesc('start_date')->paginate(20);

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
            'reason' => 'nullable|string',
        ]);

        $requestNumber = 'LV-' . date('Ym') . '-' . str_pad((string) random_int(1000, 99999), 5, '0', STR_PAD_LEFT);

        $leave = LeaveRequest::create([
            ...$validated,
            'request_number' => $requestNumber,
            'total_days' => (string) $validated['total_days'],
            'is_half_day' => $validated['is_half_day'] ?? false,
            'status' => 'approved',
            'approved_by' => $request->user()?->id ?? 1,
            'approved_at' => now(),
            'created_by' => $request->user()?->id ?? 1,
            'updated_by' => $request->user()?->id ?? 1,
        ]);

        return response()->json([
            'data' => $leave->load(['employee', 'leaveType']),
            'message' => 'Leave application submitted and approved.',
        ], 201);
    }
}
