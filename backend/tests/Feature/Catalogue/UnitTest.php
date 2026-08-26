<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogue;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
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

final class UnitTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private string $jwt;

    private int $userId;

    protected function setUp(): void
    {
        parent::setUp();
        TenantContext::flush();

        DB::table('plans')->insert([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'code' => 'ENTERPRISE',
            'name' => 'Enterprise Plan',
            'price' => '10000.0000',
            'billing_period' => 'monthly',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->tenant = Tenant::create([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'plan_id' => 1,
            'name' => 'Acme Foods Ltd',
            'slug' => 'acme-foods',
            'status' => 'active',
            'currency_code' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
        ]);

        $this->user = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Jane Operator',
            'email' => 'jane@acme.com',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->userId = $this->user->id;

        // Grant both view + manage permissions
        foreach (['view', 'manage'] as $action) {
            $perm = Permission::firstOrCreate(
                ['name' => "catalog.unit.{$action}"],
                [
                    'uuid' => (string) Str::uuid(),
                    'module' => 'catalog',
                    'resource' => 'unit',
                    'action' => $action,
                ]
            );

            $role = Role::create([
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $this->tenant->id,
                'name' => ucfirst($action).' Units',
                'slug' => "{$action}-units",
                'is_system' => false,
            ]);

            $role->permissions()->attach($perm);
            $this->user->roles()->attach($role);
        }

        $this->jwt = app(JwtService::class)->issueToken(
            userId: $this->userId,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version,
        );
    }

    protected function tearDown(): void
    {
        TenantContext::flush();
        parent::tearDown();
    }

    // ── Authentication ────────────────────────────────────────────────

    public function test_unauthenticated_returns_401(): void
    {
        $this->json('GET', route('tenant.units.index'))
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'UNAUTHENTICATED');
    }

    // ── Index ─────────────────────────────────────────────────────────

    public function test_index_returns_paginated_collection(): void
    {
        $this->createUnit(['code' => 'U001', 'name' => 'Kilogram']);
        $this->createUnit(['code' => 'U002', 'name' => 'Gram']);

        $this->json('GET', route('tenant.units.index'), [], $this->authHeader())
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [['id', 'code', 'name', 'type', 'is_base', 'precision', 'is_active', 'created_at', 'updated_at']],
                'meta' => ['correlation_id', 'pagination' => ['page', 'per_page', 'total', 'total_pages', 'has_more']],
            ])
            ->assertJsonPath('meta.pagination.total', 2);
    }

    public function test_index_filters_by_type(): void
    {
        $this->createUnit(['type' => 'weight']);
        $this->createUnit(['type' => 'volume']);

        $this->json('GET', route('tenant.units.index'), ['type' => 'weight'], $this->authHeader())
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.type', 'weight');
    }

    public function test_index_filters_by_is_active(): void
    {
        $this->createUnit(['is_active' => true]);
        $this->createUnit(['is_active' => false]);

        $this->json('GET', route('tenant.units.index'), ['is_active' => 'false'], $this->authHeader())
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1);
    }

    public function test_index_searches_by_q(): void
    {
        $this->createUnit(['code' => 'KILO', 'name' => 'Kilogram']);
        $this->createUnit(['code' => 'GRAM', 'name' => 'Gram']);

        $this->json('GET', route('tenant.units.index'), ['q' => 'kil'], $this->authHeader())
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.code', 'KILO');
    }

    public function test_index_rejects_unknown_query_param(): void
    {
        $this->json('GET', route('tenant.units.index'), ['bogus' => 'x'], $this->authHeader())
            ->assertStatus(422);
    }

    public function test_index_rejects_per_page_over_100(): void
    {
        $this->json('GET', route('tenant.units.index'), ['per_page' => 101], $this->authHeader())
            ->assertStatus(422);
    }

    // ── Show ──────────────────────────────────────────────────────────

    public function test_show_returns_unit(): void
    {
        $unit = $this->createUnit();

        $this->json('GET', route('tenant.units.show', $unit->uuid), [], $this->authHeader())
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $unit->uuid);
    }

    public function test_show_returns_404_for_nonexistent(): void
    {
        $fakeUuid = (string) Str::uuid();

        $this->json('GET', route('tenant.units.show', $fakeUuid), [], $this->authHeader())
            ->assertNotFound()
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    public function test_show_returns_404_for_other_tenant(): void
    {
        // Create a second tenant for the foreign unit (FK requires it to exist).
        DB::table('tenants')->insert([
            'id' => 999,
            'uuid' => (string) Str::uuid(),
            'plan_id' => 1,
            'name' => 'Foreign Tenant',
            'slug' => 'foreign-tenant',
            'status' => 'active',
            'currency_code' => 'USD',
            'timezone' => 'UTC',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create a unit under the foreign tenant via raw DB.
        $foreignId = DB::table('units')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'code' => 'FOREIGN',
            'name' => 'Foreign Unit',
            'type' => 'piece',
            'is_base' => false,
            'precision' => 2,
            'is_active' => true,
            'tenant_id' => 999,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $foreign = Unit::withoutGlobalScope('tenant')->find($foreignId);
        assert($foreign instanceof Unit);

        $this->json('GET', route('tenant.units.show', $foreign->uuid), [], $this->authHeader())
            ->assertNotFound()
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    // ── Options ───────────────────────────────────────────────────────

    public function test_options_returns_active_units(): void
    {
        $unit = $this->createUnit(['name' => 'Kilogram', 'code' => 'KG', 'is_active' => true]);
        $this->createUnit(['name' => 'Inactive', 'is_active' => false]);

        $this->json('GET', route('tenant.units.options'), [], $this->authHeader())
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $unit->uuid, 'label' => 'Kilogram (KG)']);
    }

    public function test_options_filters_by_type(): void
    {
        $this->createUnit(['type' => 'weight']);
        $this->createUnit(['type' => 'volume']);

        $this->json('GET', route('tenant.units.options'), ['type' => 'weight'], $this->authHeader())
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    // ── Store ─────────────────────────────────────────────────────────

    public function test_store_creates_unit_with_201(): void
    {
        $this->json('POST', route('tenant.units.store'), [
            'code' => 'KG',
            'name' => 'Kilogram',
            'type' => 'weight',
        ], $this->authHeader())
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['id', 'code', 'name', 'type']])
            ->assertHeader('Location');

        $this->assertDatabaseHas('units', ['code' => 'KG', 'tenant_id' => $this->tenant->id]);
    }

    public function test_store_applies_defaults(): void
    {
        $this->json('POST', route('tenant.units.store'), [
            'code' => 'M',
            'name' => 'Meter',
            'type' => 'length',
        ], $this->authHeader())
            ->assertCreated()
            ->assertJsonPath('data.is_base', false)
            ->assertJsonPath('data.precision', 2)
            ->assertJsonPath('data.is_active', true);
    }

    public function test_store_rejects_duplicate_code(): void
    {
        $this->createUnit(['code' => 'KG']);

        $this->json('POST', route('tenant.units.store'), [
            'code' => 'KG',
            'name' => 'Another Kilogram',
            'type' => 'weight',
        ], $this->authHeader())
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'DUPLICATE');
    }

    public function test_store_rejects_trashed_code(): void
    {
        $unit = $this->createUnit(['code' => 'OLD']);
        $unit->delete();

        $this->json('POST', route('tenant.units.store'), [
            'code' => 'OLD',
            'name' => 'New Unit',
            'type' => 'weight',
        ], $this->authHeader())
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'DUPLICATE');
    }

    public function test_store_validates_required_fields(): void
    {
        $this->json('POST', route('tenant.units.store'), [], $this->authHeader())
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_FAILED')
            ->assertJsonStructure(['error' => ['fields' => ['code', 'name', 'type']]]);
    }

    public function test_store_validates_type_enum(): void
    {
        $this->json('POST', route('tenant.units.store'), [
            'code' => 'X',
            'name' => 'Bad Type',
            'type' => 'invalid',
        ], $this->authHeader())
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_FAILED')
            ->assertJsonStructure(['error' => ['fields' => ['type']]]);
    }

    // ── Update ────────────────────────────────────────────────────────

    public function test_update_patches_unit(): void
    {
        $unit = $this->createUnit(['name' => 'Kilogram']);

        $this->json('PATCH', route('tenant.units.update', $unit->uuid), [
            'name' => 'Kg',
        ], $this->authHeader())
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Kg')
            ->assertJsonPath('data.code', $unit->code); // unchanged
    }

    public function test_update_rejects_duplicate_code(): void
    {
        $unitA = $this->createUnit(['code' => 'KG']);
        $unitB = $this->createUnit(['code' => 'G']);

        $this->json('PATCH', route('tenant.units.update', $unitB->uuid), [
            'code' => 'KG',
        ], $this->authHeader())
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'DUPLICATE');
    }

    public function test_update_allows_same_code(): void
    {
        $unit = $this->createUnit(['code' => 'KG']);

        $this->json('PATCH', route('tenant.units.update', $unit->uuid), [
            'code' => 'KG',
            'name' => 'Updated Name',
        ], $this->authHeader())
            ->assertOk()
            ->assertJsonPath('data.code', 'KG');
    }

    // ── Destroy ───────────────────────────────────────────────────────

    public function test_destroy_soft_deletes(): void
    {
        $unit = $this->createUnit();

        $this->json('DELETE', route('tenant.units.destroy', $unit->uuid), [], $this->authHeader())
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('units', ['id' => $unit->getKey()]);
    }

    public function test_destroy_rejects_when_used_by_product(): void
    {
        TenantContext::bind($this->tenant->toArray());
        $unit = Unit::factory()->create();

        // Insert a product referencing this unit via raw DB (no ProductFactory)
        DB::table('products')->insert([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'sku' => 'TEST-PROD-001',
            'name' => 'Test Product',
            'type' => 'finished',
            'base_unit_id' => $unit->getKey(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        TenantContext::flush();

        $this->json('DELETE', route('tenant.units.destroy', $unit->uuid), [], $this->authHeader())
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'IN_USE');
    }

    public function test_destroy_rejects_when_used_by_conversion(): void
    {
        TenantContext::bind($this->tenant->toArray());
        $unitA = Unit::factory()->create();
        $unitB = Unit::factory()->create();

        // Insert via raw DB to include uuid (required NOT NULL column)
        DB::table('unit_conversions')->insert([
            'uuid' => (string) Str::uuid(),
            'from_unit_id' => $unitA->getKey(),
            'to_unit_id' => $unitB->getKey(),
            'factor' => '1000.000000',
            'tenant_id' => $this->tenant->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        TenantContext::flush();

        $this->json('DELETE', route('tenant.units.destroy', $unitA->uuid), [], $this->authHeader())
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'IN_USE');
    }

    public function test_destroy_rejects_when_used_by_bom_item(): void
    {
        TenantContext::bind($this->tenant->toArray());
        $unit = Unit::factory()->create();

        // Create a product for the FK (no ProductFactory exists).
        $productId = DB::table('products')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'sku' => 'BOM-PROD-001',
            'name' => 'BOM Test Product',
            'type' => 'finished',
            'base_unit_id' => $unit->getKey(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create a bill_of_materials parent row (required by composite FK).
        $bomId = DB::table('bill_of_materials')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'product_id' => $productId,
            'version' => '1',
            'name' => 'Test BOM',
            'output_quantity' => '10.0000',
            'output_unit_id' => $unit->getKey(),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert the BOM item (no uuid column in this table).
        DB::table('bill_of_material_items')->insert([
            'bill_of_material_id' => $bomId,
            'product_id' => $productId,
            'quantity' => '1.000000',
            'unit_id' => $unit->getKey(),
            'tenant_id' => $this->tenant->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        TenantContext::flush();

        $this->json('DELETE', route('tenant.units.destroy', $unit->uuid), [], $this->authHeader())
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'IN_USE');
    }

    // ── Permission matrix ─────────────────────────────────────────────

    public function test_view_permission_required_for_index(): void
    {
        $this->assignOnly('catalog.unit.view');

        $this->json('GET', route('tenant.units.index'), [], $this->authHeader())
            ->assertOk();
    }

    public function test_manage_permission_required_for_store(): void
    {
        $this->assignOnly('catalog.unit.view');

        $this->json('POST', route('tenant.units.store'), [
            'code' => 'X', 'name' => 'X', 'type' => 'piece',
        ], $this->authHeader())
            ->assertForbidden()
            ->assertJsonPath('error.code', 'FORBIDDEN');
    }

    public function test_unauthorized_returns_403(): void
    {
        // Remove all permissions
        $this->user->roles()->detach();

        $this->json('GET', route('tenant.units.index'), [], $this->authHeader())
            ->assertForbidden()
            ->assertJsonPath('error.code', 'FORBIDDEN');
    }

    // ── Helpers ───────────────────────────────────────────────────────

    /** @param array<string, mixed> $overrides */
    private function createUnit(array $overrides = []): Unit
    {
        TenantContext::bind($this->tenant->toArray());
        $unit = Unit::factory()->create($overrides);
        TenantContext::flush();

        return $unit;
    }

    /** @return array<string, string> */
    private function authHeader(): array
    {
        return ['Authorization' => 'Bearer '.$this->jwt];
    }

    // ── Private helpers for permission tests ───────────────────────────

    private function assignOnly(string ...$permissionSlugs): void
    {
        $this->user->roles()->detach();

        $role = Role::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Limited Role',
            'slug' => 'limited-'.Str::random(6),
            'is_system' => false,
        ]);

        foreach ($permissionSlugs as $slug) {
            [$module, $resource, $action] = explode('.', $slug);
            $perm = Permission::firstOrCreate(
                ['name' => $slug],
                [
                    'uuid' => (string) Str::uuid(),
                    'module' => $module,
                    'resource' => $resource,
                    'action' => $action,
                ]
            );
            $role->permissions()->attach($perm);
        }

        $this->user->roles()->attach($role);

        // Re-issue JWT with updated permissions
        $this->jwt = app(JwtService::class)->issueToken(
            userId: $this->userId,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version,
        );
    }
}
