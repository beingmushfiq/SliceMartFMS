<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Platform\Services\PlatformRbacService;
use Illuminate\Database\Seeder;

final class ProductionSeeder extends Seeder
{
    /**
     * Seed production-ready structural data only.
     * Absolutely NO demo tenants, mock customers, fake products, or test orders.
     */
    public function run(): void
    {
        // 1. Seed global platform RBAC roles
        PlatformRbacService::seedDefaultRoles();

        // 2. Seed system permissions catalog
        $this->call([
            SystemPermissionsSeeder::class,
            BusinessTypeSeeder::class,
            IndustryProfileSeeder::class,
            PlansSeeder::class,
        ]);
    }
}
