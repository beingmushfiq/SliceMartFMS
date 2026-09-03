<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_check_returns_ok_on_api_route(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
                'version' => '1.0.0',
            ]);
    }

    public function test_health_check_head_request_returns_ok(): void
    {
        $response = $this->head('/api/health');

        $response->assertStatus(200);
    }

    public function test_liveness_probe_healthz_returns_healthy(): void
    {
        $response = $this->getJson('/healthz');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'healthy',
            ]);
    }

    public function test_readiness_probe_readyz_verifies_database(): void
    {
        $response = $this->getJson('/readyz');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ready',
                'database' => 'connected',
            ]);
    }
}
