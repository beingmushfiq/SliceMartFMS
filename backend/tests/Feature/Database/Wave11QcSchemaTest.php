<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 11 — QC & Wastage schema contracts.
 *
 * Implements DATABASE_DESIGN.md §5 Group D and §16.
 *
 * Tables:
 *   - qc_parameters
 *   - qc_inspections
 *   - qc_inspection_results
 *   - qc_defects
 *   - wastage_records
 *   - rework_orders
 */
class Wave11QcSchemaTest extends SchemaTestCase
{
    private const TABLES = [
        'qc_parameters',
        'qc_inspections',
        'qc_inspection_results',
        'qc_defects',
        'wastage_records',
        'rework_orders',
    ];

    /** @test */
    public function test_all_wave_11_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Expected table {$table} to exist after Wave 11 migrations."
            );
        }
    }

    /** @test */
    public function test_all_wave_11_tables_have_tenant_id_immediately_after_id(): void
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
    public function test_all_wave_11_tables_have_soft_deletes(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table {$table} must support soft deletes."
            );
        }
    }

    /** @test */
    public function test_no_wave_11_migration_contains_float_double_or_enum(): void
    {
        $files = glob(database_path('migrations/2026_08_24_106*'));
        self::assertIsArray($files);
        self::assertNotEmpty($files, 'Wave 11 migrations must exist.');

        foreach ($files as $file) {
            $content = file_get_contents($file);
            self::assertIsString($content);

            self::assertStringNotContainsString('->float(', $content, "Forbidden float in {$file}");
            self::assertStringNotContainsString('->double(', $content, "Forbidden double in {$file}");
            self::assertStringNotContainsString('->enum(', $content, "Forbidden enum in {$file}");
        }
    }

    // ─── qc_parameters ─────────────────────────────────────────────────────

    /** @test */
    public function test_qc_parameter_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'qc_parameters',
            $this->qcParameterAttributes($tid1, $pid2, $uid1),
            'Cross-tenant product_id on qc_parameters must be rejected.',
            'foreign'
        );
    }

    // ─── qc_inspections ────────────────────────────────────────────────────

    /** @test */
    public function test_qc_inspection_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $eid = $this->insertEmployee($tid, $cid);

        $this->insertQcInspection($tid, $eid, null, null, ['inspection_number' => 'QC-2026-001']);

        $this->assertInsertRejected(
            'qc_inspections',
            $this->qcInspectionAttributes($tid, $eid, null, null, ['inspection_number' => 'QC-2026-001']),
            'Duplicate inspection_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_same_qc_inspection_number_allowed_in_different_tenants(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $eid1 = $this->insertEmployee($tid1, $cid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $eid2 = $this->insertEmployee($tid2, $cid2);

        $this->insertQcInspection($tid1, $eid1, null, null, ['inspection_number' => 'QC-2026-001']);
        $id2 = $this->insertQcInspection($tid2, $eid2, null, null, ['inspection_number' => 'QC-2026-001']);

        self::assertGreaterThan(0, $id2);
    }

    /** @test */
    public function test_qc_inspection_composite_fk_rejects_cross_tenant_inspector(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $eid1 = $this->insertEmployee($tid1, $cid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $eid2 = $this->insertEmployee($tid2, $cid2);

        $this->assertInsertRejected(
            'qc_inspections',
            $this->qcInspectionAttributes($tid1, $eid2),
            'Cross-tenant inspector_id on qc_inspections must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_qc_inspection_composite_fk_rejects_cross_tenant_batch(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $bom1 = $this->insertBillOfMaterials($tid1, $pid1, $uid1);
        $eid1 = $this->insertEmployee($tid1, $cid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $fid2 = $this->insertFactory($tid2, $cid2);
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);
        $bom2 = $this->insertBillOfMaterials($tid2, $pid2, $uid2);
        $bid2 = $this->insertProductionBatch($tid2, $fid2, $pid2, $bom2, $uid2);

        $this->assertInsertRejected(
            'qc_inspections',
            $this->qcInspectionAttributes($tid1, $eid1, $bid2),
            'Cross-tenant production_batch_id on qc_inspections must be rejected.',
            'foreign'
        );
    }

    // ─── qc_inspection_results ─────────────────────────────────────────────

    /** @test */
    public function test_qc_inspection_result_unique_parameter_per_inspection(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $eid = $this->insertEmployee($tid, $cid);
        $qid = $this->insertQcInspection($tid, $eid);
        $pid = $this->insertQcParameter($tid);

        $this->insertQcInspectionResult($tid, $qid, $pid);

        $this->assertInsertRejected(
            'qc_inspection_results',
            $this->qcInspectionResultAttributes($tid, $qid, $pid),
            'Duplicate parameter in the same inspection must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_qc_inspection_result_cascade_deletes_when_inspection_is_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $eid = $this->insertEmployee($tid, $cid);
        $qid = $this->insertQcInspection($tid, $eid);
        $pid = $this->insertQcParameter($tid);

        $resId = $this->insertQcInspectionResult($tid, $qid, $pid);

        DB::table('qc_inspections')->where('id', $qid)->delete();

        self::assertNull(
            DB::table('qc_inspection_results')->where('id', $resId)->first(),
            'qc_inspection_results must CASCADE delete when parent qc_inspection is deleted.'
        );
    }

    /** @test */
    public function test_qc_inspection_result_composite_fk_rejects_cross_tenant_parameter(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $eid1 = $this->insertEmployee($tid1, $cid1);
        $qid1 = $this->insertQcInspection($tid1, $eid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $pid2 = $this->insertQcParameter($tid2);

        $this->assertInsertRejected(
            'qc_inspection_results',
            $this->qcInspectionResultAttributes($tid1, $qid1, $pid2),
            'Cross-tenant qc_parameter_id on qc_inspection_results must be rejected.',
            'foreign'
        );
    }

    // ─── qc_defects ────────────────────────────────────────────────────────

    /** @test */
    public function test_qc_defect_cascade_deletes_when_inspection_is_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $eid = $this->insertEmployee($tid, $cid);
        $qid = $this->insertQcInspection($tid, $eid);
        $rid = $this->insertReasonCode($tid, ['context' => 'qc_defect', 'code' => 'SCRATCH']);

        $defectId = $this->insertQcDefect($tid, $qid, $rid);

        DB::table('qc_inspections')->where('id', $qid)->delete();

        self::assertNull(
            DB::table('qc_defects')->where('id', $defectId)->first(),
            'qc_defects must CASCADE delete when parent qc_inspection is deleted.'
        );
    }

    /** @test */
    public function test_qc_defect_composite_fk_rejects_cross_tenant_reason_code(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $eid1 = $this->insertEmployee($tid1, $cid1);
        $qid1 = $this->insertQcInspection($tid1, $eid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $rid2 = $this->insertReasonCode($tid2, ['context' => 'qc_defect', 'code' => 'DENT']);

        $this->assertInsertRejected(
            'qc_defects',
            $this->qcDefectAttributes($tid1, $qid1, $rid2),
            'Cross-tenant defect_reason_id on qc_defects must be rejected.',
            'foreign'
        );
    }

    // ─── wastage_records ───────────────────────────────────────────────────

    /** @test */
    public function test_wastage_record_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $rid = $this->insertReasonCode($tid, ['context' => 'wastage', 'code' => 'SPOIL']);

        $this->insertWastageRecord($tid, $pid, $uid, $rid, null, null, ['wastage_number' => 'WST-2026-001']);

        $this->assertInsertRejected(
            'wastage_records',
            $this->wastageRecordAttributes($tid, $pid, $uid, $rid, null, null, ['wastage_number' => 'WST-2026-001']),
            'Duplicate wastage_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_same_wastage_record_number_allowed_in_different_tenants(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $rid1 = $this->insertReasonCode($tid1, ['context' => 'wastage', 'code' => 'SPOIL']);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);
        $rid2 = $this->insertReasonCode($tid2, ['context' => 'wastage', 'code' => 'SPOIL']);

        $this->insertWastageRecord($tid1, $pid1, $uid1, $rid1, null, null, ['wastage_number' => 'WST-2026-001']);
        $id2 = $this->insertWastageRecord($tid2, $pid2, $uid2, $rid2, null, null, ['wastage_number' => 'WST-2026-001']);

        self::assertGreaterThan(0, $id2);
    }

    /** @test */
    public function test_wastage_record_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $rid1 = $this->insertReasonCode($tid1, ['context' => 'wastage', 'code' => 'SPOIL']);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'wastage_records',
            $this->wastageRecordAttributes($tid1, $pid2, $uid1, $rid1),
            'Cross-tenant product_id on wastage_records must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_wastage_record_composite_fk_rejects_cross_tenant_batch(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $cid1 = $this->insertCompany($tid1);
        $fid1 = $this->insertFactory($tid1, $cid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $bom1 = $this->insertBillOfMaterials($tid1, $pid1, $uid1);
        $rid1 = $this->insertReasonCode($tid1, ['context' => 'wastage', 'code' => 'SPOIL']);

        $tid2 = $this->insertTenantWithPlan('t2');
        $cid2 = $this->insertCompany($tid2);
        $fid2 = $this->insertFactory($tid2, $cid2);
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);
        $bom2 = $this->insertBillOfMaterials($tid2, $pid2, $uid2);
        $bid2 = $this->insertProductionBatch($tid2, $fid2, $pid2, $bom2, $uid2);

        $this->assertInsertRejected(
            'wastage_records',
            $this->wastageRecordAttributes($tid1, $pid1, $uid1, $rid1, $bid2),
            'Cross-tenant production_batch_id on wastage_records must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_wastage_record_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $rid1 = $this->insertReasonCode($tid1, ['context' => 'wastage', 'code' => 'SPOIL']);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wid2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'wastage_records',
            $this->wastageRecordAttributes($tid1, $pid1, $uid1, $rid1, null, $wid2),
            'Cross-tenant warehouse_id on wastage_records must be rejected.',
            'foreign'
        );
    }

    // ─── rework_orders ─────────────────────────────────────────────────────

    /** @test */
    public function test_rework_order_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $cid = $this->insertCompany($tid);
        $fid = $this->insertFactory($tid, $cid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $bom = $this->insertBillOfMaterials($tid, $pid, $uid);
        $bid = $this->insertProductionBatch($tid, $fid, $pid, $bom, $uid);

        $this->insertReworkOrder($tid, $bid, $pid, $uid, null, null, ['rework_number' => 'RWK-2026-001']);

        $this->assertInsertRejected(
            'rework_orders',
            $this->reworkOrderAttributes($tid, $bid, $pid, $uid, null, null, ['rework_number' => 'RWK-2026-001']),
            'Duplicate rework_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_same_rework_order_number_allowed_in_different_tenants(): void
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
        $fid2 = $this->insertFactory($tid2, $cid2);
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);
        $bom2 = $this->insertBillOfMaterials($tid2, $pid2, $uid2);
        $bid2 = $this->insertProductionBatch($tid2, $fid2, $pid2, $bom2, $uid2);

        $this->insertReworkOrder($tid1, $bid1, $pid1, $uid1, null, null, ['rework_number' => 'RWK-2026-001']);
        $id2 = $this->insertReworkOrder($tid2, $bid2, $pid2, $uid2, null, null, ['rework_number' => 'RWK-2026-001']);

        self::assertGreaterThan(0, $id2);
    }

    /** @test */
    public function test_rework_order_composite_fk_rejects_cross_tenant_source_batch(): void
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
        $bid2 = $this->insertProductionBatch($tid2, $fid2, $pid2, $bom2, $uid2);

        $this->assertInsertRejected(
            'rework_orders',
            $this->reworkOrderAttributes($tid1, $bid2, $pid1, $uid1),
            'Cross-tenant source_batch_id on rework_orders must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_rework_order_composite_fk_rejects_cross_tenant_target_batch(): void
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
        $fid2 = $this->insertFactory($tid2, $cid2);
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);
        $bom2 = $this->insertBillOfMaterials($tid2, $pid2, $uid2);
        $bid2 = $this->insertProductionBatch($tid2, $fid2, $pid2, $bom2, $uid2);

        $this->assertInsertRejected(
            'rework_orders',
            $this->reworkOrderAttributes($tid1, $bid1, $pid1, $uid1, null, $bid2),
            'Cross-tenant target_batch_id on rework_orders must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_qc_and_wastage_decimal_precision_round_trip(): void
    {
        $tid = $this->insertTenantWithPlan();
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $rid = $this->insertReasonCode($tid, ['context' => 'wastage', 'code' => 'SCRAP']);

        $wid = $this->insertWastageRecord($tid, $pid, $uid, $rid, null, null, [
            'quantity' => '123.4567',
            'estimated_cost' => '9876.5432',
            'recovered_quantity' => '12.3456',
        ]);

        $row = DB::table('wastage_records')->where('id', $wid)->first();

        self::assertNotNull($row);
        self::assertSame(123.4567, (float) $row->quantity);
        self::assertSame(9876.5432, (float) $row->estimated_cost);
        self::assertSame(12.3456, (float) $row->recovered_quantity);
    }
}
