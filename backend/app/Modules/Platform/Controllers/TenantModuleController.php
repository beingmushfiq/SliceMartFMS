<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Core\Capabilities\TenantCapabilityManifest;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\TenantModule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TenantModuleController extends Controller
{
    /**
     * List all modules with their enabled status for the current tenant.
     */
    public function index(): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $storedModules = TenantModule::where('tenant_id', $tenantId)->get()->keyBy('module_key');

        $result = [];
        foreach (TenantCapabilityManifest::ALL_MODULE_KEYS as $key => $meta) {
            $stored = $storedModules->get($key);
            $result[] = [
                'module_key' => $key,
                'label' => $meta['label'],
                'enabled' => $stored ? (bool) ($stored->enabled && $stored->plan_allowed) : true,
                'plan_allowed' => $stored ? (bool) $stored->plan_allowed : true,
                'config' => $stored->config ?? [],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Toggle or update a module's enabled status/configuration.
     */
    public function update(Request $request, string $moduleKey): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
            'config' => 'nullable|array',
        ]);

        $tenantId = TenantContext::current()->tenantId();

        if (!array_key_exists($moduleKey, TenantCapabilityManifest::ALL_MODULE_KEYS)) {
            return response()->json([
                'success' => false,
                'message' => "Invalid module key '{$moduleKey}'.",
            ], 422);
        }

        $module = TenantModule::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'module_key' => $moduleKey,
            ],
            [
                'enabled' => $validated['enabled'],
                'config' => $validated['config'] ?? [],
            ]
        );

        TenantCapabilityManifest::invalidate($tenantId);

        return response()->json([
            'success' => true,
            'message' => "Module '{$moduleKey}' settings updated successfully.",
            'data' => [
                'module_key' => $moduleKey,
                'enabled' => $module->enabled,
                'config' => $module->config,
            ],
        ]);
    }

    /**
     * Batch update multiple modules at once.
     */
    public function batchUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modules' => 'required|array',
            'modules.*.module_key' => 'required|string',
            'modules.*.enabled' => 'required|boolean',
            'modules.*.config' => 'nullable|array',
        ]);

        $tenantId = TenantContext::current()->tenantId();

        foreach ($validated['modules'] as $mod) {
            $key = $mod['module_key'];
            if (!array_key_exists($key, TenantCapabilityManifest::ALL_MODULE_KEYS)) {
                continue;
            }

            TenantModule::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'module_key' => $key,
                ],
                [
                    'enabled' => $mod['enabled'],
                    'config' => $mod['config'] ?? [],
                ]
            );
        }

        TenantCapabilityManifest::invalidate($tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Modules updated successfully.',
        ]);
    }
}
