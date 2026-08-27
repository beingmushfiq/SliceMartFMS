<?php

declare(strict_types=1);

namespace Tests\Feature\QC;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\BillOfMaterial;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\ProductionOutput;
use App\Models\QcInspection;
use App\Models\QcParameter;
use App\Models\ReasonCode;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class QcInspectionTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private string $jwt;

    private Employee $inspector;

    private Product $finishedGood;

    private ProductionBatch $batch;

    private ProductionOutput $output;

    private QcParameter $weightParam;

    private ReasonCode $defectReason;

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

        $gUnit = Unit::factory()->create(['code' => 'G', 'name' => 'Grams', 'type' => 'weight']);
        $pcsUnit = Unit::factory()->create(['code' => 'PCS', 'name' => 'Pieces', 'type' => 'count']);

        $this->finishedGood = Product::factory()->create(['sku' => 'BREAD-01', 'name' => 'White Bread Loaf', 'type' => 'finished', 'base_unit_id' => $pcsUnit->id]);

        $bom = BillOfMaterial::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $this->finishedGood->id,
            'version' => '1.0',
            'name' => 'White Bread Recipe',
            'output_quantity' => '100.0000',
            'output_unit_id' => $pcsUnit->id,
            'expected_yield_percentage' => '100.0000',
            'status' => 'active',
        ]);

        $this->batch = ProductionBatch::create([
            'uuid' => (string) Str::uuid(),
            'batch_number' => 'BATCH-QC-01',
            'factory_id' => $factoryId,
            'product_id' => $this->finishedGood->id,
            'bill_of_material_id' => $bom->id,
            'batch_date' => '2026-08-28',
            'planned_quantity' => '500.0000',
            'output_unit_id' => $pcsUnit->id,
            'status' => 'in_progress',
        ]);

        $wh = Warehouse::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'WH-QC-01',
            'name' => 'Main Warehouse',
            'type' => 'finished',
            'is_active' => true,
        ]);

        $this->output = ProductionOutput::create([
            'uuid' => (string) Str::uuid(),
            'production_batch_id' => $this->batch->id,
            'product_id' => $this->finishedGood->id,
            'quantity' => '500.0000',
            'unit_id' => $pcsUnit->id,
            'output_type' => 'primary',
            'target_warehouse_id' => $wh->id,
            'qc_required' => true,
            'qc_status' => 'pending',
        ]);

        $this->inspector = Employee::create([
            'uuid' => (string) Str::uuid(),
            'employee_code' => 'QC-INSP-01',
            'company_id' => $companyId,
            'first_name' => 'Karim',
            'display_name' => 'Karim QC Inspector',
            'phone' => '+8801700000002',
            'date_of_joining' => '2025-01-01',
        ]);

        $this->weightParam = QcParameter::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => $this->finishedGood->id,
            'name' => 'Loaf Weight',
            'type' => 'numeric',
            'unit_id' => $gUnit->id,
            'min_value' => '380.0000',
            'max_value' => '420.0000',
            'is_mandatory' => 1,
            'sort_order' => 1,
        ]);

        $this->defectReason = ReasonCode::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'DEF-BURNT',
            'name' => 'Burnt Crust',
            'context' => 'qc_defect',
            'is_active' => true,
        ]);

        $this->user = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'QC Manager',
            'email' => 'qcmanager@slicemart.test',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->assignOnly(
            'qc.parameter.view',
            'qc.parameter.manage',
            'qc.inspection.view',
            'qc.inspection.create',
            'qc.inspection.update',
            'qc.inspection.delete',
            'qc.inspection.approve'
        );
    }

    public function test_create_and_query_qc_parameter(): void
    {
        $response = $this->json('POST', route('tenant.qc.parameters.store'), [
            'name' => 'Moisture Level',
            'type' => 'numeric',
            'product_id' => $this->finishedGood->uuid,
            'min_value' => '10.0000',
            'max_value' => '14.0000',
            'is_mandatory' => true,
            'sort_order' => 2,
        ], $this->headers());

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Moisture Level')
            ->assertJsonPath('data.type', 'numeric')
            ->assertJsonPath('data.min_value', '10.0000');
    }

    public function test_create_inspection_with_results_and_defects_updates_output_status(): void
    {
        $response = $this->json('POST', route('tenant.qc.inspections.store'), [
            'inspection_number' => 'INSP-2026-001',
            'production_batch_id' => $this->batch->uuid,
            'production_output_id' => $this->output->uuid,
            'inspection_date' => '2026-08-28',
            'inspector_id' => $this->inspector->uuid,
            'sample_size' => '20.0000',
            'inspected_quantity' => '500.0000',
            'passed_quantity' => '490.0000',
            'failed_quantity' => '10.0000',
            'result' => 'pass',
            'results' => [
                [
                    'qc_parameter_id' => $this->weightParam->uuid,
                    'value_numeric' => '400.0000',
                    'is_within_spec' => true,
                    'notes' => 'Within target 400g',
                ],
            ],
            'defects' => [
                [
                    'defect_reason_id' => $this->defectReason->uuid,
                    'quantity' => '10.0000',
                    'severity' => 'minor',
                    'notes' => 'Slightly dark bottom crust',
                ],
            ],
        ], $this->headers());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.inspection_number', 'INSP-2026-001')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.result', 'pass')
            ->assertJsonCount(1, 'data.results')
            ->assertJsonCount(1, 'data.defects');

        // Check linked output qc_status was updated to passed
        $freshOutput = ProductionOutput::where('id', $this->output->id)->first();
        self::assertNotNull($freshOutput);
        self::assertSame('passed', $freshOutput->qc_status);
    }

    public function test_duplicate_inspection_number_returns_409(): void
    {
        $payload = [
            'inspection_number' => 'INSP-DUP-01',
            'inspection_date' => '2026-08-28',
            'inspector_id' => $this->inspector->uuid,
            'sample_size' => '10.0000',
            'inspected_quantity' => '100.0000',
            'passed_quantity' => '100.0000',
            'result' => 'pass',
        ];

        $this->json('POST', route('tenant.qc.inspections.store'), $payload, $this->headers())->assertCreated();
        $this->json('POST', route('tenant.qc.inspections.store'), $payload, $this->headers())->assertStatus(409);
    }

    public function test_approve_inspection_locks_editing(): void
    {
        $createResponse = $this->json('POST', route('tenant.qc.inspections.store'), [
            'inspection_number' => 'INSP-APPR-01',
            'inspection_date' => '2026-08-28',
            'inspector_id' => $this->inspector->uuid,
            'sample_size' => '10.0000',
            'inspected_quantity' => '100.0000',
            'passed_quantity' => '100.0000',
            'result' => 'pass',
        ], $this->headers())->assertCreated();

        $inspUuid = $createResponse->json('data.id');
        self::assertIsString($inspUuid);

        $approveResponse = $this->json('POST', route('tenant.qc.inspections.approve', ['qcInspection' => $inspUuid]), [], $this->headers());
        $approveResponse->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.approved_by', $this->user->uuid);

        self::assertNotNull($approveResponse->json('data.approved_at'));

        // Cannot update or delete approved inspection
        $this->json('PATCH', route('tenant.qc.inspections.update', ['qcInspection' => $inspUuid]), [
            'passed_quantity' => '90.0000',
        ], $this->headers())->assertStatus(422);

        $this->json('DELETE', route('tenant.qc.inspections.destroy', ['qcInspection' => $inspUuid]), [], $this->headers())
            ->assertStatus(422);
    }

    public function test_delete_draft_inspection(): void
    {
        $createResponse = $this->json('POST', route('tenant.qc.inspections.store'), [
            'inspection_number' => 'INSP-DEL-01',
            'inspection_date' => '2026-08-28',
            'inspector_id' => $this->inspector->uuid,
            'sample_size' => '5.0000',
            'inspected_quantity' => '50.0000',
            'passed_quantity' => '50.0000',
            'result' => 'pass',
        ], $this->headers())->assertCreated();

        $inspUuid = $createResponse->json('data.id');
        self::assertIsString($inspUuid);

        $this->json('DELETE', route('tenant.qc.inspections.destroy', ['qcInspection' => $inspUuid]), [], $this->headers())
            ->assertOk();

        $fresh = QcInspection::withTrashed()->where('uuid', $inspUuid)->first();
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
        $foreignInspector = Employee::create([
            'uuid' => (string) Str::uuid(),
            'employee_code' => 'F-QC',
            'company_id' => $foreignCompanyId,
            'first_name' => 'Foreign',
            'display_name' => 'Foreign Inspector',
            'phone' => '+8801999999999',
            'date_of_joining' => '2025-01-01',
        ]);
        TenantContext::flush();

        $uuid = (string) Str::uuid();
        DB::table('qc_inspections')->insert([
            'tenant_id' => $foreign->id,
            'uuid' => $uuid,
            'inspection_number' => 'F-INSP-01',
            'inspection_date' => '2026-08-28',
            'inspector_id' => $foreignInspector->id,
            'sample_size' => '1.0000',
            'inspected_quantity' => '10.0000',
            'passed_quantity' => '10.0000',
            'result' => 'pass',
            'status' => 'draft',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->json('GET', route('tenant.qc.inspections.show', ['qcInspection' => $uuid]), [], $this->headers())
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
            'name' => 'QC Role',
            'slug' => 'qc-'.Str::random(6),
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
