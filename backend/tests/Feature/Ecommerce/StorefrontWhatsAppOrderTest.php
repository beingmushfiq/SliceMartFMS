<?php

declare(strict_types=1);

namespace Tests\Feature\Ecommerce;

use App\Models\Product;
use App\Models\Storefront;
use App\Models\Tenant;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StorefrontWhatsAppOrderTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Storefront $storefront;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->tenant = Tenant::where('slug', 'slicemart')->firstOrFail();
        $this->storefront = Storefront::where('subdomain', 'slicemart')->firstOrFail();

        $this->storefront->update([
            'whatsapp_number' => '+8801811223344',
            'whatsapp_ordering_enabled' => true,
        ]);

        $this->product = Product::where('tenant_id', $this->tenant->id)->firstOrFail();
    }

    public function test_can_generate_whatsapp_order_link_for_product(): void
    {
        $response = $this->withHeader('X-Storefront-Subdomain', 'slicemart')
            ->postJson('/api/v1/storefront/whatsapp/order-link', [
                'product_id' => $this->product->id,
                'quantity' => 2,
                'customer_name' => 'John Shopper',
                'customer_phone' => '+8801700000000',
                'delivery_address' => 'Banani, Dhaka',
            ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure([
            'data' => [
                'whatsapp_number',
                'message',
                'whatsapp_url',
                'total_amount',
            ],
        ]);

        $whatsappUrl = $response->json('data.whatsapp_url');
        $this->assertStringContainsString('https://wa.me/8801811223344', $whatsappUrl);
        $this->assertStringContainsString(rawurlencode($this->product->name), $whatsappUrl);
    }
}
