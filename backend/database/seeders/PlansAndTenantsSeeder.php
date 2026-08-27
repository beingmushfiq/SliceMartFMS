<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class PlansAndTenantsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Plans
        $starterPlanId = DB::table('plans')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'code' => 'STARTER',
            'name' => 'Starter Plan',
            'price' => '2500.0000',
            'billing_period' => 'monthly',
            'limits' => json_encode(['max_users' => 5, 'max_branches' => 1, 'max_warehouses' => 2]),
            'features' => json_encode(['production' => true, 'pos' => false, 'ecommerce' => false]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $proPlanId = DB::table('plans')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'code' => 'PROFESSIONAL',
            'name' => 'Professional Plan',
            'price' => '7500.0000',
            'billing_period' => 'monthly',
            'limits' => json_encode(['max_users' => 25, 'max_branches' => 5, 'max_warehouses' => 10]),
            'features' => json_encode(['production' => true, 'pos' => true, 'ecommerce' => true]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $enterprisePlanId = DB::table('plans')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'code' => 'ENTERPRISE',
            'name' => 'Enterprise Unlimited',
            'price' => '20000.0000',
            'billing_period' => 'monthly',
            'limits' => json_encode(['max_users' => 100, 'max_branches' => 25, 'max_warehouses' => 50]),
            'features' => json_encode(['production' => true, 'pos' => true, 'ecommerce' => true, 'multi_factory' => true]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Seed Default Demo Tenant
        $tenant = Tenant::create([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'plan_id' => $enterprisePlanId,
            'name' => 'SliceMart Bakery & Foods Ltd.',
            'slug' => 'slicemart',
            'status' => 'active',
            'currency_code' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
        ]);

        // 3. Tenant Subscription Record
        DB::table('tenant_subscriptions')->insert([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'plan_id' => $enterprisePlanId,
            'status' => 'active',
            'amount' => '20000.0000',
            'starts_at' => now()->startOfYear(),
            'ends_at' => now()->addYear(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Seed Organization Hierarchy
        $companyId = DB::table('companies')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'name' => 'SliceMart Industrial Bakery Ltd.',
            'legal_name' => 'SliceMart Industrial Bakery Group PLC',
            'tax_identifier' => 'BIN-9876543210',
            'registration_number' => 'REG-12345678',
            'address' => 'Plot 45, Tejgaon Industrial Area, Dhaka',
            'email' => 'info@slicemart.com',
            'phone' => '+88029876543',
            'is_default' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $branchId = DB::table('branches')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'company_id' => $companyId,
            'code' => 'HQ-DHK',
            'name' => 'Dhaka Main Operations & Distribution Center',
            'type' => 'mixed',
            'address' => 'Tejgaon I/A, Dhaka-1208',
            'phone' => '+88029876544',
            'is_default' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $factoryId = DB::table('factories')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenant->id,
            'company_id' => $companyId,
            'branch_id' => $branchId,
            'code' => 'FAC-DHK-01',
            'name' => 'Tejgaon Industrial Food Processing Plant',
            'address' => 'Plant Bay 1-4, Tejgaon Industrial Area, Dhaka',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Seed Production Lines
        DB::table('production_lines')->insert([
            [
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'factory_id' => $factoryId,
                'code' => 'LINE-BRD-01',
                'name' => 'Continuous Automated Bread Baking Line A',
                'capacity_per_shift' => '10000.0000',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'factory_id' => $factoryId,
                'code' => 'LINE-CAK-02',
                'name' => 'Pastry & Cake Depositing & Tunnel Oven Line B',
                'capacity_per_shift' => '5000.0000',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'factory_id' => $factoryId,
                'code' => 'LINE-PKG-03',
                'name' => 'High-Speed Automated Slicing & Bagging Line C',
                'capacity_per_shift' => '15000.0000',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
