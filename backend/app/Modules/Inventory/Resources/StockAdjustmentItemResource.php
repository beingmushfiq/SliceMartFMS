<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Resources;

use App\Modules\Inventory\Models\StockAdjustmentItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockAdjustmentItem
 */
final class StockAdjustmentItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'stock_adjustment_id' => $this->stock_adjustment_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'variant_id' => $this->variant_id,
            'batch_code' => $this->batch_code,
            'system_quantity' => $this->system_quantity,
            'adjusted_quantity' => $this->adjusted_quantity,
            'difference_quantity' => $this->difference_quantity,
            'quantity' => $this->adjusted_quantity,
            'unit_cost' => $this->unit_cost,
            'stock_movement_id' => $this->stock_movement_id,
            'notes' => $this->notes,
        ];
    }
}
