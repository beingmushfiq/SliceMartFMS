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

final class UpdateProductionPlanAction extends Action
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
        private readonly CreateProductionPlanAction $createAction,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{productionPlan: ProductionPlan}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var ProductionPlan $plan */
        $plan = $input['productionPlan'];
        $tenantId = (int) $actor->tenant_id;

        if ($plan->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => 'Only plans in draft status can be modified.',
            ]);
        }

        $plan = DB::transaction(function () use ($input, $actor, $plan, $tenantId): ProductionPlan {
            $before = $plan->load('items')->toArray();

            $updateData = [];
            foreach (['plan_date', 'period_start', 'period_end', 'source', 'status', 'notes'] as $field) {
                if (array_key_exists($field, $input)) {
                    $updateData[$field] = $input[$field];
                }
            }
            $updateData['updated_by'] = $actor->id;

            $plan->update($updateData);

            if (isset($input['items']) && is_array($input['items'])) {
                /** @var array<int, mixed> $items */
                $items = $input['items'];
                $this->createAction->syncItems($plan, $items, $tenantId, $actor->id);
            }

            $this->auditLogger->record(
                action: AuditAction::Updated,
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
