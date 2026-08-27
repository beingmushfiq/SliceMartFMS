<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Tenancy\TenantContext;
use App\Models\BillOfMaterial;
use App\Models\BillOfMaterialItem;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class BOMTableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::findOrFail(1);
        TenantContext::bind($tenant->toArray());

        $pcs = Unit::where('code', 'PCS')->firstOrFail();
        $kg = Unit::where('code', 'KG')->firstOrFail();
        $liter = Unit::where('code', 'L')->firstOrFail();

        // Finished Products
        $whiteBread = Product::where('sku', 'FG-WB-400G')->firstOrFail();
        $sourdough = Product::where('sku', 'FG-SD-500G')->firstOrFail();
        $briocheBuns = Product::where('sku', 'FG-BUN-6PK')->firstOrFail();

        // Raw materials
        $flourWheat = Product::where('sku', 'RAW-FLOUR-WHEAT')->firstOrFail();
        $flourWhole = Product::where('sku', 'RAW-FLOUR-WHOLE')->firstOrFail();
        $sugar = Product::where('sku', 'RAW-SUGAR-WHITE')->firstOrFail();
        $yeast = Product::where('sku', 'RAW-YEAST-INSTANT')->firstOrFail();
        $salt = Product::where('sku', 'RAW-SALT-IODIZED')->firstOrFail();
        $butter = Product::where('sku', 'RAW-BUTTER-UNSALTED')->firstOrFail();
        $water = Product::where('sku', 'RAW-WATER-RO')->firstOrFail();

        // Packaging
        $pouchWhiteBread = Product::where('sku', 'PKG-POUCH-WB-400')->firstOrFail();
        $pouchSourdough = Product::where('sku', 'PKG-POUCH-SD-500')->firstOrFail();

        // 1. BOM for Classic White Bread (Output: 100 Loaves)
        $bomWhiteBread = BillOfMaterial::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $whiteBread->id,
            'version' => 'v1.0',
            'name' => 'Standard Commercial Recipe (100-Loaf Batch)',
            'output_quantity' => '100.0000',
            'output_unit_id' => $pcs->id,
            'expected_yield_percentage' => '98.5000',
            'status' => 'active',
            'effective_from' => now()->startOfYear(),
        ]);

        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomWhiteBread->id,
            'product_id' => $flourWheat->id,
            'quantity' => '35.0000',
            'unit_id' => $kg->id,
            'wastage_allowance_percentage' => '1.0000',
            'is_optional' => false,
            'sort_order' => 1,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomWhiteBread->id,
            'product_id' => $water->id,
            'quantity' => '20.0000',
            'unit_id' => $liter->id,
            'wastage_allowance_percentage' => '0.0000',
            'is_optional' => false,
            'sort_order' => 2,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomWhiteBread->id,
            'product_id' => $sugar->id,
            'quantity' => '2.5000',
            'unit_id' => $kg->id,
            'wastage_allowance_percentage' => '0.5000',
            'is_optional' => false,
            'sort_order' => 3,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomWhiteBread->id,
            'product_id' => $butter->id,
            'quantity' => '1.5000',
            'unit_id' => $kg->id,
            'wastage_allowance_percentage' => '0.5000',
            'is_optional' => false,
            'sort_order' => 4,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomWhiteBread->id,
            'product_id' => $yeast->id,
            'quantity' => '0.8000',
            'unit_id' => $kg->id,
            'wastage_allowance_percentage' => '0.5000',
            'is_optional' => false,
            'sort_order' => 5,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomWhiteBread->id,
            'product_id' => $salt->id,
            'quantity' => '0.6000',
            'unit_id' => $kg->id,
            'wastage_allowance_percentage' => '0.0000',
            'is_optional' => false,
            'sort_order' => 6,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomWhiteBread->id,
            'product_id' => $pouchWhiteBread->id,
            'quantity' => '100.0000',
            'unit_id' => $pcs->id,
            'wastage_allowance_percentage' => '2.0000',
            'is_optional' => false,
            'sort_order' => 7,
        ]);

        // 2. BOM for Sourdough Loaf (Output: 50 Loaves)
        $bomSourdough = BillOfMaterial::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $sourdough->id,
            'version' => 'v1.0',
            'name' => 'Artisan Fermented Sourdough (50-Loaf Batch)',
            'output_quantity' => '50.0000',
            'output_unit_id' => $pcs->id,
            'expected_yield_percentage' => '97.0000',
            'status' => 'active',
            'effective_from' => now()->startOfYear(),
        ]);

        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomSourdough->id,
            'product_id' => $flourWhole->id,
            'quantity' => '15.0000',
            'unit_id' => $kg->id,
            'wastage_allowance_percentage' => '1.0000',
            'is_optional' => false,
            'sort_order' => 1,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomSourdough->id,
            'product_id' => $flourWheat->id,
            'quantity' => '12.0000',
            'unit_id' => $kg->id,
            'wastage_allowance_percentage' => '1.0000',
            'is_optional' => false,
            'sort_order' => 2,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomSourdough->id,
            'product_id' => $water->id,
            'quantity' => '18.0000',
            'unit_id' => $liter->id,
            'wastage_allowance_percentage' => '0.0000',
            'is_optional' => false,
            'sort_order' => 3,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomSourdough->id,
            'product_id' => $salt->id,
            'quantity' => '0.5000',
            'unit_id' => $kg->id,
            'wastage_allowance_percentage' => '0.0000',
            'is_optional' => false,
            'sort_order' => 4,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomSourdough->id,
            'product_id' => $yeast->id,
            'quantity' => '0.2000',
            'unit_id' => $kg->id,
            'wastage_allowance_percentage' => '0.5000',
            'is_optional' => false,
            'sort_order' => 5,
        ]);
        BillOfMaterialItem::create([
            'bill_of_material_id' => $bomSourdough->id,
            'product_id' => $pouchSourdough->id,
            'quantity' => '50.0000',
            'unit_id' => $pcs->id,
            'wastage_allowance_percentage' => '2.0000',
            'is_optional' => false,
            'sort_order' => 6,
        ]);

        TenantContext::flush();
    }
}
