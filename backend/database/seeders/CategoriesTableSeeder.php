<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Tenancy\TenantContext;
use App\Models\Category;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class CategoriesTableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::findOrFail(1);
        TenantContext::bind($tenant->toArray());

        // 1. Root Categories
        $raw = Category::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'RAW',
            'name' => 'Raw Ingredients & Commodities',
            'path' => 'RAW',
            'is_active' => true,
        ]);

        $pkg = Category::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'PKG',
            'name' => 'Packaging Materials & Consumables',
            'path' => 'PKG',
            'is_active' => true,
        ]);

        $sfg = Category::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'SFG',
            'name' => 'Semi-Finished / WIP Intermediates',
            'path' => 'SFG',
            'is_active' => true,
        ]);

        $fg = Category::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'FG',
            'name' => 'Finished Baked Goods',
            'path' => 'FG',
            'is_active' => true,
        ]);

        // 2. Raw Sub-categories
        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $raw->id,
            'code' => 'RAW-FLR',
            'name' => 'Grains & Flours',
            'path' => 'RAW/RAW-FLR',
            'is_active' => true,
        ]);

        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $raw->id,
            'code' => 'RAW-DRY',
            'name' => 'Fats, Oils & Dairy Products',
            'path' => 'RAW/RAW-DRY',
            'is_active' => true,
        ]);

        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $raw->id,
            'code' => 'RAW-SWT',
            'name' => 'Sugars & Sweeteners',
            'path' => 'RAW/RAW-SWT',
            'is_active' => true,
        ]);

        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $raw->id,
            'code' => 'RAW-YST',
            'name' => 'Yeast & Leavening Agents',
            'path' => 'RAW/RAW-YST',
            'is_active' => true,
        ]);

        // 3. Packaging Sub-categories
        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $pkg->id,
            'code' => 'PKG-PCH',
            'name' => 'Printed Pouches & Food Films',
            'path' => 'PKG/PKG-PCH',
            'is_active' => true,
        ]);

        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $pkg->id,
            'code' => 'PKG-BOX',
            'name' => 'Corrugated Master Cartons',
            'path' => 'PKG/PKG-BOX',
            'is_active' => true,
        ]);

        // 4. Semi-finished Sub-categories
        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $sfg->id,
            'code' => 'SFG-SRD',
            'name' => 'Sourdough Starter Dough',
            'path' => 'SFG/SFG-SRD',
            'is_active' => true,
        ]);

        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $sfg->id,
            'code' => 'SFG-BAT',
            'name' => 'Cake Batter & Premixes',
            'path' => 'SFG/SFG-BAT',
            'is_active' => true,
        ]);

        // 5. Finished Goods Sub-categories
        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $fg->id,
            'code' => 'FG-BRD',
            'name' => 'Sliced Sandwich Breads',
            'path' => 'FG/FG-BRD',
            'is_active' => true,
        ]);

        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $fg->id,
            'code' => 'FG-BUN',
            'name' => 'Buns, Rolls & Dinner Breads',
            'path' => 'FG/FG-BUN',
            'is_active' => true,
        ]);

        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $fg->id,
            'code' => 'FG-MUF',
            'name' => 'Muffins, Cupcakes & Pastries',
            'path' => 'FG/FG-MUF',
            'is_active' => true,
        ]);

        Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $fg->id,
            'code' => 'FG-RSK',
            'name' => 'Crispy Toast & Rusks',
            'path' => 'FG/FG-RSK',
            'is_active' => true,
        ]);

        TenantContext::flush();
    }
}
