<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Core\Auth\JwtService;
use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class PlatformImpersonationController extends Controller
{
    public function __construct(
        private readonly JwtService $jwtService,
    ) {}

    /**
     * Generate a secure, short-lived impersonation token to access a tenant workspace.
     */
    public function impersonate(Request $request, int|string $id): JsonResponse
    {
        $superAdmin = $request->user();

        $tenant = Tenant::find($id);
        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => "Tenant with identifier {$id} not found.",
            ], Response::HTTP_NOT_FOUND);
        }

        if ($tenant->status === 'suspended' || $tenant->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => "Cannot impersonate a {$tenant->status} tenant.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Find primary tenant admin or active user
        $tenantUser = User::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->where(function ($q) {
                $q->where('status', 'active')
                  ->orWhere('is_active', true);
            })
            ->first();

        if (! $tenantUser) {
            return response()->json([
                'success' => false,
                'message' => 'No active user found for this tenant.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Short-lived impersonation token (15 mins)
        $ttl = 900;
        $token = $this->jwtService->issueToken(
            userId: $tenantUser->id,
            tenantId: $tenant->id,
            tokenVersion: $tenantUser->token_version ?? 1,
            permVersion: '',
            scopes: [],
            customClaims: [
                'is_impersonation' => true,
                'impersonated_by_id' => $superAdmin->id,
                'impersonated_by_name' => $superAdmin->name,
                'impersonated_by_email' => $superAdmin->email,
            ],
            ttl: $ttl
        );

        // Audit log entry
        $auditLog = new \App\Models\AuditLog();
        $auditLog->tenant_id = $tenant->id;
        $auditLog->uuid = (string) \Illuminate\Support\Str::uuid();
        $auditLog->user_id = $tenantUser->id;
        $auditLog->action = \App\Core\Audit\AuditAction::Impersonated;
        $auditLog->auditable_type = 'App\Models\Tenant';
        $auditLog->auditable_id = $tenant->id;
        $auditLog->context = [
            'impersonator_platform_user_id' => $superAdmin->id,
            'impersonator_email' => $superAdmin->email,
        ];
        $auditLog->after = [
            'super_admin_email' => $superAdmin->email,
            'target_tenant_slug' => $tenant->slug,
            'target_user_id' => $tenantUser->id,
            'target_user_email' => $tenantUser->email,
        ];
        $auditLog->ip = $request->ip();
        $auditLog->user_agent = $request->userAgent();
        $auditLog->created_at = now();
        $auditLog->save();

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => $ttl,
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                ],
                'user' => [
                    'id' => $tenantUser->id,
                    'name' => $tenantUser->name,
                    'email' => $tenantUser->email,
                ],
                'impersonator' => [
                    'id' => $superAdmin->id,
                    'name' => $superAdmin->name,
                    'email' => $superAdmin->email,
                ],
            ],
        ]);
    }
}
