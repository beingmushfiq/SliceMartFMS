<?php

declare(strict_types=1);

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Actions\RecordAttendanceAction;
use App\Modules\HR\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly RecordAttendanceAction $recordAttendanceAction
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Attendance::query()->with(['employee.department', 'shift']);

        if ($request->filled('date')) {
            $query->where('attendance_date', $request->query('date'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $attendances = $query->orderByDesc('attendance_date')->paginate(30);

        return response()->json($attendances);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer',
            'attendance_date' => 'required|date',
            'check_in_at' => 'nullable|date',
            'check_out_at' => 'nullable|date',
            'shift_id' => 'nullable|integer',
            'status' => 'nullable|string|in:present,absent,late,half_day,on_leave,holiday,weekly_off',
            'remarks' => 'nullable|string',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);
        $attendance = $this->recordAttendanceAction->execute($validated, $userId);

        return response()->json([
            'data' => $attendance->load(['employee', 'shift']),
            'message' => 'Attendance recorded successfully.',
        ], 201);
    }
}
