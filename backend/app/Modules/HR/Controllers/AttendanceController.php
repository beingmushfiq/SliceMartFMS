<?php

declare(strict_types=1);

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Actions\RecordAttendanceAction;
use App\Modules\HR\Models\Attendance;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly RecordAttendanceAction $recordAttendanceAction
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Attendance::query()->with(['employee.department', 'employee.designation', 'shift']);

        if ($request->filled('date')) {
            $query->where('attendance_date', $request->query('date'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $attendances = $query->orderByDesc('attendance_date')->paginate(50);

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
            'data' => $attendance->load(['employee.department', 'shift']),
            'message' => 'Attendance recorded successfully.',
        ], 201);
    }

    public function summary(Request $request): JsonResponse
    {
        $date = $request->query('date', date('Y-m-d'));

        $totalEmployees = Employee::where('employment_status', 'active')->count();
        $attendances = Attendance::where('attendance_date', $date)->get();

        $presentCount = $attendances->whereIn('status', ['present', 'late', 'half_day'])->count();
        $lateCount = $attendances->where('status', 'late')->count();
        $onLeaveCount = $attendances->where('status', 'on_leave')->count();
        $absentCount = max(0, $totalEmployees - $presentCount - $onLeaveCount);

        $presentRate = $totalEmployees > 0 ? round(($presentCount / $totalEmployees) * 100, 1) : 0;

        return response()->json([
            'date' => $date,
            'total_workforce' => $totalEmployees,
            'present' => $presentCount,
            'late' => $lateCount,
            'absent' => $absentCount,
            'on_leave' => $onLeaveCount,
            'present_rate_percent' => $presentRate,
        ]);
    }

    public function punchBadge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'badge_id' => 'required|string', // Employee code or badge RFID
            'timestamp' => 'nullable|date',
        ]);

        $code = trim($validated['badge_id']);
        $employee = Employee::where('employee_code', $code)
            ->orWhere('national_id', $code)
            ->orWhere('id', is_numeric($code) ? (int) $code : 0)
            ->first();

        if (! $employee) {
            return response()->json([
                'success' => false,
                'message' => "Unrecognized badge or employee ID: {$code}",
            ], 404);
        }

        $now = $validated['timestamp'] ? Carbon::parse($validated['timestamp']) : now();
        $today = $now->toDateString();

        // Check if attendance already exists for today
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        $shift = $employee->defaultShift ?? Shift::where('is_active', true)->first();

        if ($attendance && $attendance->check_in_at && ! $attendance->check_out_at) {
            // Clock out
            $attendance->check_out_at = $now;
            $checkIn = Carbon::parse($attendance->check_in_at);
            $workingHours = round($checkIn->diffInMinutes($now) / 60, 2);
            $attendance->working_hours = $workingHours;
            /** @var Attendance $attendance */
            $attendance->save();

            return response()->json([
                'success' => true,
                'type' => 'clock_out',
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->display_name ?: $employee->first_name,
                    'employee_code' => $employee->employee_code,
                    'department' => $employee->department?->name,
                ],
                'attendance' => $attendance,
                'message' => "Clock-out recorded for {$employee->display_name} at {$now->format('h:i A')}. Total: {$workingHours} hrs.",
            ]);
        }

        // Clock in
        $status = 'present';
        if ($shift) {
            $shiftStart = Carbon::parse($today.' '.$shift->start_time);
            $graceEnd = $shiftStart->copy()->addMinutes($shift->grace_in_minutes ?? 15);
            if ($now->gt($graceEnd)) {
                $status = 'late';
            }
        }

        $userId = is_numeric(Auth::id()) ? (int) Auth::id() : 1;

        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'attendance_date' => $today,
            ],
            [
                'shift_id' => $shift?->id,
                'check_in_at' => $now,
                'status' => $status,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]
        );

        return response()->json([
            'success' => true,
            'type' => 'clock_in',
            'status' => $status,
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->display_name ?: $employee->first_name,
                'employee_code' => $employee->employee_code,
                'department' => $employee->department?->name,
                'designation' => $employee->designation?->name,
            ],
            'attendance' => $attendance,
            'message' => "Clock-in verified: {$employee->display_name} ({$employee->employee_code}) at {$now->format('h:i A')}. Status: ".strtoupper($status),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance record removed successfully.',
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $ids = array_map('intval', $validated['ids']);
        $count = (int) Attendance::whereIn('id', $ids)->delete();

        return response()->json([
            'success' => true,
            'message' => "Removed {$count} attendance records.",
        ]);
    }

    public function bulkStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
            'status' => 'required|string|in:present,absent,late,half_day,on_leave,holiday,weekly_off',
        ]);

        $ids = array_map('intval', $validated['ids']);
        $status = (string) $validated['status'];
        $userId = is_numeric(Auth::id()) ? (int) Auth::id() : 1;

        $count = (int) Attendance::whereIn('id', $ids)->update([
            'status' => $status,
            'updated_by' => $userId,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Marked {$count} attendance records as {$status}.",
        ]);
    }
}
