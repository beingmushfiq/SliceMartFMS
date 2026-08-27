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

final class UpdateWorkerProductionEntryAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{workerProductionEntry: WorkerProductionEntry}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var WorkerProductionEntry $entry */
        $entry = $input['workerProductionEntry'];
        $tenantId = (int) $actor->tenant_id;

        if (in_array($entry->status, ['verified', 'locked'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Cannot update a verified or locked worker production entry.',
            ]);
        }

        $entry = DB::transaction(function () use ($input, $actor, $entry, $tenantId): WorkerProductionEntry {
            $before = $entry->toArray();
            $data = [];

            if (isset($input['quantity'])) {
                $data['quantity'] = $input['quantity'];
            }
            if (isset($input['unit_id'])) {
                $row = DB::table('units')->where('tenant_id', $tenantId)->where('uuid', $input['unit_id'])->first();
                if ($row === null) {
                    throw ValidationException::withMessages(['unit_id' => 'The selected unit is invalid.']);
                }
                $data['unit_id'] = $row->id;
            }
            if (array_key_exists('rework_quantity', $input)) {
                $data['rework_quantity'] = $input['rework_quantity'] ?? '0.0000';
            }
            if (array_key_exists('rejected_quantity', $input)) {
                $data['rejected_quantity'] = $input['rejected_quantity'] ?? '0.0000';
            }
            if (array_key_exists('hours_worked', $input)) {
                $data['hours_worked'] = $input['hours_worked'];
            }
            if (isset($input['rate_type'])) {
                $data['rate_type'] = $input['rate_type'];
            }
            if (array_key_exists('rate', $input)) {
                $data['rate'] = $input['rate'];
            }
            if (array_key_exists('incentive_amount', $input)) {
                $data['incentive_amount'] = $input['incentive_amount'];
            }

            $data['updated_by'] = $actor->id;

            $entry->update($data);

            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $entry,
                before: $before,
                after: $entry->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'worker_production_entry']
            );

            return $entry;
        });

        return [
            'workerProductionEntry' => $entry->load(['productionBatch', 'employee', 'product', 'unit', 'enteredByUser', 'verifiedByUser']),
        ];
    }
}
