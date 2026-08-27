<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Resources;

use App\Modules\Inventory\Models\StockAdjustment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockAdjustment
 */
final class StockAdjustmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'adjustment_number' => $this->adjustment_number,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'adjustment_date' => $this->adjustment_date,
            'type' => $this->type,
            'reason_code_id' => $this->reason_code_id,
            'reason_code' => $this->reasonCode?->code,
            'reason_name' => $this->reasonCode?->name,
            'status' => $this->status,
            'total_value_impact' => $this->total_value_impact,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'notes' => $this->notes,
            'items' => StockAdjustmentItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
