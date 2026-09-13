<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PlatformRole;
use App\Modules\Platform\Services\PlatformRbacService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlatformRoleController extends Controller
{
    /**
     * List all platform roles.
     */
    public function index(Request $request): JsonResponse
    {
        // Auto-seed if empty
        if (PlatformRole::count() === 0) {
            PlatformRbacService::seedDefaultRoles();
        }

        $roles = PlatformRole::withCount('users')->get()->map(fn (PlatformRole $r) => [
            'id' => $r->id,
            'uuid' => $r->uuid,
            'name' => $r->name,
            'slug' => $r->slug,
            'description' => $r->description,
            'permissions' => $r->permissions,
            'is_system' => $r->is_system,
            'users_count' => $r->users_count,
            'created_at' => $r->created_at?->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $roles,
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get authoritative permission catalogue for role configuration.
     */
    public function catalogue(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => PlatformRbacService::getCatalogue(),
        ]);
    }

    /**
     * Create a custom platform role.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:128',
            'slug' => 'required|string|max:64|unique:platform_roles,slug',
            'description' => 'nullable|string',
            'permissions' => 'required|array',
            'permissions.*' => 'string',
        ]);

        $role = PlatformRole::create([
            'uuid' => (string) Str::uuid(),
            'name' => $validated['name'],
            'slug' => strtolower($validated['slug']),
            'description' => $validated['description'] ?? null,
            'permissions' => $validated['permissions'],
            'is_system' => false,
            'created_by' => $request->user()?->id,
        ]);

        AuditLog::withoutTenantScope()->create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $request->user()?->id,
            'action' => \App\Core\Audit\AuditAction::Created,
            'auditable_type' => 'PlatformRole',
            'auditable_id' => $role->id,
            'ip' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Master SaaS Admin',
            'created_at' => Carbon::now(),
            'after' => ['role_name' => $role->name, 'slug' => $role->slug],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Platform role '{$role->name}' created.",
            'data' => $role,
        ], 201);
    }

    /**
     * Update an existing platform role.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $role = PlatformRole::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:128',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        $role->update(array_filter($validated, fn ($v) => $v !== null));

        AuditLog::withoutTenantScope()->create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $request->user()?->id,
            'action' => \App\Core\Audit\AuditAction::Updated,
            'auditable_type' => 'PlatformRole',
            'auditable_id' => $role->id,
            'ip' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Master SaaS Admin',
            'created_at' => Carbon::now(),
            'after' => ['role_name' => $role->name, 'permissions' => $role->permissions],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Platform role '{$role->name}' updated.",
            'data' => $role->fresh(),
        ]);
    }

    /**
     * Delete a custom platform role.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $role = PlatformRole::withCount('users')->findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'System platform roles cannot be deleted.',
            ], 422);
        }

        if ($role->users_count > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete role assigned to {$role->users_count} administrator(s).",
            ], 422);
        }

        $name = $role->name;
        $role->delete();

        return response()->json([
            'success' => true,
            'message' => "Platform role '{$name}' deleted.",
        ]);
    }
}
