<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Tenancy\TenantContext;
use App\Models\Party;
use App\Models\PartyAddress;
use App\Models\PartyContact;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class PartiesTableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::findOrFail(1);
        TenantContext::bind($tenant->toArray());

        // 1. Raw Material & Packaging Suppliers
        $bengalFlour = Party::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'SUPP-BENGAL-FLOUR',
            'name' => 'Bengal Flour Mills Ltd.',
            'legal_name' => 'Bengal Industrial Flour & Grain Products Ltd.',
            'is_supplier' => true,
            'is_customer' => false,
            'is_dealer' => false,
            'is_agent' => false,
            'type' => 'business',
            'tax_identifier' => 'BIN-1122334455',
            'phone' => '+88028811223',
            'email' => 'sales@bengalflour.com.bd',
            'credit_limit' => '500000.0000',
            'credit_days' => 30,
            'opening_balance' => '0.0000',
            'current_balance' => '0.0000',
            'status' => 'active',
        ]);

        PartyAddress::create([
            'uuid' => (string) Str::uuid(),
            'party_id' => $bengalFlour->id,
            'type' => 'billing',
            'line1' => 'Plot 12, Postogola Industrial Area',
            'city' => 'Dhaka',
            'district' => 'Dhaka',
            'country_code' => 'BGD',
            'is_default' => true,
        ]);

        PartyContact::create([
            'uuid' => (string) Str::uuid(),
            'party_id' => $bengalFlour->id,
            'name' => 'Nazmul Huda',
            'designation' => 'Senior Corporate Sales Manager',
            'phone' => '+8801711223344',
            'email' => 'nazmul@bengalflour.com.bd',
            'is_primary' => true,
        ]);

        $pureDairy = Party::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'SUPP-PURE-DAIRY',
            'name' => 'Pure Pasture Dairy Ltd.',
            'legal_name' => 'Pure Pasture Dairy Agro Farms Ltd.',
            'is_supplier' => true,
            'is_customer' => false,
            'is_dealer' => false,
            'is_agent' => false,
            'type' => 'business',
            'tax_identifier' => 'BIN-5566778899',
            'phone' => '+88029988776',
            'email' => 'orders@puredairy.com.bd',
            'credit_limit' => '250000.0000',
            'credit_days' => 15,
            'opening_balance' => '0.0000',
            'current_balance' => '0.0000',
            'status' => 'active',
        ]);

        PartyAddress::create([
            'uuid' => (string) Str::uuid(),
            'party_id' => $pureDairy->id,
            'type' => 'shipping',
            'line1' => 'Sreemangal Road, Dairy Industrial Zone',
            'city' => 'Moulvibazar',
            'district' => 'Sylhet',
            'country_code' => 'BGD',
            'is_default' => true,
        ]);

        $packMaster = Party::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'SUPP-PACKMASTER',
            'name' => 'PackMaster Packaging Industries Ltd.',
            'is_supplier' => true,
            'is_customer' => false,
            'is_dealer' => false,
            'is_agent' => false,
            'type' => 'business',
            'tax_identifier' => 'BIN-4433221100',
            'phone' => '+88027766554',
            'email' => 'sales@packmaster.com.bd',
            'credit_limit' => '150000.0000',
            'credit_days' => 20,
            'opening_balance' => '0.0000',
            'current_balance' => '0.0000',
            'status' => 'active',
        ]);

        // 2. Retail Supermarkets & Institutional Customers
        $shwapno = Party::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'CUST-SHWAPNO',
            'name' => 'Shwapno Superstores (ACI Logistics)',
            'legal_name' => 'ACI Logistics Limited',
            'is_supplier' => false,
            'is_customer' => true,
            'is_dealer' => true,
            'is_agent' => false,
            'type' => 'business',
            'tax_identifier' => 'BIN-3344556677',
            'phone' => '+88028877665',
            'email' => 'procurement@shwapno.com',
            'credit_limit' => '1000000.0000',
            'credit_days' => 45,
            'opening_balance' => '0.0000',
            'current_balance' => '0.0000',
            'status' => 'active',
        ]);

        PartyAddress::create([
            'uuid' => (string) Str::uuid(),
            'party_id' => $shwapno->id,
            'type' => 'shipping',
            'line1' => 'ACI Centre, 245 Tejgaon Industrial Area',
            'city' => 'Dhaka',
            'district' => 'Dhaka',
            'country_code' => 'BGD',
            'is_default' => true,
        ]);

        PartyContact::create([
            'uuid' => (string) Str::uuid(),
            'party_id' => $shwapno->id,
            'name' => 'Tariqul Islam',
            'designation' => 'Category Manager (Bakery & Fresh Foods)',
            'phone' => '+8801811223344',
            'email' => 'tariqul@shwapno.com',
            'is_primary' => true,
        ]);

        $unimart = Party::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'CUST-UNIMART',
            'name' => 'Unimart Gulshan (United Group)',
            'legal_name' => 'United Retail Limited',
            'is_supplier' => false,
            'is_customer' => true,
            'is_dealer' => true,
            'is_agent' => false,
            'type' => 'business',
            'tax_identifier' => 'BIN-6677889900',
            'phone' => '+88029876500',
            'email' => 'bakery@unimart.com.bd',
            'credit_limit' => '500000.0000',
            'credit_days' => 30,
            'opening_balance' => '0.0000',
            'current_balance' => '0.0000',
            'status' => 'active',
        ]);

        // 3. Walk-in / Counter Retail Customer Sentinel
        Party::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'CUST-WALKIN-GEN',
            'name' => 'General Walk-In Retail Customer',
            'is_supplier' => false,
            'is_customer' => true,
            'is_dealer' => false,
            'is_agent' => false,
            'type' => 'individual',
            'credit_limit' => '0.0000',
            'credit_days' => 0,
            'opening_balance' => '0.0000',
            'current_balance' => '0.0000',
            'status' => 'active',
        ]);

        TenantContext::flush();
    }
}
