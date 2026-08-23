<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;

/**
 * Wave 22: Reporting & Analytics Schema Tests.
 *
 * Covers:
 *   - report_definitions
 *   - report_saved_views
 *   - report_schedules
 *   - report_exports
 *   - dashboard_widgets
 *   - summary_daily_production
 *   - summary_daily_worker_output
 *   - summary_daily_sales
 *   - summary_daily_stock
 *   - summary_daily_delivery
 *   - summary_monthly_finance
 *   - summary_monthly_payroll
 *   - summary_product_margin
 *   - summary_taxes
 */
class Wave22ReportingSchemaTest extends SchemaTestCase
{
    /** @var list<string> */
    private const TABLES = [
        'report_definitions',
        'report_saved_views',
        'report_schedules',
        'report_exports',
        'dashboard_widgets',
        'summary_daily_production',
        'summary_daily_worker_output',
        'summary_daily_sales',
        'summary_daily_stock',
        'summary_daily_delivery',
        'summary_monthly_finance',
        'summary_monthly_payroll',
        'summary_product_margin',
        'summary_taxes',
    ];

    #[Test]
    public function all_wave22_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasTable($table),
                "Failed asserting that table [{$table}] exists."
            );
        }
    }

    #[Test]
    public function every_wave22_table_has_tenant_id_in_primary_position(): void
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
    public function soft_delete_and_summary_rebuildable_compliance(): void
    {
        $softDeleteTables = [
            'report_definitions',
            'report_saved_views',
            'report_schedules',
            'report_exports',
            'dashboard_widgets',
        ];

        foreach ($softDeleteTables as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table [{$table}] must have softDeletes (deleted_at)."
            );
        }

        $summaryTables = [
            'summary_daily_production',
            'summary_daily_worker_output',
            'summary_daily_sales',
            'summary_daily_stock',
            'summary_daily_delivery',
            'summary_monthly_finance',
            'summary_monthly_payroll',
            'summary_product_margin',
            'summary_taxes',
        ];

        foreach ($summaryTables as $table) {
            $this->assertFalse(
                Schema::hasColumn($table, 'deleted_at'),
                "Summary table [{$table}] is a rebuildable materialized read model and must not have deleted_at."
            );
            $this->assertTrue(
                Schema::hasColumn($table, 'refreshed_at'),
                "Summary table [{$table}] must have refreshed_at timestamp."
            );
        }

        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'uuid'),
                "Table [{$table}] must have uuid."
            );
        }
    }

    #[Test]
    public function report_definitions_code_uniqueness_with_platform_null_tenant_support(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        // Platform-level report definition (tenant_id = null)
        $pId = $this->insertReportDefinition(null, 'GLOBAL_SALES');
        $this->assertGreaterThan(0, $pId);

        // Tenant-level custom report definition with same code in t1 allowed
        $t1Id = $this->insertReportDefinition($t1, 'GLOBAL_SALES', ['code' => 'GLOBAL_SALES_T1']);
        $this->assertGreaterThan(0, $t1Id);

        // Duplicate code in same tenant rejected
        $this->expectException(QueryException::class);
        $this->insertReportDefinition($t1, 'GLOBAL_SALES', ['code' => 'GLOBAL_SALES_DUPE']);
        DB::table('report_definitions')->insert($this->reportDefinitionAttributes($t1, 'GLOBAL_SALES', ['code' => 'GLOBAL_SALES_DUPE']));
    }

    #[Test]
    public function report_saved_views_user_storage(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $userId = $this->insertUser($t);
        $defId = $this->insertReportDefinition($t);

        $viewId = $this->insertReportSavedView($t, $defId, $userId);
        $this->assertGreaterThan(0, $viewId);

        $row = DB::table('report_saved_views')->where('id', $viewId)->first();
        $this->assertNotNull($row);
        $this->assertSame($userId, (int) $row->user_id);
    }

    #[Test]
    public function summary_daily_production_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $f = $this->insertFactory($t, $c);
        $line = $this->insertProductionLine($t, $f);
        $unit = $this->insertUnit($t);
        $product = $this->insertProduct($t, $unit);

        $this->insertSummaryDailyProduction($t, $f, $line, $product, '2026-08-24');

        $this->expectException(QueryException::class);
        DB::table('summary_daily_production')->insert($this->summaryDailyProductionAttributes(
            $t,
            $f,
            $line,
            $product,
            '2026-08-24'
        ));
    }

    #[Test]
    public function summary_daily_sales_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);

        $this->insertSummaryDailySales($t, $b, 'online', '2026-08-24');

        $this->expectException(QueryException::class);
        DB::table('summary_daily_sales')->insert($this->summaryDailySalesAttributes(
            $t,
            $b,
            'online',
            '2026-08-24'
        ));
    }

    #[Test]
    public function summary_daily_stock_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $wh = $this->insertWarehouse($t);
        $unit = $this->insertUnit($t);
        $product = $this->insertProduct($t, $unit);

        $this->insertSummaryDailyStock($t, $wh, $product, '2026-08-24');

        $this->expectException(QueryException::class);
        DB::table('summary_daily_stock')->insert($this->summaryDailyStockAttributes(
            $t,
            $wh,
            $product,
            '2026-08-24'
        ));
    }

    #[Test]
    public function summary_monthly_finance_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $coa = $this->insertChartOfAccount($t, $c);

        $this->insertSummaryMonthlyFinance($t, $c, $coa, 2026, 8);

        $this->expectException(QueryException::class);
        DB::table('summary_monthly_finance')->insert($this->summaryMonthlyFinanceAttributes(
            $t,
            $c,
            $coa,
            2026,
            8
        ));
    }

    #[Test]
    public function summary_monthly_payroll_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);

        $this->insertSummaryMonthlyPayroll($t, $c, 2026, 8);

        $this->expectException(QueryException::class);
        DB::table('summary_monthly_payroll')->insert($this->summaryMonthlyPayrollAttributes(
            $t,
            $c,
            2026,
            8
        ));
    }

    #[Test]
    public function summary_product_margin_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $unit = $this->insertUnit($t);
        $product = $this->insertProduct($t, $unit);

        $this->insertSummaryProductMargin($t, $product, 2026, 8);

        $this->expectException(QueryException::class);
        DB::table('summary_product_margin')->insert($this->summaryProductMarginAttributes(
            $t,
            $product,
            2026,
            8
        ));
    }

    #[Test]
    public function summary_taxes_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $taxProf = $this->insertTaxProfile($t);

        $this->insertSummaryTax($t, $c, $taxProf, 2026, 8);

        $this->expectException(QueryException::class);
        DB::table('summary_taxes')->insert($this->summaryTaxAttributes(
            $t,
            $c,
            $taxProf,
            2026,
            8
        ));
    }

    #[Test]
    public function cross_tenant_references_are_rejected(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $f1 = $this->insertFactory($t1, $c1);
        $line1 = $this->insertProductionLine($t1, $f1);

        $unit2 = $this->insertUnit($t2);
        $prod2 = $this->insertProduct($t2, $unit2);

        // Trying to insert production summary in tenant 1 with product belonging to tenant 2
        $this->expectException(QueryException::class);
        $this->insertSummaryDailyProduction($t1, $f1, $line1, $prod2);
    }

    #[Test]
    public function reporting_decimal_precision_round_trip(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);

        $id = $this->insertSummaryDailySales($t, $b, 'field', '2026-08-24', [
            'gross_amount' => '123456.7890',
            'discount_amount' => '2345.6789',
            'net_amount' => '121111.1101',
        ]);

        $row = DB::table('summary_daily_sales')->where('id', $id)->first();
        $this->assertNotNull($row);
        $this->assertSame(123456.789, (float) $row->gross_amount);
        $this->assertSame(2345.6789, (float) $row->discount_amount);
        $this->assertSame(121111.1101, (float) $row->net_amount);
    }
}
