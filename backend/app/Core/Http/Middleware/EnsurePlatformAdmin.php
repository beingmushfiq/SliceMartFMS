<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\Http\Responses\ErrorResponse;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures that the authenticated user is a platform-level super administrator
 * (i.e. is_platform_user === true and tenant_id === null).
 *
 * Tenant users attempting to access platform routes receive a 403 PLATFORM_ONLY error.
 */
class EnsurePlatformAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user === null) {
            return ErrorResponse::make(
                request: $request,
                code: 'UNAUTHENTICATED',
                message: 'Authentication required for platform administration.',
                httpStatus: 401
            );
        }

        // Must be a platform user with no tenant assignment
        if ($user->tenant_id !== null) {
            return ErrorResponse::make(
                request: $request,
                code: 'PLATFORM_ONLY',
                message: 'This endpoint is restricted to DevCenterPoint platform administrators.',
                httpStatus: 403
            );
        }

        return $next($request);
    }
}
