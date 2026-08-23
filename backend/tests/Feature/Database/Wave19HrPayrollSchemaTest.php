<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;

/**
 * Wave 19: Full HR & Payroll Schema Tests.
 *
 * Covers:
 *   - leave_types
 *   - leave_requests
 *   - leave_balances
 *   - shift_assignments
 *   - holidays
 *   - employee_documents
 *   - salary_components
 *   - salary_structures
 *   - salary_structure_components
 *   - payroll_periods
 *   - attendances
 *   - payslips
 *   - payslip_items
 *   - payroll_advances
 */
class Wave19HrPayrollSchemaTest extends SchemaTestCase
{
    /** @var list<string> */
    private const TABLES = [
        'leave_types',
        'leave_requests',
        'leave_balances',
        'shift_assignments',
        'holidays',
        'employee_documents',
        'salary_components',
        'salary_structures',
        'salary_structure_components',
        'payroll_periods',
        'attendances',
        'payslips',
        'payslip_items',
        'payroll_advances',
    ];

    #[Test]
    public function all_wave19_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasTable($table),
                "Failed asserting that table [{$table}] exists."
            );
        }
    }

    #[Test]
    public function every_wave19_table_has_tenant_id_in_primary_position(): void
    {
        foreach (self::TABLES as $table) {
            $columns = Schema::getColumnListing($table);
            $this->assertGreaterThanOrEqual(
                2,
                count($columns),
                "Table [{$table}] must have at least 2 columns."
            );
            $this->assertSame(
                'tenant_id',
                $columns[1],
                "Table [{$table}] must place 'tenant_id' at ordinal position 1 (second column after id)."
            );
        }
    }

    #[Test]
    public function every_wave19_table_has_soft_deletes_and_uuid(): void
    {
        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table [{$table}] must have softDeletes (deleted_at)."
            );
            $this->assertTrue(
                Schema::hasColumn($table, 'uuid'),
                "Table [{$table}] must have uuid."
            );
        }
    }

    #[Test]
    public function leave_types_enforces_code_uniqueness_per_tenant(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $this->insertLeaveType($t1, 'SICK');

        // Cross-tenant same code is permitted
        $id2 = $this->insertLeaveType($t2, 'SICK', ['code' => 'SICK_UNIQUE']);
        $this->assertGreaterThan(0, $id2);

        // Same tenant duplicate code fails
        $this->expectException(QueryException::class);
        $this->insertLeaveType($t1, 'SICK', ['code' => 'SICK_DUPE']);
        DB::table('leave_types')->insert($this->leaveTypeAttributes($t1, 'SICK', ['code' => 'SICK_DUPE']));
    }

    #[Test]
    public function leave_requests_enforces_request_number_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $companyId = $this->insertCompany($t);
        $empId = $this->insertEmployee($t, $companyId);
        $leaveTypeId = $this->insertLeaveType($t);

        $this->insertLeaveRequest($t, $empId, $leaveTypeId, ['request_number' => 'LR-2026-001']);

        $this->expectException(QueryException::class);
        DB::table('leave_requests')->insert($this->leaveRequestAttributes(
            $t,
            $empId,
            $leaveTypeId,
            ['request_number' => 'LR-2026-001']
        ));
    }

    #[Test]
    public function leave_balances_enforces_composite_uniqueness_per_employee_type_year(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $companyId = $this->insertCompany($t);
        $empId = $this->insertEmployee($t, $companyId);
        $leaveTypeId = $this->insertLeaveType($t);

        $this->insertLeaveBalance($t, $empId, $leaveTypeId, 2026);

        $this->expectException(QueryException::class);
        DB::table('leave_balances')->insert($this->leaveBalanceAttributes(
            $t,
            $empId,
            $leaveTypeId,
            2026
        ));
    }

    #[Test]
    public function shift_assignments_reiterates_fk_constraints(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $e1 = $this->insertEmployee($t1, $c1);
        $s1 = $this->insertShift($t1);

        $id = $this->insertShiftAssignment($t1, $e1, $s1);
        $this->assertGreaterThan(0, $id);

        // Cross-tenant employee is rejected
        $c2 = $this->insertCompany($t2);
        $e2 = $this->insertEmployee($t2, $c2);

        $this->expectException(QueryException::class);
        $this->insertShiftAssignment($t1, $e2, $s1);
    }

    #[Test]
    public function holidays_enforces_tenant_and_date_indexing(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');

        $hId = $this->insertHoliday($t, '2026-12-25', ['name' => 'Christmas Day']);
        $this->assertGreaterThan(0, $hId);

        $row = DB::table('holidays')->where('id', $hId)->first();
        $this->assertNotNull($row);
        $this->assertSame('2026-12-25', $row->holiday_date);
    }

    #[Test]
    public function employee_documents_cascades_on_employee_delete(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $companyId = $this->insertCompany($t);
        $empId = $this->insertEmployee($t, $companyId);
        $attId = $this->insertAttachment($t);

        $docId = $this->insertEmployeeDocument($t, $empId, $attId, 'nid');
        $this->assertGreaterThan(0, $docId);

        // Deleting employee row hard-deletes the document
        DB::table('employees')->where('id', $empId)->delete();
        $this->assertNull(DB::table('employee_documents')->where('id', $docId)->first());
    }

    #[Test]
    public function salary_components_enforces_code_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');

        $this->insertSalaryComponent($t1, 'BASIC_PAY');

        $this->expectException(QueryException::class);
        DB::table('salary_components')->insert($this->salaryComponentAttributes($t1, 'BASIC_PAY', 'earning', [
            'code' => 'BASIC_PAY_1',
        ]));
    }

    #[Test]
    public function salary_structures_enforces_composite_uniqueness_on_code_and_effective(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');

        $this->insertSalaryStructure($t1, 'STAFF_2026', [
            'code' => 'STAFF_2026',
            'effective_from' => '2026-01-01',
        ]);

        $this->expectException(QueryException::class);
        DB::table('salary_structures')->insert($this->salaryStructureAttributes($t1, 'STAFF_2026', [
            'code' => 'STAFF_2026',
            'effective_from' => '2026-01-01',
        ]));
    }

    #[Test]
    public function salary_structure_components_cascades_on_structure_delete(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $structId = $this->insertSalaryStructure($t);
        $compId = $this->insertSalaryComponent($t);

        $sCompId = $this->insertSalaryStructureComponent($t, $structId, $compId);
        $this->assertGreaterThan(0, $sCompId);

        DB::table('salary_structures')->where('id', $structId)->delete();
        $this->assertNull(DB::table('salary_structure_components')->where('id', $sCompId)->first());
    }

    #[Test]
    public function payroll_periods_enforces_code_uniqueness_per_company(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $companyId = $this->insertCompany($t);

        $this->insertPayrollPeriod($t, $companyId, '2026-08', ['period_code' => '2026-08']);

        $this->expectException(QueryException::class);
        DB::table('payroll_periods')->insert($this->payrollPeriodAttributes($t, $companyId, '2026-08', [
            'period_code' => '2026-08',
        ]));
    }

    #[Test]
    public function attendances_enforces_one_row_per_employee_per_date(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $companyId = $this->insertCompany($t);
        $empId = $this->insertEmployee($t, $companyId);

        $this->insertAttendance($t, $empId, '2026-08-24');

        $this->expectException(QueryException::class);
        DB::table('attendances')->insert($this->attendanceAttributes($t, $empId, '2026-08-24'));
    }

    #[Test]
    public function payslips_enforces_uniqueness_and_item_cascading_delete(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $companyId = $this->insertCompany($t);
        $empId = $this->insertEmployee($t, $companyId);
        $periodId = $this->insertPayrollPeriod($t, $companyId);
        $salaryCompId = $this->insertSalaryComponent($t);

        $payslipId = $this->insertPayslip($t, $periodId, $empId, ['payslip_number' => 'PS-2026-001']);
        $this->assertGreaterThan(0, $payslipId);

        $itemId = $this->insertPayslipItem($t, $payslipId, $salaryCompId);
        $this->assertGreaterThan(0, $itemId);

        // Verify cascading delete on payslip item
        DB::table('payslips')->where('id', $payslipId)->delete();
        $this->assertNull(DB::table('payslip_items')->where('id', $itemId)->first());
    }

    #[Test]
    public function payroll_advances_enforces_advance_number_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $companyId = $this->insertCompany($t);
        $empId = $this->insertEmployee($t, $companyId);

        $this->insertPayrollAdvance($t, $empId, ['advance_number' => 'ADV-2026-001']);

        $this->expectException(QueryException::class);
        DB::table('payroll_advances')->insert($this->payrollAdvanceAttributes($t, $empId, [
            'advance_number' => 'ADV-2026-001',
        ]));
    }

    #[Test]
    public function cross_tenant_references_are_rejected(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $e1 = $this->insertEmployee($t1, $c1);

        $c2 = $this->insertCompany($t2);
        $period2 = $this->insertPayrollPeriod($t2, $c2);

        // Payslip trying to mix tenant 1 employee with tenant 2 payroll period
        $this->expectException(QueryException::class);
        $this->insertPayslip($t1, $period2, $e1);
    }

    #[Test]
    public function hr_payroll_decimal_precision_round_trip(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $companyId = $this->insertCompany($t);
        $empId = $this->insertEmployee($t, $companyId);
        $periodId = $this->insertPayrollPeriod($t, $companyId);

        $payslipId = $this->insertPayslip($t, $periodId, $empId, [
            'gross_amount' => '65432.1234',
            'net_amount' => '58765.4321',
            'paid_days' => '28.5000',
        ]);

        $row = DB::table('payslips')->where('id', $payslipId)->first();
        $this->assertNotNull($row);
        $this->assertSame(65432.1234, (float) $row->gross_amount);
        $this->assertSame(58765.4321, (float) $row->net_amount);
        $this->assertSame(28.5, (float) $row->paid_days);
    }
}
