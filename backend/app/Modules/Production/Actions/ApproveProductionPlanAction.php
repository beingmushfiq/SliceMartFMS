<?php

declare(strict_types=1);

namespace App\Modules\Production\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\ProductionPlan;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ApproveProductionPlanAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, productionPlan: ProductionPlan}  $input
     * @return array{productionPlan: ProductionPlan}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var ProductionPlan $plan */
        $plan = $input['productionPlan'];

        if ($plan->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => 'Only plans in draft status can be approved.',
            ]);
        }

        if ($plan->items()->count() === 0) {
            throw ValidationException::withMessages([
                'items' => 'Cannot approve a production plan with no scheduled items.',
            ]);
        }

        $plan = DB::transaction(function () use ($actor, $plan): ProductionPlan {
            $before = $plan->toArray();

            $plan->update([
                'status' => 'approved',
                'approved_by' => $actor->id,
                'approved_at' => now(),
                'updated_by' => $actor->id,
            ]);

            $plan->items()->update([
                'status' => 'approved',
                'updated_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Approved,
                auditable: $plan,
                before: $before,
                after: $plan->load('items')->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_plan']
            );

            return $plan;
        });

        return [
            'productionPlan' => $plan->load(['items.product', 'items.billOfMaterial', 'items.unit']),
        ];
    }
}
