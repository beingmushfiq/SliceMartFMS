<?php

declare(strict_types=1);

namespace App\Modules\Production\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\ProductionBatch;
use App\Models\ProductionOutput;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class RecordBatchOutputAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{productionOutput: ProductionOutput, productionBatch: ProductionBatch}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var ProductionBatch $batch */
        $batch = $input['productionBatch'];
        $tenantId = (int) $actor->tenant_id;

        if (in_array($batch->status, ['closed', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Cannot record outputs on a closed or cancelled batch.',
            ]);
        }

        $result = DB::transaction(function () use ($input, $actor, $batch, $tenantId): array {
            $productId = $this->resolveId('products', $input['product_id'], $tenantId, 'product_id');
            $unitId = $this->resolveId('units', $input['unit_id'], $tenantId, 'unit_id');
            $targetWarehouseId = $this->resolveId('warehouses', $input['target_warehouse_id'], $tenantId, 'target_warehouse_id');

            $variantId = null;
            if (! empty($input['variant_id'])) {
                $variantId = $this->resolveId('product_variants', $input['variant_id'], $tenantId, 'variant_id');
            }

            $output = ProductionOutput::create([
                'uuid' => (string) Str::uuid(),
                'production_batch_id' => $batch->id,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'quantity' => $input['quantity'],
                'unit_id' => $unitId,
                'output_type' => $input['output_type'],
                'batch_code' => $input['batch_code'] ?? null,
                'expiry_date' => $input['expiry_date'] ?? null,
                'target_warehouse_id' => $targetWarehouseId,
                'qc_required' => $input['qc_required'] ?? true,
                'qc_status' => ($input['qc_required'] ?? true) ? 'pending' : 'not_required',
                'recorded_by' => $actor->id,
                'recorded_at' => now(),
                'created_by' => $actor->id,
            ]);

            // Atomically update total_output_quantity on batch
            $newTotalOutput = (string) ProductionOutput::where('production_batch_id', $batch->id)->sum('quantity');
            $batch->update([
                'total_output_quantity' => $newTotalOutput,
                'updated_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $output,
                after: $output->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_output', 'batch_id' => $batch->uuid]
            );

            return [
                'output' => $output,
                'batch' => $batch->load(['inputs', 'outputs.product', 'outputs.unit', 'outputs.targetWarehouse', 'product', 'billOfMaterial', 'outputUnit']),
            ];
        });

        return [
            'productionOutput' => $result['output']->load(['product', 'variant', 'unit', 'targetWarehouse', 'recorder']),
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
