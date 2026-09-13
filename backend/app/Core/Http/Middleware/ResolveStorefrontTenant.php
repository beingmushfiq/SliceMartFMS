<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\Tenancy\TenantContext;
use App\Core\Tenancy\TenantResolver;
use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveStorefrontTenant
{
    /**
     * Handle an incoming request and bind tenant context for public storefront.
     * Uses hardened TenantResolver with master domain guard and DNS label validation.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $storefront = TenantResolver::resolveStorefrontFromRequest($request);

        if (! $storefront) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'STOREFRONT_NOT_FOUND',
                    'message' => 'The requested storefront does not exist or has been disabled.',
                ],
            ], 404);
        }

        // Verify associated tenant exists and is not suspended
        $tenant = Tenant::find($storefront->tenant_id);
        if (! $tenant || $tenant->status === 'suspended') {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'TENANT_SUSPENDED',
                    'message' => 'This storefront is currently unavailable.',
                ],
            ], 403);
        }

        // Bind tenant context
        TenantContext::bind($tenant->toArray());
        $request->attributes->set('storefront', $storefront);
        $request->attributes->set('tenant_id', $storefront->tenant_id);

        return $next($request);
    }
}
