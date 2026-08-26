<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogue;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class ProductTest extends TestCase
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
        $this->user = User::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Operator', 'email' => 'product@acme.test', 'password' => Hash::make('Password123!'), 'status' => 'active', 'locale' => 'en', 'token_version' => 1, 'perm_version' => 1]);
        $this->assignOnly('catalog.product.view', 'catalog.product.manage');
    }

    public function test_store_resolves_uuid_references_and_hides_internal_ids(): void
    {
        $unit = $this->createUnit();
        $category = $this->createCategory();
        $brand = $this->createBrand();
        $response = $this->json('POST', route('tenant.products.store'), ['sku' => 'SKU-1', 'name' => 'Product', 'type' => 'finished', 'base_unit_id' => $unit->uuid, 'category_id' => $category->uuid, 'brand_id' => $brand->uuid, 'standard_cost' => '12.3400'], $this->headers());
        $response->assertCreated()->assertJsonPath('success', true)->assertJsonPath('data.sku', 'SKU-1')->assertJsonPath('data.category_id', $category->uuid)->assertJsonPath('data.brand_id', $brand->uuid)->assertJsonMissingPath('data.tenant_id');
        self::assertSame('12.3400', $response->json('data.standard_cost'));
    }

    public function test_duplicate_sku_including_trashed_returns_conflict(): void
    {
        $unit = $this->createUnit();
        $product = $this->createProduct(['sku' => 'DUP', 'base_unit_id' => $unit->id]);
        $this->json('POST', route('tenant.products.store'), ['sku' => 'DUP', 'name' => 'Other', 'type' => 'finished', 'base_unit_id' => $unit->uuid], $this->headers())->assertStatus(409)->assertJsonPath('error.code', 'DUPLICATE');
        $product->delete();
        $this->json('POST', route('tenant.products.store'), ['sku' => 'DUP', 'name' => 'Other', 'type' => 'finished', 'base_unit_id' => $unit->uuid], $this->headers())->assertStatus(409);
    }

    public function test_cross_tenant_show_returns_not_found(): void
    {
        $foreign = Tenant::create(['id' => 999, 'uuid' => (string) Str::uuid(), 'plan_id' => 1, 'name' => 'Foreign', 'slug' => 'foreign', 'status' => 'active', 'currency_code' => 'BDT', 'timezone' => 'Asia/Dhaka', 'locale' => 'en', 'date_format' => 'Y-m-d', 'number_format' => 'standard']);
        $foreignUnit = (string) Str::uuid();
        DB::table('units')->insert(['tenant_id' => $foreign->id, 'uuid' => $foreignUnit, 'code' => 'FU001', 'name' => 'Foreign Unit', 'type' => 'piece', 'is_base' => true, 'precision' => 0, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $uuid = (string) Str::uuid();
        DB::table('products')->insert(['tenant_id' => $foreign->id, 'uuid' => $uuid, 'sku' => 'FOREIGN', 'name' => 'Foreign', 'type' => 'finished', 'base_unit_id' => DB::table('units')->where('uuid', $foreignUnit)->value('id'), 'created_at' => now(), 'updated_at' => now()]);
        $this->json('GET', route('tenant.products.show', ['product' => $uuid]), [], $this->headers())->assertNotFound()->assertJsonPath('error.code', 'NOT_FOUND');
    }

    public function test_view_only_user_cannot_mutate(): void
    {
        $this->assignOnly('catalog.product.view');
        $this->json('POST', route('tenant.products.store'), ['sku' => 'NOPE', 'name' => 'Nope', 'type' => 'finished', 'base_unit_id' => 'not-a-uuid'], $this->headers())->assertForbidden();
    }

    /** @param array<string, mixed> $overrides */
    private function createProduct(array $overrides = []): Product
    {
        $unit = $this->createUnit();
        TenantContext::bind($this->tenant->toArray());
        /** @phpstan-ignore argument.type */
        $product = Product::factory()->create(['base_unit_id' => $unit->id, ...$overrides]);
        TenantContext::flush();

        return $product;
    }

    private function createUnit(): Unit
    {
        TenantContext::bind($this->tenant->toArray());
        $unit = Unit::factory()->create();
        TenantContext::flush();

        return $unit;
    }

    private function createCategory(): Category
    {
        TenantContext::bind($this->tenant->toArray());
        $category = Category::factory()->create(['path' => '1']);
        TenantContext::flush();

        return $category;
    }

    private function createBrand(): Brand
    {
        TenantContext::bind($this->tenant->toArray());
        $brand = Brand::factory()->create();
        TenantContext::flush();

        return $brand;
    }

    /** @return array<string, string> */
    private function headers(): array
    {
        return ['Authorization' => 'Bearer '.$this->jwt];
    }

    private function assignOnly(string ...$permissions): void
    {
        $role = Role::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Product Role', 'slug' => 'product-'.Str::random(6), 'is_system' => false]);
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
