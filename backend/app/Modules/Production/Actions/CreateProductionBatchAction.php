<?php

declare(strict_types=1);

namespace App\Modules\Production\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\ProductionBatch;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateProductionBatchAction extends Action
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
        $tenantId = (int) $actor->tenant_id;

        if (ProductionBatch::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('batch_number', $input['batch_number'])
            ->exists()
        ) {
            throw new DuplicateResourceException(
                field: 'batch_number',
                value: is_string($input['batch_number']) ? $input['batch_number'] : ''
            );
        }

        $batch = DB::transaction(function () use ($input, $actor, $tenantId): ProductionBatch {
            $factoryId = $this->resolveId('factories', $input['factory_id'], $tenantId, 'factory_id');
            $productId = $this->resolveId('products', $input['product_id'], $tenantId, 'product_id');
            $bomId = $this->resolveId('bill_of_materials', $input['bill_of_material_id'], $tenantId, 'bill_of_material_id');
            $unitId = $this->resolveId('units', $input['output_unit_id'], $tenantId, 'output_unit_id');

            $planItemId = null;
            if (! empty($input['production_plan_item_id'])) {
                $planItemId = $this->resolveId('production_plan_items', $input['production_plan_item_id'], $tenantId, 'production_plan_item_id');
            }

            $lineId = null;
            if (! empty($input['production_line_id'])) {
                $lineId = $this->resolveId('production_lines', $input['production_line_id'], $tenantId, 'production_line_id');
            }

            $shiftId = null;
            if (! empty($input['shift_id'])) {
                $shiftId = $this->resolveId('shifts', $input['shift_id'], $tenantId, 'shift_id');
            }

            $supervisorId = null;
            if (! empty($input['supervisor_id'])) {
                $supervisorId = $this->resolveId('users', $input['supervisor_id'], $tenantId, 'supervisor_id');
            }

            $batch = ProductionBatch::create([
                'uuid' => (string) Str::uuid(),
                'batch_number' => $input['batch_number'],
                'production_plan_item_id' => $planItemId,
                'factory_id' => $factoryId,
                'production_line_id' => $lineId,
                'product_id' => $productId,
                'bill_of_material_id' => $bomId,
                'shift_id' => $shiftId,
                'batch_date' => $input['batch_date'],
                'planned_quantity' => $input['planned_quantity'],
                'output_unit_id' => $unitId,
                'status' => $input['status'] ?? 'draft',
                'context_completeness' => 'draft',
                'total_input_quantity' => '0.0000',
                'total_output_quantity' => '0.0000',
                'worker_reported_quantity' => '0.0000',
                'yield_percentage' => null,
                'variance_quantity' => null,
                'variance_percentage' => null,
                'analysis' => null,
                'supervisor_id' => $supervisorId,
                'created_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $batch,
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
        $query = DB::table($table)->where('tenant_id', $tenantId);
        $row = (clone $query)->where('uuid', $uuid)->first();
        if ($row === null && is_numeric($uuid)) {
            $row = (clone $query)->where('id', (int) $uuid)->first();
        }
        if ($row === null) {
            throw ValidationException::withMessages([$field => 'The selected reference is invalid.']);
        }

        return (int) $row->id;
    }
}
