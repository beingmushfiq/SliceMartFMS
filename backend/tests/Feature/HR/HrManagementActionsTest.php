<?php

declare(strict_types=1);

namespace Tests\Feature\HR;

use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\HR\Models\Attendance;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\LeaveRequest;
use App\Modules\HR\Models\LeaveType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class HrManagementActionsTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $plan = Plan::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'enterprise-plan',
            'name' => 'Enterprise Plan',
            'slug' => 'enterprise-plan',
            'price' => 299.00,
            'billing_period' => 'monthly',
            'is_active' => true,
        ]);

        $this->tenant = Tenant::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'plan_id' => $plan->id,
            'timezone' => 'Asia/Dhaka',
            'currency_code' => 'BDT',
            'date_format' => 'Y-m-d',
            'number_format' => '1,234.56',
            'status' => 'active',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
            'token_version' => 1,
        ]);

        $jwtService = app(\App\Core\Auth\JwtService::class);
        $this->token = $jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: 1,
            permVersion: '1',
            scopes: []
        );

        \App\Models\Company::create([
            'tenant_id' => $this->tenant->id,
            'uuid' => (string) Str::uuid(),
            'name' => 'SliceMart Factory Co.',
            'is_default' => true,
            'is_active' => true,
        ]);
    }

    public function test_can_delete_single_and_bulk_employees(): void
    {
        $dept = Department::create([
            'tenant_id' => $this->tenant->id,
            'company_id' => 1,
            'code' => 'DEPT-TEST',
            'name' => 'Test Department',
            'is_active' => true,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        $emp1 = Employee::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'company_id' => 1,
            'department_id' => $dept->id,
            'employee_code' => 'EMP-TEST-01',
            'first_name' => 'Tariq',
            'last_name' => 'Hasan',
            'display_name' => 'Tariq Hasan',
            'phone' => '+8801700000001',
            'employment_status' => 'active',
            'date_of_joining' => '2026-01-01',
            'is_active' => 1,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        $emp2 = Employee::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'company_id' => 1,
            'department_id' => $dept->id,
            'employee_code' => 'EMP-TEST-02',
            'first_name' => 'Suman',
            'last_name' => 'Roy',
            'display_name' => 'Suman Roy',
            'phone' => '+8801700000002',
            'employment_status' => 'active',
            'date_of_joining' => '2026-01-01',
            'is_active' => 1,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // Bulk status
        $statusRes = $this->withHeader('Authorization', 'Bearer '.$this->token)->postJson('/api/v1/hr/employees/bulk-status', [
            'ids' => [$emp1->id, $emp2->id],
            'status' => 'suspended',
        ]);
        $statusRes->assertOk();
        $this->assertEquals('suspended', $emp1->fresh()->employment_status);

        // Delete single
        $delRes = $this->withHeader('Authorization', 'Bearer '.$this->token)->deleteJson("/api/v1/hr/employees/{$emp1->id}");
        $delRes->assertOk();
        $this->assertSoftDeleted('employees', ['id' => $emp1->id]);

        // Bulk delete
        $bulkDelRes = $this->withHeader('Authorization', 'Bearer '.$this->token)->postJson('/api/v1/hr/employees/bulk-delete', [
            'ids' => [$emp2->id],
        ]);
        $bulkDelRes->assertOk();
        $this->assertSoftDeleted('employees', ['id' => $emp2->id]);
    }

    public function test_can_delete_and_bulk_manage_attendances_and_leaves(): void
    {
        $emp = Employee::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'company_id' => 1,
            'employee_code' => 'EMP-ATT-01',
            'first_name' => 'Kamal',
            'display_name' => 'Kamal Hossain',
            'phone' => '+8801700000003',
            'employment_status' => 'active',
            'date_of_joining' => '2026-01-01',
            'is_active' => 1,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        $att = Attendance::create([
            'tenant_id' => $this->tenant->id,
            'employee_id' => $emp->id,
            'attendance_date' => '2026-09-12',
            'status' => 'present',
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // Delete attendance
        $delAttRes = $this->withHeader('Authorization', 'Bearer '.$this->token)->deleteJson("/api/v1/hr/attendances/{$att->id}");
        $delAttRes->assertOk();
        $this->assertSoftDeleted('attendances', ['id' => $att->id]);

        $leaveType = LeaveType::create([
            'tenant_id' => $this->tenant->id,
            'code' => 'CASUAL-TEST',
            'name' => 'Casual Leave Test',
            'annual_quota_days' => 14,
            'is_paid' => true,
            'is_active' => true,
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        $leave = LeaveRequest::create([
            'tenant_id' => $this->tenant->id,
            'request_number' => 'LV-TEST-001',
            'employee_id' => $emp->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => '2026-09-15',
            'end_date' => '2026-09-16',
            'total_days' => '2.0000',
            'status' => 'pending',
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // Bulk approve leave
        $approveRes = $this->withHeader('Authorization', 'Bearer '.$this->token)->postJson('/api/v1/hr/leaves/bulk-approve', [
            'ids' => [$leave->id],
        ]);
        $approveRes->assertOk();
        $this->assertEquals('approved', $leave->fresh()->status);

        // Delete leave
        $delLeaveRes = $this->withHeader('Authorization', 'Bearer '.$this->token)->deleteJson("/api/v1/hr/leaves/{$leave->id}");
        $delLeaveRes->assertOk();
        $this->assertSoftDeleted('leave_requests', ['id' => $leave->id]);
    }
}
