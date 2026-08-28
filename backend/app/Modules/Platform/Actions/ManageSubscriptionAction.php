<?php

declare(strict_types=1);

namespace App\Modules\Platform\Actions;

use App\Core\Actions\Action;
use App\Models\AuditLog;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Action to change plan, extend trial, or renew subscription.
 */
class ManageSubscriptionAction extends Action
{
    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function execute(array $input): array
    {
        $tenantId = (int) $input['tenant_id'];
        $tenant = Tenant::findOrFail($tenantId);

        $actionType = (string) ($input['action'] ?? 'extend'); // 'extend' | 'change_plan' | 'renew'

        if ($actionType === 'change_plan') {
            $newPlanId = (int) ($input['plan_id'] ?? 0);
            $newPlan = Plan::findOrFail($newPlanId);

            $oldPlanId = $tenant->plan_id;
            $tenant->update(['plan_id' => $newPlan->id]);

            // Update active subscription
            $subscription = TenantSubscription::where('tenant_id', $tenant->id)
                ->whereIn('status', ['active', 'trial'])
                ->latest('id')
                ->first();

            if ($subscription !== null) {
                $subscription->update([
                    'plan_id' => $newPlan->id,
                    'amount' => $newPlan->price,
                ]);
            }

            AuditLog::withoutTenantScope()->create([
                'uuid' => (string) Str::uuid(),
                'user_id' => Auth::id(),
                'action' => \App\Core\Audit\AuditAction::Updated,
                'auditable_type' => 'Tenant',
                'auditable_id' => $tenant->id,
                'ip' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent() ?? 'Master SaaS Admin',
                'created_at' => Carbon::now(),
                'before' => ['plan_id' => $oldPlanId],
                'after' => ['plan_id' => $newPlan->id, 'plan_code' => $newPlan->code],
            ]);

            return [
                'tenant_id' => $tenant->id,
                'plan_id' => $newPlan->id,
                'plan_name' => $newPlan->name,
                'status' => $tenant->status,
            ];
        }

        if ($actionType === 'extend') {
            $days = (int) ($input['days'] ?? 30);
            $subscription = TenantSubscription::where('tenant_id', $tenant->id)->latest('id')->first();

            $baseDate = $subscription?->ends_at ?? Carbon::now();
            $newEndsAt = Carbon::parse($baseDate)->addDays($days);

            if ($subscription !== null) {
                $subscription->update([
                    'ends_at' => $newEndsAt,
                    'status' => 'active',
                ]);
            }

            $tenant->update(['status' => 'active', 'suspended_at' => null]);

            AuditLog::withoutTenantScope()->create([
                'uuid' => (string) Str::uuid(),
                'user_id' => Auth::id(),
                'action' => \App\Core\Audit\AuditAction::Updated,
                'auditable_type' => 'Tenant',
                'auditable_id' => $tenant->id,
                'ip' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent() ?? 'Master SaaS Admin',
                'created_at' => Carbon::now(),
                'after' => ['extended_days' => $days, 'ends_at' => $newEndsAt->toIso8601String()],
            ]);

            return [
                'tenant_id' => $tenant->id,
                'status' => 'active',
                'ends_at' => $newEndsAt->toIso8601String(),
            ];
        }

        throw ValidationException::withMessages([
            'action' => ["Unsupported subscription action '{$actionType}'."],
        ]);
    }
}
