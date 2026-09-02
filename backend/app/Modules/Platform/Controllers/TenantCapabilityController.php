<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Core\Capabilities\TenantCapabilityManifest;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TenantCapabilityController extends Controller
{
    /**
     * Get the complete capability manifest for the current tenant.
     */
    public function manifest(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $bustCache = $request->boolean('refresh');

        $manifest = TenantCapabilityManifest::forTenant($tenantId, $bustCache);

        return response()->json([
            'success' => true,
            'data' => $manifest,
        ]);
    }
}
