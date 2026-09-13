<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database in dependency order.
     * Delegates to ProductionSeeder when in production mode,
     * or DevelopmentSeeder in local/testing mode.
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->info('Running ProductionSeeder (structural only, no demo data)...');
            $this->call(ProductionSeeder::class);
        } else {
            $this->command?->info('Running DevelopmentSeeder (includes demo tenant & mock data)...');
            $this->call(DevelopmentSeeder::class);
        }
    }
}
