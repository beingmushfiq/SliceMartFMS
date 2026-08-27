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

final class DeleteProductionBatchAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, productionBatch: ProductionBatch}  $input
     */
    public function execute(array $input): void
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var ProductionBatch $batch */
        $batch = $input['productionBatch'];

        if (! in_array($batch->status, ['draft', 'scheduled', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Only batches in draft, scheduled, or cancelled status can be deleted.',
            ]);
        }

        DB::transaction(function () use ($actor, $batch): void {
            $before = $batch->toArray();

            $batch->inputs()->delete();
            $batch->outputs()->delete();
            $batch->delete();

            $this->auditLogger->record(
                action: AuditAction::Deleted,
                auditable: $batch,
                before: $before,
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_batch']
            );
        });
    }
}
