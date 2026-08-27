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

final class CloseProductionBatchAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

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

        if ($batch->status !== 'completed') {
            throw ValidationException::withMessages([
                'status' => 'Only completed batches can be closed.',
            ]);
        }

        $batch = DB::transaction(function () use ($actor, $batch): ProductionBatch {
            $before = $batch->toArray();

            $batch->update([
                'status' => 'closed',
                'context_completeness' => 'closed',
                'closed_by' => $actor->id,
                'closed_at' => now(),
                'updated_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Approved,
                auditable: $batch,
                before: $before,
                after: $batch->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_batch', 'event' => 'closed']
            );

            return $batch;
        });

        return [
            'productionBatch' => $batch->load(['product', 'billOfMaterial', 'outputUnit', 'inputs', 'outputs', 'supervisor', 'closedByUser']),
        ];
    }
}
