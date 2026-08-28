<?php

declare(strict_types=1);

namespace Tests\Feature\Ecommerce;

use App\Core\Auth\JwtService;
use App\Models\OrderFraudAssessment;
use App\Models\Party;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\Sales\Models\SalesOrder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderFraudVerificationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $tenantUser;
    private string $tenantToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->tenant = Tenant::where('slug', 'slicemart')->firstOrFail();
        $this->tenantUser = User::withoutTenantScope()->where('email', 'admin@slicemart.test')->firstOrFail();

        $jwtService = app(JwtService::class);
        $this->tenantToken = $jwtService->issueToken(
            userId: $this->tenantUser->id,
            tenantId: $this->tenant->id,
            tokenVersion: 1,
            permVersion: '1',
            scopes: []
        );
    }

    public function test_can_list_orders_in_fraud_queue_with_risk_scores(): void
    {
        $customer = Party::create([
            'tenant_id' => $this->tenant->id,
            'uuid' => (string) Str::uuid(),
            'code' => 'CUST-FRAUD-01',
            'name' => 'Bob Review',
            'phone' => '+8801711223344',
            'is_customer' => true,
        ]);

        $order = SalesOrder::create([
            'tenant_id' => $this->tenant->id,
            'uuid' => (string) Str::uuid(),
            'order_number' => 'SO-FRAUD-001',
            'party_id' => $customer->id,
            'channel' => 'online',
            'subtotal' => '3500.0000',
            'tax_amount' => '0.0000',
            'total_amount' => '3500.0000',
            'status' => 'pending',
            'payment_status' => 'pending',
            'shipping_address' => 'Short addr',
            'order_date' => now(),
        ]);

        app(\App\Modules\Ecommerce\Services\OrderFraudScorerService::class)->assessOrder($order);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->tenantToken}",
            'X-Tenant-ID' => (string) $this->tenant->id,
        ])->getJson('/api/v1/fraud-check/queue');

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'data');
        $this->assertGreaterThan(0, $response->json('data.0.risk_score'));
    }

    public function test_can_verify_and_release_order(): void
    {
        $customer = Party::create([
            'tenant_id' => $this->tenant->id,
            'uuid' => (string) Str::uuid(),
            'code' => 'CUST-FRAUD-02',
            'name' => 'Charlie Release',
            'phone' => '+8801799887766',
            'is_customer' => true,
        ]);

        $order = SalesOrder::create([
            'tenant_id' => $this->tenant->id,
            'uuid' => (string) Str::uuid(),
            'order_number' => 'SO-FRAUD-002',
            'party_id' => $customer->id,
            'channel' => 'online',
            'subtotal' => '1200.0000',
            'tax_amount' => '0.0000',
            'total_amount' => '1200.0000',
            'status' => 'pending',
            'payment_status' => 'pending',
            'order_date' => now(),
        ]);

        app(\App\Modules\Ecommerce\Services\OrderFraudScorerService::class)->assessOrder($order);

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$this->tenantToken}",
            'X-Tenant-ID' => (string) $this->tenant->id,
        ])->postJson("/api/v1/fraud-check/orders/{$order->id}/verify", [
            'notes' => 'Customer called and confirmed delivery time.',
            'checklist' => [
                'phone_confirmed' => true,
                'address_validated' => true,
                'items_confirmed' => true,
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.verification_status', 'verified');

        $this->assertDatabaseHas('sales_orders', [
            'id' => $order->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('order_fraud_assessments', [
            'sales_order_id' => $order->id,
            'verification_status' => 'verified',
        ]);
    }

    public function test_can_hold_and_reject_order(): void
    {
        $customer = Party::create([
            'tenant_id' => $this->tenant->id,
            'uuid' => (string) Str::uuid(),
            'code' => 'CUST-FRAUD-03',
            'name' => 'Dave Hold',
            'phone' => '+8801700112233',
            'is_customer' => true,
        ]);

        $order = SalesOrder::create([
            'tenant_id' => $this->tenant->id,
            'uuid' => (string) Str::uuid(),
            'order_number' => 'SO-FRAUD-003',
            'party_id' => $customer->id,
            'channel' => 'online',
            'subtotal' => '8000.0000',
            'tax_amount' => '0.0000',
            'total_amount' => '8000.0000',
            'status' => 'pending',
            'payment_status' => 'pending',
            'order_date' => now(),
        ]);

        app(\App\Modules\Ecommerce\Services\OrderFraudScorerService::class)->assessOrder($order);

        // Put on hold
        $holdRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tenantToken}",
            'X-Tenant-ID' => (string) $this->tenant->id,
        ])->postJson("/api/v1/fraud-check/orders/{$order->id}/hold", [
            'notes' => 'Customer phone is switched off.',
        ]);

        $holdRes->assertOk();
        $this->assertDatabaseHas('sales_orders', [
            'id' => $order->id,
            'status' => 'on_hold',
        ]);

        // Reject fraudulent order
        $rejectRes = $this->withHeaders([
            'Authorization' => "Bearer {$this->tenantToken}",
            'X-Tenant-ID' => (string) $this->tenant->id,
        ])->postJson("/api/v1/fraud-check/orders/{$order->id}/reject", [
            'notes' => 'Confirmed fraudulent/fake order placement.',
        ]);

        $rejectRes->assertOk();
        $this->assertDatabaseHas('sales_orders', [
            'id' => $order->id,
            'status' => 'cancelled',
        ]);
    }
}
