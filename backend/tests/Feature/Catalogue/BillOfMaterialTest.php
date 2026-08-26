<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogue;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\BillOfMaterial;
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

final class BillOfMaterialTest extends TestCase
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
        $this->user = User::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'Operator', 'email' => 'bom@acme.test', 'password' => Hash::make('Password123!'), 'status' => 'active', 'locale' => 'en', 'token_version' => 1, 'perm_version' => 1]);
        $this->assignOnly('catalog.bom.view', 'catalog.bom.manage');
    }

    public function test_create_serializes_nested_items_with_public_ids(): void
    {
        $output = $this->createProduct('OUTPUT');
        $input = $this->createProduct('INPUT');
        $unit = $this->createUnit();
        $response = $this->json('POST', route('tenant.bill-of-materials.store'), [
            'product_id' => $output->uuid, 'version' => '1', 'name' => 'Recipe', 'output_quantity' => '10.0000', 'output_unit_id' => $unit->uuid,
            'items' => [['product_id' => $input->uuid, 'quantity' => '2.5000', 'unit_id' => $unit->uuid]],
        ], $this->headers());
        $response->assertCreated()->assertJsonPath('success', true)->assertJsonPath('data.product_id', $output->uuid)->assertJsonPath('data.items.0.product_id', $input->uuid)->assertJsonPath('data.items.0.unit_id', $unit->uuid)->assertJsonMissingPath('data.tenant_id');
        self::assertSame('10.0000', $response->json('data.output_quantity'));
        self::assertSame('2.5000', $response->json('data.items.0.quantity'));
    }

    public function test_duplicate_version_returns_conflict_and_delete_archives(): void
    {
        $bom = $this->createBom('1');
        $this->json('POST', route('tenant.bill-of-materials.store'), $this->payload($bom->product->uuid, $bom->outputUnit->uuid, '1'), $this->headers())->assertStatus(409);
        $this->json('DELETE', route('tenant.bill-of-materials.destroy', ['billOfMaterial' => $bom->uuid]), [], $this->headers())->assertOk();
        $fresh = $bom->fresh();
        self::assertNotNull($fresh);
        self::assertSame('archived', $fresh->status);
    }

    public function test_update_replaces_items_atomically(): void
    {
        $output = $this->createProduct('OUTPUT');
        $first = $this->createProduct('FIRST');
        $second = $this->createProduct('SECOND');
        $unit = $this->createUnit();
        $createResponse = $this->json('POST', route('tenant.bill-of-materials.store'), [...$this->payload($output->uuid, $unit->uuid, '1'), 'items' => [['product_id' => $first->uuid, 'quantity' => '1.0000', 'unit_id' => $unit->uuid]]], $this->headers())->assertCreated();
        $bomUuid = $createResponse->json('data.id');
        self::assertIsString($bomUuid);
        $this->json('PATCH', route('tenant.bill-of-materials.update', ['billOfMaterial' => $bomUuid]), ['items' => [['product_id' => $second->uuid, 'quantity' => '3.0000', 'unit_id' => $unit->uuid]]], $this->headers())->assertOk()->assertJsonPath('data.items.0.product_id', $second->uuid);
        $bomId = BillOfMaterial::where('uuid', $bomUuid)->value('id');
        self::assertIsInt($bomId);
        self::assertSame(1, DB::table('bill_of_material_items')->where('bill_of_material_id', $bomId)->count());
    }

    public function test_cross_tenant_show_returns_not_found(): void
    {
        $foreign = Tenant::create(['id' => 999, 'uuid' => (string) Str::uuid(), 'plan_id' => 1, 'name' => 'Foreign', 'slug' => 'foreign', 'status' => 'active', 'currency_code' => 'BDT', 'timezone' => 'Asia/Dhaka', 'locale' => 'en', 'date_format' => 'Y-m-d', 'number_format' => 'standard']);
        TenantContext::bind($foreign->toArray());
        $foreignUnit = Unit::factory()->create(['code' => 'FU001']);
        $foreignProduct = Product::factory()->create(['sku' => 'FOREIGN', 'base_unit_id' => $foreignUnit->id]);
        TenantContext::flush();
        $uuid = (string) Str::uuid();
        DB::table('bill_of_materials')->insert(['tenant_id' => $foreign->id, 'uuid' => $uuid, 'product_id' => $foreignProduct->id, 'version' => '1', 'name' => 'Foreign', 'output_quantity' => '1.0000', 'output_unit_id' => $foreignUnit->id, 'expected_yield_percentage' => '100.0000', 'status' => 'draft', 'created_at' => now(), 'updated_at' => now()]);
        $this->json('GET', route('tenant.bill-of-materials.show', ['billOfMaterial' => $uuid]), [], $this->headers())->assertNotFound()->assertJsonPath('error.code', 'NOT_FOUND');
    }

    /** @return array<string, mixed> */
    private function payload(string $productUuid, string $unitUuid, string $version): array
    {
        return ['product_id' => $productUuid, 'version' => $version, 'name' => 'Recipe', 'output_quantity' => '1.0000', 'output_unit_id' => $unitUuid, 'items' => [['product_id' => $productUuid, 'quantity' => '1.0000', 'unit_id' => $unitUuid]]];
    }

    private function createBom(string $version): BillOfMaterial
    {
        $product = $this->createProduct('BOM-'.$version);
        $unit = $this->createUnit();
        $response = $this->json('POST', route('tenant.bill-of-materials.store'), $this->payload($product->uuid, $unit->uuid, $version), $this->headers())->assertCreated();
        $uuid = $response->json('data.id');
        self::assertIsString($uuid);

        return BillOfMaterial::where('uuid', $uuid)->firstOrFail();
    }

    private function createProduct(string $sku): Product
    {
        $unit = $this->createUnit();
        TenantContext::bind($this->tenant->toArray());
        $product = Product::factory()->create(['sku' => $sku, 'base_unit_id' => $unit->id]);
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

    /** @return array<string, string> */
    private function headers(): array
    {
        return ['Authorization' => 'Bearer '.$this->jwt];
    }

    private function assignOnly(string ...$permissions): void
    {
        $role = Role::create(['uuid' => (string) Str::uuid(), 'tenant_id' => 1, 'name' => 'BOM Role', 'slug' => 'bom-'.Str::random(6), 'is_system' => false]);
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
