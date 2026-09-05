<?php

declare(strict_types=1);

namespace App\Modules\QC\Resources;

use App\Models\WastageRecord;
use App\Modules\Catalogue\Resources\ProductResource;
use App\Modules\Catalogue\Resources\ReasonCodeResource;
use App\Modules\Catalogue\Resources\UnitResource;
use App\Modules\Catalogue\Resources\WarehouseResource;
use App\Modules\Production\Resources\ProductionBatchResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WastageRecord
 */
final class WastageRecordResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'wastage_number' => $this->wastage_number,
            'production_batch' => new ProductionBatchResource($this->whenLoaded('productionBatch')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'product_name' => $this->product?->name,
            'stage' => $this->stage,
            'quantity' => $this->quantity,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'reason_code' => new ReasonCodeResource($this->whenLoaded('reasonCode')),
            'reason_code_name' => $this->reasonCode?->name,
            'reason_name' => $this->reasonCode?->name,
            'estimated_cost' => $this->estimated_cost,
            'total_cost' => $this->estimated_cost,
            'is_recoverable' => (bool) $this->is_recoverable,
            'recovered_quantity' => $this->recovered_quantity,
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'recorded_by' => $this->recordedByUser?->uuid,
            'recorded_at' => $this->recorded_at?->toIso8601String(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
