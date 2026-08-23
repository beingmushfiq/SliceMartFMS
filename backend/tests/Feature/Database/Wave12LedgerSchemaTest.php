<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 12 — Ledger & Stock Inventory schema contracts.
 *
 * Implements ADR-014 (Stock Ledger vs Balance Cache), DATABASE_DESIGN.md §6 and §16.
 *
 * Tables:
 *   - stock_movements (append-only ledger)
 *   - stock_balances (transactional cache)
 *   - stock_reservations
 */
class Wave12LedgerSchemaTest extends SchemaTestCase
{
    private const TABLES = [
        'stock_movements',
        'stock_balances',
        'stock_reservations',
    ];

    /** @test */
    public function test_all_wave_12_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Expected table {$table} to exist after Wave 12 migrations."
            );
        }
    }

    /** @test */
    public function test_all_wave_12_tables_have_tenant_id_immediately_after_id(): void
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
    public function test_stock_movements_and_stock_balances_do_not_have_soft_deletes(): void
    {
        // §1 & §6 invariant: Ledgers and caches are NEVER soft deleted.
        self::assertFalse(
            Schema::hasColumn('stock_movements', 'deleted_at'),
            'stock_movements is an immutable append-only ledger and must not have deleted_at.'
        );
        self::assertFalse(
            Schema::hasColumn('stock_balances', 'deleted_at'),
            'stock_balances is a transactional cache and must not have deleted_at.'
        );
    }

    /** @test */
    public function test_stock_reservations_has_soft_deletes(): void
    {
        self::assertTrue(
            Schema::hasColumn('stock_reservations', 'deleted_at'),
            'stock_reservations must support soft deletes.'
        );
    }

    /** @test */
    public function test_no_wave_12_migration_contains_float_double_or_enum(): void
    {
        $files = glob(database_path('migrations/2026_08_24_107*'));
        self::assertIsArray($files);
        self::assertNotEmpty($files, 'Wave 12 migrations must exist.');

        foreach ($files as $file) {
            $content = file_get_contents($file);
            self::assertIsString($content);

            self::assertStringNotContainsString('->float(', $content, "Forbidden float in {$file}");
            self::assertStringNotContainsString('->double(', $content, "Forbidden double in {$file}");
            self::assertStringNotContainsString('->enum(', $content, "Forbidden enum in {$file}");
        }
    }

    // ─── stock_movements ───────────────────────────────────────────────────

    /** @test */
    public function test_stock_movement_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $wid = $this->insertWarehouse($tid);

        $this->insertStockMovement($tid, $pid, $wid, $uid, ['movement_number' => 'STK-2026-0001']);

        $this->assertInsertRejected(
            'stock_movements',
            $this->stockMovementAttributes($tid, $pid, $wid, $uid, ['movement_number' => 'STK-2026-0001']),
            'Duplicate movement_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_same_stock_movement_number_allowed_in_different_tenants(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $wid1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);
        $wid2 = $this->insertWarehouse($tid2);

        $this->insertStockMovement($tid1, $pid1, $wid1, $uid1, ['movement_number' => 'STK-2026-0001']);
        $id2 = $this->insertStockMovement($tid2, $pid2, $wid2, $uid2, ['movement_number' => 'STK-2026-0001']);

        self::assertGreaterThan(0, $id2);
    }

    /** @test */
    public function test_stock_movement_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $wid1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'stock_movements',
            $this->stockMovementAttributes($tid1, $pid2, $wid1, $uid1),
            'Cross-tenant product_id on stock_movements must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_movement_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wid2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'stock_movements',
            $this->stockMovementAttributes($tid1, $pid1, $wid2, $uid1),
            'Cross-tenant warehouse_id on stock_movements must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_movement_composite_fk_rejects_cross_tenant_location(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $wid1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wid2 = $this->insertWarehouse($tid2);
        $loc2 = $this->insertWarehouseLocation($tid2, $wid2);

        $this->assertInsertRejected(
            'stock_movements',
            $this->stockMovementAttributes($tid1, $pid1, $wid1, $uid1, ['warehouse_location_id' => $loc2]),
            'Cross-tenant warehouse_location_id on stock_movements must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_movement_composite_fk_rejects_cross_tenant_reason_code(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $wid1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $rid2 = $this->insertReasonCode($tid2, ['context' => 'stock_adjustment', 'code' => 'ADJ-PLUS']);

        $this->assertInsertRejected(
            'stock_movements',
            $this->stockMovementAttributes($tid1, $pid1, $wid1, $uid1, [
                'movement_type' => 'adjustment_increase',
                'reason_code_id' => $rid2,
            ]),
            'Cross-tenant reason_code_id on stock_movements must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_movement_composite_fk_rejects_cross_tenant_related_movement(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);
        $wid1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);
        $wid2 = $this->insertWarehouse($tid2);
        $mov2 = $this->insertStockMovement($tid2, $pid2, $wid2, $uid2);

        $this->assertInsertRejected(
            'stock_movements',
            $this->stockMovementAttributes($tid1, $pid1, $wid1, $uid1, [
                'related_movement_id' => $mov2,
            ]),
            'Cross-tenant related_movement_id on stock_movements must be rejected.',
            'foreign'
        );
    }

    // ─── stock_balances ────────────────────────────────────────────────────

    /** @test */
    public function test_stock_balance_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wid2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'stock_balances',
            $this->stockBalanceAttributes($tid1, $pid1, $wid2),
            'Cross-tenant warehouse_id on stock_balances must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_balance_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wid1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'stock_balances',
            $this->stockBalanceAttributes($tid1, $pid2, $wid1),
            'Cross-tenant product_id on stock_balances must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_balance_slot_sentinels_prevent_duplicate_null_variant_location_batch_rows(): void
    {
        $tid = $this->insertTenantWithPlan();
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $wid = $this->insertWarehouse($tid);

        // First row with null variant_id, null warehouse_location_id, null batch_code, state = 'available'
        $this->insertStockBalance($tid, $pid, $wid, [
            'variant_id' => null,
            'warehouse_location_id' => null,
            'batch_code' => null,
            'stock_state' => 'available',
        ]);

        // Attempting to insert duplicate slot with nulls must be rejected by uq_stock_balances_slot using generated sentinels
        $this->assertInsertRejected(
            'stock_balances',
            $this->stockBalanceAttributes($tid, $pid, $wid, [
                'variant_id' => null,
                'warehouse_location_id' => null,
                'batch_code' => null,
                'stock_state' => 'available',
            ]),
            'Duplicate stock_balance slot with NULL columns must be rejected via generated sentinels.',
            'unique'
        );
    }

    // ─── stock_reservations ────────────────────────────────────────────────

    /** @test */
    public function test_stock_reservation_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wid2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'stock_reservations',
            $this->stockReservationAttributes($tid1, $pid1, $wid2, $uid1),
            'Cross-tenant warehouse_id on stock_reservations must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_reservation_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $uid1 = $this->insertUnit($tid1);
        $wid1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'stock_reservations',
            $this->stockReservationAttributes($tid1, $pid2, $wid1, $uid1),
            'Cross-tenant product_id on stock_reservations must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_stock_ledger_decimal_precision_round_trip(): void
    {
        $tid = $this->insertTenantWithPlan();
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);
        $wid = $this->insertWarehouse($tid);

        $movId = $this->insertStockMovement($tid, $pid, $wid, $uid, [
            'quantity' => '1234.5678',
            'unit_cost' => '45.6789',
            'total_cost' => '56393.9936',
            'balance_after' => '1234.5678',
        ]);

        $balId = $this->insertStockBalance($tid, $pid, $wid, [
            'quantity' => '1234.5678',
            'average_cost' => '45.6789',
            'total_value' => '56393.9936',
        ]);

        $mov = DB::table('stock_movements')->where('id', $movId)->first();
        $bal = DB::table('stock_balances')->where('id', $balId)->first();

        self::assertNotNull($mov);
        self::assertNotNull($bal);

        self::assertSame(1234.5678, (float) $mov->quantity);
        self::assertSame(45.6789, (float) $mov->unit_cost);
        self::assertSame(56393.9936, (float) $mov->total_cost);
        self::assertSame(1234.5678, (float) $mov->balance_after);

        self::assertSame(1234.5678, (float) $bal->quantity);
        self::assertSame(45.6789, (float) $bal->average_cost);
        self::assertSame(56393.9936, (float) $bal->total_value);
    }
}
