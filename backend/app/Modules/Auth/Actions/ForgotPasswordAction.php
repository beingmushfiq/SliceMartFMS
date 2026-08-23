<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Forgot Password Action (API_CONTRACT §8.6).
 *
 * Always returns 200 with a generic message to prevent account enumeration.
 */
class ForgotPasswordAction extends Action
{
    /**
     * Execute forgot password.
     *
     * @param  array{email: string}  $input
     * @return array{message: string}
     */
    public function execute(array $input): array
    {
        $email = strtolower(trim($input['email']));

        if ($email !== '') {
            /** @var User|null $user */
            $user = User::withoutTenantScope()->where('email', $email)->where('status', 'active')->first();

            if ($user !== null) {
                $token = Str::random(60);
                DB::table('password_reset_tokens')->updateOrInsert(
                    ['email' => $email],
                    [
                        'token' => hash('sha256', $token),
                        'created_at' => Carbon::now(),
                    ]
                );

                // In production, send email notification with $token
            }
        }

        return [
            'message' => 'If this email is registered, password reset instructions have been sent.',
        ];
    }
}
