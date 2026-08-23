<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Core\Auth\RefreshTokenService;
use App\Models\User;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Logout All Sessions Action (ADR-007, API_CONTRACT §8.3).
 *
 * Increments token_version on user and revokes all active refresh tokens,
 * instantly terminating all concurrent sessions.
 */
class LogoutAllAction extends Action
{
    public function __construct(
        private readonly RefreshTokenService $refreshTokenService
    ) {}

    /**
     * Execute logout for all user sessions.
     *
     * @param  array{user: User}  $input
     * @return array{success: true, cookie: Cookie}
     */
    public function execute(array $input): array
    {
        /** @var User $user */
        $user = $input['user'];

        // Increment token_version to invalidate all extant access tokens
        $user->increment('token_version');

        // Revoke all refresh tokens for this user
        $this->refreshTokenService->revokeAllForUser($user->id);

        $cookie = $this->refreshTokenService->forgetCookie();

        return [
            'success' => true,
            'cookie' => $cookie,
        ];
    }
}
