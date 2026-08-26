<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogue;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\Category;
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

final class CategoryTest extends TestCase
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
        $this->user = User::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Operator', 'email' => 'category@acme.test', 'password' => Hash::make('Password123!'), 'status' => 'active', 'locale' => 'en', 'token_version' => 1, 'perm_version' => 1]);
        $this->assignOnly('catalog.category.view', 'catalog.category.manage');
    }

    public function test_create_materialises_root_and_child_paths(): void
    {
        $rootResponse = $this->json('POST', route('tenant.categories.store'), ['code' => 'ROOT', 'name' => 'Root'], $this->headers())->assertCreated();
        $rootId = $rootResponse->json('data.id');
        self::assertIsString($rootId);
        $childResponse = $this->json('POST', route('tenant.categories.store'), ['parent_id' => $rootId, 'code' => 'CHILD', 'name' => 'Child'], $this->headers())->assertCreated();
        self::assertSame($rootId, $childResponse->json('data.parent_id'));
        $childPath = $childResponse->json('data.path');
        self::assertIsString($childPath);
        self::assertMatchesRegularExpression('/^\d+\/\d+$/', $childPath);
    }

    public function test_reparenting_recomputes_descendant_paths(): void
    {
        $first = $this->createCategory(['code' => 'FIRST']);
        $second = $this->createCategory(['code' => 'SECOND']);
        $child = $this->createCategory(['parent_id' => $first->id, 'code' => 'CHILD']);
        $grandchild = $this->createCategory(['parent_id' => $child->id, 'code' => 'GRAND']);
        $this->json('PATCH', route('tenant.categories.update', $child->uuid), ['parent_id' => $second->uuid], $this->headers())->assertOk();
        self::assertSame($second->path.'/'.$child->id, Category::findOrFail($child->id)->path);
        self::assertSame($second->path.'/'.$child->id.'/'.$grandchild->id, Category::findOrFail($grandchild->id)->path);
    }

    public function test_cycle_detection_returns_validation_error(): void
    {
        $root = $this->createCategory(['code' => 'ROOT']);
        $child = $this->createCategory(['parent_id' => $root->id, 'code' => 'CHILD']);
        $this->json('PATCH', route('tenant.categories.update', $root->uuid), ['parent_id' => $child->uuid], $this->headers())->assertStatus(422)->assertJsonPath('error.code', 'VALIDATION_FAILED');
    }

    public function test_delete_is_blocked_by_child_and_product(): void
    {
        $parent = $this->createCategory(['code' => 'PARENT']);
        $this->createCategory(['parent_id' => $parent->id, 'code' => 'CHILD']);
        $this->json('DELETE', route('tenant.categories.destroy', $parent->uuid), [], $this->headers())->assertStatus(409)->assertJsonPath('error.code', 'IN_USE');
        $free = $this->createCategory(['code' => 'FREE']);
        $unit = $this->createUnit();
        DB::table('products')->insert(['tenant_id' => 1, 'uuid' => (string) Str::uuid(), 'sku' => 'SKU-1', 'name' => 'Product', 'type' => 'finished', 'category_id' => $free->id, 'base_unit_id' => $unit->id, 'created_at' => now(), 'updated_at' => now()]);
        $this->json('DELETE', route('tenant.categories.destroy', $free->uuid), [], $this->headers())->assertStatus(409)->assertJsonPath('error.code', 'IN_USE');
    }

    public function test_cross_tenant_show_returns_not_found(): void
    {
        $foreign = Tenant::create(['id' => 999, 'uuid' => (string) Str::uuid(), 'plan_id' => 1, 'name' => 'Foreign', 'slug' => 'foreign', 'status' => 'active', 'currency_code' => 'BDT', 'timezone' => 'Asia/Dhaka', 'locale' => 'en', 'date_format' => 'Y-m-d', 'number_format' => 'standard']);
        $uuid = (string) Str::uuid();
        DB::table('categories')->insert(['tenant_id' => $foreign->id, 'uuid' => $uuid, 'code' => 'FOREIGN', 'name' => 'Foreign', 'is_active' => true, 'path' => '1', 'created_at' => now(), 'updated_at' => now()]);
        $this->json('GET', route('tenant.categories.show', ['category' => $uuid]), [], $this->headers())->assertNotFound();
    }

    public function test_view_only_user_cannot_mutate(): void
    {
        $this->assignOnly('catalog.category.view');
        $this->json('POST', route('tenant.categories.store'), ['code' => 'NOPE', 'name' => 'Nope'], $this->headers())->assertForbidden();
    }

    /** @param array<string, mixed> $overrides */
    private function createCategory(array $overrides = []): Category
    {
        TenantContext::bind($this->tenant->toArray());
        $category = Category::factory()->create($overrides);
        $parentPath = $category->parent_id === null ? null : Category::findOrFail($category->parent_id)->path;
        $category->update(['path' => ($parentPath === null ? '' : $parentPath.'/').$category->id]);
        TenantContext::flush();

        return $category;
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
        $role = Role::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Category Role', 'slug' => 'category-'.Str::random(6), 'is_system' => false]);
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
