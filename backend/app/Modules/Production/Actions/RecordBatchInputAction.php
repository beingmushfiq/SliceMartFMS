<?php

declare(strict_types=1);

namespace App\Modules\Production\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\ProductionBatch;
use App\Models\ProductionBatchInput;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class RecordBatchInputAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{productionBatchInput: ProductionBatchInput, productionBatch: ProductionBatch}
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
                'status' => 'Cannot record material inputs on a completed or closed batch.',
            ]);
        }

        $result = DB::transaction(function () use ($input, $actor, $batch, $tenantId): array {
            $productId = $this->resolveId('products', $input['product_id'], $tenantId, 'product_id');
            $unitId = $this->resolveId('units', $input['unit_id'], $tenantId, 'unit_id');

            $issueItemId = null;
            if (! empty($input['material_issue_item_id'])) {
                $issueItemId = $this->resolveId('material_issue_items', $input['material_issue_item_id'], $tenantId, 'material_issue_item_id');
            }

            $batchInput = ProductionBatchInput::create([
                'uuid' => (string) Str::uuid(),
                'production_batch_id' => $batch->id,
                'product_id' => $productId,
                'quantity' => $input['quantity'],
                'unit_id' => $unitId,
                'source' => $input['source'],
                'material_issue_item_id' => $issueItemId,
                'recorded_by' => $actor->id,
                'recorded_at' => now(),
                'notes' => $input['notes'] ?? null,
                'created_by' => $actor->id,
            ]);

            // Atomically update total_input_quantity on batch
            $newTotalInput = (string) ProductionBatchInput::where('production_batch_id', $batch->id)->sum('quantity');
            $batch->update([
                'total_input_quantity' => $newTotalInput,
                'context_completeness' => 'collecting',
                'updated_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $batchInput,
                after: $batchInput->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_batch_input', 'batch_id' => $batch->uuid]
            );

            return [
                'batchInput' => $batchInput,
                'batch' => $batch->load(['inputs.product', 'inputs.unit', 'outputs', 'product', 'billOfMaterial', 'outputUnit']),
            ];
        });

        return [
            'productionBatchInput' => $result['batchInput']->load(['product', 'unit', 'recorder']),
            'productionBatch' => $result['batch'],
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
