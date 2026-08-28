<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\Tenancy\TenantContext;
use App\Models\Storefront;
use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveStorefrontTenant
{
    /**
     * Handle an incoming request and bind tenant context for public storefront.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $subdomain = $request->header('X-Storefront-Subdomain')
            ?: $request->header('X-Tenant-Subdomain')
            ?: $request->query('subdomain')
            ?: $this->extractSubdomainFromHost($request->getHost());

        if (empty($subdomain)) {
            // Default to first active storefront if running locally
            $storefront = Storefront::withoutTenantScope()
                ->where('status', '!=', 'suspended')
                ->first();
        } else {
            $storefront = Storefront::withoutTenantScope()
                ->where(function ($query) use ($subdomain): void {
                    $query->where('subdomain', $subdomain)
                        ->orWhere('domain', $subdomain);
                })
                ->first();
        }

        if (! $storefront) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'STOREFRONT_NOT_FOUND',
                    'message' => 'The requested storefront does not exist or has been disabled.',
                ],
            ], 404);
        }

        // Verify tenant is active
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

    private function extractSubdomainFromHost(string $host): ?string
    {
        $parts = explode('.', $host);
        if (count($parts) >= 3) {
            return $parts[0];
        }
        return null;
    }
}
