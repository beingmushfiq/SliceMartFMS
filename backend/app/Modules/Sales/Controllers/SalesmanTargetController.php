<?php

declare(strict_types=1);

namespace App\Modules\Sales\Controllers;

use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Modules\HR\Models\Employee;
use App\Modules\Sales\Models\CrmLead;
use App\Modules\Sales\Models\IncentiveCalculation;
use App\Modules\Sales\Models\IncentivePolicy;
use App\Modules\Sales\Models\Invoice;
use App\Modules\Sales\Models\SalesmanTarget;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Resources\SalesmanTargetResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

final class SalesmanTargetController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenantId = TenantContext::current()->tenantId();

        $query = SalesmanTarget::with(['employee'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', (int) $request->query('employee_id'));
        }

        if ($request->filled('period_month')) {
            $query->where('period_month', (string) $request->query('period_month'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        $targets = $query->orderByDesc('period_month')
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', '25'));

        return SalesmanTargetResource::collection($targets);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $validated = $request->validate([
            'employee_id'   => ['required', 'integer', 'exists:employees,id'],
            'period_month'  => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'target_name'   => ['nullable', 'string', 'max:128'],
            'target_amount' => ['required', 'numeric', 'min:0'],
            'notes'         => ['nullable', 'string'],
        ]);

        $target = SalesmanTarget::firstOrNew([
            'tenant_id'    => $tenantId,
            'employee_id'  => $validated['employee_id'],
            'period_month' => $validated['period_month'],
        ]);

        $target->target_name = $validated['target_name'] ?? "Sales Target {$validated['period_month']}";
        $target->target_amount = (string) $validated['target_amount'];
        $target->notes = $validated['notes'] ?? null;
        $target->created_by = Auth::id() ? (int) Auth::id() : null;
        $target->save();

        // Calculate current metrics based on existing records
        $this->syncTargetMetrics($target);

        return (new SalesmanTargetResource($target->load('employee')))->response()->setStatusCode(201);
    }

    public function show(int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $target = SalesmanTarget::with(['employee', 'incentiveCalculations'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        return (new SalesmanTargetResource($target))->response();
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $target = SalesmanTarget::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'target_name'   => ['nullable', 'string', 'max:128'],
            'target_amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'status'        => ['nullable', 'string', 'in:active,completed,cancelled'],
            'notes'         => ['nullable', 'string'],
        ]);

        $target->fill($validated);
        $target->updated_by = Auth::id() ? (int) Auth::id() : null;
        $target->save();

        $this->syncTargetMetrics($target);

        return (new SalesmanTargetResource($target->load('employee')))->response();
    }

    public function recalculate(int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $target = SalesmanTarget::where('tenant_id', $tenantId)->findOrFail($id);
        $this->syncTargetMetrics($target);

        return (new SalesmanTargetResource($target->load('employee')))->response();
    }

    public function salesmen(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $currentMonth = $request->query('period_month', now()->format('Y-m'));

        $employees = Employee::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->get();

        $salesmenData = $employees->map(function ($emp) use ($tenantId, $currentMonth) {
            $target = SalesmanTarget::where('tenant_id', $tenantId)
                ->where('employee_id', $emp->id)
                ->where('period_month', $currentMonth)
                ->first();

            $targetAmount = $target ? (float) $target->target_amount : 0.0;
            $achievedAmount = $target ? (float) $target->achieved_amount : 0.0;
            $achievementPct = $target ? (float) $target->achievement_percentage : 0.0;
            $pendingTarget = max(0.0, $targetAmount - $achievedAmount);

            // Estimated incentive
            $estimatedIncentive = 0.0;
            if ($target) {
                $policy = IncentivePolicy::with('rules')
                    ->where('tenant_id', $tenantId)
                    ->where('is_active', true)
                    ->first();

                if ($policy && $achievementPct >= (float) $policy->min_achievement_pct) {
                    foreach ($policy->rules as $rule) {
                        if ($achievementPct >= (float) $rule->min_pct && $achievementPct <= (float) $rule->max_pct) {
                            if ($rule->incentive_type === 'percentage') {
                                $estimatedIncentive = ($achievedAmount * (float) $rule->incentive_value) / 100;
                            } else {
                                $estimatedIncentive = (float) $rule->incentive_value;
                            }
                            break;
                        }
                    }
                }
            }

            return [
                'id'                  => $emp->id,
                'uuid'                => $emp->uuid,
                'employee_code'       => $emp->employee_code,
                'name'                => $emp->display_name ?? "{$emp->first_name} {$emp->last_name}",
                'email'               => $emp->email,
                'phone'               => $emp->phone,
                'department_id'       => $emp->department_id,
                'designation_id'      => $emp->designation_id,
                'target_id'           => $target?->id,
                'period_month'        => $currentMonth,
                'target_amount'       => $targetAmount,
                'achieved_amount'     => $achievedAmount,
                'achievement_pct'     => $achievementPct,
                'pending_target'      => $pendingTarget,
                'total_leads'         => $target?->total_leads ?? 0,
                'valid_leads'         => $target?->valid_leads ?? 0,
                'fake_leads'          => $target?->fake_leads ?? 0,
                'converted_leads'     => $target?->converted_leads ?? 0,
                'conversion_rate'     => $target && $target->total_leads > 0 ? round(($target->converted_leads / $target->total_leads) * 100, 2) : 0,
                'profit_generated'    => $target ? (float) $target->profit_generated : 0.0,
                'estimated_incentive' => round($estimatedIncentive, 2),
            ];
        });

        return response()->json([
            'period_month' => $currentMonth,
            'data'         => $salesmenData,
        ]);
    }

    public function dashboard(Request $request, int $employeeId): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $month = $request->query('period_month', now()->format('Y-m'));

        $employee = Employee::where('tenant_id', $tenantId)->findOrFail($employeeId);

        /** @var SalesmanTarget|null $target */
        $target = SalesmanTarget::where('tenant_id', $tenantId)
            ->where('employee_id', $employeeId)
            ->where('period_month', $month)
            ->first();

        if ($target) {
            $this->syncTargetMetrics($target);
            $target->refresh();
        }

        $targetAmount = $target ? (float) $target->target_amount : 0.0;
        $achievedAmount = $target ? (float) $target->achieved_amount : 0.0;
        $achievementPct = $target ? (float) $target->achievement_percentage : 0.0;
        $remaining = max(0.0, $targetAmount - $achievedAmount);

        // Calculate estimated incentive
        $estimatedIncentive = 0.0;
        $policy = IncentivePolicy::with('rules')
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->first();

        if ($policy && $achievementPct >= (float) $policy->min_achievement_pct) {
            foreach ($policy->rules as $rule) {
                if ($achievementPct >= (float) $rule->min_pct && $achievementPct <= (float) $rule->max_pct) {
                    if ($rule->incentive_type === 'percentage') {
                        $estimatedIncentive = ($achievedAmount * (float) $rule->incentive_value) / 100;
                    } else {
                        $estimatedIncentive = (float) $rule->incentive_value;
                    }
                    break;
                }
            }
        }

        // Recent orders
        $recentOrders = SalesOrder::where('tenant_id', $tenantId)
            ->where(function ($q) use ($employeeId, $employee) {
                $q->where('salesman_id', $employeeId);
                if ($employee->user_id) {
                    $q->orWhere('salesperson_id', $employee->user_id);
                }
            })
            ->orderByDesc('order_date')
            ->limit(5)
            ->get(['id', 'order_number', 'order_date', 'total_amount', 'status', 'payment_status']);

        // Recent leads
        $recentLeads = CrmLead::where('tenant_id', $tenantId)
            ->where(function ($q) use ($employee) {
                if ($employee->user_id) {
                    $q->where('assigned_to', $employee->user_id);
                }
            })
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'lead_number', 'name', 'company_name', 'stage', 'expected_value', 'is_fake']);

        return response()->json([
            'salesman' => [
                'id'            => $employee->id,
                'name'          => $employee->display_name ?? "{$employee->first_name} {$employee->last_name}",
                'employee_code' => $employee->employee_code,
                'email'         => $employee->email,
                'phone'         => $employee->phone,
            ],
            'period_month' => $month,
            'kpis' => [
                'target_amount'       => $targetAmount,
                'achieved_amount'     => $achievedAmount,
                'achievement_pct'     => $achievementPct,
                'remaining_target'    => $remaining,
                'total_leads'         => $target?->total_leads ?? 0,
                'valid_leads'         => $target?->valid_leads ?? 0,
                'fake_leads'          => $target?->fake_leads ?? 0,
                'converted_leads'     => $target?->converted_leads ?? 0,
                'conversion_rate'     => $target && $target->total_leads > 0 ? round(($target->converted_leads / $target->total_leads) * 100, 2) : 0,
                'profit_generated'    => $target ? (float) $target->profit_generated : 0.0,
                'estimated_incentive' => round($estimatedIncentive, 2),
            ],
            'recent_orders' => $recentOrders,
            'recent_leads'  => $recentLeads,
        ]);
    }

    private function syncTargetMetrics(SalesmanTarget $target): void
    {
        $employee = Employee::find($target->employee_id);
        if (!$employee) {
            return;
        }

        $startOfMonth = "{$target->period_month}-01";
        $endOfMonth = date('Y-m-t', strtotime($startOfMonth));

        // Total sales achieved in month
        $salesQuery = Invoice::where('tenant_id', $target->tenant_id)
            ->where('status', '!=', 'void')
            ->whereBetween('invoice_date', [$startOfMonth, $endOfMonth]);

        if ($employee->user_id) {
            $salesQuery->where(function ($q) use ($target, $employee) {
                $q->where('salesman_id', $target->employee_id)
                  ->orWhere('created_by', $employee->user_id);
            });
        } else {
            $salesQuery->where('salesman_id', $target->employee_id);
        }

        $achieved = (float) $salesQuery->sum('total_amount');
        $target->achieved_amount = (string) $achieved;

        $targetAmt = (float) $target->target_amount;
        if ($targetAmt > 0) {
            $target->achievement_percentage = (string) round(($achieved / $targetAmt) * 100, 2);
        } else {
            $target->achievement_percentage = '0.00';
        }

        // Leads metrics
        $leadsQuery = CrmLead::where('tenant_id', $target->tenant_id)
            ->whereBetween('created_at', ["{$startOfMonth} 00:00:00", "{$endOfMonth} 23:59:59"]);

        if ($employee->user_id) {
            $leadsQuery->where('assigned_to', $employee->user_id);
        }

        $totalLeads = $leadsQuery->count();
        $fakeLeads = (clone $leadsQuery)->where('is_fake', true)->count();
        $validLeads = $totalLeads - $fakeLeads;
        $convertedLeads = (clone $leadsQuery)->whereNotNull('converted_at')->count();

        $target->total_leads = $totalLeads;
        $target->fake_leads = $fakeLeads;
        $target->valid_leads = $validLeads;
        $target->converted_leads = $convertedLeads;

        // Estimated profit generated (~20% margin standard or actual)
        $target->profit_generated = (string) round($achieved * 0.20, 4);

        $target->save();
    }
}
