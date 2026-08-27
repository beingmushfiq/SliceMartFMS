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

final class UpdateProductionBatchAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{productionBatch: ProductionBatch}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var ProductionBatch $batch */
        $batch = $input['productionBatch'];
        $tenantId = (int) $actor->tenant_id;

        if (in_array($batch->status, ['completed', 'closed', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Batches that are completed, closed, or cancelled cannot be modified.',
            ]);
        }

        $batch = DB::transaction(function () use ($input, $actor, $batch, $tenantId): ProductionBatch {
            $before = $batch->toArray();
            $updateData = [];

            if (array_key_exists('batch_date', $input)) {
                $updateData['batch_date'] = $input['batch_date'];
            }
            if (array_key_exists('planned_quantity', $input)) {
                $updateData['planned_quantity'] = $input['planned_quantity'];
            }
            if (array_key_exists('status', $input)) {
                $updateData['status'] = $input['status'];
            }
            if (array_key_exists('production_line_id', $input)) {
                $updateData['production_line_id'] = ! empty($input['production_line_id'])
                    ? $this->resolveId('production_lines', $input['production_line_id'], $tenantId, 'production_line_id')
                    : null;
            }
            if (array_key_exists('shift_id', $input)) {
                $updateData['shift_id'] = ! empty($input['shift_id'])
                    ? $this->resolveId('shifts', $input['shift_id'], $tenantId, 'shift_id')
                    : null;
            }
            if (array_key_exists('supervisor_id', $input)) {
                $updateData['supervisor_id'] = ! empty($input['supervisor_id'])
                    ? $this->resolveId('users', $input['supervisor_id'], $tenantId, 'supervisor_id')
                    : null;
            }

            $updateData['updated_by'] = $actor->id;
            $batch->update($updateData);

            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $batch,
                before: $before,
                after: $batch->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_batch']
            );

            return $batch;
        });

        return [
            'productionBatch' => $batch->load(['product', 'billOfMaterial', 'outputUnit', 'inputs', 'outputs', 'supervisor']),
        ];
    }

    private function resolveId(string $table, mixed $uuid, int $tenantId, string $field): int
    {
        $row = DB::table($table)->where('tenant_id', $tenantId)->where('uuid', $uuid)->first();
        if ($row === null) {
            throw ValidationException::withMessages([$field => 'The selected reference is invalid.']);
        }

        return (int) $row->id;
    }
}
