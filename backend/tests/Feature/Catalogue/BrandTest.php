<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogue;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\Brand;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class BrandTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private string $jwt;

    protected function setUp(): void
    {
        parent::setUp();
        TenantContext::flush();
        DB::table('plans')->insert(['id' => 1, 'uuid' => (string) Str::uuid(), 'code' => 'ENTERPRISE', 'name' => 'Enterprise', 'price' => '10000.0000', 'billing_period' => 'monthly', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $this->tenant = Tenant::create(['id' => 1, 'uuid' => (string) Str::uuid(), 'plan_id' => 1, 'name' => 'Acme', 'slug' => 'acme', 'status' => 'active', 'currency_code' => 'BDT', 'timezone' => 'Asia/Dhaka', 'locale' => 'en', 'date_format' => 'Y-m-d', 'number_format' => 'standard']);
        $this->user = User::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Operator', 'email' => 'brand@acme.test', 'password' => Hash::make('Password123!'), 'status' => 'active', 'locale' => 'en', 'token_version' => 1, 'perm_version' => 1]);
        $this->assignOnly('catalog.brand.view', 'catalog.brand.manage');
    }

    public function test_index_and_store_use_contract_envelope(): void
    {
        $response = $this->json('POST', route('tenant.brands.store'), ['code' => 'ACME', 'name' => 'Acme Brand'], $this->headers());
        $response->assertCreated()->assertHeader('Location')->assertJsonPath('success', true)->assertJsonPath('data.id', $response->json('data.id'))->assertJsonMissingPath('data.tenant_id');
        $this->json('GET', route('tenant.brands.index'), [], $this->headers())->assertOk()->assertJsonStructure(['data' => [['id', 'code', 'name', 'logo_path', 'is_active']], 'meta' => ['correlation_id', 'pagination', 'applied']]);
    }

    public function test_duplicate_and_trashed_codes_return_conflict(): void
    {
        $brand = $this->createBrand(['code' => 'DUP']);
        $this->json('POST', route('tenant.brands.store'), ['code' => 'DUP', 'name' => 'Other'], $this->headers())->assertStatus(409)->assertJsonPath('error.code', 'DUPLICATE');
        $brand->delete();
        $this->json('POST', route('tenant.brands.store'), ['code' => 'DUP', 'name' => 'Other'], $this->headers())->assertStatus(409);
    }

    public function test_cross_tenant_show_returns_not_found(): void
    {
        $foreign = Tenant::create(['id' => 999, 'uuid' => (string) Str::uuid(), 'plan_id' => 1, 'name' => 'Foreign', 'slug' => 'foreign', 'status' => 'active', 'currency_code' => 'BDT', 'timezone' => 'Asia/Dhaka', 'locale' => 'en', 'date_format' => 'Y-m-d', 'number_format' => 'standard']);
        $uuid = (string) Str::uuid();
        DB::table('brands')->insert(['tenant_id' => $foreign->id, 'uuid' => $uuid, 'code' => 'FOREIGN', 'name' => 'Foreign', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $this->json('GET', route('tenant.brands.show', ['brand' => $uuid]), [], $this->headers())->assertNotFound()->assertJsonPath('error.code', 'NOT_FOUND');
    }

    public function test_delete_is_blocked_by_live_product(): void
    {
        $brand = $this->createBrand();
        $unit = $this->createUnit();
        DB::table('products')->insert(['tenant_id' => 1, 'uuid' => (string) Str::uuid(), 'sku' => 'SKU-1', 'name' => 'Product', 'type' => 'finished', 'brand_id' => $brand->id, 'base_unit_id' => $unit->id, 'created_at' => now(), 'updated_at' => now()]);
        $this->json('DELETE', route('tenant.brands.destroy', $brand->uuid), [], $this->headers())->assertStatus(409)->assertJsonPath('error.code', 'IN_USE');
    }

    public function test_view_only_user_cannot_mutate(): void
    {
        $this->assignOnly('catalog.brand.view');
        $this->json('POST', route('tenant.brands.store'), ['code' => 'NOPE', 'name' => 'Nope'], $this->headers())->assertForbidden();
    }

    /** @param array<string, mixed> $overrides */
    private function createBrand(array $overrides = []): Brand
    {
        TenantContext::bind($this->tenant->toArray());
        $brand = Brand::factory()->create($overrides);
        TenantContext::flush();

        return $brand;
    }

    private function createUnit(): Unit
    {
        TenantContext::bind($this->tenant->toArray());
        $unit = Unit::factory()->create();
        TenantContext::flush();

        return $unit;
    }

    /** @return array<string, string> */
    private function headers(): array
    {
        return ['Authorization' => 'Bearer '.$this->jwt];
    }

    private function assignOnly(string ...$permissions): void
    {
        $role = Role::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Brand Role', 'slug' => 'brand-'.Str::random(6), 'is_system' => false]);
        foreach ($permissions as $name) {
            [$module, $resource, $action] = explode('.', $name);
            $permission = Permission::firstOrCreate(['name' => $name], ['uuid' => (string) Str::uuid(), 'module' => $module, 'resource' => $resource, 'action' => $action]);
            $role->permissions()->attach($permission);
        }
        $this->user->roles()->detach();
        $this->user->roles()->attach($role);
        $this->jwt = app(JwtService::class)->issueToken(userId: $this->user->id, tenantId: 1, tokenVersion: 1);
    }
}
