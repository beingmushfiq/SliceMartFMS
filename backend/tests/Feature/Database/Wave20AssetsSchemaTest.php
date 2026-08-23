<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;

/**
 * Wave 20: Assets & Maintenance Schema Tests.
 *
 * Covers:
 *   - asset_categories
 *   - assets
 *   - asset_assignments
 *   - asset_depreciation_entries
 *   - maintenance_schedules
 *   - maintenance_orders
 *   - maintenance_order_parts
 *   - asset_meter_readings
 */
class Wave20AssetsSchemaTest extends SchemaTestCase
{
    /** @var list<string> */
    private const TABLES = [
        'asset_categories',
        'assets',
        'asset_assignments',
        'asset_depreciation_entries',
        'maintenance_schedules',
        'maintenance_orders',
        'maintenance_order_parts',
        'asset_meter_readings',
    ];

    #[Test]
    public function all_wave20_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasTable($table),
                "Failed asserting that table [{$table}] exists."
            );
        }
    }

    #[Test]
    public function every_wave20_table_has_tenant_id_in_primary_position(): void
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
    public function soft_delete_and_ledger_compliance(): void
    {
        // Tables with soft deletes
        $softDeleteTables = [
            'asset_categories',
            'assets',
            'asset_assignments',
            'maintenance_schedules',
            'maintenance_orders',
            'maintenance_order_parts',
            'asset_meter_readings',
        ];

        foreach ($softDeleteTables as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table [{$table}] must have softDeletes (deleted_at)."
            );
        }

        // Append-only ledger has no soft deletes
        $this->assertFalse(
            Schema::hasColumn('asset_depreciation_entries', 'deleted_at'),
            'asset_depreciation_entries is an append-only ledger and must not have deleted_at.'
        );

        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'uuid'),
                "Table [{$table}] must have uuid."
            );
        }
    }

    #[Test]
    public function asset_categories_enforces_code_uniqueness_per_tenant(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $this->insertAssetCategory($t1, 'FLEET');

        // Cross-tenant same code allowed
        $id2 = $this->insertAssetCategory($t2, 'FLEET', ['code' => 'FLEET_UNIQUE']);
        $this->assertGreaterThan(0, $id2);

        // Same tenant duplicate code rejected
        $this->expectException(QueryException::class);
        $this->insertAssetCategory($t1, 'FLEET', ['code' => 'FLEET_DUPE']);
        DB::table('asset_categories')->insert($this->assetCategoryAttributes($t1, 'FLEET', ['code' => 'FLEET_DUPE']));
    }

    #[Test]
    public function assets_enforces_asset_code_uniqueness_per_tenant(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $catId = $this->insertAssetCategory($t);
        $companyId = $this->insertCompany($t);
        $branchId = $this->insertBranch($t, $companyId);

        $this->insertAsset($t, $catId, $companyId, $branchId, ['asset_code' => 'AST-2026-001']);

        $this->expectException(QueryException::class);
        DB::table('assets')->insert($this->assetAttributes($t, $catId, $companyId, $branchId, [
            'asset_code' => 'AST-2026-001',
        ]));
    }

    #[Test]
    public function asset_depreciation_entries_enforces_period_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $catId = $this->insertAssetCategory($t);
        $companyId = $this->insertCompany($t);
        $branchId = $this->insertBranch($t, $companyId);
        $assetId = $this->insertAsset($t, $catId, $companyId, $branchId);

        $this->insertAssetDepreciationEntry($t, $assetId, 2026, 8);

        $this->expectException(QueryException::class);
        DB::table('asset_depreciation_entries')->insert($this->assetDepreciationEntryAttributes(
            $t,
            $assetId,
            2026,
            8
        ));
    }

    #[Test]
    public function maintenance_schedules_enforces_code_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $catId = $this->insertAssetCategory($t);
        $companyId = $this->insertCompany($t);
        $branchId = $this->insertBranch($t, $companyId);
        $assetId = $this->insertAsset($t, $catId, $companyId, $branchId);

        $this->insertMaintenanceSchedule($t, $assetId, 'PM-OIL');

        $this->expectException(QueryException::class);
        DB::table('maintenance_schedules')->insert($this->maintenanceScheduleAttributes($t, $assetId, 'PM-OIL', [
            'code' => 'PM-OIL_1',
        ]));
    }

    #[Test]
    public function maintenance_orders_enforces_order_number_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $catId = $this->insertAssetCategory($t);
        $companyId = $this->insertCompany($t);
        $branchId = $this->insertBranch($t, $companyId);
        $assetId = $this->insertAsset($t, $catId, $companyId, $branchId);

        $this->insertMaintenanceOrder($t, $assetId, ['order_number' => 'MO-2026-001']);

        $this->expectException(QueryException::class);
        DB::table('maintenance_orders')->insert($this->maintenanceOrderAttributes($t, $assetId, [
            'order_number' => 'MO-2026-001',
        ]));
    }

    #[Test]
    public function maintenance_order_parts_cascades_on_order_delete(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $catId = $this->insertAssetCategory($t);
        $companyId = $this->insertCompany($t);
        $branchId = $this->insertBranch($t, $companyId);
        $assetId = $this->insertAsset($t, $catId, $companyId, $branchId);
        $orderId = $this->insertMaintenanceOrder($t, $assetId);

        $unitId = $this->insertUnit($t);
        $productId = $this->insertProduct($t, $unitId);
        $warehouseId = $this->insertWarehouse($t);

        $partId = $this->insertMaintenanceOrderPart($t, $orderId, $productId, $warehouseId, $unitId);
        $this->assertGreaterThan(0, $partId);

        // Deleting order hard-deletes child parts
        DB::table('maintenance_orders')->where('id', $orderId)->delete();
        $this->assertNull(DB::table('maintenance_order_parts')->where('id', $partId)->first());
    }

    #[Test]
    public function asset_meter_readings_stores_reading_record(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $catId = $this->insertAssetCategory($t);
        $companyId = $this->insertCompany($t);
        $branchId = $this->insertBranch($t, $companyId);
        $assetId = $this->insertAsset($t, $catId, $companyId, $branchId);

        $rId = $this->insertAssetMeterReading($t, $assetId, ['reading_value' => '3456.7800']);
        $this->assertGreaterThan(0, $rId);

        $row = DB::table('asset_meter_readings')->where('id', $rId)->first();
        $this->assertNotNull($row);
        $this->assertSame(3456.78, (float) $row->reading_value);
    }

    #[Test]
    public function cross_tenant_references_are_rejected(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $cat1 = $this->insertAssetCategory($t1);
        $c1 = $this->insertCompany($t1);
        $b1 = $this->insertBranch($t1, $c1);

        $c2 = $this->insertCompany($t2);
        $b2 = $this->insertBranch($t2, $c2);

        // Asset trying to mix tenant 1 category with tenant 2 company
        $this->expectException(QueryException::class);
        $this->insertAsset($t1, $cat1, $c2, $b2);
    }

    #[Test]
    public function asset_decimal_precision_round_trip(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $catId = $this->insertAssetCategory($t);
        $companyId = $this->insertCompany($t);
        $branchId = $this->insertBranch($t, $companyId);

        $assetId = $this->insertAsset($t, $catId, $companyId, $branchId, [
            'purchase_cost' => '123456.7890',
            'salvage_value' => '12345.6789',
            'book_value' => '111111.1101',
        ]);

        $row = DB::table('assets')->where('id', $assetId)->first();
        $this->assertNotNull($row);
        $this->assertSame(123456.789, (float) $row->purchase_cost);
        $this->assertSame(12345.6789, (float) $row->salvage_value);
        $this->assertSame(111111.1101, (float) $row->book_value);
    }
}
