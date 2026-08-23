<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Schema;

/**
 * Wave 8 + 9 — HR identity schema contract tests.
 *
 * Tables under test: departments, designations, shifts, employees.
 * Plus the Wave 9 FK closure (104900) that adds three circular/deferred FKs:
 *   departments.head_employee_id → employees
 *   employees.reports_to_employee_id → employees (self-referential)
 *   employees.default_shift_id → shifts
 */
class Wave8HrIdentitySchemaTest extends SchemaTestCase
{
    // ─────────────────────────────────────────────────────────────────────────
    // Existence
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_all_wave_8_tables_exist(): void
    {
        foreach (['departments', 'designations', 'shifts', 'employees'] as $table) {
            self::assertTrue(Schema::hasTable($table), "Table `{$table}` does not exist.");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Structural: tenant_id is second column
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_departments_tenant_id_is_second_column(): void
    {
        self::assertSame('tenant_id', Schema::getColumnListing('departments')[1]);
    }

    /** @test */
    public function test_employees_tenant_id_is_second_column(): void
    {
        self::assertSame('tenant_id', Schema::getColumnListing('employees')[1]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Soft delete
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_master_data_tables_have_deleted_at(): void
    {
        foreach (['departments', 'designations', 'shifts', 'employees'] as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table `{$table}` should have deleted_at (master data)."
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // No float / double / enum
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_no_float_double_or_enum_columns_in_wave_8_tables(): void
    {
        $forbidden = ['float', 'double', 'enum'];

        foreach (['departments', 'designations', 'shifts', 'employees'] as $table) {
            foreach (Schema::getColumnListing($table) as $col) {
                $type = Schema::getColumnType($table, $col);
                self::assertNotContains(
                    $type,
                    $forbidden,
                    "Table `{$table}`.`{$col}` uses forbidden type `{$type}`."
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // departments: unique (tenant_id, company_id, code)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_department_code_unique_within_company(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $this->insertDepartment($tid, $cid, ['code' => 'ENG']);

        $this->assertInsertRejected(
            'departments',
            $this->departmentAttributes($tid, $cid, ['code' => 'ENG']),
            'Duplicate department code within same company should be rejected.'
        );
    }

    /** @test */
    public function test_same_department_code_allowed_in_different_companies(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid1 = $this->insertCompany($tid, ['name' => 'Company Alpha']);
        $cid2 = $this->insertCompany($tid, ['name' => 'Company Beta']);

        $this->insertDepartment($tid, $cid1, ['code' => 'ENG']);
        $id = $this->insertDepartment($tid, $cid2, ['code' => 'ENG']);
        self::assertGreaterThan(0, $id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // departments: self-referential tree RESTRICT
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_department_self_referential_parent_restricts_cross_tenant(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-dept-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-dept-b');

        $cid1 = $this->insertCompany($t1);
        $parent = $this->insertDepartment($t1, $cid1, ['code' => 'ROOT']);

        $cid2 = $this->insertCompany($t2);
        $this->assertInsertRejected(
            'departments',
            $this->departmentAttributes($t2, $cid2, ['parent_id' => $parent, 'code' => 'CHILD']),
            'Cross-tenant parent_id in departments should be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_deleting_parent_department_with_children_is_refused(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $parent = $this->insertDepartment($tid, $cid, ['code' => 'PARENT']);
        $this->insertDepartment($tid, $cid, ['parent_id' => $parent, 'code' => 'CHILD']);

        $this->assertDeleteRejectedByForeignKey(
            'departments',
            $parent,
            'Deleting a department with children should be refused.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // departments: cross-tenant company FK
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_department_rejects_cross_tenant_company(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-dept-c');
        $t2 = $this->insertTenant($plan['id'], 'ten-dept-d');
        $cid = $this->insertCompany($t1);

        $this->assertInsertRejected(
            'departments',
            $this->departmentAttributes($t2, $cid),
            'Cross-tenant company_id in departments should be rejected.',
            'foreign'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // designations: unique (tenant_id, code)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_designation_code_unique_within_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $this->insertDesignation($tid, ['code' => 'MGR']);

        $this->assertInsertRejected(
            'designations',
            $this->designationAttributes($tid, ['code' => 'MGR']),
            'Duplicate designation code within same tenant should be rejected.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // shifts: unique (tenant_id, code)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_shift_code_unique_within_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $this->insertShift($tid, ['code' => 'MORNING']);

        $this->assertInsertRejected(
            'shifts',
            $this->shiftAttributes($tid, ['code' => 'MORNING']),
            'Duplicate shift code within same tenant should be rejected.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // employees: unique (tenant_id, employee_code)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_employee_code_unique_within_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $this->insertEmployee($tid, $cid, ['employee_code' => 'EMP-001']);

        $this->assertInsertRejected(
            'employees',
            $this->employeeAttributes($tid, $cid, ['employee_code' => 'EMP-001']),
            'Duplicate employee_code within same tenant should be rejected.'
        );
    }

    /** @test */
    public function test_same_employee_code_allowed_across_tenants(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-emp-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-emp-b');
        $c1 = $this->insertCompany($t1);
        $c2 = $this->insertCompany($t2);

        $this->insertEmployee($t1, $c1, ['employee_code' => 'EMP-001']);
        $id = $this->insertEmployee($t2, $c2, ['employee_code' => 'EMP-001']);
        self::assertGreaterThan(0, $id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // employees: cross-tenant composite FKs (inline Wave 8)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_employee_rejects_cross_tenant_company(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-emp-c');
        $t2 = $this->insertTenant($plan['id'], 'ten-emp-d');
        $cid = $this->insertCompany($t1);

        $this->assertInsertRejected(
            'employees',
            $this->employeeAttributes($t2, $cid),
            'Cross-tenant company_id in employees should be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_employee_rejects_cross_tenant_department(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-emp-e');
        $t2 = $this->insertTenant($plan['id'], 'ten-emp-f');
        $cid1 = $this->insertCompany($t1);
        $cid2 = $this->insertCompany($t2);
        $deptId = $this->insertDepartment($t1, $cid1);

        $this->assertInsertRejected(
            'employees',
            $this->employeeAttributes($t2, $cid2, ['department_id' => $deptId]),
            'Cross-tenant department_id in employees should be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_employee_rejects_cross_tenant_designation(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-emp-g');
        $t2 = $this->insertTenant($plan['id'], 'ten-emp-h');
        $cid2 = $this->insertCompany($t2);
        $desigId = $this->insertDesignation($t1);

        $this->assertInsertRejected(
            'employees',
            $this->employeeAttributes($t2, $cid2, ['designation_id' => $desigId]),
            'Cross-tenant designation_id in employees should be rejected.',
            'foreign'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Wave 9 closure: head_employee_id on departments
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_department_head_rejects_cross_tenant_employee(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-head-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-head-b');
        $cid1 = $this->insertCompany($t1);
        $cid2 = $this->insertCompany($t2);
        $empId = $this->insertEmployee($t1, $cid1);

        // Create the department without a head first.
        $deptId = $this->insertDepartment($t2, $cid2);

        // Then try to set a cross-tenant employee as the head.
        $this->assertInsertRejected(
            'departments',
            $this->departmentAttributes($t2, $cid2, ['head_employee_id' => $empId]),
            'Cross-tenant head_employee_id in departments should be rejected (Wave 9 closure).',
            'foreign'
        );
    }

    /** @test */
    public function test_deleting_employee_who_is_department_head_is_refused(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $empId = $this->insertEmployee($tid, $cid);
        $this->insertDepartment($tid, $cid, ['head_employee_id' => $empId]);

        $this->assertDeleteRejectedByForeignKey(
            'employees',
            $empId,
            'Deleting an employee who is a department head should be refused.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Wave 9 closure: reports_to_employee_id self-referential
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_employee_reports_to_self_referential_rejects_cross_tenant(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-rpt-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-rpt-b');
        $cid1 = $this->insertCompany($t1);
        $cid2 = $this->insertCompany($t2);
        $manager = $this->insertEmployee($t1, $cid1, ['employee_code' => 'MGR-001']);

        $this->assertInsertRejected(
            'employees',
            $this->employeeAttributes($t2, $cid2, [
                'employee_code' => 'EMP-SUB',
                'reports_to_employee_id' => $manager,
            ]),
            'Cross-tenant reports_to_employee_id should be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_deleting_manager_employee_with_reports_is_refused(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $manager = $this->insertEmployee($tid, $cid, ['employee_code' => 'MGR-X']);
        $this->insertEmployee($tid, $cid, [
            'employee_code' => 'EMP-X',
            'reports_to_employee_id' => $manager,
        ]);

        $this->assertDeleteRejectedByForeignKey(
            'employees',
            $manager,
            'Deleting a manager who has direct reports should be refused.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Wave 9 closure: default_shift_id
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_employee_rejects_cross_tenant_shift(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-shf-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-shf-b');
        $cid2 = $this->insertCompany($t2);
        $shiftId = $this->insertShift($t1);

        $this->assertInsertRejected(
            'employees',
            $this->employeeAttributes($t2, $cid2, ['default_shift_id' => $shiftId]),
            'Cross-tenant default_shift_id should be rejected (Wave 9 closure).',
            'foreign'
        );
    }

    /** @test */
    public function test_deleting_shift_referenced_by_employee_is_refused(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $shiftId = $this->insertShift($tid);
        $this->insertEmployee($tid, $cid, ['default_shift_id' => $shiftId]);

        $this->assertDeleteRejectedByForeignKey(
            'shifts',
            $shiftId,
            'Deleting a shift referenced by an employee should be refused.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // shifts: crosses_midnight column exists and accepts 0/1
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_shift_crosses_midnight_stores_correctly(): void
    {
        $tid = $this->insertTenantWithPlan();
        $id = $this->insertShift($tid, [
            'code' => 'NIGHT',
            'start_time' => '22:00:00',
            'end_time' => '06:00:00',
            'crosses_midnight' => 1,
        ]);

        self::assertSame('1', (string) $this->columnValue('shifts', 'crosses_midnight', $id));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // employees: user_id unique-when-set (NULL hole documented)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_employee_user_id_unique_when_set(): void
    {
        // Create a real user so the user_id FK is satisfiable.
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $userId = DB::table('users')->insertGetId([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'Test User',
            'email' => 'test-unique@example.com',
            'password' => 'hashed',
            'status' => 'active',
            'tenant_id' => $tid,
        ]);

        $this->insertEmployee($tid, $cid, ['employee_code' => 'EMP-U1', 'user_id' => $userId]);

        // Second employee with the same user_id must be rejected.
        $this->assertInsertRejected(
            'employees',
            $this->employeeAttributes($tid, $cid, ['employee_code' => 'EMP-U2', 'user_id' => $userId]),
            'Two employees cannot share the same user_id.'
        );
    }

    /** @test */
    public function test_employee_null_user_id_does_not_block_multiple_null_rows(): void
    {
        // NULL ≠ NULL — multiple employees without a login are not blocked.
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);

        $this->insertEmployee($tid, $cid, ['employee_code' => 'EMP-N1', 'user_id' => null]);
        $id = $this->insertEmployee($tid, $cid, ['employee_code' => 'EMP-N2', 'user_id' => null]);
        self::assertGreaterThan(0, $id, 'Multiple null user_id employees should be allowed.');
    }
}
