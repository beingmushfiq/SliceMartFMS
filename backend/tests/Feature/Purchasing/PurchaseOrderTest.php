<?php

declare(strict_types=1);

namespace Tests\Feature\Purchasing;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\Party;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Modules\Purchasing\Models\PurchaseOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class PurchaseOrderTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private string $jwt;
    private Party $supplier;
    private Warehouse $warehouse;
    private Product $product;
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
            'name' => 'PO Factory',
            'slug' => 'po-factory',
            'status' => 'active',
            'currency_code' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
        ]);

        TenantContext::bind($this->tenant->toArray());

        $this->user = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'Procurement Officer',
            'email' => 'buyer@slicemart.test',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->unit = Unit::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'code' => 'BAG',
            'name' => 'Bag (50kg)',
            'type' => 'unit',
        ]);

        $this->product = Product::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'sku' => 'FLOUR-50KG',
            'name' => 'Bulk Flour 50kg',
            'type' => 'raw',
            'base_unit_id' => $this->unit->id,
        ]);

        $this->warehouse = Warehouse::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'code' => 'WH-MILL',
            'name' => 'Central Mill Silo',
            'type' => 'raw',
            'is_active' => true,
        ]);

        $this->supplier = Party::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'code' => 'SUP-AGRO',
            'name' => 'Agro Grain Ltd',
            'type' => 'vendor',
        ]);

        $this->assignOnly(
            'purchasing.order.view',
            'purchasing.order.create',
            'purchasing.order.approve'
        );
    }

    public function test_create_and_approve_purchase_order(): void
    {
        $createRes = $this->postJson('/api/v1/purchasing/orders', [
            'party_id' => $this->supplier->id,
            'warehouse_id' => $this->warehouse->id,
            'order_date' => now()->toDateString(),
            'expected_delivery_date' => now()->addDays(7)->toDateString(),
            'currency_code' => 'BDT',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => '100.0000',
                    'unit_id' => $this->unit->id,
                    'unit_price' => '45.0000',
                    'discount_amount' => '0.0000',
                    'tax_rate' => '0.0000',
                ],
            ],
        ], $this->headers());

        $createRes->assertStatus(201)
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.grand_total', '4500.0000');

        $poId = $createRes->json('data.id');
        $this->assertIsInt($poId);

        $approveRes = $this->postJson("/api/v1/purchasing/orders/{$poId}/approve", [], $this->headers());

        $approveRes->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('purchase_orders', [
            'id' => $poId,
            'status' => 'approved',
        ]);
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
            'name' => 'Buyer Role',
            'slug' => 'po-'.Str::random(6),
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
