<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Core\Auth\JwtService;
use App\Core\Auth\PermissionCatalogue;
use App\Core\Auth\RefreshTokenService;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Refresh Token Action (ADR-007, API_CONTRACT §8.2).
 *
 * Rotates the refresh token and issues a new access token.
 * Detects stolen token reuse and revokes entire family.
 */
class RefreshTokenAction extends Action
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly RefreshTokenService $refreshTokenService
    ) {
    }

    /**
     * Execute refresh token rotation.
     *
     * @param  array<string, mixed>  $input
     * @return array{
     *     access_token: string,
     *     token_type: string,
     *     expires_in: int,
     *     cookie: Cookie
     * }
     */
    public function execute(array $input): array
    {
        $plainToken = (string) ($input['refresh_token'] ?? '');
        $ipAddress = isset($input['ip_address']) ? (string) $input['ip_address'] : null;
        $userAgent = isset($input['user_agent']) ? (string) $input['user_agent'] : null;

        $rotationResult = $this->refreshTokenService->rotateRefreshToken($plainToken, $ipAddress, $userAgent);

        $user = $rotationResult['user'];
        $user->loadMissing(['scopes']);

        $scopes = $user->scopes->map(fn ($s) => [
            'type' => $s->scope_type,
            'id' => $s->scope_id,
        ])->all();

        $effectivePermissions = $user->getEffectivePermissions();
        $permVersion = PermissionCatalogue::computePermVersion($effectivePermissions);

        $ttl = (int) config('auth.jwt.ttl', 900);
        $accessToken = $this->jwtService->issueToken(
            userId: $user->id,
            tenantId: $user->tenant_id,
            tokenVersion: $user->token_version,
            permVersion: $permVersion,
            scopes: $scopes,
            ttl: $ttl
        );

        $newCookie = $this->refreshTokenService->createCookie($rotationResult['token']);

        return [
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'expires_in' => $ttl,
            'cookie' => $newCookie,
        ];
    }
}
