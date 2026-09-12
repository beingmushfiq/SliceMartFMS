<?php

declare(strict_types=1);

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Actions\CreateEmployeeAction;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\EmployeeDocument;
use App\Modules\HR\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly CreateEmployeeAction $createEmployeeAction
    ) {}

    public function departments(Request $request): JsonResponse
    {
        $departments = Department::query()
            ->when($request->boolean('active_only', false), fn ($q) => $q->where('is_active', true))
            ->withCount('employees')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $departments,
        ]);
    }

    public function storeDepartment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:32',
            'name' => 'required|string|max:100',
            'company_id' => 'nullable|integer',
            'head_employee_id' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);
        $department = Department::create([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'company_id' => $validated['company_id'] ?? 1,
            'head_employee_id' => $validated['head_employee_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        return response()->json([
            'data' => $department,
            'message' => 'Department created successfully.',
        ], 201);
    }

    public function updateDepartment(int $id, Request $request): JsonResponse
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'code' => 'nullable|string|max:32',
            'name' => 'nullable|string|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        $department->update([
            ...$validated,
            'updated_by' => (int) ($request->user()?->id ?? 1),
        ]);

        return response()->json([
            'data' => $department,
            'message' => 'Department updated successfully.',
        ]);
    }

    public function designations(Request $request): JsonResponse
    {
        $designations = Designation::query()
            ->when($request->boolean('active_only', false), fn ($q) => $q->where('is_active', true))
            ->withCount('employees')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $designations,
        ]);
    }

    public function storeDesignation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:32',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);
        $designation = Designation::create([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        return response()->json([
            'data' => $designation,
            'message' => 'Designation created successfully.',
        ], 201);
    }

    public function updateDesignation(int $id, Request $request): JsonResponse
    {
        $designation = Designation::findOrFail($id);

        $validated = $request->validate([
            'code' => 'nullable|string|max:32',
            'name' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $designation->update([
            ...$validated,
            'updated_by' => (int) ($request->user()?->id ?? 1),
        ]);

        return response()->json([
            'data' => $designation,
            'message' => 'Designation updated successfully.',
        ]);
    }

    public function shifts(Request $request): JsonResponse
    {
        $shifts = Shift::query()
            ->when($request->boolean('active_only', false), fn ($q) => $q->where('is_active', true))
            ->withCount('employees')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'data' => $shifts,
        ]);
    }

    public function storeShift(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:32',
            'name' => 'required|string|max:100',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'break_minutes' => 'nullable|integer|min:0',
            'grace_in_minutes' => 'nullable|integer|min:0',
            'grace_out_minutes' => 'nullable|integer|min:0',
            'crosses_midnight' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);
        $shift = Shift::create([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'break_minutes' => $validated['break_minutes'] ?? 45,
            'grace_in_minutes' => $validated['grace_in_minutes'] ?? 15,
            'grace_out_minutes' => $validated['grace_out_minutes'] ?? 15,
            'half_day_threshold_minutes' => 240,
            'crosses_midnight' => $validated['crosses_midnight'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        return response()->json([
            'data' => $shift,
            'message' => 'Shift schedule created successfully.',
        ], 201);
    }

    public function updateShift(int $id, Request $request): JsonResponse
    {
        $shift = Shift::findOrFail($id);

        $validated = $request->validate([
            'code' => 'nullable|string|max:32',
            'name' => 'nullable|string|max:100',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'grace_in_minutes' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $shift->update([
            ...$validated,
            'updated_by' => (int) ($request->user()?->id ?? 1),
        ]);

        return response()->json([
            'data' => $shift,
            'message' => 'Shift schedule updated successfully.',
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Employee::query()->with(['department', 'designation', 'defaultShift', 'branch']);

        if ($request->filled('search')) {
            $search = '%' . $request->query('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', $search)
                    ->orWhere('last_name', 'like', $search)
                    ->orWhere('display_name', 'like', $search)
                    ->orWhere('employee_code', 'like', $search)
                    ->orWhere('email', 'like', $search);
            });
        }

        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->query('employment_type'));
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        if ($request->filled('employment_status')) {
            $query->where('employment_status', $request->query('employment_status'));
        }

        $employees = $query->orderBy('display_name')->get()->map(function ($emp) {
            return [
                'id' => $emp->id,
                'uuid' => $emp->uuid,
                'employee_code' => $emp->employee_code,
                'first_name' => $emp->first_name,
                'last_name' => $emp->last_name ?? '',
                'full_name' => $emp->display_name ?: trim("{$emp->first_name} {$emp->last_name}"),
                'display_name' => $emp->display_name ?: trim("{$emp->first_name} {$emp->last_name}"),
                'email' => $emp->email,
                'phone' => $emp->phone,
                'employment_type' => $emp->employment_type,
                'designation' => $emp->designation?->name,
                'department' => $emp->department?->name,
                'department_id' => $emp->department_id,
                'shift' => $emp->defaultShift?->name,
                'status' => $emp->employment_status ?? 'active',
                'date_of_joining' => $emp->date_of_joining,
                'bank_name' => $emp->bank_name,
                'bank_account_number' => $emp->bank_account_number,
                'mobile_wallet_number' => $emp->mobile_wallet_number,
                'national_id' => $emp->national_id,
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
            'company_id' => 'nullable|integer',
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
            'national_id' => 'nullable|string|max:64',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:64',
            'mobile_wallet_number' => 'nullable|string|max:32',
        ]);

        $validated['company_id'] = $validated['company_id'] ?? 1;

        $userId = (int) ($request->user()?->id ?? 1);
        $employee = $this->createEmployeeAction->execute($validated, $userId);

        return response()->json([
            'data' => $employee->load(['department', 'designation', 'defaultShift', 'branch']),
            'message' => 'Employee onboarded successfully.',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $employee = Employee::with([
            'department',
            'designation',
            'defaultShift',
            'branch',
            'salaryStructure.components.component',
        ])->findOrFail($id);

        return response()->json([
            'data' => $employee,
        ]);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:32',
            'email' => 'nullable|email|max:191',
            'department_id' => 'nullable|integer',
            'designation_id' => 'nullable|integer',
            'default_shift_id' => 'nullable|integer',
            'salary_structure_id' => 'nullable|integer',
            'employment_type' => 'nullable|string|in:permanent,contract,daily_wage,piece_rate,probation',
            'employment_status' => 'nullable|string|in:active,on_leave,suspended,resigned,terminated',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:64',
            'mobile_wallet_number' => 'nullable|string|max:32',
            'national_id' => 'nullable|string|max:64',
        ]);

        $employee->update([
            ...$validated,
            'updated_by' => (int) ($request->user()?->id ?? 1),
        ]);

        return response()->json([
            'data' => $employee->load(['department', 'designation', 'defaultShift', 'branch']),
            'message' => 'Employee profile updated successfully.',
        ]);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $newStatus = ($employee->employment_status === 'active') ? 'terminated' : 'active';
        $employee->update([
            'employment_status' => $newStatus,
            'is_active' => ($newStatus === 'active') ? 1 : 0,
            'updated_by' => auth()->id() ?? 1,
        ]);

        return response()->json([
            'data' => $employee,
            'message' => "Employee status changed to {$newStatus}.",
        ]);
    }

    public function documents(int $id): JsonResponse
    {
        $documents = EmployeeDocument::where('employee_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $documents,
        ]);
    }

    public function storeDocument(int $id, Request $request): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'document_type' => 'required|string|in:nid,contract,certificate,photo,health_pass,other',
            'notes' => 'nullable|string',
            'issued_on' => 'nullable|date',
            'expires_on' => 'nullable|date',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);
        $doc = EmployeeDocument::create([
            'employee_id' => $employee->id,
            'document_type' => $validated['document_type'],
            'attachment_id' => 1, // Fallback/default attachment link
            'issued_on' => $validated['issued_on'] ?? null,
            'expires_on' => $validated['expires_on'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        return response()->json([
            'data' => $doc,
            'message' => 'Document registered to employee profile.',
        ], 201);
    }
}
