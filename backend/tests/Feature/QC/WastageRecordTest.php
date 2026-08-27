<?php

declare(strict_types=1);

namespace Tests\Feature\QC;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\BillOfMaterial;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\ReasonCode;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WastageRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class WastageRecordTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private string $jwt;

    private Product $flour;

    private Unit $kgUnit;

    private ReasonCode $spillageReason;

    private Warehouse $warehouse;

    private ProductionBatch $batch;

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
            'limits' => json_encode(['max_users' => 100]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->tenant = Tenant::create([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'plan_id' => 1,
            'name' => 'SliceMart',
            'slug' => 'slicemart',
            'status' => 'active',
            'currency_code' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
        ]);

        TenantContext::bind($this->tenant->toArray());

        $companyId = DB::table('companies')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'SliceMart Foods',
            'legal_name' => 'SliceMart Foods Ltd.',
            'tax_identifier' => 'BIN-123456',
            'registration_number' => 'REG-123456',
            'is_default' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $branchId = DB::table('branches')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'company_id' => $companyId,
            'code' => 'BR-01',
            'name' => 'Main Branch',
            'type' => 'mixed',
            'is_default' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $factoryId = DB::table('factories')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'company_id' => $companyId,
            'branch_id' => $branchId,
            'code' => 'FAC-01',
            'name' => 'Tejgaon Plant',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->kgUnit = Unit::factory()->create(['code' => 'KG', 'name' => 'Kilograms', 'type' => 'weight']);
        $this->flour = Product::factory()->create(['sku' => 'FLOUR-01', 'name' => 'Wheat Flour', 'type' => 'raw', 'base_unit_id' => $this->kgUnit->id]);

        $bom = BillOfMaterial::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $this->flour->id,
            'version' => '1.0',
            'name' => 'Flour Mix',
            'output_quantity' => '100.0000',
            'output_unit_id' => $this->kgUnit->id,
            'expected_yield_percentage' => '100.0000',
            'status' => 'active',
        ]);

        $this->batch = ProductionBatch::create([
            'uuid' => (string) Str::uuid(),
            'batch_number' => 'BATCH-WASTE-01',
            'factory_id' => $factoryId,
            'product_id' => $this->flour->id,
            'bill_of_material_id' => $bom->id,
            'batch_date' => '2026-08-28',
            'planned_quantity' => '500.0000',
            'output_unit_id' => $this->kgUnit->id,
            'status' => 'in_progress',
        ]);

        $this->warehouse = Warehouse::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'WH-RAW-01',
            'name' => 'Raw Materials Warehouse',
            'type' => 'raw',
            'is_active' => true,
        ]);

        $this->spillageReason = ReasonCode::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'WST-SPILL',
            'name' => 'Floor Spillage',
            'context' => 'wastage',
            'is_active' => true,
        ]);

        $this->user = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'Floor Lead',
            'email' => 'floorlead@slicemart.test',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->assignOnly(
            'qc.wastage.view',
            'qc.wastage.create',
            'qc.wastage.update',
            'qc.wastage.delete',
            'qc.wastage.approve'
        );
    }

    public function test_create_wastage_record(): void
    {
        $response = $this->json('POST', route('tenant.qc.wastage-records.store'), [
            'wastage_number' => 'WST-2026-001',
            'product_id' => $this->flour->uuid,
            'production_batch_id' => $this->batch->uuid,
            'stage' => 'in_process',
            'quantity' => '15.5000',
            'unit_id' => $this->kgUnit->uuid,
            'reason_code_id' => $this->spillageReason->uuid,
            'estimated_cost' => '750.0000',
            'is_recoverable' => false,
            'warehouse_id' => $this->warehouse->uuid,
            'notes' => 'Bag tear on mixing line',
        ], $this->headers());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.wastage_number', 'WST-2026-001')
            ->assertJsonPath('data.stage', 'in_process')
            ->assertJsonPath('data.quantity', '15.5000')
            ->assertJsonPath('data.reason_code.code', 'WST-SPILL');
    }

    public function test_duplicate_wastage_number_returns_409(): void
    {
        $payload = [
            'wastage_number' => 'WST-DUP-01',
            'product_id' => $this->flour->uuid,
            'stage' => 'storage',
            'quantity' => '5.0000',
            'unit_id' => $this->kgUnit->uuid,
            'reason_code_id' => $this->spillageReason->uuid,
        ];

        $this->json('POST', route('tenant.qc.wastage-records.store'), $payload, $this->headers())->assertCreated();
        $this->json('POST', route('tenant.qc.wastage-records.store'), $payload, $this->headers())->assertStatus(409);
    }

    public function test_update_and_delete_wastage_record(): void
    {
        $createResponse = $this->json('POST', route('tenant.qc.wastage-records.store'), [
            'wastage_number' => 'WST-UPD-01',
            'product_id' => $this->flour->uuid,
            'stage' => 'input',
            'quantity' => '10.0000',
            'unit_id' => $this->kgUnit->uuid,
            'reason_code_id' => $this->spillageReason->uuid,
        ], $this->headers())->assertCreated();

        $wasteUuid = $createResponse->json('data.id');
        self::assertIsString($wasteUuid);

        $updateResponse = $this->json('PATCH', route('tenant.qc.wastage-records.update', ['wastageRecord' => $wasteUuid]), [
            'quantity' => '12.0000',
            'estimated_cost' => '600.0000',
        ], $this->headers());

        $updateResponse->assertOk()
            ->assertJsonPath('data.quantity', '12.0000')
            ->assertJsonPath('data.estimated_cost', '600.0000');

        $this->json('DELETE', route('tenant.qc.wastage-records.destroy', ['wastageRecord' => $wasteUuid]), [], $this->headers())
            ->assertOk();

        $fresh = WastageRecord::withTrashed()->where('uuid', $wasteUuid)->first();
        self::assertNotNull($fresh);
        self::assertNotNull($fresh->deleted_at);
    }

    public function test_cross_tenant_isolation(): void
    {
        $foreign = Tenant::create([
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

        TenantContext::bind($foreign->toArray());
        $foreignUnit = Unit::factory()->create(['code' => 'F-KG']);
        $foreignProduct = Product::factory()->create(['sku' => 'F-FLOUR', 'base_unit_id' => $foreignUnit->id]);
        $foreignReason = ReasonCode::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'F-REASON',
            'name' => 'Foreign Reason',
            'context' => 'wastage',
            'is_active' => true,
        ]);
        TenantContext::flush();

        $uuid = (string) Str::uuid();
        DB::table('wastage_records')->insert([
            'tenant_id' => $foreign->id,
            'uuid' => $uuid,
            'wastage_number' => 'F-WST-01',
            'product_id' => $foreignProduct->id,
            'stage' => 'input',
            'quantity' => '1.0000',
            'unit_id' => $foreignUnit->id,
            'reason_code_id' => $foreignReason->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->json('GET', route('tenant.qc.wastage-records.show', ['wastageRecord' => $uuid]), [], $this->headers())
            ->assertNotFound()
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    /**
     * @return array<string, string>
     */
    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->jwt,
            'X-Tenant' => $this->tenant->slug,
            'Accept' => 'application/json',
        ];
    }

    private function assignOnly(string ...$permissions): void
    {
        $role = Role::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'Wastage Role',
            'slug' => 'waste-'.Str::random(6),
            'is_system' => false,
        ]);

        foreach ($permissions as $name) {
            [$module, $resource, $action] = explode('.', $name);
            $permission = Permission::firstOrCreate(
                ['name' => $name],
                [
                    'uuid' => (string) Str::uuid(),
                    'module' => $module,
                    'resource' => $resource,
                    'action' => $action,
                ]
            );
            $role->permissions()->attach($permission);
        }

        $this->user->roles()->detach();
        $this->user->roles()->attach($role);

        $this->jwt = app(JwtService::class)->issueToken(
            userId: $this->user->id,
            tenantId: 1,
            tokenVersion: 1
        );
    }
}
