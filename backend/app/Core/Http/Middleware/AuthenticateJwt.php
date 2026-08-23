<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\Auth\JwtExpiredException;
use App\Core\Auth\JwtInvalidException;
use App\Core\Auth\JwtService;
use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Models\Tenant;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticate incoming requests using JWT Access Tokens (ADR-007).
 */
class AuthenticateJwt
{
    public function __construct(
        private readonly JwtService $jwtService
    ) {
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if ($token === null || trim($token) === '') {
            return ErrorResponse::make(
                request: $request,
                code: 'UNAUTHENTICATED',
                message: 'No authorization bearer token provided.',
                httpStatus: 401
            );
        }

        try {
            $claims = $this->jwtService->decode($token);
        } catch (JwtExpiredException $e) {
            return ErrorResponse::make(
                request: $request,
                code: 'TOKEN_EXPIRED',
                message: $e->getMessage(),
                httpStatus: 401
            );
        } catch (JwtInvalidException $e) {
            return ErrorResponse::make(
                request: $request,
                code: 'TOKEN_INVALID',
                message: $e->getMessage(),
                httpStatus: 401
            );
        }

        $userId = (int) ($claims['sub'] ?? 0);
        /** @var User|null $user */
        $user = User::withoutTenantScope()->find($userId);

        if ($user === null || ! $user->is_active) {
            return ErrorResponse::make(
                request: $request,
                code: 'USER_INACTIVE',
                message: 'The user account is inactive or no longer exists.',
                httpStatus: 401
            );
        }

        // Token version revocation check (ADR-007):
        // If token_version in the token is older than the user's current token_version,
        // it means the session or all sessions were revoked.
        $tokenVersion = (int) ($claims['token_version'] ?? 0);
        if ($tokenVersion !== $user->token_version) {
            return ErrorResponse::make(
                request: $request,
                code: 'TOKEN_REVOKED',
                message: 'This session has been revoked. Please log in again.',
                httpStatus: 401
            );
        }

        // Bind user to Laravel auth
        Auth::setUser($user);
        $request->setUserResolver(fn () => $user);

        // Bind TenantContext if tenant_id is present and not already bound
        $tenantId = isset($claims['tenant_id']) && $claims['tenant_id'] !== null ? (int) $claims['tenant_id'] : null;
        if ($tenantId !== null && ! TenantContext::isBound()) {
            /** @var Tenant|null $tenant */
            $tenant = Tenant::query()->find($tenantId);
            if ($tenant !== null) {
                TenantContext::bind($tenant->toArray());
            }
        }

        return $next($request);
    }
}
