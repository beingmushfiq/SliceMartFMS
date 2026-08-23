<?php

declare(strict_types=1);

namespace App\Core\Auth;

use App\Models\RefreshToken;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Refresh Token Service for SliceMart FMS (ADR-007).
 *
 * Implements:
 * - Opaque rotating refresh tokens with 14-day lifetime.
 * - Family tracking via `family_id` UUID.
 * - Atomic single-use rotation (`replaced_by_id`).
 * - Stolen token reuse detection: revoking the whole family immediately if a revoked token is used.
 * - HttpOnly, Secure, SameSite=Strict cookie delivery.
 */
class RefreshTokenService
{
    private int $ttlDays;

    private string $cookieName;

    private string $cookiePath;

    private ?string $cookieDomain;

    private bool $cookieSecure;

    /** @var 'lax'|'strict'|'none' */
    private string $cookieSameSite;

    public function __construct()
    {
        $ttl = config('auth.refresh_token.ttl_days');
        $this->ttlDays = is_numeric($ttl) ? (int) $ttl : 14;

        $name = config('auth.refresh_token.cookie_name');
        $this->cookieName = is_string($name) ? $name : 'slicemart_refresh_token';

        $path = config('auth.refresh_token.cookie_path');
        $this->cookiePath = is_string($path) ? $path : '/api/v1/auth';

        $domain = config('auth.refresh_token.cookie_domain');
        $this->cookieDomain = is_string($domain) ? $domain : null;

        $this->cookieSecure = (bool) config('auth.refresh_token.cookie_secure', true);

        $sameSite = config('auth.refresh_token.cookie_same_site');
        $this->cookieSameSite = is_string($sameSite) && in_array($sameSite, ['lax', 'strict', 'none'], true) ? $sameSite : 'strict';
    }

    /**
     * Create and store a new refresh token.
     *
     * @return array{token: string, model: RefreshToken}
     */
    public function createRefreshToken(
        User $user,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $familyId = null
    ): array {
        $plainToken = 'rt_'.Str::random(40).bin2hex(random_bytes(16));
        $tokenHash = hash('sha256', $plainToken);
        $family = $familyId ?? (string) Str::uuid();
        $expiresAt = Carbon::now()->addDays($this->ttlDays);

        /** @var RefreshToken $model */
        $model = RefreshToken::query()->create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'token_hash' => $tokenHash,
            'family_id' => $family,
            'replaced_by_id' => null,
            'ip' => $ipAddress,
            'user_agent' => $userAgent ? Str::limit($userAgent, 255, '') : null,
            'expires_at' => $expiresAt,
            'revoked_at' => null,
        ]);

        return [
            'token' => $plainToken,
            'model' => $model,
        ];
    }

    /**
     * Rotate a presented refresh token atomically.
     *
     * @return array{token: string, model: RefreshToken, user: User}
     *
     * @throws RefreshTokenInvalidException
     * @throws RefreshTokenExpiredException
     * @throws RefreshTokenReusedException
     */
    public function rotateRefreshToken(
        string $plainToken,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): array {
        $tokenHash = hash('sha256', $plainToken);

        /** @var RefreshToken|null $existingToken */
        $existingToken = RefreshToken::query()
            ->where('token_hash', $tokenHash)
            ->first();

        if ($existingToken === null) {
            throw new RefreshTokenInvalidException('The refresh token is invalid.', 401);
        }

        // Stolen Token Reuse Detection (ADR-007):
        // If the token has already been revoked, someone is trying to reuse a rotated token!
        if ($existingToken->revoked_at !== null) {
            Log::warning('Stolen refresh token reuse detected. Revoking entire token family.', [
                'family_id' => $existingToken->family_id,
                'user_id' => $existingToken->user_id,
                'tenant_id' => $existingToken->tenant_id,
                'ip_address' => $ipAddress,
            ]);

            // Invalidate ALL tokens in this family immediately
            RefreshToken::query()
                ->where('family_id', $existingToken->family_id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => Carbon::now()]);

            throw new RefreshTokenReusedException('Refresh token reuse detected. All sessions in this family revoked.', 401);
        }

        // Expiration check
        if ($existingToken->expires_at->isPast()) {
            $existingToken->update(['revoked_at' => Carbon::now()]);
            throw new RefreshTokenExpiredException('The refresh token has expired.', 401);
        }

        return DB::transaction(function () use ($existingToken, $ipAddress, $userAgent) {
            /** @var RefreshToken $lockedToken */
            $lockedToken = RefreshToken::query()
                ->where('id', $existingToken->id)
                ->lockForUpdate()
                ->firstOrFail();

            /** @var User|null $user */
            $user = User::withoutTenantScope()->find($lockedToken->user_id);
            if ($user === null || ! $user->is_active) {
                $lockedToken->update(['revoked_at' => Carbon::now()]);
                throw new RefreshTokenInvalidException('The user associated with this token is invalid or inactive.', 401);
            }

            // Issue successor token in the same family
            $plainNewToken = 'rt_'.Str::random(40).bin2hex(random_bytes(16));
            $newTokenHash = hash('sha256', $plainNewToken);
            $expiresAt = Carbon::now()->addDays($this->ttlDays);

            /** @var RefreshToken $newToken */
            $newToken = RefreshToken::query()->create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $user->id,
                'tenant_id' => $user->tenant_id,
                'token_hash' => $newTokenHash,
                'family_id' => $lockedToken->family_id,
                'replaced_by_id' => null,
                'ip' => $ipAddress,
                'user_agent' => $userAgent ? Str::limit($userAgent, 255, '') : null,
                'expires_at' => $expiresAt,
                'revoked_at' => null,
            ]);

            // Revoke current token and link successor
            $lockedToken->update([
                'revoked_at' => Carbon::now(),
                'replaced_by_id' => $newToken->id,
            ]);

            return [
                'token' => $plainNewToken,
                'model' => $newToken,
                'user' => $user,
            ];
        });
    }

    /**
     * Revoke an entire refresh token family.
     */
    public function revokeFamily(string $familyId): int
    {
        return RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => Carbon::now()]);
    }

    /**
     * Revoke all refresh tokens for a user.
     */
    public function revokeAllForUser(int $userId): int
    {
        return RefreshToken::query()
            ->where('user_id', $userId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => Carbon::now()]);
    }

    /**
     * Build the httpOnly, Secure, SameSite=Strict cookie for the client.
     */
    public function createCookie(string $plainToken): Cookie
    {
        $minutes = $this->ttlDays * 24 * 60;
        $expire = time() + ($minutes * 60);

        return Cookie::create(
            name: $this->cookieName,
            value: $plainToken,
            expire: $expire,
            path: $this->cookiePath,
            domain: $this->cookieDomain,
            secure: $this->cookieSecure,
            httpOnly: true,
            raw: false,
            sameSite: $this->cookieSameSite
        );
    }

    /**
     * Build a cookie clearing instruction for the client.
     */
    public function forgetCookie(): Cookie
    {
        return Cookie::create(
            name: $this->cookieName,
            value: '',
            expire: time() - 3600,
            path: $this->cookiePath,
            domain: $this->cookieDomain,
            secure: $this->cookieSecure,
            httpOnly: true,
            raw: false,
            sameSite: $this->cookieSameSite
        );
    }

    /**
     * Get cookie name.
     */
    public function getCookieName(): string
    {
        return $this->cookieName;
    }
}
