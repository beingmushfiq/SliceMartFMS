<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Tenancy\TenantContext;
use App\Models\DiscountRule;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class PricingTableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::findOrFail(1);
        TenantContext::bind($tenant->toArray());

        $whiteBread = Product::where('sku', 'FG-WB-400G')->firstOrFail();
        $sourdough = Product::where('sku', 'FG-SD-500G')->firstOrFail();
        $briocheBuns = Product::where('sku', 'FG-BUN-6PK')->firstOrFail();

        // 1. Retail Standard Price List
        $retailList = PriceList::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'PL-RETAIL-STD',
            'name' => 'Standard Retail Counter Price List',
            'currency_code' => 'BDT',
            'applies_to' => 'all',
            'channel' => 'counter',
            'priority' => 10,
            'is_active' => true,
        ]);

        PriceListItem::create([
            'price_list_id' => $retailList->id,
            'product_id' => $whiteBread->id,
            'min_quantity' => '1.0000',
            'unit_price' => '65.0000',
            'discount_percentage' => '0.0000',
        ]);

        PriceListItem::create([
            'price_list_id' => $retailList->id,
            'product_id' => $sourdough->id,
            'min_quantity' => '1.0000',
            'unit_price' => '120.0000',
            'discount_percentage' => '0.0000',
        ]);

        PriceListItem::create([
            'price_list_id' => $retailList->id,
            'product_id' => $briocheBuns->id,
            'min_quantity' => '1.0000',
            'unit_price' => '85.0000',
            'discount_percentage' => '0.0000',
        ]);

        // 2. Dealer & Wholesale Tier Price List (Bulk discounts)
        $wholesaleList = PriceList::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'PL-WHOLESALE-DLR',
            'name' => 'Authorized Dealer Wholesale Price List',
            'currency_code' => 'BDT',
            'applies_to' => 'dealers',
            'channel' => 'dealer',
            'priority' => 20,
            'is_active' => true,
        ]);

        PriceListItem::create([
            'price_list_id' => $wholesaleList->id,
            'product_id' => $whiteBread->id,
            'min_quantity' => '50.0000',
            'unit_price' => '52.0000',
            'discount_percentage' => '0.0000',
        ]);

        PriceListItem::create([
            'price_list_id' => $wholesaleList->id,
            'product_id' => $sourdough->id,
            'min_quantity' => '20.0000',
            'unit_price' => '95.0000',
            'discount_percentage' => '0.0000',
        ]);

        PriceListItem::create([
            'price_list_id' => $wholesaleList->id,
            'product_id' => $briocheBuns->id,
            'min_quantity' => '30.0000',
            'unit_price' => '68.0000',
            'discount_percentage' => '0.0000',
        ]);

        // 3. Discount Rules
        DiscountRule::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'High Volume Bread Order 5% Rebate',
            'scope' => 'order',
            'discount_type' => 'percentage',
            'value' => '5.0000',
            'condition' => ['min_order_amount' => 10000],
            'priority' => 5,
            'is_active' => true,
        ]);

        DiscountRule::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Corporate Customer Seasonal Flat Discount',
            'scope' => 'order',
            'discount_type' => 'fixed_amount',
            'value' => '500.0000',
            'condition' => ['min_order_amount' => 25000],
            'priority' => 10,
            'is_active' => true,
        ]);

        TenantContext::flush();
    }
}
