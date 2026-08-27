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

final class DeleteWorkerProductionEntryAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, workerProductionEntry: WorkerProductionEntry}  $input
     */
    public function execute(array $input): void
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var WorkerProductionEntry $entry */
        $entry = $input['workerProductionEntry'];

        if (in_array($entry->status, ['verified', 'locked'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Cannot delete a verified or locked worker production entry.',
            ]);
        }

        DB::transaction(function () use ($actor, $entry): void {
            $before = $entry->toArray();

            $entry->delete();

            $this->auditLogger->record(
                action: AuditAction::Deleted,
                auditable: $entry,
                before: $before,
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'worker_production_entry']
            );
        });
    }
}
