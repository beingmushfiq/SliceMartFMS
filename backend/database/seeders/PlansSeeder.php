<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class PlansSeeder extends Seeder
{
    /**
     * Seed default platform subscription plans (without tenants).
     */
    public function run(): void
    {
        $plans = [
            [
                'code' => 'STARTER',
                'name' => 'Starter Plan',
                'price' => '500.0000',
                'billing_period' => 'monthly',
                'limits' => [
                    'max_users' => 5,
                    'max_branches' => 1,
                    'max_warehouses' => 2,
                    'max_storage_mb' => 2048,
                ],
                'features' => [
                    'production' => true,
                    'pos' => false,
                    'ecommerce' => false,
                    'multi_factory' => false,
                    'custom_domain' => false,
                ],
                'is_active' => true,
            ],
            [
                'code' => 'PROFESSIONAL',
                'name' => 'Professional Plan',
                'price' => '500.0000',
                'billing_period' => 'monthly',
                'limits' => [
                    'max_users' => 25,
                    'max_branches' => 5,
                    'max_warehouses' => 10,
                    'max_storage_mb' => 10240,
                ],
                'features' => [
                    'production' => true,
                    'pos' => true,
                    'ecommerce' => true,
                    'multi_factory' => false,
                    'custom_domain' => true,
                ],
                'is_active' => true,
            ],
            [
                'code' => 'ENTERPRISE',
                'name' => 'Enterprise Unlimited',
                'price' => '500.0000',
                'billing_period' => 'monthly',
                'limits' => [
                    'max_users' => 100,
                    'max_branches' => 25,
                    'max_warehouses' => 50,
                    'max_storage_mb' => 51200,
                ],
                'features' => [
                    'production' => true,
                    'pos' => true,
                    'ecommerce' => true,
                    'multi_factory' => true,
                    'custom_domain' => true,
                ],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            $existing = DB::table('plans')->where('code', $plan['code'])->first();

            if ($existing) {
                DB::table('plans')->where('id', $existing->id)->update([
                    'name' => $plan['name'],
                    'price' => $plan['price'],
                    'billing_period' => $plan['billing_period'],
                    'limits' => json_encode($plan['limits']),
                    'features' => json_encode($plan['features']),
                    'is_active' => $plan['is_active'],
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('plans')->insert([
                    'uuid' => (string) Str::uuid(),
                    'code' => $plan['code'],
                    'name' => $plan['name'],
                    'price' => $plan['price'],
                    'billing_period' => $plan['billing_period'],
                    'limits' => json_encode($plan['limits']),
                    'features' => json_encode($plan['features']),
                    'is_active' => $plan['is_active'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
