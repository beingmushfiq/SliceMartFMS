<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogue;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class PricingTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private string $jwt;

    protected function setUp(): void
    {
        parent::setUp();
        TenantContext::flush();
        DB::table('plans')->insert([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'code' => 'ENTERPRISE',
            'name' => 'Enterprise',
            'price' => '10000.0000',
            'billing_period' => 'monthly',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Tenant::create([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'plan_id' => 1,
            'name' => 'Acme',
            'slug' => 'acme',
            'status' => 'active',
            'currency_code' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
        ]);
        $this->user = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'Operator',
            'email' => 'pricing@acme.test',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);
        $this->assignOnly(
            'pricing.price_list.view',
            'pricing.price_list.manage',
            'pricing.discount_rule.view',
            'pricing.discount_rule.manage',
            'pricing.tax_profile.view',
            'pricing.tax_profile.manage',
        );
    }

    // ── Price Lists ──────────────────────────────────────────────────

    public function test_price_list_crud_lifecycle(): void
    {
        // 1. Store
        $response = $this->json('POST', route('tenant.pricing.price-lists.store'), [
            'code' => 'PL-WHOLESALE',
            'name' => 'Wholesale Price List',
            'currency_code' => 'BDT',
            'is_active' => true,
        ], $this->headers());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'PL-WHOLESALE');

        $uuid = $response->json('data.id');

        // 2. Index
        $this->json('GET', route('tenant.pricing.price-lists.index'), [], $this->headers())
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // 3. Options
        $this->json('GET', route('tenant.pricing.price-lists.options'), [], $this->headers())
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // 4. Show
        $this->json('GET', route('tenant.pricing.price-lists.show', ['priceList' => $uuid]), [], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.name', 'Wholesale Price List');

        // 5. Update
        $this->json('PATCH', route('tenant.pricing.price-lists.update', ['priceList' => $uuid]), [
            'name' => 'Updated Wholesale List',
        ], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Wholesale List');

        // 6. Destroy
        $this->json('DELETE', route('tenant.pricing.price-lists.destroy', ['priceList' => $uuid]), [], $this->headers())
            ->assertOk();

        $this->assertSoftDeleted('price_lists', ['uuid' => $uuid]);
    }

    // ── Discount Rules ────────────────────────────────────────────────

    public function test_discount_rule_crud_lifecycle(): void
    {
        // 1. Store
        $response = $this->json('POST', route('tenant.pricing.discount-rules.store'), [
            'name' => 'Bulk Purchase 10%',
            'scope' => 'order',
            'discount_type' => 'percentage',
            'value' => '10.0000',
            'is_active' => true,
        ], $this->headers());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Bulk Purchase 10%');

        $uuid = $response->json('data.id');

        // 2. Index
        $this->json('GET', route('tenant.pricing.discount-rules.index'), [], $this->headers())
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // 3. Show
        $this->json('GET', route('tenant.pricing.discount-rules.show', ['discountRule' => $uuid]), [], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.discount_type', 'percentage');

        // 4. Update
        $this->json('PATCH', route('tenant.pricing.discount-rules.update', ['discountRule' => $uuid]), [
            'name' => 'Bulk Purchase 15%',
            'value' => '15.0000',
        ], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.name', 'Bulk Purchase 15%');

        // 5. Destroy
        $this->json('DELETE', route('tenant.pricing.discount-rules.destroy', ['discountRule' => $uuid]), [], $this->headers())
            ->assertOk();

        $this->assertSoftDeleted('discount_rules', ['uuid' => $uuid]);
    }

    // ── Tax Profiles ──────────────────────────────────────────────────

    public function test_tax_profile_crud_lifecycle(): void
    {
        // 1. Store
        $response = $this->json('POST', route('tenant.pricing.tax-profiles.store'), [
            'code' => 'VAT-15',
            'name' => 'Standard VAT 15%',
            'rate' => '15.0000',
            'type' => 'exclusive',
            'is_active' => true,
        ], $this->headers());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'VAT-15');

        $uuid = $response->json('data.id');

        // 2. Index
        $this->json('GET', route('tenant.pricing.tax-profiles.index'), [], $this->headers())
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // 3. Options
        $this->json('GET', route('tenant.pricing.tax-profiles.options'), [], $this->headers())
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // 4. Show
        $this->json('GET', route('tenant.pricing.tax-profiles.show', ['taxProfile' => $uuid]), [], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.rate', '15.0000');

        // 5. Update
        $this->json('PATCH', route('tenant.pricing.tax-profiles.update', ['taxProfile' => $uuid]), [
            'name' => 'Standard VAT 15% Revised',
        ], $this->headers())
            ->assertOk()
            ->assertJsonPath('data.name', 'Standard VAT 15% Revised');

        // 6. Destroy
        $this->json('DELETE', route('tenant.pricing.tax-profiles.destroy', ['taxProfile' => $uuid]), [], $this->headers())
            ->assertOk();

        $this->assertSoftDeleted('tax_profiles', ['uuid' => $uuid]);
    }

    public function test_cross_tenant_price_list_returns_not_found(): void
    {
        $foreignTenant = Tenant::create([
            'id' => 999,
            'uuid' => (string) Str::uuid(),
            'plan_id' => 1,
            'name' => 'Foreign Tenant',
            'slug' => 'foreign',
            'status' => 'active',
            'currency_code' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
        ]);

        $uuid = (string) Str::uuid();
        DB::table('price_lists')->insert([
            'tenant_id' => $foreignTenant->id,
            'uuid' => $uuid,
            'code' => 'FOREIGN-PL',
            'name' => 'Foreign List',
            'currency_code' => 'BDT',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->json('GET', route('tenant.pricing.price-lists.show', ['priceList' => $uuid]), [], $this->headers())
            ->assertNotFound()
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    /** @return array<string, string> */
    private function headers(): array
    {
        return ['Authorization' => 'Bearer '.$this->jwt];
    }

    private function assignOnly(string ...$permissions): void
    {
        $role = Role::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'Pricing Role',
            'slug' => 'pricing-'.Str::random(6),
            'is_system' => false,
        ]);
        foreach ($permissions as $name) {
            [$module, $resource, $action] = explode('.', $name);
            $permission = Permission::firstOrCreate(
                ['name' => $name],
                ['uuid' => (string) Str::uuid(), 'module' => $module, 'resource' => $resource, 'action' => $action]
            );
            $role->permissions()->attach($permission);
        }
        $this->user->roles()->detach();
        $this->user->roles()->attach($role);
        $this->jwt = app(JwtService::class)->issueToken(userId: $this->user->id, tenantId: 1, tokenVersion: 1);
    }
}
