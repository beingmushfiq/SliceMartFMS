<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Tenancy\TenantContext;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Storefront;
use App\Models\Tenant;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class StorefrontTableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::findOrFail(1);
        TenantContext::bind($tenant->toArray());

        $company = Company::first();
        $branch = Branch::first();
        $warehouse = Warehouse::where('type', 'finished_goods')->first() ?? Warehouse::first();

        Storefront::firstOrCreate(
            ['subdomain' => 'slicemart'],
            [
                'tenant_id' => $tenant->id,
                'uuid' => (string) Str::uuid(),
                'code' => 'SF-SLICEMART',
                'name' => 'SliceMart Direct Storefront',
                'domain' => 'slicemart.devcenterpoint.com',
                'subdomain' => 'slicemart',
                'company_id' => $company->id,
                'default_branch_id' => $branch->id,
                'default_warehouse_id' => $warehouse->id,
                'currency' => 'BDT',
                'locale' => 'en',
                'theme' => [
                    'primary_color' => '#10b981',
                    'accent_color' => '#047857',
                    'hero_title' => 'Freshly Baked. Direct From Our Factory.',
                    'hero_subtitle' => 'Artisanal breads, signature cakes & premium baked delicacies delivered directly to your doorstep.',
                ],
                'meta_title' => 'SliceMart Online Store — Fresh Bakery & Confectionery',
                'meta_description' => 'Order industrial quality artisanal baked goods straight from the SliceMart factory in Tejgaon.',
                'guest_checkout_enabled' => true,
                'cod_enabled' => true,
                'online_payment_enabled' => true,
                'min_order_amount' => '100.0000',
                'status' => 'live',
                'published_at' => now(),
            ]
        );
    }
}
