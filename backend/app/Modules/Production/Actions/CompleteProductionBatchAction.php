<?php

declare(strict_types=1);

namespace App\Modules\Production\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\ProductionBatch;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CompleteProductionBatchAction extends Action
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
        private readonly AnalyzeBatchYieldAction $analyzeAction,
    ) {}

    /**
     * @param  array{user: User, productionBatch: ProductionBatch}  $input
     * @return array{productionBatch: ProductionBatch}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var ProductionBatch $batch */
        $batch = $input['productionBatch'];

        if ($batch->status !== 'in_progress') {
            throw ValidationException::withMessages([
                'status' => 'Only batches currently in progress can be completed.',
            ]);
        }

        $batch = DB::transaction(function () use ($actor, $batch): ProductionBatch {
            $before = $batch->toArray();

            $batch->update([
                'status' => 'completed',
                'completed_at' => now(),
                'updated_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $batch,
                before: $before,
                after: $batch->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_batch', 'event' => 'completed']
            );

            return $batch;
        });

        // Trigger yield analysis if inputs or outputs were recorded
        if ((float) $batch->total_input_quantity > 0 || (float) $batch->total_output_quantity > 0) {
            $this->analyzeAction->execute(['user' => $actor, 'productionBatch' => $batch]);
        }

        return [
            'productionBatch' => $batch->load(['product', 'billOfMaterial', 'outputUnit', 'inputs', 'outputs', 'supervisor']),
        ];
    }
}
