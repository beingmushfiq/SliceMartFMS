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
        $host = strtolower($request->header('X-Storefront-Domain') ?: $request->getHost());

        // 1. Check verified custom domain in tenant_domains table
        $tenantDomain = \App\Models\TenantDomain::withoutTenantScope()
            ->where('domain', $host)
            ->where('verification_status', 'verified')
            ->first();

        if ($tenantDomain) {
            $storefront = Storefront::withoutTenantScope()
                ->where('tenant_id', $tenantDomain->tenant_id)
                ->where('status', '!=', 'suspended')
                ->first();
        } else {
            $subdomain = $request->header('X-Storefront-Subdomain')
                ?: $request->header('X-Tenant-Subdomain')
                ?: $request->query('subdomain')
                ?: $this->extractSubdomainFromHost($host);

            if (empty($subdomain)) {
                // Default to first active storefront if running in local test environment
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

                if (! $storefront) {
                    $tenantBySlug = Tenant::query()
                        ->where('slug', $subdomain)
                        ->where('status', '!=', 'suspended')
                        ->first();

                    if ($tenantBySlug) {
                        $storefront = Storefront::withoutTenantScope()
                            ->where('tenant_id', $tenantBySlug->id)
                            ->where('status', '!=', 'suspended')
                            ->first();

                        if (! $storefront) {
                            $storefront = Storefront::create([
                                'tenant_id' => $tenantBySlug->id,
                                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                                'name' => $tenantBySlug->name,
                                'code' => 'STORE-' . strtoupper(\Illuminate\Support\Str::random(4)),
                                'subdomain' => $tenantBySlug->slug,
                                'currency' => $tenantBySlug->currency_code ?? 'BDT',
                                'locale' => $tenantBySlug->locale ?? 'en',
                                'theme' => [
                                    'primary_color' => '#10b981',
                                    'accent_color' => '#065f46',
                                    'hero_title' => 'Direct from the Factory',
                                    'hero_subtitle' => 'Premium products manufactured to perfection',
                                ],
                                'meta_title' => $tenantBySlug->name . ' - Official Store',
                                'guest_checkout_enabled' => true,
                                'cod_enabled' => true,
                                'online_payment_enabled' => true,
                                'status' => 'live',
                            ]);
                        }
                    }
                }
            }
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
