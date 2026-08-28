<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\TenantUsageCounter;
use App\Models\User;
use App\Modules\Platform\Actions\ManageSubscriptionAction;
use App\Modules\Platform\Actions\RegisterTenantAction;
use App\Modules\Platform\Actions\UpdateTenantStatusAction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller for Master SaaS Admin Tenant Lifecycle & Management.
 */
class PlatformTenantController extends Controller
{
    /**
     * List all tenants with filtering, search, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::with(['users' => fn ($q) => $q->where('is_platform_user', false)]);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', (int) $request->input('plan_id'));
        }

        if ($request->filled('q')) {
            $search = (string) $request->input('q');
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%"));
        }

        $sort = (string) $request->input('sort', '-created_at');
        $desc = str_starts_with($sort, '-');
        $field = $desc ? substr($sort, 1) : $sort;
        if (in_array($field, ['id', 'name', 'slug', 'status', 'created_at'], true)) {
            $query->orderBy($field, $desc ? 'desc' : 'asc');
        } else {
            $query->latest('id');
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $paginator = $query->paginate($perPage);

        $data = $paginator->getCollection()->map(function (Tenant $tenant) {
            $sub = TenantSubscription::where('tenant_id', $tenant->id)->latest('id')->first();

            return [
                'id' => $tenant->id,
                'uuid' => $tenant->uuid,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status,
                'plan_id' => $tenant->plan_id,
                'currency_code' => $tenant->currency_code,
                'timezone' => $tenant->timezone,
                'users_count' => $tenant->users->count(),
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                'activated_at' => $tenant->activated_at?->toIso8601String(),
                'suspended_at' => $tenant->suspended_at?->toIso8601String(),
                'created_at' => $tenant->created_at?->toIso8601String(),
                'subscription' => $sub !== null ? [
                    'status' => $sub->status,
                    'amount' => (float) $sub->amount,
                    'starts_at' => $sub->starts_at?->toIso8601String(),
                    'ends_at' => $sub->ends_at?->toIso8601String(),
                ] : null,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'pagination' => [
                    'total' => $paginator->total(),
                    'page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total_pages' => $paginator->lastPage(),
                ],
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Provision a new tenant.
     */
    public function store(Request $request, RegisterTenantAction $action): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'slug' => 'required|string|max:64',
            'plan_id' => 'required|integer|exists:plans,id',
            'owner_name' => 'required|string|max:191',
            'owner_email' => 'required|email|max:191',
            'password' => 'required|string|min:8',
            'currency_code' => 'nullable|string|size:3',
            'timezone' => 'nullable|string|max:64',
            'locale' => 'nullable|string|max:10',
            'is_trial' => 'nullable|boolean',
            'trial_days' => 'nullable|integer|min:1|max:90',
            'settings' => 'nullable|array',
            'branding' => 'nullable|array',
        ]);

        $result = $action->execute($validated);

        return response()->json([
            'success' => true,
            'data' => $result,
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Show full tenant profile and subscription history.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $tenant = Tenant::with(['users' => fn ($q) => $q->where('is_platform_user', false)])->findOrFail($id);

        $subscriptions = TenantSubscription::where('tenant_id', $tenant->id)->latest('id')->get();
        $usageCounters = TenantUsageCounter::where('tenant_id', $tenant->id)->get();
        $recentAudit = AuditLog::with('actor:id,name,email')
            ->where('tenant_id', $tenant->id)
            ->latest('id')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'tenant' => [
                    'id' => $tenant->id,
                    'uuid' => $tenant->uuid,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'status' => $tenant->status,
                    'plan_id' => $tenant->plan_id,
                    'currency_code' => $tenant->currency_code,
                    'timezone' => $tenant->timezone,
                    'locale' => $tenant->locale,
                    'settings' => $tenant->settings,
                    'branding' => $tenant->branding,
                    'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                    'activated_at' => $tenant->activated_at?->toIso8601String(),
                    'suspended_at' => $tenant->suspended_at?->toIso8601String(),
                    'created_at' => $tenant->created_at?->toIso8601String(),
                ],
                'users' => $tenant->users->map(fn (User $u) => [
                    'id' => $u->id,
                    'uuid' => $u->uuid,
                    'name' => $u->name,
                    'email' => $u->email,
                    'status' => $u->status,
                    'last_login_at' => $u->last_login_at?->toIso8601String(),
                ]),
                'subscriptions' => $subscriptions->map(fn (TenantSubscription $s) => [
                    'id' => $s->id,
                    'uuid' => $s->uuid,
                    'plan_id' => $s->plan_id,
                    'status' => $s->status,
                    'amount' => (float) $s->amount,
                    'starts_at' => $s->starts_at?->toIso8601String(),
                    'ends_at' => $s->ends_at?->toIso8601String(),
                ]),
                'usage_counters' => $usageCounters->map(fn (TenantUsageCounter $u) => [
                    'metric' => $u->metric,
                    'period' => $u->period,
                    'value' => $u->value,
                ]),
                'recent_audit' => $recentAudit->map(fn (AuditLog $a) => [
                    'id' => $a->id,
                    'action' => $a->action,
                    'actor_name' => $a->actor?->name ?? 'System',
                    'created_at' => $a->created_at?->toIso8601String(),
                    'details' => $a->after,
                ]),
            ],
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update tenant metadata, settings, or branding.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:191',
            'timezone' => 'nullable|string|max:64',
            'locale' => 'nullable|string|max:10',
            'currency_code' => 'nullable|string|size:3',
            'settings' => 'nullable|array',
            'branding' => 'nullable|array',
        ]);

        $tenant->update(array_filter($validated, fn ($val) => $val !== null));

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $tenant->id,
                'uuid' => $tenant->uuid,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status,
                'timezone' => $tenant->timezone,
                'currency_code' => $tenant->currency_code,
                'settings' => $tenant->settings,
                'branding' => $tenant->branding,
            ],
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update tenant status (active, suspended, past_due, etc.).
     */
    public function updateStatus(int $id, Request $request, UpdateTenantStatusAction $action): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,trial,past_due,suspended,cancelled',
            'reason' => 'nullable|string|max:500',
        ]);

        $result = $action->execute([
            'tenant_id' => $id,
            'status' => $validated['status'],
            'reason' => $validated['reason'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $result,
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Extend subscription validity or switch plan.
     */
    public function manageSubscription(int $id, Request $request, ManageSubscriptionAction $action): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|in:extend,change_plan,renew',
            'days' => 'nullable|integer|min:1|max:365',
            'plan_id' => 'nullable|integer|exists:plans,id',
        ]);

        $result = $action->execute(array_merge($validated, ['tenant_id' => $id]));

        return response()->json([
            'success' => true,
            'data' => $result,
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }
}
