<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 13 — Stock Operations schema contracts.
 *
 * Implements DATABASE_DESIGN.md §6 and §16.
 *
 * Tables:
 *   - stock_transfers
 *   - stock_transfer_items
 *   - stock_adjustments
 *   - stock_adjustment_items
 *   - stock_counts
 *   - stock_count_items
 */
class Wave13StockOpsSchemaTest extends SchemaTestCase
{
    private const TABLES = [
        'stock_transfers',
        'stock_transfer_items',
        'stock_adjustments',
        'stock_adjustment_items',
        'stock_counts',
        'stock_count_items',
    ];

    /** @test */
    public function test_all_wave_13_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Expected table {$table} to exist after Wave 13 migrations."
            );
        }
    }

    /** @test */
    public function test_all_wave_13_tables_have_tenant_id_immediately_after_id(): void
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
    public function test_all_wave_13_tables_have_soft_deletes(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table {$table} must support soft deletes."
            );
        }
    }

    /** @test */
    public function test_no_wave_13_migration_contains_float_double_or_enum(): void
    {
        $files = glob(database_path('migrations/2026_08_24_108*'));
        self::assertIsArray($files);
        self::assertNotEmpty($files, 'Wave 13 migrations must exist.');

        foreach ($files as $file) {
            $content = file_get_contents($file);
            self::assertIsString($content);

            self::assertStringNotContainsString('->float(', $content, "Forbidden float in {$file}");
            self::assertStringNotContainsString('->double(', $content, "Forbidden double in {$file}");
            self::assertStringNotContainsString('->enum(', $content, "Forbidden enum in {$file}");
        }
    }

    // ─── stock_transfers ───────────────────────────────────────────────────

    /** @test */
    public function test_stock_transfers_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh1 = $this->insertWarehouse($tid);
        $wh2 = $this->insertWarehouse($tid);

        $this->insertStockTransfer($tid, $wh1, $wh2, ['transfer_number' => 'TRF-2026-0001']);

        $this->assertInsertRejected(
            'stock_transfers',
            $this->stockTransferAttributes($tid, $wh1, $wh2, ['transfer_number' => 'TRF-2026-0001']),
            'Duplicate transfer_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_same_stock_transfers_number_allowed_in_different_tenants(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1_1 = $this->insertWarehouse($tid1);
        $wh1_2 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2_1 = $this->insertWarehouse($tid2);
        $wh2_2 = $this->insertWarehouse($tid2);

        $this->insertStockTransfer($tid1, $wh1_1, $wh1_2, ['transfer_number' => 'TRF-2026-0001']);
        $id2 = $this->insertStockTransfer($tid2, $wh2_1, $wh2_2, ['transfer_number' => 'TRF-2026-0001']);

        self::assertGreaterThan(0, $id2);
    }

    /** @test */
    public function test_stock_transfers_composite_fk_rejects_cross_tenant_from_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1_2 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2_1 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'stock_transfers',
            $this->stockTransferAttributes($tid1, $wh2_1, $wh1_2),
            'Cross-tenant from_warehouse_id on stock_transfers must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_transfers_composite_fk_rejects_cross_tenant_to_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1_1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2_2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'stock_transfers',
            $this->stockTransferAttributes($tid1, $wh1_1, $wh2_2),
            'Cross-tenant to_warehouse_id on stock_transfers must be rejected.',
            'foreign'
        );
    }

    // ─── stock_transfer_items ──────────────────────────────────────────────

    /** @test */
    public function test_stock_transfer_items_composite_fk_rejects_cross_tenant_transfer(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2_1 = $this->insertWarehouse($tid2);
        $wh2_2 = $this->insertWarehouse($tid2);
        $trf2 = $this->insertStockTransfer($tid2, $wh2_1, $wh2_2);

        $this->assertInsertRejected(
            'stock_transfer_items',
            $this->stockTransferItemAttributes($tid1, $trf2, $pid1, $uid1),
            'Cross-tenant stock_transfer_id on stock_transfer_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_transfer_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1_1 = $this->insertWarehouse($tid1);
        $wh1_2 = $this->insertWarehouse($tid1);
        $trf1 = $this->insertStockTransfer($tid1, $wh1_1, $wh1_2);
        $uid1 = $this->insertUnit($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'stock_transfer_items',
            $this->stockTransferItemAttributes($tid1, $trf1, $pid2, $uid1),
            'Cross-tenant product_id on stock_transfer_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_transfer_items_composite_fk_rejects_cross_tenant_unit(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1_1 = $this->insertWarehouse($tid1);
        $wh1_2 = $this->insertWarehouse($tid1);
        $trf1 = $this->insertStockTransfer($tid1, $wh1_1, $wh1_2);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);

        $this->assertInsertRejected(
            'stock_transfer_items',
            $this->stockTransferItemAttributes($tid1, $trf1, $pid1, $uid2),
            'Cross-tenant unit_id on stock_transfer_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_transfer_items_cascade_deletes_when_stock_transfer_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh1 = $this->insertWarehouse($tid);
        $wh2 = $this->insertWarehouse($tid);
        $trf = $this->insertStockTransfer($tid, $wh1, $wh2);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $itemId = $this->insertStockTransferItem($tid, $trf, $pid, $uid);

        self::assertNotNull(DB::table('stock_transfer_items')->where('id', $itemId)->first());

        // Hard delete parent transfer
        DB::table('stock_transfers')->where('id', $trf)->delete();

        self::assertNull(
            DB::table('stock_transfer_items')->where('id', $itemId)->first(),
            'stock_transfer_items row must cascade-delete with parent transfer.'
        );
    }

    // ─── stock_adjustments ─────────────────────────────────────────────────

    /** @test */
    public function test_stock_adjustments_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $rc = $this->insertReasonCode($tid, ['context' => 'stock_adjustment']);

        $this->insertStockAdjustment($tid, $wh, $rc, ['adjustment_number' => 'ADJ-2026-0001']);

        $this->assertInsertRejected(
            'stock_adjustments',
            $this->stockAdjustmentAttributes($tid, $wh, $rc, ['adjustment_number' => 'ADJ-2026-0001']),
            'Duplicate adjustment_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_stock_adjustments_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $rc1 = $this->insertReasonCode($tid1, ['context' => 'stock_adjustment']);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'stock_adjustments',
            $this->stockAdjustmentAttributes($tid1, $wh2, $rc1),
            'Cross-tenant warehouse_id on stock_adjustments must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_adjustments_composite_fk_rejects_cross_tenant_reason_code(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $rc2 = $this->insertReasonCode($tid2, ['context' => 'stock_adjustment']);

        $this->assertInsertRejected(
            'stock_adjustments',
            $this->stockAdjustmentAttributes($tid1, $wh1, $rc2),
            'Cross-tenant reason_code_id on stock_adjustments must be rejected.',
            'foreign'
        );
    }

    // ─── stock_adjustment_items ────────────────────────────────────────────

    /** @test */
    public function test_stock_adjustment_items_composite_fk_rejects_cross_tenant_adjustment(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);
        $rc2 = $this->insertReasonCode($tid2, ['context' => 'stock_adjustment']);
        $adj2 = $this->insertStockAdjustment($tid2, $wh2, $rc2);

        $this->assertInsertRejected(
            'stock_adjustment_items',
            $this->stockAdjustmentItemAttributes($tid1, $adj2, $pid1),
            'Cross-tenant stock_adjustment_id on stock_adjustment_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_adjustment_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);
        $rc1 = $this->insertReasonCode($tid1, ['context' => 'stock_adjustment']);
        $adj1 = $this->insertStockAdjustment($tid1, $wh1, $rc1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'stock_adjustment_items',
            $this->stockAdjustmentItemAttributes($tid1, $adj1, $pid2),
            'Cross-tenant product_id on stock_adjustment_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_adjustment_items_cascade_deletes_when_stock_adjustment_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $rc = $this->insertReasonCode($tid, ['context' => 'stock_adjustment']);
        $adj = $this->insertStockAdjustment($tid, $wh, $rc);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $itemId = $this->insertStockAdjustmentItem($tid, $adj, $pid);

        self::assertNotNull(DB::table('stock_adjustment_items')->where('id', $itemId)->first());

        // Hard delete parent adjustment
        DB::table('stock_adjustments')->where('id', $adj)->delete();

        self::assertNull(
            DB::table('stock_adjustment_items')->where('id', $itemId)->first(),
            'stock_adjustment_items row must cascade-delete with parent adjustment.'
        );
    }

    // ─── stock_counts ──────────────────────────────────────────────────────

    /** @test */
    public function test_stock_counts_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);

        $this->insertStockCount($tid, $wh, ['count_number' => 'CNT-2026-0001']);

        $this->assertInsertRejected(
            'stock_counts',
            $this->stockCountAttributes($tid, $wh, ['count_number' => 'CNT-2026-0001']),
            'Duplicate count_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_stock_counts_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'stock_counts',
            $this->stockCountAttributes($tid1, $wh2),
            'Cross-tenant warehouse_id on stock_counts must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_counts_composite_fk_rejects_cross_tenant_stock_adjustment(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);
        $rc2 = $this->insertReasonCode($tid2, ['context' => 'stock_adjustment']);
        $adj2 = $this->insertStockAdjustment($tid2, $wh2, $rc2);

        $this->assertInsertRejected(
            'stock_counts',
            $this->stockCountAttributes($tid1, $wh1, ['stock_adjustment_id' => $adj2]),
            'Cross-tenant stock_adjustment_id on stock_counts must be rejected.',
            'foreign'
        );
    }

    // ─── stock_count_items ─────────────────────────────────────────────────

    /** @test */
    public function test_stock_count_items_composite_fk_rejects_cross_tenant_count(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);
        $cnt2 = $this->insertStockCount($tid2, $wh2);

        $this->assertInsertRejected(
            'stock_count_items',
            $this->stockCountItemAttributes($tid1, $cnt2, $pid1),
            'Cross-tenant stock_count_id on stock_count_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_count_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);
        $cnt1 = $this->insertStockCount($tid1, $wh1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'stock_count_items',
            $this->stockCountItemAttributes($tid1, $cnt1, $pid2),
            'Cross-tenant product_id on stock_count_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_count_items_composite_fk_rejects_cross_tenant_warehouse_location(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);
        $cnt1 = $this->insertStockCount($tid1, $wh1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);
        $loc2 = $this->insertWarehouseLocation($tid2, $wh2);

        $this->assertInsertRejected(
            'stock_count_items',
            $this->stockCountItemAttributes($tid1, $cnt1, $pid1, ['warehouse_location_id' => $loc2]),
            'Cross-tenant warehouse_location_id on stock_count_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_count_items_cascade_deletes_when_stock_count_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $cnt = $this->insertStockCount($tid, $wh);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $itemId = $this->insertStockCountItem($tid, $cnt, $pid);

        self::assertNotNull(DB::table('stock_count_items')->where('id', $itemId)->first());

        // Hard delete parent count
        DB::table('stock_counts')->where('id', $cnt)->delete();

        self::assertNull(
            DB::table('stock_count_items')->where('id', $itemId)->first(),
            'stock_count_items row must cascade-delete with parent count.'
        );
    }

    /** @test */
    public function test_stock_ops_decimal_precision_round_trip(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh1 = $this->insertWarehouse($tid);
        $wh2 = $this->insertWarehouse($tid);
        $rc = $this->insertReasonCode($tid, ['context' => 'stock_adjustment']);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $trf = $this->insertStockTransfer($tid, $wh1, $wh2);
        $trfItemId = $this->insertStockTransferItem($tid, $trf, $pid, $uid, [
            'sent_quantity' => '123.4567',
            'received_quantity' => '120.0000',
            'damaged_quantity' => '3.4567',
        ]);

        $adj = $this->insertStockAdjustment($tid, $wh1, $rc, [
            'total_value_impact' => '456.7890',
        ]);
        $adjItemId = $this->insertStockAdjustmentItem($tid, $adj, $pid, [
            'system_quantity' => '100.1234',
            'adjusted_quantity' => '105.1234',
            'difference_quantity' => '5.0000',
            'unit_cost' => '91.3578',
        ]);

        $cnt = $this->insertStockCount($tid, $wh1);
        $cntItemId = $this->insertStockCountItem($tid, $cnt, $pid, [
            'system_quantity' => '50.1234',
            'counted_quantity' => '48.1234',
            'variance_quantity' => '-2.0000',
            'recount_quantity' => '49.1234',
        ]);

        $trfItem = DB::table('stock_transfer_items')->where('id', $trfItemId)->first();
        $adjRow = DB::table('stock_adjustments')->where('id', $adj)->first();
        $adjItem = DB::table('stock_adjustment_items')->where('id', $adjItemId)->first();
        $cntItem = DB::table('stock_count_items')->where('id', $cntItemId)->first();

        self::assertNotNull($trfItem);
        self::assertNotNull($adjRow);
        self::assertNotNull($adjItem);
        self::assertNotNull($cntItem);

        self::assertSame(123.4567, (float) $trfItem->sent_quantity);
        self::assertSame(120.0, (float) $trfItem->received_quantity);
        self::assertSame(3.4567, (float) $trfItem->damaged_quantity);

        self::assertSame(456.789, (float) $adjRow->total_value_impact);
        self::assertSame(100.1234, (float) $adjItem->system_quantity);
        self::assertSame(105.1234, (float) $adjItem->adjusted_quantity);
        self::assertSame(5.0, (float) $adjItem->difference_quantity);
        self::assertSame(91.3578, (float) $adjItem->unit_cost);

        self::assertSame(50.1234, (float) $cntItem->system_quantity);
        self::assertSame(48.1234, (float) $cntItem->counted_quantity);
        self::assertSame(-2.0, (float) $cntItem->variance_quantity);
        self::assertSame(49.1234, (float) $cntItem->recount_quantity);
    }
}
