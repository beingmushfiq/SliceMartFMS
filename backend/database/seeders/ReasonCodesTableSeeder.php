<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Tenancy\TenantContext;
use App\Models\ReasonCode;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class ReasonCodesTableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::findOrFail(1);
        TenantContext::bind($tenant->toArray());

        $reasons = [
            // QC Defect Reasons
            ['context' => 'qc_defect', 'code' => 'BURNT_CRUST', 'name' => 'Overbaked / Burnt Crust', 'requires_note' => false, 'sort_order' => 1],
            ['context' => 'qc_defect', 'code' => 'UNDERCOOKED', 'name' => 'Undercooked / Doughy Core', 'requires_note' => false, 'sort_order' => 2],
            ['context' => 'qc_defect', 'code' => 'UNEVEN_SLICING', 'name' => 'Uneven / Damaged Slicing Profile', 'requires_note' => false, 'sort_order' => 3],
            ['context' => 'qc_defect', 'code' => 'CONTAMINATION', 'name' => 'Foreign Particle Contamination', 'requires_note' => true, 'sort_order' => 4],
            ['context' => 'qc_defect', 'code' => 'UNDERWEIGHT', 'name' => 'Weight Below Tolerated Standard', 'requires_note' => false, 'sort_order' => 5],

            // Wastage Reasons
            ['context' => 'wastage', 'code' => 'DOUGH_SPILL', 'name' => 'Dough Dropped / Conveyor Spill', 'requires_note' => false, 'sort_order' => 1],
            ['context' => 'wastage', 'code' => 'OVEN_TRIP', 'name' => 'Oven Power Trip / Line Stoppage', 'requires_note' => true, 'sort_order' => 2],
            ['context' => 'wastage', 'code' => 'CRUST_TRIM', 'name' => 'Standard Production Crust Trimming', 'requires_note' => false, 'sort_order' => 3],
            ['context' => 'wastage', 'code' => 'EXPIRED_RAW', 'name' => 'Ingredient Past Expiry Date', 'requires_note' => true, 'sort_order' => 4],

            // Stock Adjustment Reasons
            ['context' => 'stock_adjustment', 'code' => 'CYCLE_COUNT_VARIANCE', 'name' => 'Periodic Physical Cycle Count Variance', 'requires_note' => false, 'sort_order' => 1],
            ['context' => 'stock_adjustment', 'code' => 'DAMAGED_IN_STORAGE', 'name' => 'Water or Handling Damage in Warehouse', 'requires_note' => true, 'sort_order' => 2],
            ['context' => 'stock_adjustment', 'code' => 'OPENING_BALANCE_ADJ', 'name' => 'System Onboarding Opening Stock Entry', 'requires_note' => false, 'sort_order' => 3],
            ['context' => 'stock_adjustment', 'code' => 'SAMPLE_DISTRIBUTION', 'name' => 'Marketing & Lab Sample Testing', 'requires_note' => true, 'sort_order' => 4],

            // Sales Return Reasons
            ['context' => 'sales_return', 'code' => 'NEARING_EXPIRY', 'name' => 'Retail Shelf Nearing Expiry Return', 'requires_note' => false, 'sort_order' => 1],
            ['context' => 'sales_return', 'code' => 'TRANSIT_CRUSHED', 'name' => 'Crushed / Damaged During Logistics Delivery', 'requires_note' => false, 'sort_order' => 2],
            ['context' => 'sales_return', 'code' => 'WRONG_ITEM_SHIPPED', 'name' => 'Dispatched Incorrect SKU', 'requires_note' => true, 'sort_order' => 3],

            // Purchase Return Reasons
            ['context' => 'purchase_return', 'code' => 'SUPPLIER_REJECTED_QC', 'name' => 'Inbound Raw Material Failed Quality Gate', 'requires_note' => true, 'sort_order' => 1],
            ['context' => 'purchase_return', 'code' => 'SHORT_DELIVERY', 'name' => 'Vendor Shipped Damaged or Short Sacks', 'requires_note' => false, 'sort_order' => 2],

            // Rework Reasons
            ['context' => 'rework', 'code' => 'RE_BAG_SEAL', 'name' => 'Defective Bag Seal — Re-pack Only', 'requires_note' => false, 'sort_order' => 1],
            ['context' => 'rework', 'code' => 'RUSK_CONVERSION', 'name' => 'Overbaked Bread Diverted to Rusk Baking', 'requires_note' => false, 'sort_order' => 2],
        ];

        foreach ($reasons as $reason) {
            ReasonCode::create([
                'uuid' => (string) Str::uuid(),
                'context' => $reason['context'],
                'code' => $reason['code'],
                'name' => $reason['name'],
                'requires_note' => $reason['requires_note'],
                'is_active' => true,
                'sort_order' => $reason['sort_order'],
            ]);
        }

        TenantContext::flush();
    }
}
