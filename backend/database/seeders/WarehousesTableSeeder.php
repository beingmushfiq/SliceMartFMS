<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Tenancy\TenantContext;
use App\Models\Tenant;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class WarehousesTableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::findOrFail(1);
        TenantContext::bind($tenant->toArray());

        // 1. Raw Materials Central Storage
        $rawWarehouse = Warehouse::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'WH-RAW-01',
            'name' => 'Tejgaon Central Raw Ingredients Warehouse',
            'type' => 'raw_material',
            'address' => 'Plot 45, Tejgaon Industrial Area, Dhaka',
            'is_default' => true,
            'allows_negative_stock' => false,
            'is_active' => true,
        ]);

        $flourZone = WarehouseLocation::create([
            'uuid' => (string) Str::uuid(),
            'warehouse_id' => $rawWarehouse->id,
            'code' => 'ZONE-FLOUR',
            'name' => 'Grain & Flour Bulk Storage Zone',
            'type' => 'zone',
            'is_active' => true,
        ]);

        WarehouseLocation::create([
            'uuid' => (string) Str::uuid(),
            'warehouse_id' => $rawWarehouse->id,
            'parent_id' => $flourZone->id,
            'code' => 'SILO-01',
            'name' => 'Flour Silo 1 (50-Ton Capacity)',
            'type' => 'bin',
            'is_active' => true,
        ]);

        WarehouseLocation::create([
            'uuid' => (string) Str::uuid(),
            'warehouse_id' => $rawWarehouse->id,
            'parent_id' => $flourZone->id,
            'code' => 'PALLET-FL-A1',
            'name' => 'Pallet Racking A1 (Flour Bags)',
            'type' => 'rack',
            'is_active' => true,
        ]);

        $coldZone = WarehouseLocation::create([
            'uuid' => (string) Str::uuid(),
            'warehouse_id' => $rawWarehouse->id,
            'code' => 'ZONE-COLD',
            'name' => 'Temperature-Controlled Cold Storage (+4°C)',
            'type' => 'zone',
            'is_active' => true,
        ]);

        WarehouseLocation::create([
            'uuid' => (string) Str::uuid(),
            'warehouse_id' => $rawWarehouse->id,
            'parent_id' => $coldZone->id,
            'code' => 'COLD-BAY-1',
            'name' => 'Dairy & Butter Chiller Bay 1',
            'type' => 'bin',
            'is_active' => true,
        ]);

        // 2. Finished Goods Depot
        $fgWarehouse = Warehouse::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'WH-FG-01',
            'name' => 'Dhaka Main Finished Goods Distribution Depot',
            'type' => 'finished_goods',
            'address' => 'Tejgaon Main Plant Logistics Bay, Dhaka',
            'is_default' => false,
            'allows_negative_stock' => false,
            'is_active' => true,
        ]);

        WarehouseLocation::create([
            'uuid' => (string) Str::uuid(),
            'warehouse_id' => $fgWarehouse->id,
            'code' => 'DISPATCH-STAGING',
            'name' => 'Van Loading & Dispatch Staging Area',
            'type' => 'zone',
            'is_active' => true,
        ]);

        WarehouseLocation::create([
            'uuid' => (string) Str::uuid(),
            'warehouse_id' => $fgWarehouse->id,
            'code' => 'FG-RACK-BREAD',
            'name' => 'Bread Crate Rack B1-B8',
            'type' => 'rack',
            'is_active' => true,
        ]);

        // 3. Quarantine & QC Buffer
        Warehouse::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'WH-QC-HOLD',
            'name' => 'QC Inspection & Quarantine Hold Depot',
            'type' => 'quarantine',
            'address' => 'Tejgaon Plant QC Quarantine Bay',
            'is_default' => false,
            'allows_negative_stock' => false,
            'is_active' => true,
        ]);

        TenantContext::flush();
    }
}
