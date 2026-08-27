<?php

declare(strict_types=1);

namespace App\Modules\QC\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\User;
use App\Models\WastageRecord;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UpdateWastageRecordAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{wastageRecord: WastageRecord}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var WastageRecord $wastage */
        $wastage = $input['wastageRecord'];
        $tenantId = (int) $actor->tenant_id;

        $wastage = DB::transaction(function () use ($input, $actor, $wastage, $tenantId): WastageRecord {
            $before = $wastage->toArray();
            $data = [];

            if (isset($input['quantity'])) {
                $data['quantity'] = $input['quantity'];
            }
            if (isset($input['unit_id'])) {
                $data['unit_id'] = $this->resolveId('units', $input['unit_id'], $tenantId, 'unit_id');
            }
            if (isset($input['reason_code_id'])) {
                $data['reason_code_id'] = $this->resolveId('reason_codes', $input['reason_code_id'], $tenantId, 'reason_code_id');
            }
            if (array_key_exists('estimated_cost', $input)) {
                $data['estimated_cost'] = $input['estimated_cost'];
            }
            if (isset($input['is_recoverable'])) {
                $data['is_recoverable'] = $input['is_recoverable'] ? 1 : 0;
            }
            if (array_key_exists('recovered_quantity', $input)) {
                $data['recovered_quantity'] = $input['recovered_quantity'];
            }
            if (array_key_exists('warehouse_id', $input)) {
                $data['warehouse_id'] = ! empty($input['warehouse_id'])
                    ? $this->resolveId('warehouses', $input['warehouse_id'], $tenantId, 'warehouse_id')
                    : null;
            }
            if (array_key_exists('notes', $input)) {
                $data['notes'] = $input['notes'];
            }

            $data['updated_by'] = $actor->id;
            $wastage->update($data);

            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $wastage,
                before: $before,
                after: $wastage->toArray(),
                actor: $actor,
                context: ['module' => 'qc', 'resource' => 'wastage_record']
            );

            return $wastage;
        });

        return [
            'wastageRecord' => $wastage->load(['product', 'unit', 'reasonCode', 'productionBatch', 'warehouse', 'recordedByUser']),
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
