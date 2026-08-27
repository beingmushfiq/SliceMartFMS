<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Tenancy\TenantContext;
use App\Models\Brand;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class BrandsTableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::findOrFail(1);
        TenantContext::bind($tenant->toArray());

        Brand::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'SLICEMART',
            'name' => 'SliceMart Classic',
            'is_active' => true,
        ]);

        Brand::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'ARTISAN',
            'name' => 'Artisan Crust & Bake',
            'is_active' => true,
        ]);

        Brand::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'NUTRISLICE',
            'name' => 'NutriSlice Healthy Grains',
            'is_active' => true,
        ]);

        Brand::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'DAILYFRESH',
            'name' => 'DailyFresh Quick Bakery',
            'is_active' => true,
        ]);

        TenantContext::flush();
    }
}
