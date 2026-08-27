<?php

declare(strict_types=1);

namespace App\Modules\Production\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\User;
use App\Models\WorkerProductionEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class VerifyWorkerProductionEntryAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, workerProductionEntry: WorkerProductionEntry}  $input
     * @return array{workerProductionEntry: WorkerProductionEntry}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var WorkerProductionEntry $entry */
        $entry = $input['workerProductionEntry'];

        if ($entry->status === 'verified' || $entry->status === 'locked') {
            throw ValidationException::withMessages([
                'status' => 'The worker production entry is already verified or locked.',
            ]);
        }

        $entry = DB::transaction(function () use ($actor, $entry): WorkerProductionEntry {
            $before = $entry->toArray();

            $entry->update([
                'status' => 'verified',
                'verified_by' => $actor->id,
                'verified_at' => now(),
                'updated_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Approved,
                auditable: $entry,
                before: $before,
                after: $entry->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'worker_production_entry', 'event' => 'verified']
            );

            return $entry;
        });

        return [
            'workerProductionEntry' => $entry->load(['productionBatch', 'employee', 'product', 'unit', 'enteredByUser', 'verifiedByUser']),
        ];
    }
}
