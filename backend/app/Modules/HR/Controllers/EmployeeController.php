<?php

declare(strict_types=1);

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Actions\CreateEmployeeAction;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly CreateEmployeeAction $createEmployeeAction
    ) {}

    public function departments(Request $request): JsonResponse
    {
        $departments = Department::query()->where('is_active', true)->get();

        return response()->json([
            'data' => $departments,
        ]);
    }

    public function designations(Request $request): JsonResponse
    {
        $designations = Designation::query()->where('is_active', true)->get();

        return response()->json([
            'data' => $designations,
        ]);
    }

    public function shifts(Request $request): JsonResponse
    {
        $shifts = Shift::query()->where('is_active', true)->get();

        return response()->json([
            'data' => $shifts,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Employee::query()->with(['department', 'designation', 'defaultShift', 'branch']);

        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->query('employment_type'));
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        $employees = $query->orderBy('display_name')->get()->map(function ($emp) {
            return [
                'id' => $emp->uuid,
                'employee_code' => $emp->employee_code,
                'first_name' => $emp->first_name,
                'last_name' => $emp->last_name ?? '',
                'full_name' => $emp->display_name ?: trim("{$emp->first_name} {$emp->last_name}"),
                'email' => $emp->email,
                'phone' => $emp->phone,
                'designation' => $emp->designation?->name,
                'department' => $emp->department?->name,
                'status' => $emp->employment_status ?? 'active',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|integer',
            'branch_id' => 'nullable|integer',
            'factory_id' => 'nullable|integer',
            'department_id' => 'nullable|integer',
            'designation_id' => 'nullable|integer',
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'phone' => 'required|string|max:32',
            'email' => 'nullable|email|max:191',
            'employment_type' => 'nullable|string|in:permanent,contract,daily_wage,piece_rate,probation',
            'employment_status' => 'nullable|string|in:active,on_leave,suspended,resigned,terminated',
            'default_shift_id' => 'nullable|integer',
            'salary_structure_id' => 'nullable|integer',
            'date_of_joining' => 'nullable|date',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:64',
            'mobile_wallet_number' => 'nullable|string|max:32',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);
        $employee = $this->createEmployeeAction->execute($validated, $userId);

        return response()->json([
            'data' => $employee->load(['department', 'designation', 'defaultShift', 'branch']),
            'message' => 'Employee onboarded successfully.',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $employee = Employee::with(['department', 'designation', 'defaultShift', 'branch', 'salaryStructure.components.component'])->findOrFail($id);

        return response()->json([
            'data' => $employee,
        ]);
    }
}
