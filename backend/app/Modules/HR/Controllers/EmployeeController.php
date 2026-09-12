<?php

declare(strict_types=1);

namespace App\Modules\HR\Controllers;

use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\HR\Actions\CreateEmployeeAction;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\EmployeeDocument;
use App\Modules\HR\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
        $query = Employee::query()->with([
            'department:id,name,code',
            'designation:id,name,code',
            'defaultShift:id,name,code',
            'branch:id,name,code',
            'user:id,name,email,status',
            'user.roles:id,name,slug',
        ]);

        if ($request->filled('search')) {
            $search = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($search): void {
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
                'user_id' => $emp->user_id,
                'has_user_account' => ! is_null($emp->user_id),
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
                'user' => $emp->user ? [
                    'id' => $emp->user->id,
                    'name' => $emp->user->name,
                    'email' => $emp->user->email,
                    'status' => $emp->user->status ?? 'active',
                ] : null,
                'roles' => $emp->user ? $emp->user->roles->map(fn ($r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'slug' => $r->slug,
                ]) : [],
                'primary_role' => $emp->user?->roles->first()?->name,
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
            'grant_user_access' => 'nullable|boolean',
            'user_password' => 'nullable|string|min:8',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'integer|exists:roles,id',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $validated['company_id'] = $validated['company_id'] ?? 1;
        $validated['tenant_id'] = $request->user()?->tenant_id ?? 1;

        $userId = (int) ($request->user()?->id ?? 1);
        $employee = $this->createEmployeeAction->execute($validated, $userId);

        return response()->json([
            'data' => $employee->load(['department', 'designation', 'defaultShift', 'branch', 'user.roles']),
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
            'user.roles',
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
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $employee->update([
            ...$validated,
            'updated_by' => (int) ($request->user()?->id ?? 1),
        ]);

        return response()->json([
            'data' => $employee->load(['department', 'designation', 'defaultShift', 'branch', 'user.roles']),
            'message' => 'Employee profile updated successfully.',
        ]);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $employee = Employee::with('user')->findOrFail($id);
        $newStatus = ($employee->employment_status === 'active') ? 'terminated' : 'active';
        $employee->update([
            'employment_status' => $newStatus,
            'is_active' => ($newStatus === 'active') ? 1 : 0,
            'updated_by' => Auth::id() ?? 1,
        ]);

        // Security cascade: if employee is terminated, suspend user login and invalidate sessions immediately
        if ($employee->user) {
            $userStatus = ($newStatus === 'active') ? 'active' : 'suspended';
            $employee->user->update([
                'status' => $userStatus,
                'token_version' => ($employee->user->token_version ?? 1) + 1,
            ]);
        }

        return response()->json([
            'data' => $employee->load(['user.roles']),
            'message' => "Employee status changed to {$newStatus}.",
        ]);
    }

    /**
     * Provision a user login account and assign roles for an existing employee.
     */
    public function provisionUser(int $id, Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $employee = Employee::with('user')->findOrFail($id);

        if ($employee->user_id || $employee->user) {
            return response()->json([
                'message' => 'Employee already has a system user account.',
            ], 422);
        }

        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role_ids' => 'required|array',
            'role_ids.*' => 'integer|exists:roles,id',
        ]);

        $tenantId = $employee->tenant_id ?? (int) ($request->user()?->tenant_id ?? 1);

        $user = DB::transaction(function () use ($employee, $validated, $tenantId, $auditLogger, $request) {
            $user = User::create([
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'name' => $employee->display_name ?: trim("{$employee->first_name} {$employee->last_name}"),
                'email' => strtolower(trim($validated['email'])),
                'password' => Hash::make($validated['password']),
                'phone' => $employee->phone,
                'status' => 'active',
                'token_version' => 1,
                'perm_version' => 1,
                'default_company_id' => $employee->company_id ?? 1,
                'default_branch_id' => $employee->branch_id,
                'default_factory_id' => $employee->factory_id,
            ]);

            $pivotData = [];
            foreach ($validated['role_ids'] as $roleId) {
                $pivotData[$roleId] = ['tenant_id' => $tenantId];
            }
            $user->roles()->sync($pivotData);

            $employee->update([
                'user_id' => $user->id,
                'email' => $user->email,
                'updated_by' => (int) ($request->user()?->id ?? 1),
            ]);

            $auditLogger->record(
                action: AuditAction::Created,
                auditable: $user,
                before: null,
                after: [
                    'action' => 'provisioned_for_employee',
                    'employee_id' => $employee->id,
                    'roles' => $validated['role_ids'],
                ],
                actor: $request->user(),
                context: ['tenant_id' => $tenantId],
                ip: $request->ip(),
                userAgent: $request->userAgent()
            );

            return $user;
        });

        return response()->json([
            'message' => "User account provisioned and roles assigned for '{$employee->display_name}'.",
            'data' => $employee->load(['user.roles', 'department', 'designation']),
        ], 201);
    }

    /**
     * Update the assigned roles for an employee's user account.
     */
    public function updateRoles(int $id, Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $employee = Employee::with('user')->findOrFail($id);

        if (! $employee->user) {
            return response()->json([
                'message' => 'Employee does not have an active system user account.',
            ], 422);
        }

        $validated = $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'integer|exists:roles,id',
        ]);

        $tenantId = $employee->tenant_id ?? (int) ($request->user()?->tenant_id ?? 1);

        DB::transaction(function () use ($employee, $validated, $tenantId, $auditLogger, $request): void {
            $pivotData = [];
            foreach ($validated['role_ids'] as $roleId) {
                $pivotData[$roleId] = ['tenant_id' => $tenantId];
            }
            $employee->user->roles()->sync($pivotData);
            $employee->user->perm_version = ($employee->user->perm_version ?? 1) + 1;
            $employee->user->save();

            $auditLogger->record(
                action: AuditAction::Updated,
                auditable: $employee->user,
                before: null,
                after: [
                    'action' => 'employee_roles_updated',
                    'employee_id' => $employee->id,
                    'roles' => $validated['role_ids'],
                ],
                actor: $request->user(),
                context: ['tenant_id' => $tenantId],
                ip: $request->ip(),
                userAgent: $request->userAgent()
            );
        });

        return response()->json([
            'message' => "Roles updated for '{$employee->display_name}'.",
            'data' => $employee->load(['user.roles']),
        ]);
    }

    /**
     * Link an existing user account to this employee.
     */
    public function linkUser(int $id, Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $tenantId = $employee->tenant_id ?? (int) ($request->user()?->tenant_id ?? 1);
        $user = User::query()
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->findOrFail($validated['user_id']);

        $employee->update([
            'user_id' => $user->id,
            'updated_by' => (int) ($request->user()?->id ?? 1),
        ]);

        $auditLogger->record(
            action: AuditAction::Updated,
            auditable: $employee,
            before: null,
            after: [
                'action' => 'linked_user_account',
                'user_id' => $user->id,
            ],
            actor: $request->user(),
            context: ['tenant_id' => $tenantId],
            ip: $request->ip(),
            userAgent: $request->userAgent()
        );

        return response()->json([
            'message' => "User account '{$user->name}' linked to '{$employee->display_name}'.",
            'data' => $employee->load(['user.roles', 'department', 'designation']),
        ]);
    }

    /**
     * Unlink user account from this employee.
     */
    public function unlinkUser(int $id, Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $prevUserId = $employee->user_id;
        $employee->update([
            'user_id' => null,
            'updated_by' => (int) ($request->user()?->id ?? 1),
        ]);

        $auditLogger->record(
            action: AuditAction::Updated,
            auditable: $employee,
            before: ['user_id' => $prevUserId],
            after: ['user_id' => null],
            actor: $request->user(),
            context: ['tenant_id' => $employee->tenant_id],
            ip: $request->ip(),
            userAgent: $request->userAgent()
        );

        return response()->json([
            'message' => "User account unlinked from '{$employee->display_name}'.",
            'data' => $employee->load(['department', 'designation']),
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

    public function destroy(int $id): JsonResponse
    {
        $employee = Employee::with('user')->findOrFail($id);

        DB::transaction(function () use ($employee): void {
            if ($employee->user) {
                $employee->user->update(['status' => 'suspended']);
            }
            $employee->delete();
        });

        return response()->json([
            'success' => true,
            'message' => "Employee '{$employee->display_name}' deleted successfully.",
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $ids = array_map('intval', $validated['ids']);
        $count = 0;

        DB::transaction(function () use ($ids, &$count): void {
            $employees = Employee::with('user')->whereIn('id', $ids)->get();
            foreach ($employees as $employee) {
                /** @var Employee $employee */
                if ($employee->user) {
                    $employee->user->update(['status' => 'suspended']);
                }
                $employee->delete();
                $count++;
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Successfully deleted {$count} employee records.",
        ]);
    }

    public function bulkStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
            'status' => 'required|string|in:active,terminated,on_leave,suspended,resigned',
        ]);

        $ids = array_map('intval', $validated['ids']);
        $status = (string) $validated['status'];
        $isActive = ($status === 'active') ? 1 : 0;
        $userId = is_numeric(Auth::id()) ? (int) Auth::id() : 1;

        DB::transaction(function () use ($ids, $status, $isActive, $userId): void {
            Employee::whereIn('id', $ids)->update([
                'employment_status' => $status,
                'is_active' => $isActive,
                'updated_by' => $userId,
            ]);

            if ($status !== 'active') {
                $userIds = Employee::whereIn('id', $ids)->whereNotNull('user_id')->pluck('user_id');
                User::whereIn('id', $userIds)->update(['status' => 'suspended']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => "Status updated to '{$status}' for ".count($ids).' employees.',
        ]);
    }

    public function destroyDepartment(int $id): JsonResponse
    {
        $department = Department::withCount('employees')->findOrFail($id);
        if ($department->employees_count > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete department '{$department->name}' because it has {$department->employees_count} assigned employees.",
            ], 422);
        }

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => "Department '{$department->name}' deleted successfully.",
        ]);
    }

    public function bulkDeleteDepartments(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $ids = array_map('intval', $validated['ids']);
        $departments = Department::withCount('employees')->whereIn('id', $ids)->get();
        $deleted = 0;

        foreach ($departments as $dept) {
            /** @var Department $dept */
            if ($dept->employees_count === 0) {
                $dept->delete();
                $deleted++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Deleted {$deleted} departments.",
        ]);
    }

    public function destroyDesignation(int $id): JsonResponse
    {
        $designation = Designation::withCount('employees')->findOrFail($id);
        if ($designation->employees_count > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete designation '{$designation->name}' because it has {$designation->employees_count} assigned employees.",
            ], 422);
        }

        $designation->delete();

        return response()->json([
            'success' => true,
            'message' => "Designation '{$designation->name}' deleted successfully.",
        ]);
    }

    public function bulkDeleteDesignations(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $ids = array_map('intval', $validated['ids']);
        $designations = Designation::withCount('employees')->whereIn('id', $ids)->get();
        $deleted = 0;

        foreach ($designations as $des) {
            /** @var Designation $des */
            if ($des->employees_count === 0) {
                $des->delete();
                $deleted++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Deleted {$deleted} designations.",
        ]);
    }

    public function destroyShift(int $id): JsonResponse
    {
        $shift = Shift::findOrFail($id);
        $shift->delete();

        return response()->json([
            'success' => true,
            'message' => "Shift '{$shift->name}' deleted successfully.",
        ]);
    }

    public function bulkDeleteShifts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $ids = array_map('intval', $validated['ids']);
        Shift::whereIn('id', $ids)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Deleted '.count($ids).' shifts.',
        ]);
    }
}
