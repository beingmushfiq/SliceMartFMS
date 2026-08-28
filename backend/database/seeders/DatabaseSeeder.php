<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database in dependency order.
     */
    public function run(): void
    {
        $this->call([
            PlansAndTenantsSeeder::class,
            RolesAndPermissionsSeeder::class,
            UnitsTableSeeder::class,
            CategoriesTableSeeder::class,
            BrandsTableSeeder::class,
            TaxProfilesTableSeeder::class,
            ReasonCodesTableSeeder::class,
            WarehousesTableSeeder::class,
            ProductsTableSeeder::class,
            BOMTableSeeder::class,
            PartiesTableSeeder::class,
            PricingTableSeeder::class,
            StorefrontTableSeeder::class,
        ]);
    }
}
