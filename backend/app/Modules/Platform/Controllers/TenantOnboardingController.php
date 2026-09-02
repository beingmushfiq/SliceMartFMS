<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Core\Capabilities\TenantCapabilityManifest;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\CustomFieldDefinition;
use App\Models\IndustryProfile;
use App\Models\Tenant;
use App\Models\TenantModule;
use App\Models\TenantProductionStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TenantOnboardingController extends Controller
{
    /**
     * Get current onboarding progress, draft data, and tenant config.
     */
    public function state(): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $tenant = Tenant::findOrFail($tenantId);

        return response()->json([
            'success' => true,
            'data' => [
                'tenant_id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'currency_code' => $tenant->currency_code,
                'timezone' => $tenant->timezone,
                'business_type_keys' => $tenant->business_type_keys ?? ['manufacturing'],
                'industry_profile_key' => $tenant->industry_profile_key ?? 'general_manufacturing',
                'manufacturing_type' => $tenant->manufacturing_type ?? 'discrete',
                'onboarding_step' => $tenant->onboarding_step ?? 1,
                'onboarding_completed' => (bool) $tenant->onboarding_completed_at,
                'onboarding_draft' => $tenant->onboarding_draft ?? [],
            ],
        ]);
    }

    /**
     * Save progress on an onboarding step.
     */
    public function saveStep(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'step' => 'required|integer|min:1|max:10',
            'data' => 'required|array',
        ]);

        $tenantId = TenantContext::current()->tenantId();
        $tenant = Tenant::findOrFail($tenantId);

        $draft = $tenant->onboarding_draft ?? [];
        $draft["step_{$validated['step']}"] = $validated['data'];

        $tenant->onboarding_step = max($tenant->onboarding_step ?? 1, $validated['step']);
        $tenant->onboarding_draft = $draft;

        // Apply immediate tenant configuration if present
        if (!empty($validated['data']['business_type_keys'])) {
            $tenant->business_type_keys = $validated['data']['business_type_keys'];
        }
        if (!empty($validated['data']['industry_profile_key'])) {
            $tenant->industry_profile_key = $validated['data']['industry_profile_key'];
        }
        if (!empty($validated['data']['manufacturing_type'])) {
            $tenant->manufacturing_type = $validated['data']['manufacturing_type'];
        }
        if (!empty($validated['data']['currency_code'])) {
            $tenant->currency_code = $validated['data']['currency_code'];
        }
        if (!empty($validated['data']['timezone'])) {
            $tenant->timezone = $validated['data']['timezone'];
        }

        $tenant->save();
        TenantCapabilityManifest::invalidate($tenantId);

        return response()->json([
            'success' => true,
            'message' => "Onboarding step {$validated['step']} saved.",
            'data' => [
                'onboarding_step' => $tenant->onboarding_step,
                'onboarding_draft' => $tenant->onboarding_draft,
            ],
        ]);
    }

    /**
     * Complete the 10-step onboarding and provision all configured modules, stages, units, fields.
     */
    public function complete(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $tenant = Tenant::findOrFail($tenantId);

        $payload = $request->all();
        $draft = array_merge($tenant->onboarding_draft ?? [], $payload);

        // 1. Process Industry Profile defaults
        $industryKey = $draft['industry_profile_key'] ?? $tenant->industry_profile_key ?? 'general_manufacturing';
        $profile = IndustryProfile::where('key', $industryKey)->first();

        $tenant->industry_profile_key = $industryKey;
        $tenant->business_type_keys = $draft['business_type_keys'] ?? $profile?->business_type_keys ?? ['manufacturing'];
        $tenant->manufacturing_type = $draft['manufacturing_type'] ?? 'discrete';

        if (!empty($draft['currency_code'])) {
            $tenant->currency_code = $draft['currency_code'];
        }
        if (!empty($draft['timezone'])) {
            $tenant->timezone = $draft['timezone'];
        }
        if (!empty($draft['terminology'])) {
            $tenant->terminology = $draft['terminology'];
        } elseif ($profile && !empty($profile->default_terminology)) {
            $tenant->terminology = $profile->default_terminology;
        }

        $tenant->onboarding_completed_at = now();
        $tenant->onboarding_step = 10;
        $tenant->save();

        // 2. Configure Modules
        $enabledModules = $draft['enabled_modules'] ?? $profile?->recommended_modules ?? array_keys(TenantCapabilityManifest::ALL_MODULE_KEYS);
        foreach (TenantCapabilityManifest::ALL_MODULE_KEYS as $key => $meta) {
            $isEnabled = in_array($key, $enabledModules, true);
            TenantModule::updateOrCreate(
                ['tenant_id' => $tenantId, 'module_key' => $key],
                ['enabled' => $isEnabled]
            );
        }

        // 3. Configure Production Stages
        $stages = $draft['production_stages'] ?? $profile?->default_production_stages ?? [];
        if (!empty($stages)) {
            TenantProductionStage::where('tenant_id', $tenantId)->delete();
            foreach ($stages as $index => $stage) {
                TenantProductionStage::create([
                    'tenant_id' => $tenantId,
                    'key' => $stage['key'] ?? 'stage_' . ($index + 1),
                    'label' => $stage['label'] ?? 'Stage ' . ($index + 1),
                    'sort_order' => $stage['sort_order'] ?? ($index + 1),
                    'is_qc_stage' => $stage['is_qc_stage'] ?? false,
                    'requires_worker_tracking' => true,
                    'requires_machine_tracking' => false,
                    'is_active' => true,
                ]);
            }
        }

        // 4. Default Custom Fields
        $customFields = $draft['custom_fields'] ?? $profile?->default_custom_fields ?? [];
        if (!empty($customFields)) {
            foreach ($customFields as $cf) {
                CustomFieldDefinition::firstOrCreate(
                    [
                        'tenant_id' => $tenantId,
                        'module' => $cf['module'],
                        'entity' => $cf['entity'],
                        'internal_key' => $cf['internal_key'],
                    ],
                    [
                        'label' => $cf['label'],
                        'field_type' => $cf['field_type'],
                        'is_active' => true,
                    ]
                );
            }
        }

        TenantCapabilityManifest::invalidate($tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Onboarding finalized successfully. Platform initialized.',
            'data' => TenantCapabilityManifest::forTenant($tenantId, true),
        ]);
    }
}
