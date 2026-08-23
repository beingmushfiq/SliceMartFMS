<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Core\Auth\RefreshTokenService;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Change Password Action (API_CONTRACT §8.6).
 *
 * Updates user password, increments token_version to terminate all other
 * concurrent sessions, and revokes all refresh token families.
 */
class ChangePasswordAction extends Action
{
    public function __construct(
        private readonly RefreshTokenService $refreshTokenService
    ) {
    }

    /**
     * Execute password change.
     *
     * @param  array{user: User, current_password: string, new_password: string}  $input
     * @return array{success: true}
     */
    public function execute(array $input): array
    {
        /** @var User $user */
        $user = $input['user'];
        $currentPassword = $input['current_password'];
        $newPassword = $input['new_password'];

        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided current password does not match.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        // Increment token_version to invalidate all existing access tokens
        $user->increment('token_version');

        // Revoke all refresh tokens
        $this->refreshTokenService->revokeAllForUser($user->id);

        return [
            'success' => true,
        ];
    }
}
