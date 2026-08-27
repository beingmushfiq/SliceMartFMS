<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Tenancy\TenantContext;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\TaxProfile;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class ProductsTableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::findOrFail(1);
        TenantContext::bind($tenant->toArray());

        $kg = Unit::where('code', 'KG')->firstOrFail();
        $liter = Unit::where('code', 'L')->firstOrFail();
        $pcs = Unit::where('code', 'PCS')->firstOrFail();

        $catFlour = Category::where('code', 'RAW-FLR')->firstOrFail();
        $catDairy = Category::where('code', 'RAW-DRY')->firstOrFail();
        $catSugar = Category::where('code', 'RAW-SWT')->firstOrFail();
        $catYeast = Category::where('code', 'RAW-YST')->firstOrFail();
        $catPouch = Category::where('code', 'PKG-PCH')->firstOrFail();
        $catBox = Category::where('code', 'PKG-BOX')->firstOrFail();
        $catBread = Category::where('code', 'FG-BRD')->firstOrFail();
        $catMuffin = Category::where('code', 'FG-MUF')->firstOrFail();
        $catBun = Category::where('code', 'FG-BUN')->firstOrFail();

        $brandClassic = Brand::where('code', 'SLICEMART')->firstOrFail();
        $brandArtisan = Brand::where('code', 'ARTISAN')->firstOrFail();
        $brandNutri = Brand::where('code', 'NUTRISLICE')->firstOrFail();
        $brandDaily = Brand::where('code', 'DAILYFRESH')->firstOrFail();

        $taxStandard = TaxProfile::where('code', 'VAT-15')->firstOrFail();
        $taxExempt = TaxProfile::where('code', 'VAT-EXEMPT')->firstOrFail();

        // 1. Raw Ingredients
        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'RAW-FLOUR-WHEAT',
            'name' => 'Refined Wheat Flour Type 550',
            'description' => 'High protein baker wheat flour for sandwich bread and buns',
            'type' => 'raw_material',
            'category_id' => $catFlour->id,
            'base_unit_id' => $kg->id,
            'purchase_unit_id' => $kg->id,
            'is_produced' => false,
            'is_purchased' => true,
            'is_sold' => false,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 180,
            'reorder_level' => '500.0000',
            'reorder_quantity' => '2000.0000',
            'standard_cost' => '52.5000',
            'default_sale_price' => '0.0000',
            'tax_profile_id' => $taxExempt->id,
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'RAW-FLOUR-WHOLE',
            'name' => 'Stoneground Whole Wheat Flour',
            'description' => '100% whole grain wheat flour with bran and germ',
            'type' => 'raw_material',
            'category_id' => $catFlour->id,
            'base_unit_id' => $kg->id,
            'purchase_unit_id' => $kg->id,
            'is_produced' => false,
            'is_purchased' => true,
            'is_sold' => false,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 120,
            'reorder_level' => '200.0000',
            'reorder_quantity' => '1000.0000',
            'standard_cost' => '65.0000',
            'default_sale_price' => '0.0000',
            'tax_profile_id' => $taxExempt->id,
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'RAW-SUGAR-WHITE',
            'name' => 'Fine Refined Cane Sugar',
            'description' => 'High purity sugar for dough sweetness and yeast activation',
            'type' => 'raw_material',
            'category_id' => $catSugar->id,
            'base_unit_id' => $kg->id,
            'purchase_unit_id' => $kg->id,
            'is_produced' => false,
            'is_purchased' => true,
            'is_sold' => false,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 365,
            'reorder_level' => '250.0000',
            'reorder_quantity' => '1000.0000',
            'standard_cost' => '130.0000',
            'default_sale_price' => '0.0000',
            'tax_profile_id' => $taxStandard->id,
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'RAW-YEAST-INSTANT',
            'name' => 'Instant Dry Baker Yeast',
            'description' => 'Fast fermenting instant dry yeast for high volume bread lines',
            'type' => 'raw_material',
            'category_id' => $catYeast->id,
            'base_unit_id' => $kg->id,
            'purchase_unit_id' => $kg->id,
            'is_produced' => false,
            'is_purchased' => true,
            'is_sold' => false,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 365,
            'reorder_level' => '50.0000',
            'reorder_quantity' => '200.0000',
            'standard_cost' => '550.0000',
            'default_sale_price' => '0.0000',
            'tax_profile_id' => $taxStandard->id,
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'RAW-SALT-IODIZED',
            'name' => 'Vacuum Iodized Food Grade Salt',
            'description' => 'High purity salt for gluten structure development and taste',
            'type' => 'raw_material',
            'category_id' => $catFlour->id,
            'base_unit_id' => $kg->id,
            'purchase_unit_id' => $kg->id,
            'is_produced' => false,
            'is_purchased' => true,
            'is_sold' => false,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 720,
            'reorder_level' => '100.0000',
            'reorder_quantity' => '500.0000',
            'standard_cost' => '38.0000',
            'default_sale_price' => '0.0000',
            'tax_profile_id' => $taxExempt->id,
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'RAW-BUTTER-UNSALTED',
            'name' => 'Unsalted Pastry Butter 82%',
            'description' => 'Pure dairy butter for enriched bread dough and cakes',
            'type' => 'raw_material',
            'category_id' => $catDairy->id,
            'base_unit_id' => $kg->id,
            'purchase_unit_id' => $kg->id,
            'is_produced' => false,
            'is_purchased' => true,
            'is_sold' => false,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 90,
            'reorder_level' => '100.0000',
            'reorder_quantity' => '500.0000',
            'standard_cost' => '850.0000',
            'default_sale_price' => '0.0000',
            'tax_profile_id' => $taxStandard->id,
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'RAW-WATER-RO',
            'name' => 'Purified Treated Water',
            'description' => 'Temperature controlled water for automated dough kneading',
            'type' => 'raw_material',
            'category_id' => $catFlour->id,
            'base_unit_id' => $liter->id,
            'purchase_unit_id' => $liter->id,
            'is_produced' => false,
            'is_purchased' => false,
            'is_sold' => false,
            'is_stock_tracked' => false,
            'tracking_mode' => 'none',
            'standard_cost' => '0.5000',
            'default_sale_price' => '0.0000',
            'status' => 'active',
        ]);

        // 2. Packaging Materials
        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'PKG-POUCH-WB-400',
            'name' => 'Printed Bread Pouch 400g (SliceMart)',
            'description' => 'Food contact approved printed OPP pouch with twist tie zone',
            'type' => 'packaging',
            'category_id' => $catPouch->id,
            'base_unit_id' => $pcs->id,
            'purchase_unit_id' => $pcs->id,
            'is_produced' => false,
            'is_purchased' => true,
            'is_sold' => false,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 720,
            'reorder_level' => '5000.0000',
            'reorder_quantity' => '20000.0000',
            'standard_cost' => '2.2000',
            'default_sale_price' => '0.0000',
            'tax_profile_id' => $taxStandard->id,
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'PKG-POUCH-SD-500',
            'name' => 'Perforated Artisan Pouch 500g (Artisan Crust)',
            'description' => 'Micro-perforated crust-preserving bread bag with window',
            'type' => 'packaging',
            'category_id' => $catPouch->id,
            'base_unit_id' => $pcs->id,
            'purchase_unit_id' => $pcs->id,
            'is_produced' => false,
            'is_purchased' => true,
            'is_sold' => false,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 720,
            'reorder_level' => '2000.0000',
            'reorder_quantity' => '10000.0000',
            'standard_cost' => '4.5000',
            'default_sale_price' => '0.0000',
            'tax_profile_id' => $taxStandard->id,
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'PKG-BOX-48',
            'name' => 'Master Shipping Carton 48-Loaf',
            'description' => '5-ply corrugated carton box for distribution transport',
            'type' => 'packaging',
            'category_id' => $catBox->id,
            'base_unit_id' => $pcs->id,
            'purchase_unit_id' => $pcs->id,
            'is_produced' => false,
            'is_purchased' => true,
            'is_sold' => false,
            'is_stock_tracked' => true,
            'tracking_mode' => 'none',
            'reorder_level' => '500.0000',
            'reorder_quantity' => '2500.0000',
            'standard_cost' => '45.0000',
            'default_sale_price' => '0.0000',
            'tax_profile_id' => $taxStandard->id,
            'status' => 'active',
        ]);

        // 3. Finished Products
        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'FG-WB-400G',
            'barcode' => '8941122334455',
            'name' => 'SliceMart Classic White Sandwich Bread 400g',
            'description' => 'Ultra-soft sliced sandwich bread baked with fortified wheat flour',
            'type' => 'finished',
            'category_id' => $catBread->id,
            'brand_id' => $brandClassic->id,
            'base_unit_id' => $pcs->id,
            'sales_unit_id' => $pcs->id,
            'is_produced' => true,
            'is_purchased' => false,
            'is_sold' => true,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 5,
            'reorder_level' => '200.0000',
            'reorder_quantity' => '1000.0000',
            'standard_cost' => '32.5000',
            'default_sale_price' => '65.0000',
            'tax_profile_id' => $taxStandard->id,
            'weight' => '0.4000',
            'is_online' => true,
            'online_slug' => 'slicemart-classic-white-bread-400g',
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'FG-SD-500G',
            'barcode' => '8941122334462',
            'name' => 'Artisan Crust Rustic Sourdough Loaf 500g',
            'description' => 'Naturally leavened 24-hour slow fermented artisan sourdough',
            'type' => 'finished',
            'category_id' => $catBread->id,
            'brand_id' => $brandArtisan->id,
            'base_unit_id' => $pcs->id,
            'sales_unit_id' => $pcs->id,
            'is_produced' => true,
            'is_purchased' => false,
            'is_sold' => true,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 7,
            'reorder_level' => '100.0000',
            'reorder_quantity' => '500.0000',
            'standard_cost' => '58.0000',
            'default_sale_price' => '120.0000',
            'tax_profile_id' => $taxStandard->id,
            'weight' => '0.5000',
            'is_online' => true,
            'online_slug' => 'artisan-rustic-sourdough-500g',
            'status' => 'active',
        ]);

        Product::create([
            'uuid' => (string) Str::uuid(),
            'sku' => 'FG-BUN-6PK',
            'barcode' => '8941122334479',
            'name' => 'NutriSlice Brioche Burger Buns (6-Pack)',
            'description' => 'Golden butter-glazed brioche burger buns for food service and retail',
            'type' => 'finished',
            'category_id' => $catBun->id,
            'brand_id' => $brandNutri->id,
            'base_unit_id' => $pcs->id,
            'sales_unit_id' => $pcs->id,
            'is_produced' => true,
            'is_purchased' => false,
            'is_sold' => true,
            'is_stock_tracked' => true,
            'tracking_mode' => 'batch',
            'shelf_life_days' => 6,
            'reorder_level' => '150.0000',
            'reorder_quantity' => '600.0000',
            'standard_cost' => '42.0000',
            'default_sale_price' => '85.0000',
            'tax_profile_id' => $taxStandard->id,
            'weight' => '0.3600',
            'is_online' => true,
            'online_slug' => 'nutrislice-brioche-burger-buns-6pk',
            'status' => 'active',
        ]);

        TenantContext::flush();
    }
}
