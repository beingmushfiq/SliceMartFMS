<?php

declare(strict_types=1);

namespace Tests\Unit\Auth;

use App\Core\Auth\JwtExpiredException;
use App\Core\Auth\JwtInvalidException;
use App\Core\Auth\JwtService;
use Tests\TestCase;

class JwtServiceTest extends TestCase
{
    private JwtService $jwtService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->jwtService = new JwtService('test-secret-key-that-is-long-enough-32bytes', 'HS256', 900);
    }

    public function test_issue_and_decode_token_successfully(): void
    {
        $token = $this->jwtService->issueToken(
            userId: 42,
            tenantId: 10,
            tokenVersion: 2,
            permVersion: 'a1b2c3d4e5f6',
            scopes: [['type' => 'branch', 'id' => 5]]
        );

        $this->assertNotEmpty($token);

        $decoded = $this->jwtService->decode($token);

        $this->assertSame(42, $decoded['sub']);
        $this->assertSame(10, $decoded['tenant_id']);
        /** @var array<string, mixed> $scopes */
        $scopes = (array) $decoded['scopes'];
        $this->assertCount(1, $scopes);
        $this->assertArrayHasKey('exp', $decoded);
        $this->assertArrayHasKey('jti', $decoded);
    }

    public function test_expired_token_throws_expired_exception(): void
    {
        $expiredToken = $this->jwtService->issueToken(
            userId: 42,
            tenantId: 10,
            ttl: -10
        );

        $this->expectException(JwtExpiredException::class);
        $this->jwtService->decode($expiredToken);
    }

    public function test_tampered_token_throws_invalid_exception(): void
    {
        $token = $this->jwtService->issueToken(userId: 42, tenantId: 10);
        $tampered = $token.'tampered';

        $this->expectException(JwtInvalidException::class);
        $this->jwtService->decode($tampered);
    }

    public function test_wrong_secret_token_throws_invalid_exception(): void
    {
        $otherService = new JwtService('different-secret-key-32-bytes-long', 'HS256');
        $token = $otherService->issueToken(userId: 42, tenantId: 10);

        $this->expectException(JwtInvalidException::class);
        $this->jwtService->decode($token);
    }
}
