<?php

declare(strict_types=1);

namespace Tests\Feature\Platform;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantModuleNavOrderTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $admin;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->tenant = Tenant::where('slug', 'slicemart')->firstOrFail();
        $this->admin = User::where('email', 'admin@slicemart.test')->firstOrFail();

        TenantContext::bind($this->tenant->toArray());

        $this->token = app(JwtService::class)->issueToken(
            userId: $this->admin->id,
            tenantId: $this->tenant->id,
            tokenVersion: 1
        );
    }

    public function test_can_get_default_nav_order(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/tenant/modules/nav-order');

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure([
            'data' => [
                'sections',
                'items',
            ],
        ]);

        $sections = $response->json('data.sections');
        $this->assertContains('overview', $sections);
        $this->assertContains('crm', $sections);
        $this->assertContains('sales', $sections);
        $this->assertContains('supply', $sections);
        $this->assertContains('production', $sections);
    }

    public function test_can_update_custom_nav_order(): void
    {
        $customSections = ['overview', 'supply', 'production', 'crm', 'sales', 'finance', 'hr', 'system'];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->putJson('/api/v1/tenant/modules/nav-order', [
                'sections' => $customSections,
            ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.sections', $customSections);

        // Verify that fetching nav-order again returns the updated order
        $fetchRes = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/tenant/modules/nav-order');

        $fetchRes->assertOk();
        $fetchRes->assertJsonPath('data.sections', $customSections);

        // Verify that manifest contains updated nav_order
        $manifestRes = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/v1/tenant/manifest?refresh=1');

        $manifestRes->assertOk();
        $this->assertEquals($customSections, $manifestRes->json('data.nav_order.sections'));
    }
}
