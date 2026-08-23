<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Core\Auth\RefreshTokenService;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Reset Password Action (API_CONTRACT §8.6).
 *
 * Validates reset token, updates password, increments token_version,
 * and terminates all active sessions.
 */
class ResetPasswordAction extends Action
{
    public function __construct(
        private readonly RefreshTokenService $refreshTokenService
    ) {}

    /**
     * Execute password reset.
     *
     * @param  array{email: string, token: string, password: string}  $input
     * @return array{message: string}
     */
    public function execute(array $input): array
    {
        $email = strtolower(trim($input['email']));
        $token = $input['token'];
        $password = $input['password'];

        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if ($record === null || ! hash_equals((string) $record->token, hash('sha256', $token))) {
            throw ValidationException::withMessages([
                'email' => ['This password reset token is invalid.'],
            ]);
        }

        // Expiration check (default 60 minutes)
        $rawExpire = config('auth.passwords.users.expire');
        $expireMinutes = is_numeric($rawExpire) ? (int) $rawExpire : 60;
        $createdAt = Carbon::parse((string) $record->created_at);
        if ($createdAt->addMinutes($expireMinutes)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            throw ValidationException::withMessages([
                'email' => ['This password reset token has expired.'],
            ]);
        }

        /** @var User|null $user */
        $user = User::withoutTenantScope()->where('email', $email)->where('status', 'active')->first();

        if ($user === null) {
            throw ValidationException::withMessages([
                'email' => ['Unable to find an active user with that email address.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($password),
        ]);

        $user->increment('token_version');
        $this->refreshTokenService->revokeAllForUser($user->id);

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return [
            'message' => 'Your password has been reset successfully.',
        ];
    }
}
