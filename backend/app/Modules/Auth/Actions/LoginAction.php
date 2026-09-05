<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Core\Auth\JwtService;
use App\Core\Auth\PermissionCatalogue;
use App\Core\Auth\RefreshTokenService;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Login Action (ADR-007, API_CONTRACT §8.1).
 *
 * Authenticates user credentials with Argon2id, generates access JWT
 * and rotating refresh token cookie. Supports multi-tenant account selection.
 */
class LoginAction extends Action
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly RefreshTokenService $refreshTokenService
    ) {}

    /**
     * Execute login.
     *
     * @param  array<string, mixed>  $input
     * @return array{
     *     requires_tenant_selection?: bool,
     *     tenants?: list<array{id: int, uuid: string, name: string, slug: string}>,
     *     access_token?: string,
     *     token_type?: string,
     *     expires_in?: int,
     *     user?: array<string, mixed>,
     *     tenant?: array<string, mixed>|null,
     *     cookie?: Cookie
     * }
     */
    public function execute(array $input): array
    {
        $rawEmail = $input['email'] ?? '';
        $email = strtolower(trim(is_string($rawEmail) ? $rawEmail : ''));
        $rawPassword = $input['password'] ?? '';
        $password = is_string($rawPassword) ? $rawPassword : '';
        $rawTenantId = $input['tenant_id'] ?? null;
        $requestedTenantId = is_numeric($rawTenantId) ? (int) $rawTenantId : null;
        $rawIp = $input['ip_address'] ?? null;
        $ipAddress = is_string($rawIp) ? $rawIp : null;
        $rawUserAgent = $input['user_agent'] ?? null;
        $userAgent = is_string($rawUserAgent) ? $rawUserAgent : null;

        if ($email === '' || $password === '') {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, User> $matchingUsers */
        $matchingUsers = User::withoutTenantScope()
            ->with(['tenant', 'roles.permissions', 'scopes'])
            ->where('email', $email)
            ->where('status', 'active')
            ->get();

        // Filter by valid password hash
        $validUsers = $matchingUsers->filter(fn (User $u) => Hash::check($password, $u->password))->values();

        if ($validUsers->isEmpty()) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Multi-tenant membership: if user belongs to multiple active tenants and no tenant was requested
        if ($validUsers->count() > 1 && $requestedTenantId === null) {
            $tenants = array_values($validUsers->map(function (User $u) {
                return [
                    'id' => (int) $u->tenant_id,
                    'uuid' => $u->tenant !== null ? $u->tenant->uuid : '',
                    'name' => $u->tenant !== null ? $u->tenant->name : 'Default Organization',
                    'slug' => $u->tenant !== null ? $u->tenant->slug : '',
                ];
            })->all());

            return [
                'requires_tenant_selection' => true,
                'tenants' => $tenants,
            ];
        }

        /** @var User $user */
        $user = $requestedTenantId !== null
            ? $validUsers->firstWhere('tenant_id', $requestedTenantId) ?? $validUsers->first()
            : $validUsers->first();

        // Update last login timestamp
        $user->update([
            'last_login_at' => Carbon::now(),
            'last_login_ip' => $ipAddress,
        ]);

        // Issue refresh token
        $refreshResult = $this->refreshTokenService->createRefreshToken($user, $ipAddress, $userAgent);
        $cookie = $this->refreshTokenService->createCookie($refreshResult['token']);

        // Resolve scopes & permissions
        /** @var list<array<string, mixed>> $scopes */
        $scopes = array_values($user->scopes->map(fn ($s) => [
            'type' => $s->scope_type,
            'id' => $s->scope_id,
        ])->all());

        $effectivePermissions = $user->getEffectivePermissions();
        $permVersion = PermissionCatalogue::computePermVersion($effectivePermissions);

        // Issue access JWT (15 min)
        $rawTtl = config('auth.jwt.ttl');
        $ttl = is_numeric($rawTtl) ? (int) $rawTtl : 900;
        $accessToken = $this->jwtService->issueToken(
            userId: $user->id,
            tenantId: $user->tenant_id,
            tokenVersion: $user->token_version,
            permVersion: $permVersion,
            scopes: $scopes,
            ttl: $ttl
        );

        $tenantData = null;
        if ($user->tenant !== null) {
            $tenantData = [
                'id' => $user->tenant->id,
                'uuid' => $user->tenant->uuid,
                'name' => $user->tenant->name,
                'slug' => $user->tenant->slug,
                'status' => $user->tenant->status,
                'currency' => $user->tenant->currency_code,
                'timezone' => $user->tenant->timezone,
                'locale' => $user->tenant->locale,
                'branding' => $user->tenant->branding,
            ];
        }

        $primaryRole = $user->roles->first()?->name ?? ($user->is_platform_admin ? 'Platform Admin' : 'User');
        $roleNames = $user->roles->pluck('name')->all();

        return [
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'expires_in' => $ttl,
            'user' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_admin' => $user->is_platform_admin,
                'locale' => $user->locale ?? 'en',
                'theme' => 'dark',
                'reduced_motion' => false,
                'density' => 'comfortable',
                'landing_page' => '/dashboard',
                'role' => $primaryRole,
                'roles' => $roleNames,
            ],
            'tenant' => $tenantData,
            'permissions' => $effectivePermissions,
            'cookie' => $cookie,
        ];
    }
}
