<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    public function test_api_rate_limiter_is_registered(): void
    {
        $limiter = RateLimiter::limiter('api');
        $this->assertNotNull($limiter);
    }

    public function test_login_rate_limiter_is_registered(): void
    {
        $limiter = RateLimiter::limiter('login');
        $this->assertNotNull($limiter);
    }

    public function test_storefront_rate_limiter_is_registered(): void
    {
        $limiter = RateLimiter::limiter('storefront');
        $this->assertNotNull($limiter);
    }

    public function test_webhooks_rate_limiter_is_registered(): void
    {
        $limiter = RateLimiter::limiter('webhooks');
        $this->assertNotNull($limiter);
    }
}
