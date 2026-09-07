<?php

declare(strict_types=1);

namespace App\Modules\Production\Resources;

use App\Models\ProductionBatch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

/**
 * @mixin ProductionBatch
 */
final class ProductionBatchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $factoryUuid = DB::table('factories')->where('id', $this->factory_id)->value('uuid');
        $lineUuid = $this->production_line_id !== null
            ? DB::table('production_lines')->where('id', $this->production_line_id)->value('uuid')
            : null;
        $shiftUuid = $this->shift_id !== null
            ? DB::table('shifts')->where('id', $this->shift_id)->value('uuid')
            : null;

        return [
            'id' => $this->uuid,
            'batch_number' => $this->batch_number,
            'production_plan_item_id' => $this->productionPlanItem?->uuid,
            'factory_id' => is_string($factoryUuid) ? $factoryUuid : '',
            'production_line_id' => is_string($lineUuid) ? $lineUuid : null,
            'product_id' => $this->product->uuid,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'bill_of_material_id' => $this->billOfMaterial->uuid,
            'bom_id' => $this->billOfMaterial->uuid,
            'bom_name' => $this->billOfMaterial->name,
            'bom_version' => $this->billOfMaterial->version,
            'shift_id' => is_string($shiftUuid) ? $shiftUuid : null,
            'batch_date' => $this->batch_date->toDateString(),
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'planned_quantity' => (string) $this->planned_quantity,
            'target_quantity' => (string) $this->planned_quantity,
            'actual_quantity' => (string) $this->total_output_quantity,
            'output_unit_id' => $this->outputUnit->uuid,
            'output_unit_code' => $this->outputUnit->code,
            'status' => $this->status,
            'context_completeness' => $this->context_completeness,
            'total_input_quantity' => (string) $this->total_input_quantity,
            'total_output_quantity' => (string) $this->total_output_quantity,
            'worker_reported_quantity' => $this->worker_reported_quantity !== null ? (string) $this->worker_reported_quantity : null,
            'yield_percentage' => $this->yield_percentage !== null ? (string) $this->yield_percentage : null,
            'actual_yield_pct' => $this->yield_percentage !== null ? (string) $this->yield_percentage : null,
            'expected_yield_pct' => '100.00',
            'variance_quantity' => $this->variance_quantity !== null ? (string) $this->variance_quantity : null,
            'process_loss_quantity' => $this->variance_quantity !== null ? (string) $this->variance_quantity : '0.0000',
            'variance_percentage' => $this->variance_percentage !== null ? (string) $this->variance_percentage : null,
            'yield_variance_pct' => $this->variance_percentage !== null ? (string) $this->variance_percentage : null,
            'analysis' => $this->analysis,
            'supervisor_id' => $this->supervisor?->uuid,
            'closed_by' => $this->closedByUser?->uuid,
            'closed_at' => $this->closed_at?->toIso8601String(),
            'inputs' => ProductionBatchInputResource::collection($this->inputs),
            'outputs' => ProductionOutputResource::collection($this->outputs),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
