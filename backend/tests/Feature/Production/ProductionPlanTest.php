<?php

declare(strict_types=1);

namespace Tests\Feature\Production;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\BillOfMaterial;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductionPlan;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class ProductionPlanTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private string $jwt;

    private string $companyUuid;

    private string $factoryUuid;

    private Product $product;

    private BillOfMaterial $bom;

    private Unit $unit;

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

        $this->companyUuid = (string) Str::uuid();
        $companyId = DB::table('companies')->insertGetId([
            'uuid' => $this->companyUuid,
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

        $this->factoryUuid = (string) Str::uuid();
        DB::table('factories')->insertGetId([
            'uuid' => $this->factoryUuid,
            'tenant_id' => $this->tenant->id,
            'company_id' => $companyId,
            'branch_id' => $branchId,
            'code' => 'FAC-01',
            'name' => 'Tejgaon Plant',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->unit = Unit::factory()->create(['code' => 'PCS', 'name' => 'Pieces', 'type' => 'count']);
        $this->product = Product::factory()->create(['sku' => 'BREAD-01', 'base_unit_id' => $this->unit->id]);

        $this->bom = BillOfMaterial::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $this->product->id,
            'version' => '1.0',
            'name' => 'Standard Recipe',
            'output_quantity' => '100.0000',
            'output_unit_id' => $this->unit->id,
            'expected_yield_percentage' => '100.0000',
            'status' => 'active',
        ]);

        $this->user = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'Production Manager',
            'email' => 'pm@slicemart.test',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->assignOnly(
            'production.plan.view',
            'production.plan.create',
            'production.plan.update',
            'production.plan.delete',
            'production.plan.approve'
        );
    }

    public function test_create_serializes_nested_items_with_public_ids(): void
    {
        $response = $this->json('POST', route('tenant.production.plans.store'), [
            'company_id' => $this->companyUuid,
            'factory_id' => $this->factoryUuid,
            'plan_number' => 'PLAN-2026-001',
            'plan_date' => '2026-08-28',
            'period_start' => '2026-08-28',
            'period_end' => '2026-08-28',
            'source' => 'manual',
            'notes' => 'First test production plan',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'bill_of_material_id' => $this->bom->uuid,
                    'planned_quantity' => '500.0000',
                    'unit_id' => $this->unit->uuid,
                    'scheduled_date' => '2026-08-28',
                ],
            ],
        ], $this->headers());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.plan_number', 'PLAN-2026-001')
            ->assertJsonPath('data.company_id', $this->companyUuid)
            ->assertJsonPath('data.factory_id', $this->factoryUuid)
            ->assertJsonPath('data.items.0.product_id', $this->product->uuid)
            ->assertJsonPath('data.items.0.bill_of_material_id', $this->bom->uuid)
            ->assertJsonMissingPath('data.tenant_id');

        self::assertSame('500.0000', $response->json('data.items.0.planned_quantity'));
        self::assertSame('draft', $response->json('data.status'));
    }

    public function test_duplicate_plan_number_returns_409_conflict(): void
    {
        $payload = [
            'company_id' => $this->companyUuid,
            'factory_id' => $this->factoryUuid,
            'plan_number' => 'PLAN-DUP-001',
            'plan_date' => '2026-08-28',
            'period_start' => '2026-08-28',
            'period_end' => '2026-08-28',
            'source' => 'manual',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'bill_of_material_id' => $this->bom->uuid,
                    'planned_quantity' => '100.0000',
                    'unit_id' => $this->unit->uuid,
                ],
            ],
        ];

        $this->json('POST', route('tenant.production.plans.store'), $payload, $this->headers())->assertCreated();
        $this->json('POST', route('tenant.production.plans.store'), $payload, $this->headers())->assertStatus(409);
    }

    public function test_update_modifies_header_and_replaces_items_atomically(): void
    {
        $createResponse = $this->json('POST', route('tenant.production.plans.store'), [
            'company_id' => $this->companyUuid,
            'factory_id' => $this->factoryUuid,
            'plan_number' => 'PLAN-UPD-001',
            'plan_date' => '2026-08-28',
            'period_start' => '2026-08-28',
            'period_end' => '2026-08-28',
            'source' => 'manual',
            'notes' => 'Original note',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'bill_of_material_id' => $this->bom->uuid,
                    'planned_quantity' => '100.0000',
                    'unit_id' => $this->unit->uuid,
                ],
            ],
        ], $this->headers())->assertCreated();

        $planUuid = $createResponse->json('data.id');
        self::assertIsString($planUuid);

        $updateResponse = $this->json('PATCH', route('tenant.production.plans.update', ['productionPlan' => $planUuid]), [
            'notes' => 'Updated note',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'bill_of_material_id' => $this->bom->uuid,
                    'planned_quantity' => '250.0000',
                    'unit_id' => $this->unit->uuid,
                ],
            ],
        ], $this->headers());

        $updateResponse->assertOk()
            ->assertJsonPath('data.notes', 'Updated note')
            ->assertJsonPath('data.items.0.planned_quantity', '250.0000');

        $planId = ProductionPlan::where('uuid', $planUuid)->value('id');
        self::assertSame(1, DB::table('production_plan_items')->where('production_plan_id', $planId)->whereNull('deleted_at')->count());
    }

    public function test_approve_transitions_status_and_stamps_approver(): void
    {
        $createResponse = $this->json('POST', route('tenant.production.plans.store'), [
            'company_id' => $this->companyUuid,
            'factory_id' => $this->factoryUuid,
            'plan_number' => 'PLAN-APP-001',
            'plan_date' => '2026-08-28',
            'period_start' => '2026-08-28',
            'period_end' => '2026-08-28',
            'source' => 'manual',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'bill_of_material_id' => $this->bom->uuid,
                    'planned_quantity' => '100.0000',
                    'unit_id' => $this->unit->uuid,
                ],
            ],
        ], $this->headers())->assertCreated();

        $planUuid = $createResponse->json('data.id');
        self::assertIsString($planUuid);

        $approveResponse = $this->json('POST', route('tenant.production.plans.approve', ['productionPlan' => $planUuid]), [], $this->headers());
        $approveResponse->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.approved_by', $this->user->uuid);

        // Cannot modify approved plan
        $this->json('PATCH', route('tenant.production.plans.update', ['productionPlan' => $planUuid]), [
            'notes' => 'Attempted edit',
        ], $this->headers())->assertStatus(422);

        // Cannot delete approved plan
        $this->json('DELETE', route('tenant.production.plans.destroy', ['productionPlan' => $planUuid]), [], $this->headers())
            ->assertStatus(422);
    }

    public function test_delete_soft_deletes_draft_plan_and_items(): void
    {
        $createResponse = $this->json('POST', route('tenant.production.plans.store'), [
            'company_id' => $this->companyUuid,
            'factory_id' => $this->factoryUuid,
            'plan_number' => 'PLAN-DEL-001',
            'plan_date' => '2026-08-28',
            'period_start' => '2026-08-28',
            'period_end' => '2026-08-28',
            'source' => 'manual',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'bill_of_material_id' => $this->bom->uuid,
                    'planned_quantity' => '100.0000',
                    'unit_id' => $this->unit->uuid,
                ],
            ],
        ], $this->headers())->assertCreated();

        $planUuid = $createResponse->json('data.id');
        self::assertIsString($planUuid);

        $this->json('DELETE', route('tenant.production.plans.destroy', ['productionPlan' => $planUuid]), [], $this->headers())->assertOk();

        $fresh = ProductionPlan::withTrashed()->where('uuid', $planUuid)->first();
        self::assertNotNull($fresh);
        self::assertNotNull($fresh->deleted_at);
    }

    public function test_cross_tenant_show_returns_not_found(): void
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

        $foreignCompanyUuid = (string) Str::uuid();
        $foreignCompanyId = DB::table('companies')->insertGetId([
            'uuid' => $foreignCompanyUuid,
            'tenant_id' => $foreign->id,
            'name' => 'Foreign Co',
            'legal_name' => 'Foreign Co Ltd',
            'tax_identifier' => 'BIN-999',
            'registration_number' => 'REG-999',
            'is_default' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $foreignBranchId = DB::table('branches')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $foreign->id,
            'company_id' => $foreignCompanyId,
            'code' => 'F-BR',
            'name' => 'Foreign Branch',
            'type' => 'mixed',
            'is_default' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $foreignFactoryId = DB::table('factories')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $foreign->id,
            'company_id' => $foreignCompanyId,
            'branch_id' => $foreignBranchId,
            'code' => 'F-FAC',
            'name' => 'Foreign Factory',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $uuid = (string) Str::uuid();
        DB::table('production_plans')->insert([
            'tenant_id' => $foreign->id,
            'uuid' => $uuid,
            'company_id' => $foreignCompanyId,
            'factory_id' => $foreignFactoryId,
            'plan_number' => 'FOREIGN-PLAN-01',
            'plan_date' => '2026-08-28',
            'period_start' => '2026-08-28',
            'period_end' => '2026-08-28',
            'source' => 'manual',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->json('GET', route('tenant.production.plans.show', ['productionPlan' => $uuid]), [], $this->headers())
            ->assertNotFound()
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    public function test_index_filters_by_status_and_source(): void
    {
        $payload = [
            'company_id' => $this->companyUuid,
            'factory_id' => $this->factoryUuid,
            'plan_number' => 'PLAN-IDX-001',
            'plan_date' => '2026-08-28',
            'period_start' => '2026-08-28',
            'period_end' => '2026-08-28',
            'source' => 'manual',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'bill_of_material_id' => $this->bom->uuid,
                    'planned_quantity' => '100.0000',
                    'unit_id' => $this->unit->uuid,
                ],
            ],
        ];

        $this->json('POST', route('tenant.production.plans.store'), $payload, $this->headers())->assertCreated();

        $response = $this->json('GET', route('tenant.production.plans.index', ['status' => 'draft']), [], $this->headers());
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.plan_number', 'PLAN-IDX-001');

        $emptyResponse = $this->json('GET', route('tenant.production.plans.index', ['status' => 'completed']), [], $this->headers());
        $emptyResponse->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_unauthorized_user_receives_403_forbidden(): void
    {
        $this->assignOnly('production.plan.view');

        $this->json('POST', route('tenant.production.plans.store'), [
            'company_id' => $this->companyUuid,
            'factory_id' => $this->factoryUuid,
            'plan_number' => 'PLAN-UNAUTH',
            'plan_date' => '2026-08-28',
            'period_start' => '2026-08-28',
            'period_end' => '2026-08-28',
            'source' => 'manual',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'bill_of_material_id' => $this->bom->uuid,
                    'planned_quantity' => '100.0000',
                    'unit_id' => $this->unit->uuid,
                ],
            ],
        ], $this->headers())->assertForbidden();
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
            'name' => 'Production Role',
            'slug' => 'prod-'.Str::random(6),
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
