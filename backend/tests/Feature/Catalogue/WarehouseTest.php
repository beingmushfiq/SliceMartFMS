<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogue;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class WarehouseTest extends TestCase
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
        $this->user = User::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Operator', 'email' => 'warehouse@acme.test', 'password' => Hash::make('Password123!'), 'status' => 'active', 'locale' => 'en', 'token_version' => 1, 'perm_version' => 1]);
        $this->assignOnly('inventory.warehouse.view', 'inventory.warehouse.manage');
    }

    public function test_store_index_and_options_use_envelopes(): void
    {
        $response = $this->json('POST', route('tenant.warehouses.store'), ['code' => 'MAIN', 'name' => 'Main Warehouse', 'type' => 'general'], $this->headers());
        $response->assertCreated()->assertJsonPath('success', true)->assertJsonPath('data.code', 'MAIN')->assertJsonMissingPath('data.tenant_id');
        $this->json('GET', route('tenant.warehouses.index'), [], $this->headers())->assertOk()->assertJsonStructure(['data', 'meta' => ['correlation_id', 'pagination', 'applied']]);
        $this->json('GET', route('tenant.warehouses.options'), [], $this->headers())->assertOk()->assertJsonPath('data.0.id', $response->json('data.id'));
    }

    public function test_duplicate_code_and_cross_tenant_show_are_rejected(): void
    {
        $warehouse = $this->createWarehouse(['code' => 'DUP']);
        $this->json('POST', route('tenant.warehouses.store'), ['code' => 'DUP', 'name' => 'Other', 'type' => 'general'], $this->headers())->assertStatus(409)->assertJsonPath('error.code', 'DUPLICATE');
        $foreign = Tenant::create(['id' => 999, 'uuid' => (string) Str::uuid(), 'plan_id' => 1, 'name' => 'Foreign', 'slug' => 'foreign', 'status' => 'active', 'currency_code' => 'BDT', 'timezone' => 'Asia/Dhaka', 'locale' => 'en', 'date_format' => 'Y-m-d', 'number_format' => 'standard']);
        $uuid = (string) Str::uuid();
        DB::table('warehouses')->insert(['tenant_id' => $foreign->id, 'uuid' => $uuid, 'code' => 'FOREIGN', 'name' => 'Foreign', 'type' => 'general', 'is_default' => false, 'allows_negative_stock' => false, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $this->json('GET', route('tenant.warehouses.show', ['warehouse' => $uuid]), [], $this->headers())->assertNotFound();
    }

    public function test_view_only_user_cannot_mutate(): void
    {
        $this->assignOnly('inventory.warehouse.view');
        $this->json('POST', route('tenant.warehouses.store'), ['code' => 'NOPE', 'name' => 'Nope', 'type' => 'general'], $this->headers())->assertForbidden();
    }

    /** @param array<string, mixed> $overrides */
    private function createWarehouse(array $overrides = []): Warehouse
    {
        TenantContext::bind($this->tenant->toArray());
        $warehouse = Warehouse::factory()->create($overrides);
        TenantContext::flush();

        return $warehouse;
    }

    /** @return array<string, string> */
    private function headers(): array
    {
        return ['Authorization' => 'Bearer '.$this->jwt];
    }

    private function assignOnly(string ...$permissions): void
    {
        $role = Role::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Warehouse Role', 'slug' => 'warehouse-'.Str::random(6), 'is_system' => false]);
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
