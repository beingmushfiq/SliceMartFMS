<?php

declare(strict_types=1);

namespace Tests\Feature\Production;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\BillOfMaterial;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Models\WorkerProductionEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class WorkerProductionEntryTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private string $jwt;

    private Employee $employee;

    private Product $product;

    private ProductionBatch $batch;

    private Unit $pcsUnit;

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

        $this->pcsUnit = Unit::factory()->create(['code' => 'PCS', 'name' => 'Pieces', 'type' => 'count']);
        $this->product = Product::factory()->create(['sku' => 'BREAD-01', 'name' => 'White Bread Loaf', 'type' => 'finished', 'base_unit_id' => $this->pcsUnit->id]);

        $bom = BillOfMaterial::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $this->product->id,
            'version' => '1.0',
            'name' => 'White Bread Recipe',
            'output_quantity' => '100.0000',
            'output_unit_id' => $this->pcsUnit->id,
            'expected_yield_percentage' => '100.0000',
            'status' => 'active',
        ]);

        $this->batch = ProductionBatch::create([
            'uuid' => (string) Str::uuid(),
            'batch_number' => 'BATCH-2026-W01',
            'factory_id' => $factoryId,
            'product_id' => $this->product->id,
            'bill_of_material_id' => $bom->id,
            'batch_date' => '2026-08-28',
            'planned_quantity' => '500.0000',
            'output_unit_id' => $this->pcsUnit->id,
            'status' => 'in_progress',
            'context_completeness' => 'collecting',
        ]);

        $this->employee = Employee::create([
            'uuid' => (string) Str::uuid(),
            'employee_code' => 'EMP-001',
            'company_id' => $companyId,
            'first_name' => 'Rahim',
            'last_name' => 'Uddin',
            'display_name' => 'Rahim Uddin',
            'phone' => '+8801700000001',
            'date_of_joining' => '2025-01-01',
            'employment_type' => 'piece_rate',
            'employment_status' => 'active',
            'is_active' => 1,
        ]);

        $this->user = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'Floor Supervisor',
            'email' => 'supervisor2@slicemart.test',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->assignOnly(
            'production.worker_entry.view',
            'production.worker_entry.create',
            'production.worker_entry.update',
            'production.worker_entry.delete',
            'production.worker_entry.approve'
        );
    }

    public function test_create_worker_production_entry_with_valid_attributes(): void
    {
        $response = $this->json('POST', route('tenant.production.worker-entries.store'), [
            'production_batch_id' => $this->batch->uuid,
            'employee_id' => $this->employee->uuid,
            'product_id' => $this->product->uuid,
            'work_date' => '2026-08-28',
            'measure_type' => 'piece',
            'quantity' => '250.0000',
            'unit_id' => $this->pcsUnit->uuid,
            'rework_quantity' => '5.0000',
            'rejected_quantity' => '2.0000',
            'hours_worked' => '8.0000',
            'rate_type' => 'piece_rate',
            'rate' => '1.5000',
            'incentive_amount' => '50.0000',
        ], $this->headers());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.quantity', '250.0000')
            ->assertJsonPath('data.rework_quantity', '5.0000')
            ->assertJsonPath('data.rejected_quantity', '2.0000')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.employee.employee_code', 'EMP-001');
    }

    public function test_duplicate_worker_entry_fails_with_409(): void
    {
        $payload = [
            'production_batch_id' => $this->batch->uuid,
            'employee_id' => $this->employee->uuid,
            'product_id' => $this->product->uuid,
            'work_date' => '2026-08-28',
            'measure_type' => 'piece',
            'quantity' => '100.0000',
            'unit_id' => $this->pcsUnit->uuid,
        ];

        $this->json('POST', route('tenant.production.worker-entries.store'), $payload, $this->headers())->assertCreated();
        $this->json('POST', route('tenant.production.worker-entries.store'), $payload, $this->headers())->assertStatus(409);
    }

    public function test_update_and_verify_worker_entry(): void
    {
        $createResponse = $this->json('POST', route('tenant.production.worker-entries.store'), [
            'production_batch_id' => $this->batch->uuid,
            'employee_id' => $this->employee->uuid,
            'product_id' => $this->product->uuid,
            'work_date' => '2026-08-28',
            'measure_type' => 'piece',
            'quantity' => '100.0000',
            'unit_id' => $this->pcsUnit->uuid,
        ], $this->headers())->assertCreated();

        $entryUuid = $createResponse->json('data.id');
        self::assertIsString($entryUuid);

        // Update entry
        $updateResponse = $this->json('PATCH', route('tenant.production.worker-entries.update', ['workerProductionEntry' => $entryUuid]), [
            'quantity' => '120.0000',
            'rework_quantity' => '2.0000',
        ], $this->headers());

        $updateResponse->assertOk()
            ->assertJsonPath('data.quantity', '120.0000')
            ->assertJsonPath('data.rework_quantity', '2.0000');

        // Verify entry
        $verifyResponse = $this->json('POST', route('tenant.production.worker-entries.verify', ['workerProductionEntry' => $entryUuid]), [], $this->headers());
        $verifyResponse->assertOk()
            ->assertJsonPath('data.status', 'verified')
            ->assertJsonPath('data.verified_by', $this->user->uuid);

        self::assertNotNull($verifyResponse->json('data.verified_at'));

        // Cannot update or delete verified entry
        $this->json('PATCH', route('tenant.production.worker-entries.update', ['workerProductionEntry' => $entryUuid]), [
            'quantity' => '150.0000',
        ], $this->headers())->assertStatus(422);

        $this->json('DELETE', route('tenant.production.worker-entries.destroy', ['workerProductionEntry' => $entryUuid]), [], $this->headers())
            ->assertStatus(422);
    }

    public function test_summary_aggregates_totals(): void
    {
        $this->json('POST', route('tenant.production.worker-entries.store'), [
            'production_batch_id' => $this->batch->uuid,
            'employee_id' => $this->employee->uuid,
            'product_id' => $this->product->uuid,
            'work_date' => '2026-08-28',
            'measure_type' => 'piece',
            'quantity' => '200.0000',
            'unit_id' => $this->pcsUnit->uuid,
            'rework_quantity' => '5.0000',
            'rejected_quantity' => '2.0000',
            'hours_worked' => '8.0000',
            'incentive_amount' => '100.0000',
        ], $this->headers())->assertCreated();

        $summaryResponse = $this->json('GET', route('tenant.production.worker-entries.summary', [
            'employee_id' => $this->employee->uuid,
            'date_from' => '2026-08-01',
            'date_to' => '2026-08-31',
        ]), [], $this->headers());

        $summaryResponse->assertOk()
            ->assertJsonPath('data.total_quantity', '200.0000')
            ->assertJsonPath('data.total_rework_quantity', '5.0000')
            ->assertJsonPath('data.total_rejected_quantity', '2.0000')
            ->assertJsonPath('data.total_hours_worked', '8.0000')
            ->assertJsonPath('data.total_incentive_amount', '100.0000')
            ->assertJsonPath('data.total_entries', 1);
    }

    public function test_delete_draft_worker_entry(): void
    {
        $createResponse = $this->json('POST', route('tenant.production.worker-entries.store'), [
            'production_batch_id' => $this->batch->uuid,
            'employee_id' => $this->employee->uuid,
            'product_id' => $this->product->uuid,
            'work_date' => '2026-08-28',
            'measure_type' => 'piece',
            'quantity' => '50.0000',
            'unit_id' => $this->pcsUnit->uuid,
        ], $this->headers())->assertCreated();

        $entryUuid = $createResponse->json('data.id');
        self::assertIsString($entryUuid);

        $this->json('DELETE', route('tenant.production.worker-entries.destroy', ['workerProductionEntry' => $entryUuid]), [], $this->headers())
            ->assertOk();

        $fresh = WorkerProductionEntry::withTrashed()->where('uuid', $entryUuid)->first();
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
        $foreignCompanyId = DB::table('companies')->insertGetId([
            'uuid' => (string) Str::uuid(),
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
        $foreignFactoryId = DB::table('factories')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $foreign->id,
            'company_id' => $foreignCompanyId,
            'code' => 'F-FAC',
            'name' => 'Foreign Factory',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $foreignUnit = Unit::factory()->create(['code' => 'F-PCS']);
        $foreignProduct = Product::factory()->create(['sku' => 'F-PROD', 'base_unit_id' => $foreignUnit->id]);
        $foreignBom = BillOfMaterial::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $foreignProduct->id,
            'version' => '1.0',
            'name' => 'Foreign BOM',
            'output_quantity' => '1.0000',
            'output_unit_id' => $foreignUnit->id,
            'expected_yield_percentage' => '100.0000',
            'status' => 'active',
        ]);
        $foreignBatch = ProductionBatch::create([
            'uuid' => (string) Str::uuid(),
            'batch_number' => 'F-BATCH',
            'factory_id' => $foreignFactoryId,
            'product_id' => $foreignProduct->id,
            'bill_of_material_id' => $foreignBom->id,
            'batch_date' => '2026-08-28',
            'planned_quantity' => '10.0000',
            'output_unit_id' => $foreignUnit->id,
            'status' => 'draft',
        ]);
        $foreignEmp = Employee::create([
            'uuid' => (string) Str::uuid(),
            'employee_code' => 'F-EMP',
            'company_id' => $foreignCompanyId,
            'first_name' => 'Foreign',
            'display_name' => 'Foreign Emp',
            'phone' => '+8801999999999',
            'date_of_joining' => '2025-01-01',
        ]);
        TenantContext::flush();

        $uuid = (string) Str::uuid();
        DB::table('worker_production_entries')->insert([
            'tenant_id' => $foreign->id,
            'uuid' => $uuid,
            'production_batch_id' => $foreignBatch->id,
            'employee_id' => $foreignEmp->id,
            'product_id' => $foreignProduct->id,
            'work_date' => '2026-08-28',
            'measure_type' => 'piece',
            'quantity' => '10.0000',
            'unit_id' => $foreignUnit->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->json('GET', route('tenant.production.worker-entries.show', ['workerProductionEntry' => $uuid]), [], $this->headers())
            ->assertNotFound()
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    public function test_index_filters_by_employee_and_date_range(): void
    {
        $this->json('POST', route('tenant.production.worker-entries.store'), [
            'production_batch_id' => $this->batch->uuid,
            'employee_id' => $this->employee->uuid,
            'product_id' => $this->product->uuid,
            'work_date' => '2026-08-28',
            'measure_type' => 'piece',
            'quantity' => '100.0000',
            'unit_id' => $this->pcsUnit->uuid,
        ], $this->headers())->assertCreated();

        $response = $this->json('GET', route('tenant.production.worker-entries.index', [
            'employee_id' => $this->employee->uuid,
            'date_from' => '2026-08-01',
            'date_to' => '2026-08-31',
        ]), [], $this->headers());

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_unauthorized_user_receives_403_forbidden(): void
    {
        $this->assignOnly('production.worker_entry.view');

        $this->json('POST', route('tenant.production.worker-entries.store'), [
            'production_batch_id' => $this->batch->uuid,
            'employee_id' => $this->employee->uuid,
            'product_id' => $this->product->uuid,
            'work_date' => '2026-08-28',
            'measure_type' => 'piece',
            'quantity' => '10.0000',
            'unit_id' => $this->pcsUnit->uuid,
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
            'name' => 'Worker Role',
            'slug' => 'worker-'.Str::random(6),
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
