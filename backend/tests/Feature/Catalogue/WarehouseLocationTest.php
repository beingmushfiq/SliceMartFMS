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
use App\Models\WarehouseLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class WarehouseLocationTest extends TestCase
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
        $this->user = User::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Operator', 'email' => 'warehouse-location@acme.test', 'password' => Hash::make('Password123!'), 'status' => 'active', 'locale' => 'en', 'token_version' => 1, 'perm_version' => 1]);
        $this->assignOnly('inventory.warehouse.view', 'inventory.warehouse.manage');
    }

    public function test_store_and_index_use_uuid_relations_and_envelopes(): void
    {
        $warehouse = $this->createWarehouse();
        $parent = $this->createLocation($warehouse, ['code' => 'ZONE-A', 'name' => 'Zone A', 'type' => 'zone']);

        $response = $this->json('POST', route('tenant.warehouses.locations.store', ['warehouse' => $warehouse->uuid]), [
            'code' => 'BIN-01',
            'name' => 'Bin 01',
            'type' => 'bin',
            'parent_id' => $parent->uuid,
        ], $this->headers());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.warehouse_id', $warehouse->uuid)
            ->assertJsonPath('data.parent_id', $parent->uuid)
            ->assertJsonMissingPath('data.tenant_id');

        $this->json('GET', route('tenant.warehouses.locations.index', ['warehouse' => $warehouse->uuid]), [], $this->headers())
            ->assertOk()
            ->assertJsonStructure(['data', 'meta' => ['correlation_id', 'pagination', 'applied']]);
    }

    public function test_duplicate_code_and_cross_tenant_show_are_rejected(): void
    {
        $warehouse = $this->createWarehouse();
        $this->createLocation($warehouse, ['code' => 'DUP', 'name' => 'Dup']);

        $this->json('POST', route('tenant.warehouses.locations.store', ['warehouse' => $warehouse->uuid]), [
            'code' => 'DUP',
            'name' => 'Other',
            'type' => 'bin',
        ], $this->headers())->assertStatus(409)->assertJsonPath('error.code', 'DUPLICATE');

        $foreign = Tenant::create(['id' => 999, 'uuid' => (string) Str::uuid(), 'plan_id' => 1, 'name' => 'Foreign', 'slug' => 'foreign', 'status' => 'active', 'currency_code' => 'BDT', 'timezone' => 'Asia/Dhaka', 'locale' => 'en', 'date_format' => 'Y-m-d', 'number_format' => 'standard']);
        $foreignWarehouse = Warehouse::create(['tenant_id' => $foreign->id, 'uuid' => (string) Str::uuid(), 'code' => 'FW-1', 'name' => 'Foreign Warehouse', 'type' => 'general', 'is_default' => false, 'allows_negative_stock' => false, 'is_active' => true, 'created_by' => $this->user->id, 'updated_by' => $this->user->id]);
        $foreignLocation = WarehouseLocation::create(['tenant_id' => $foreign->id, 'uuid' => (string) Str::uuid(), 'warehouse_id' => $foreignWarehouse->id, 'code' => 'FOREIGN', 'name' => 'Foreign Bin', 'type' => 'bin', 'is_active' => true, 'created_by' => $this->user->id, 'updated_by' => $this->user->id]);

        $this->json('GET', route('tenant.warehouses.locations.show', ['warehouse' => $warehouse->uuid, 'location' => $foreignLocation->uuid]), [], $this->headers())
            ->assertNotFound();
    }

    public function test_view_only_user_cannot_mutate(): void
    {
        $this->assignOnly('inventory.warehouse.view');
        $warehouse = $this->createWarehouse();

        $this->json('POST', route('tenant.warehouses.locations.store', ['warehouse' => $warehouse->uuid]), ['code' => 'NOPE', 'name' => 'Nope', 'type' => 'bin'], $this->headers())
            ->assertForbidden();
    }

    private function createWarehouse(array $overrides = []): Warehouse
    {
        TenantContext::bind($this->tenant->toArray());
        $warehouse = Warehouse::factory()->create(['code' => 'WH-1', ...$overrides]);
        TenantContext::flush();

        return $warehouse;
    }

    private function createLocation(Warehouse $warehouse, array $overrides = []): WarehouseLocation
    {
        TenantContext::bind($this->tenant->toArray());
        $location = WarehouseLocation::create(['uuid' => (string) Str::uuid(), 'warehouse_id' => $warehouse->id, 'code' => 'LOC-1', 'name' => 'Location', 'type' => 'bin', 'is_active' => true, 'created_by' => $this->user->id, 'updated_by' => $this->user->id, ...$overrides]);
        TenantContext::flush();

        return $location;
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
