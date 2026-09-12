<?php

declare(strict_types=1);

namespace Tests\Feature\Ecommerce;

use App\Models\Coupon;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantCouponManagementTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $admin;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $plan = \App\Models\Plan::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'code' => 'ENTERPRISE',
            'name' => 'Enterprise Edition',
            'price' => '0.0000',
            'billing_period' => 'monthly',
            'limits' => [],
        ]);

        $this->tenant = Tenant::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'SliceMart Retail',
            'slug' => 'slicemart',
            'plan_id' => $plan->id,
            'timezone' => 'UTC',
            'currency_code' => 'BDT',
            'date_format' => 'Y-m-d',
            'number_format' => 'en-US',
            'status' => 'active',
        ]);

        $this->admin = User::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'name' => 'SliceMart Admin',
            'email' => 'admin@slicemart.test',
            'password' => 'Password123!',
            'status' => 'active',
            'token_version' => 1,
        ]);
        $this->admin->setAttribute('tenant_id', $this->tenant->id);
        $this->admin->save();

        $jwtService = app(\App\Core\Auth\JwtService::class);
        $this->token = $jwtService->issueToken(
            userId: $this->admin->id,
            tenantId: $this->tenant->id,
            tokenVersion: 1,
            permVersion: '1',
            scopes: []
        );
        $this->actingAs($this->admin);
    }

    public function test_can_list_coupons_and_stats(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson('/api/v1/storefront/coupons');

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $this->assertArrayHasKey('stats', $response->json('meta'));
    }

    public function test_can_create_single_coupon(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/v1/storefront/coupons', [
                'code' => 'TESTSAVE25',
                'name' => 'Test Save 25% Off',
                'discount_type' => 'percentage',
                'discount_value' => 25,
                'min_order_amount' => 500,
                'max_discount_amount' => 1000,
                'usage_limit_total' => 50,
                'is_active' => true,
            ]);

        $response->assertCreated();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.code', 'TESTSAVE25');
        $this->assertDatabaseHas('coupons', [
            'code' => 'TESTSAVE25',
            'tenant_id' => $this->tenant->id,
            'is_active' => true,
        ]);
    }

    public function test_can_batch_generate_coupons(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/v1/storefront/coupons/generate-batch', [
                'prefix' => 'BATCH26',
                'count' => 5,
                'name' => 'Autumn Batch Voucher',
                'discount_type' => 'fixed',
                'discount_value' => 150,
                'min_order_amount' => 1000,
                'usage_limit_total' => 1,
            ]);

        $response->assertCreated();
        $response->assertJsonPath('success', true);
        $data = $response->json('data');
        $this->assertCount(5, $data);
        foreach ($data as $c) {
            $this->assertStringStartsWith('BATCH26-', $c['code']);
        }
    }

    public function test_can_toggle_coupon_status(): void
    {
        $coupon = Coupon::create([
            'tenant_id' => $this->tenant->id,
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'code' => 'TOGGLEME',
            'name' => 'Toggle Status Coupon',
            'discount_type' => 'fixed',
            'discount_value' => '100.0000',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/v1/storefront/coupons/'.$coupon->id.'/toggle-status');

        $response->assertOk();
        $response->assertJsonPath('data.is_active', false);
    }
}
