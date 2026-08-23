<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Core\Auth\RefreshTokenService;
use App\Models\RefreshToken;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Logout Action (ADR-007, API_CONTRACT §8.3).
 *
 * Revokes the current refresh family and clears the cookie.
 * Always succeeds even if the token was already revoked or missing.
 */
class LogoutAction extends Action
{
    public function __construct(
        private readonly RefreshTokenService $refreshTokenService
    ) {}

    /**
     * Execute logout.
     *
     * @param  array<string, mixed>  $input
     * @return array{success: true, cookie: Cookie}
     */
    public function execute(array $input = []): array
    {
        $rawToken = $input['refresh_token'] ?? '';
        $plainToken = is_string($rawToken) ? $rawToken : '';

        if ($plainToken !== '') {
            $tokenHash = hash('sha256', $plainToken);
            /** @var RefreshToken|null $tokenModel */
            $tokenModel = RefreshToken::query()->where('token_hash', $tokenHash)->first();

            if ($tokenModel !== null) {
                $this->refreshTokenService->revokeFamily($tokenModel->family_id);
            }
        }

        $cookie = $this->refreshTokenService->forgetCookie();

        return [
            'success' => true,
            'cookie' => $cookie,
        ];
    }
}
