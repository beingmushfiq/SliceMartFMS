<?php

declare(strict_types=1);

namespace App\Modules\Production\Resources;

use App\Models\ProductionOutput;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ProductionOutput
 */
final class ProductionOutputResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'product_id' => $this->product->uuid,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'variant_id' => $this->variant?->uuid,
            'quantity' => $this->quantity,
            'unit_id' => $this->unit->uuid,
            'unit_code' => $this->unit->code,
            'output_type' => $this->output_type,
            'batch_code' => $this->batch_code,
            'expiry_date' => $this->expiry_date?->toDateString(),
            'target_warehouse_id' => $this->targetWarehouse->uuid,
            'warehouse_name' => $this->targetWarehouse->name,
            'qc_required' => $this->qc_required,
            'qc_status' => $this->qc_status,
            'recorded_at' => $this->recorded_at?->toIso8601String(),
            'recorded_by' => $this->recorder?->uuid,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
