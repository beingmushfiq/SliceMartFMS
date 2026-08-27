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

final class DeleteProductionPlanAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, productionPlan: ProductionPlan}  $input
     */
    public function execute(array $input): void
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var ProductionPlan $plan */
        $plan = $input['productionPlan'];

        if ($plan->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => 'Only plans in draft status can be deleted.',
            ]);
        }

        DB::transaction(function () use ($actor, $plan): void {
            $before = $plan->load('items')->toArray();

            $plan->items()->delete();
            $plan->delete();

            $this->auditLogger->record(
                action: AuditAction::Deleted,
                auditable: $plan,
                before: $before,
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_plan']
            );
        });
    }
}
