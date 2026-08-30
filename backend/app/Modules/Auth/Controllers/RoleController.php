<?php

declare(strict_types=1);

namespace App\Modules\Auth\Controllers;

use App\Core\Audit\AuditLogger;
use App\Core\Auth\PermissionCatalogue;
use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = (int) $request->attributes->get('tenant_id');

        $roles = Role::query()
            ->where(function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId)
                      ->orWhereNull('tenant_id');
            })
            ->withCount(['users', 'permissions'])
            ->with(['permissions:id,name,module,resource,action,description'])
            ->orderBy('is_system', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'data' => $roles,
        ]);
    }

    public function permissions(): JsonResponse
    {
        $permissions = Permission::query()
            ->orderBy('module')
            ->orderBy('resource')
            ->orderBy('action')
            ->get();

        // Group permissions by module and resource for frontend matrix rendering
        $grouped = [];
        foreach ($permissions as $perm) {
            $mod = $perm->module ?: 'General';
            $res = $perm->resource ?: 'Global';

            if (!isset($grouped[$mod])) {
                $grouped[$mod] = [
                    'module' => $mod,
                    'resources' => [],
                ];
            }

            if (!isset($grouped[$mod]['resources'][$res])) {
                $grouped[$mod]['resources'][$res] = [
                    'resource' => $res,
                    'permissions' => [],
                ];
            }

            $grouped[$mod]['resources'][$res]['permissions'][] = [
                'id' => $perm->id,
                'name' => $perm->name,
                'module' => $perm->module,
                'resource' => $perm->resource,
                'action' => $perm->action,
                'description' => $perm->description,
            ];
        }

        // Convert associative arrays to lists
        $groupedList = array_values(array_map(function ($modData) {
            $modData['resources'] = array_values($modData['resources']);
            return $modData;
        }, $grouped));

        return response()->json([
            'data' => [
                'raw' => $permissions,
                'grouped' => $groupedList,
            ],
        ]);
    }

    public function show(int $id, Request $request): JsonResponse
    {
        $tenantId = (int) $request->attributes->get('tenant_id');

        $role = Role::query()
            ->where(function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId)
                      ->orWhereNull('tenant_id');
            })
            ->with(['permissions:id,name,module,resource,action,description'])
            ->withCount('users')
            ->findOrFail($id);

        return response()->json([
            'data' => $role,
        ]);
    }

    public function store(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $tenantId = (int) $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $slug = !empty($validated['slug'])
            ? Str::slug($validated['slug'], '_')
            : Str::slug($validated['name'], '_');

        // Ensure unique slug for this tenant
        $existing = Role::query()
            ->where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->first();

        if ($existing) {
            $slug .= '_' . Str::lower(Str::random(4));
        }

        $role = DB::transaction(function () use ($tenantId, $validated, $slug, $auditLogger, $request) {
            $role = Role::create([
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'is_system' => false,
            ]);

            if (!empty($validated['permission_ids'])) {
                $role->permissions()->sync($validated['permission_ids']);
            }

            $auditLogger->record(
                action: \App\Core\Audit\AuditAction::Created,
                auditable: $role,
                before: null,
                after: [
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'permission_ids' => $validated['permission_ids'] ?? [],
                ],
                actor: $request->user(),
                context: ['tenant_id' => $tenantId],
                ip: $request->ip(),
                userAgent: $request->userAgent()
            );

            return $role;
        });

        $role->load(['permissions:id,name,module,resource,action,description']);

        return response()->json([
            'message' => 'Custom role created successfully.',
            'data' => $role,
        ], Response::HTTP_CREATED);
    }

    public function update(int $id, Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $tenantId = (int) $request->attributes->get('tenant_id');

        $role = Role::query()
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'message' => 'System standard roles cannot be modified.',
            ], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'slug' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'permission_ids' => 'nullable|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $beforeState = [
            'name' => $role->name,
            'description' => $role->description,
            'permission_ids' => $role->permissions()->pluck('permissions.id')->toArray(),
        ];

        DB::transaction(function () use ($role, $validated, $beforeState, $auditLogger, $tenantId, $request) {
            $role->fill(array_filter([
                'name' => $validated['name'] ?? null,
                'slug' => !empty($validated['slug']) ? Str::slug($validated['slug'], '_') : null,
                'description' => $validated['description'] ?? null,
            ]));
            $role->save();

            if (isset($validated['permission_ids'])) {
                $role->permissions()->sync($validated['permission_ids']);
            }

            $afterState = [
                'name' => $role->name,
                'description' => $role->description,
                'permission_ids' => $validated['permission_ids'] ?? $beforeState['permission_ids'],
            ];

            $auditLogger->record(
                action: \App\Core\Audit\AuditAction::Updated,
                auditable: $role,
                before: $beforeState,
                after: $afterState,
                actor: $request->user(),
                context: ['tenant_id' => $tenantId],
                ip: $request->ip(),
                userAgent: $request->userAgent()
            );
        });

        $role->load(['permissions:id,name,module,resource,action,description']);

        return response()->json([
            'message' => 'Role updated successfully.',
            'data' => $role,
        ]);
    }

    public function destroy(int $id, Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $tenantId = (int) $request->attributes->get('tenant_id');

        $role = Role::query()
            ->where('tenant_id', $tenantId)
            ->withCount('users')
            ->findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'message' => 'System roles cannot be deleted.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($role->users_count > 0) {
            return response()->json([
                'message' => "Cannot delete role while {$role->users_count} user(s) are assigned to it.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(function () use ($role, $auditLogger, $tenantId, $request) {
            $before = [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ];

            $role->permissions()->detach();
            $role->delete();

            $auditLogger->record(
                action: \App\Core\Audit\AuditAction::Deleted,
                auditable: $role,
                before: $before,
                after: null,
                actor: $request->user(),
                context: ['tenant_id' => $tenantId],
                ip: $request->ip(),
                userAgent: $request->userAgent()
            );
        });

        return response()->json([
            'message' => "Role '{$role->name}' deleted successfully.",
        ]);
    }
}
