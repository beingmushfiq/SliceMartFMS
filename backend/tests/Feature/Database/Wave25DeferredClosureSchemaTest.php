<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use PHPUnit\Framework\Attributes\Test;

/**
 * Wave 25: Deferred Cross-Group Foreign Key Closure Schema Tests.
 *
 * Verifies that all deferred cross-group foreign keys have been closed
 * and enforce composite (tenant_id, parent_id) referential integrity:
 * 1. employees.salary_structure_id               → salary_structures(tenant_id, id)
 * 2. material_issue_items.stock_movement_id      → stock_movements(tenant_id, id)
 * 3. production_outputs.stock_movement_id        → stock_movements(tenant_id, id)
 * 4. qc_inspections.goods_receipt_id             → goods_receipts(tenant_id, id)
 * 5. wastage_records.stock_movement_id           → stock_movements(tenant_id, id)
 * 6. worker_production_entries.payroll_period_id → payroll_periods(tenant_id, id)
 * 7. run_sheets.vehicle_id                       → assets(tenant_id, id)
 * 8. cod_reconciliations.bank_account_id         → bank_accounts(tenant_id, id)
 * 9. asset_depreciation_entries.journal_entry_id → journal_entries(tenant_id, id)
 */
class Wave25DeferredClosureSchemaTest extends SchemaTestCase
{
    #[Test]
    public function employees_salary_structure_foreign_key_is_enforced(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $ss1 = $this->insertSalaryStructure($t1, 'Standard Factory Wage');
        $ss2 = $this->insertSalaryStructure($t2, 'Standard Factory Wage T2');

        // Valid assignment within same tenant
        $emp1 = $this->insertEmployee($t1, $c1, ['salary_structure_id' => $ss1]);
        $this->assertGreaterThan(0, $emp1);

        // Cross-tenant salary structure rejected
        $this->expectException(QueryException::class);
        $this->insertEmployee($t1, $c1, ['salary_structure_id' => $ss2]);
    }

    #[Test]
    public function material_issue_items_stock_movement_foreign_key_is_enforced(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $f1 = $this->insertFactory($t1, $c1);
        $w1 = $this->insertWarehouse($t1);
        $u1 = $this->insertUnit($t1);
        $p1 = $this->insertProduct($t1, $u1);
        $bom1 = $this->insertBillOfMaterials($t1, $p1, $u1);
        $batch1 = $this->insertProductionBatch($t1, $f1, $p1, $bom1, $u1);
        $issue1 = $this->insertMaterialIssue($t1, $batch1, $w1);

        $sm1 = $this->insertStockMovement($t1, $w1, $p1, $u1);

        $w2 = $this->insertWarehouse($t2);
        $u2 = $this->insertUnit($t2);
        $p2 = $this->insertProduct($t2, $u2);
        $sm2 = $this->insertStockMovement($t2, $w2, $p2, $u2);

        // Valid within same tenant
        $itemId = $this->insertMaterialIssueItem($t1, $issue1, $p1, $u1, [
            'stock_movement_id' => $sm1,
        ]);
        $this->assertGreaterThan(0, $itemId);

        // Cross-tenant stock movement rejected
        $this->expectException(QueryException::class);
        $this->insertMaterialIssueItem($t1, $issue1, $p1, $u1, [
            'stock_movement_id' => $sm2,
        ]);
    }

    #[Test]
    public function production_outputs_stock_movement_foreign_key_is_enforced(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $f1 = $this->insertFactory($t1, $c1);
        $w1 = $this->insertWarehouse($t1);
        $u1 = $this->insertUnit($t1);
        $p1 = $this->insertProduct($t1, $u1);
        $bom1 = $this->insertBillOfMaterials($t1, $p1, $u1);
        $batch1 = $this->insertProductionBatch($t1, $f1, $p1, $bom1, $u1);
        $sm1 = $this->insertStockMovement($t1, $w1, $p1, $u1);

        $w2 = $this->insertWarehouse($t2);
        $u2 = $this->insertUnit($t2);
        $p2 = $this->insertProduct($t2, $u2);
        $sm2 = $this->insertStockMovement($t2, $w2, $p2, $u2);

        // Valid within same tenant
        $outId = $this->insertProductionOutput($t1, $batch1, $p1, $u1, $w1, [
            'stock_movement_id' => $sm1,
        ]);
        $this->assertGreaterThan(0, $outId);

        // Cross-tenant stock movement rejected
        $this->expectException(QueryException::class);
        $this->insertProductionOutput($t1, $batch1, $p1, $u1, $w1, [
            'stock_movement_id' => $sm2,
        ]);
    }

    #[Test]
    public function qc_inspections_goods_receipt_foreign_key_is_enforced(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $inspector1 = $this->insertEmployee($t1, $c1);

        $w1 = $this->insertWarehouse($t1);
        $supplier1 = $this->insertParty($t1, ['is_supplier' => true]);
        $gr1 = $this->insertGoodsReceipt($t1, $supplier1, $w1);

        $c2 = $this->insertCompany($t2);
        $w2 = $this->insertWarehouse($t2);
        $supplier2 = $this->insertParty($t2, ['is_supplier' => true]);
        $gr2 = $this->insertGoodsReceipt($t2, $supplier2, $w2);

        // Valid within same tenant
        $qcId = $this->insertQcInspection($t1, $inspector1, null, null, [
            'goods_receipt_id' => $gr1,
        ]);
        $this->assertGreaterThan(0, $qcId);

        // Cross-tenant goods receipt rejected
        $this->expectException(QueryException::class);
        $this->insertQcInspection($t1, $inspector1, null, null, [
            'goods_receipt_id' => $gr2,
        ]);
    }

    #[Test]
    public function wastage_records_stock_movement_foreign_key_is_enforced(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $w1 = $this->insertWarehouse($t1);
        $u1 = $this->insertUnit($t1);
        $p1 = $this->insertProduct($t1, $u1);
        $rid1 = $this->insertReasonCode($t1, ['context' => 'wastage']);
        $sm1 = $this->insertStockMovement($t1, $w1, $p1, $u1);

        $w2 = $this->insertWarehouse($t2);
        $u2 = $this->insertUnit($t2);
        $p2 = $this->insertProduct($t2, $u2);
        $sm2 = $this->insertStockMovement($t2, $w2, $p2, $u2);

        // Valid within same tenant
        $wId = $this->insertWastageRecord($t1, $p1, $u1, $rid1, null, $w1, [
            'stock_movement_id' => $sm1,
        ]);
        $this->assertGreaterThan(0, $wId);

        // Cross-tenant stock movement rejected
        $this->expectException(QueryException::class);
        $this->insertWastageRecord($t1, $p1, $u1, $rid1, null, $w1, [
            'stock_movement_id' => $sm2,
        ]);
    }

    #[Test]
    public function worker_production_entries_payroll_period_foreign_key_is_enforced(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $f1 = $this->insertFactory($t1, $c1);
        $u1 = $this->insertUnit($t1);
        $p1 = $this->insertProduct($t1, $u1);
        $bom1 = $this->insertBillOfMaterials($t1, $p1, $u1);
        $batch1 = $this->insertProductionBatch($t1, $f1, $p1, $bom1, $u1);
        $emp1 = $this->insertEmployee($t1, $c1);
        $period1 = $this->insertPayrollPeriod($t1, $c1);

        $c2 = $this->insertCompany($t2);
        $period2 = $this->insertPayrollPeriod($t2, $c2);

        // Valid within same tenant
        $entry1 = $this->insertWorkerProductionEntry($t1, $batch1, $emp1, $p1, $u1, [
            'payroll_period_id' => $period1,
        ]);
        $this->assertGreaterThan(0, $entry1);

        // Cross-tenant payroll period rejected
        $this->expectException(QueryException::class);
        $this->insertWorkerProductionEntry($t1, $batch1, $emp1, $p1, $u1, [
            'payroll_period_id' => $period2,
        ]);
    }

    #[Test]
    public function run_sheets_vehicle_foreign_key_is_enforced(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $b1 = $this->insertBranch($t1, $c1);

        $cat1 = $this->insertAssetCategory($t1);
        $asset1 = $this->insertAsset($t1, $cat1, $c1, $b1, ['asset_code' => 'AST-VAN-01']);

        $c2 = $this->insertCompany($t2);
        $b2 = $this->insertBranch($t2, $c2);
        $cat2 = $this->insertAssetCategory($t2);
        $asset2 = $this->insertAsset($t2, $cat2, $c2, $b2, ['asset_code' => 'AST-VAN-T2']);

        // Valid within same tenant
        $rsId = $this->insertRunSheet($t1, $b1, [
            'vehicle_id' => $asset1,
        ]);
        $this->assertGreaterThan(0, $rsId);

        // Cross-tenant asset vehicle rejected
        $this->expectException(QueryException::class);
        $this->insertRunSheet($t1, $b1, [
            'vehicle_id' => $asset2,
        ]);
    }

    #[Test]
    public function cod_reconciliations_bank_account_foreign_key_is_enforced(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $b1 = $this->insertBranch($t1, $c1);
        $rs1 = $this->insertRunSheet($t1, $b1);

        $coa1 = $this->insertChartOfAccount($t1, $c1);
        $bank1 = $this->insertBankAccount($t1, $c1, $coa1, 'MAIN_BANK');

        $c2 = $this->insertCompany($t2);
        $coa2 = $this->insertChartOfAccount($t2, $c2);
        $bank2 = $this->insertBankAccount($t2, $c2, $coa2, 'T2_BANK');

        // Valid within same tenant
        $codId = $this->insertCodReconciliation($t1, 'run_sheet', $rs1, [
            'bank_account_id' => $bank1,
        ]);
        $this->assertGreaterThan(0, $codId);

        // Cross-tenant bank account rejected
        $this->expectException(QueryException::class);
        $this->insertCodReconciliation($t1, 'run_sheet', $rs1, [
            'bank_account_id' => $bank2,
        ]);
    }

    #[Test]
    public function asset_depreciation_entries_journal_entry_foreign_key_is_enforced(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $b1 = $this->insertBranch($t1, $c1);
        $cat1 = $this->insertAssetCategory($t1);
        $asset1 = $this->insertAsset($t1, $cat1, $c1, $b1);

        $je1 = $this->insertJournalEntry($t1, $c1);

        $c2 = $this->insertCompany($t2);
        $je2 = $this->insertJournalEntry($t2, $c2);

        // Valid within same tenant
        $deprId = $this->insertAssetDepreciationEntry($t1, $asset1, 2026, 8, [
            'journal_entry_id' => $je1,
        ]);
        $this->assertGreaterThan(0, $deprId);

        // Cross-tenant journal entry rejected
        $this->expectException(QueryException::class);
        $this->insertAssetDepreciationEntry($t1, $asset1, 2026, 8, [
            'journal_entry_id' => $je2,
        ]);
    }
}
