<?php

declare(strict_types=1);

namespace App\Modules\QC\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\User;
use App\Models\WastageRecord;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateWastageRecordAction extends Action
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
        $tenantId = (int) $actor->tenant_id;

        $number = is_string($input['wastage_number']) ? $input['wastage_number'] : '';
        if (WastageRecord::where('wastage_number', $number)->exists()) {
            throw new DuplicateResourceException('wastage_number', $number);
        }

        $productId = $this->resolveId('products', $input['product_id'], $tenantId, 'product_id');
        $unitId = $this->resolveId('units', $input['unit_id'], $tenantId, 'unit_id');
        $reasonCodeId = $this->resolveId('reason_codes', $input['reason_code_id'], $tenantId, 'reason_code_id');

        $batchId = null;
        if (! empty($input['production_batch_id'])) {
            $batchId = $this->resolveId('production_batches', $input['production_batch_id'], $tenantId, 'production_batch_id');
        }

        $warehouseId = null;
        if (! empty($input['warehouse_id'])) {
            $warehouseId = $this->resolveId('warehouses', $input['warehouse_id'], $tenantId, 'warehouse_id');
        }

        $wastage = DB::transaction(function () use ($input, $actor, $number, $productId, $unitId, $reasonCodeId, $batchId, $warehouseId): WastageRecord {
            $wastage = WastageRecord::create([
                'uuid' => (string) Str::uuid(),
                'wastage_number' => $number,
                'product_id' => $productId,
                'production_batch_id' => $batchId,
                'stage' => $input['stage'],
                'quantity' => $input['quantity'],
                'unit_id' => $unitId,
                'reason_code_id' => $reasonCodeId,
                'estimated_cost' => $input['estimated_cost'] ?? null,
                'is_recoverable' => isset($input['is_recoverable']) && $input['is_recoverable'] ? 1 : 0,
                'recovered_quantity' => $input['recovered_quantity'] ?? '0.0000',
                'warehouse_id' => $warehouseId,
                'recorded_by' => $actor->id,
                'recorded_at' => now(),
                'notes' => $input['notes'] ?? null,
                'created_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $wastage,
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
