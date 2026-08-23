<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 10 — Production schema contracts.
 *
 * Implements ADR-011 (Production Spine), ADR-012 (Production Context Completeness),
 * ADR-013 (Worker Linkage), and DATABASE_DESIGN.md §5 Group D.
 *
 * Tables:
 *   - production_plans
 *   - production_plan_items
 *   - production_batches
 *   - material_issues
 *   - material_issue_items
 *   - production_batch_inputs
 *   - worker_production_entries
 *   - production_outputs
 */
class Wave10ProductionSchemaTest extends SchemaTestCase
{
    private const TABLES = [
        'production_plans',
        'production_plan_items',
        'production_batches',
        'material_issues',
        'material_issue_items',
        'production_batch_inputs',
        'worker_production_entries',
        'production_outputs',
    ];

    /** @test */
    public function test_all_wave_10_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Expected table {$table} to exist after Wave 10 migrations."
            );
        }
    }

    /** @test */
    public function test_all_wave_10_tables_have_tenant_id_immediately_after_id(): void
    {
        foreach (self::TABLES as $table) {
            $columns = Schema::getColumnListing($table);
            self::assertSame(
                'id',
                $columns[0] ?? null,
                "Table {$table} must have 'id' as first column."
            );
            self::assertSame(
                'tenant_id',
                $columns[1] ?? null,
                "Table {$table} must have 'tenant_id' as second column."
            );
        }
    }

    /** @test */
    public function test_all_wave_10_tables_have_soft_deletes(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table {$table} must support soft deletes."
            );
        }
    }

    /** @test */
    public function test_no_wave_10_migration_contains_float_double_or_enum(): void
    {
        $files = glob(database_path('migrations/2026_08_24_105*'));
        self::assertIsArray($files);
        self::assertNotEmpty($files, 'Wave 10 migrations must exist.');

        foreach ($files as $file) {
            $content = file_get_contents($file);
            self::assertIsString($content);

            self::assertStringNotContainsString('->float(', $content, "Forbidden float in {$file}");
            self::assertStringNotContainsString('->double(', $content, "Forbidden double in {$file}");
            self::assertStringNotContainsString('->enum(', $content, "Forbidden enum in {$file}");
        }
    }

    // ─── production_plans ───────────────────────────────────────────────────

    /** @test */
    public function test_production_plan_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);

        $this->insertProductionPlan($tid, $cid, $fid, ['plan_number' => 'PLAN-2026-001']);

        $this->assertInsertRejected(
            'production_plans',
            $this->productionPlanAttributes($tid, $cid, $fid, ['plan_number' => 'PLAN-2026-001']),
            'Duplicate plan_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_same_plan_number_allowed_in_different_tenants(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $fid2 = $this->insertFactory($tid2, $cid2);

        $this->insertProductionPlan($tid1, $cid1, $fid1, ['plan_number' => 'PLAN-2026-001']);
        $id2 = $this->insertProductionPlan($tid2, $cid2, $fid2, ['plan_number' => 'PLAN-2026-001']);

        self::assertGreaterThan(0, $id2);
    }

    /** @test */
    public function test_production_plan_composite_fk_rejects_cross_tenant_company(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);

        $this->assertInsertRejected(
            'production_plans',
            $this->productionPlanAttributes($tid1, $cid2, $fid1, ['plan_number' => 'PLAN-XT-1']),
            'Cross-tenant company_id on production_plans must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_production_plan_composite_fk_rejects_cross_tenant_factory(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $fid2 = $this->insertFactory($tid2, $cid2);

        $this->assertInsertRejected(
            'production_plans',
            $this->productionPlanAttributes($tid1, $cid1, $fid2, ['plan_number' => 'PLAN-XT-2']),
            'Cross-tenant factory_id on production_plans must be rejected.',
            'foreign'
        );
    }

    // ─── production_plan_items ──────────────────────────────────────────────

    /** @test */
    public function test_production_plan_item_cascade_deletes_when_plan_is_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $bom = $this->insertBillOfMaterials($tid, $pid, $uid);
        $plan = $this->insertProductionPlan($tid, $cid, $fid);

        $itemId = $this->insertProductionPlanItem($tid, $plan, $pid, $bom, $uid);

        DB::table('production_plans')->where('id', $plan)->delete();

        self::assertNull(
            DB::table('production_plan_items')->where('id', $itemId)->first(),
            'production_plan_items must CASCADE delete when parent production_plan is deleted.'
        );
    }

    /** @test */
    public function test_production_plan_item_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $bom1 = $this->insertBillOfMaterials($tid1, $pid1, $uid1);
        $plan1 = $this->insertProductionPlan($tid1, $cid1, $fid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'production_plan_items',
            $this->productionPlanItemAttributes($tid1, $plan1, $pid2, $bom1, $uid1),
            'Cross-tenant product_id on production_plan_items must be rejected.',
            'foreign'
        );
    }

    // ─── production_batches ─────────────────────────────────────────────────

    /** @test */
    public function test_production_batch_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $bom = $this->insertBillOfMaterials($tid, $pid, $uid);

        $this->insertProductionBatch($tid, $fid, $pid, $bom, $uid, ['batch_number' => 'BATCH-2026-001']);

        $this->assertInsertRejected(
            'production_batches',
            $this->productionBatchAttributes($tid, $fid, $pid, $bom, $uid, ['batch_number' => 'BATCH-2026-001']),
            'Duplicate batch_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_same_batch_number_allowed_in_different_tenants(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $bom1 = $this->insertBillOfMaterials($tid1, $pid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $fid2 = $this->insertFactory($tid2, $cid2);
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);
        $bom2 = $this->insertBillOfMaterials($tid2, $pid2, $uid2);

        $this->insertProductionBatch($tid1, $fid1, $pid1, $bom1, $uid1, ['batch_number' => 'BATCH-2026-001']);
        $id2 = $this->insertProductionBatch($tid2, $fid2, $pid2, $bom2, $uid2, ['batch_number' => 'BATCH-2026-001']);

        self::assertGreaterThan(0, $id2);
    }

    /** @test */
    public function test_production_batch_composite_fk_rejects_cross_tenant_factory(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $bom1 = $this->insertBillOfMaterials($tid1, $pid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $fid2 = $this->insertFactory($tid2, $cid2);

        $this->assertInsertRejected(
            'production_batches',
            $this->productionBatchAttributes($tid1, $fid2, $pid1, $bom1, $uid1),
            'Cross-tenant factory_id on production_batches must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_production_batch_adr012_invariants_yield_and_variance_nullable_by_default(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $bom = $this->insertBillOfMaterials($tid, $pid, $uid);

        $id = $this->insertProductionBatch($tid, $fid, $pid, $bom, $uid);
        $row = DB::table('production_batches')->where('id', $id)->first();

        self::assertNotNull($row);
        self::assertNull($row->yield_percentage, 'ADR-012: yield_percentage must be NULL on draft/collecting batch.');
        self::assertNull($row->variance_quantity, 'ADR-012: variance_quantity must be NULL on draft/collecting batch.');
        self::assertNull($row->variance_percentage, 'ADR-012: variance_percentage must be NULL on draft/collecting batch.');
    }

    // ─── material_issues & items ────────────────────────────────────────────

    /** @test */
    public function test_material_issue_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $bom = $this->insertBillOfMaterials($tid, $pid, $uid);
        $bid = $this->insertProductionBatch($tid, $fid, $pid, $bom, $uid);
        $wid = $this->insertWarehouse($tid);

        $this->insertMaterialIssue($tid, $bid, $wid, ['issue_number' => 'MI-2026-001']);

        $this->assertInsertRejected(
            'material_issues',
            $this->materialIssueAttributes($tid, $bid, $wid, ['issue_number' => 'MI-2026-001']),
            'Duplicate issue_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_material_issue_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $bom1 = $this->insertBillOfMaterials($tid1, $pid1, $uid1);
        $bid1 = $this->insertProductionBatch($tid1, $fid1, $pid1, $bom1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wid2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'material_issues',
            $this->materialIssueAttributes($tid1, $bid1, $wid2),
            'Cross-tenant warehouse_id on material_issues must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_material_issue_item_cascade_deletes_when_issue_is_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $bom = $this->insertBillOfMaterials($tid, $pid, $uid);
        $bid = $this->insertProductionBatch($tid, $fid, $pid, $bom, $uid);
        $wid = $this->insertWarehouse($tid);
        $mid = $this->insertMaterialIssue($tid, $bid, $wid);

        $itemId = $this->insertMaterialIssueItem($tid, $mid, $pid, $uid);

        DB::table('material_issues')->where('id', $mid)->delete();

        self::assertNull(
            DB::table('material_issue_items')->where('id', $itemId)->first(),
            'material_issue_items must CASCADE delete when parent material_issue is deleted.'
        );
    }

    // ─── production_batch_inputs ────────────────────────────────────────────

    /** @test */
    public function test_production_batch_input_cascade_deletes_when_batch_is_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $bom = $this->insertBillOfMaterials($tid, $pid, $uid);
        $bid = $this->insertProductionBatch($tid, $fid, $pid, $bom, $uid);

        $inputId = $this->insertProductionBatchInput($tid, $bid, $pid, $uid);

        DB::table('production_batches')->where('id', $bid)->delete();

        self::assertNull(
            DB::table('production_batch_inputs')->where('id', $inputId)->first(),
            'production_batch_inputs must CASCADE delete when parent production_batch is deleted.'
        );
    }

    /** @test */
    public function test_production_batch_input_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $bom1 = $this->insertBillOfMaterials($tid1, $pid1, $uid1);
        $bid1 = $this->insertProductionBatch($tid1, $fid1, $pid1, $bom1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'production_batch_inputs',
            $this->productionBatchInputAttributes($tid1, $bid1, $pid2, $uid1),
            'Cross-tenant product_id on production_batch_inputs must be rejected.',
            'foreign'
        );
    }

    // ─── worker_production_entries ──────────────────────────────────────────

    /** @test */
    public function test_worker_production_entry_uniqueness_composite_key(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $bom = $this->insertBillOfMaterials($tid, $pid, $uid);
        $bid = $this->insertProductionBatch($tid, $fid, $pid, $bom, $uid);
        $eid = $this->insertEmployee($tid, $cid);
        $sid = $this->insertShift($tid);

        $this->insertWorkerProductionEntry($tid, $bid, $eid, $pid, $uid, [
            'work_date' => '2026-08-24',
            'shift_id' => $sid,
        ]);

        $this->assertInsertRejected(
            'worker_production_entries',
            $this->workerProductionEntryAttributes($tid, $bid, $eid, $pid, $uid, [
                'work_date' => '2026-08-24',
                'shift_id' => $sid,
            ]),
            'Duplicate worker entry for same batch, employee, product, work_date and shift must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_worker_production_entry_composite_fk_rejects_cross_tenant_employee(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $bom1 = $this->insertBillOfMaterials($tid1, $pid1, $uid1);
        $bid1 = $this->insertProductionBatch($tid1, $fid1, $pid1, $bom1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $eid2 = $this->insertEmployee($tid2, $cid2);

        $this->assertInsertRejected(
            'worker_production_entries',
            $this->workerProductionEntryAttributes($tid1, $bid1, $eid2, $pid1, $uid1),
            'Cross-tenant employee_id on worker_production_entries must be rejected.',
            'foreign'
        );
    }

    // ─── production_outputs ─────────────────────────────────────────────────

    /** @test */
    public function test_production_output_composite_fk_rejects_cross_tenant_batch(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $wid1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $fid2 = $this->insertFactory($tid2, $cid2);
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);
        $bom2 = $this->insertBillOfMaterials($tid2, $pid2, $uid2);
        $bid2 = $this->insertProductionBatch($tid2, $fid2, $pid2, $bom2, $uid2);

        $this->assertInsertRejected(
            'production_outputs',
            $this->productionOutputAttributes($tid1, $bid2, $pid1, $uid1, $wid1),
            'Cross-tenant production_batch_id on production_outputs must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_production_output_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $bom1 = $this->insertBillOfMaterials($tid1, $pid1, $uid1);
        $bid1 = $this->insertProductionBatch($tid1, $fid1, $pid1, $bom1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wid2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'production_outputs',
            $this->productionOutputAttributes($tid1, $bid1, $pid1, $uid1, $wid2),
            'Cross-tenant target_warehouse_id on production_outputs must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_production_decimal_precision_round_trip(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $bom = $this->insertBillOfMaterials($tid, $pid, $uid);
        $bid = $this->insertProductionBatch($tid, $fid, $pid, $bom, $uid, [
            'planned_quantity' => '1234.5678',
        ]);
        $wid = $this->insertWarehouse($tid);
        $oid = $this->insertProductionOutput($tid, $bid, $pid, $uid, $wid, [
            'quantity' => '987.6543',
        ]);

        $batchRow = DB::table('production_batches')->where('id', $bid)->first();
        $outputRow = DB::table('production_outputs')->where('id', $oid)->first();

        self::assertNotNull($batchRow);
        self::assertNotNull($outputRow);

        self::assertSame(1234.5678, (float) $batchRow->planned_quantity);
        self::assertSame(987.6543, (float) $outputRow->quantity);
    }
}
