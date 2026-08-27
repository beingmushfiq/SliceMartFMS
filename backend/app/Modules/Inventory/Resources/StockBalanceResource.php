<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Resources;

use App\Modules\Inventory\Models\StockBalance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockBalance
 */
final class StockBalanceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'variant_id' => $this->variant_id,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'warehouse_location_id' => $this->warehouse_location_id,
            'batch_code' => $this->batch_code,
            'stock_state' => $this->stock_state,
            'quantity' => $this->quantity,
            'average_cost' => $this->average_cost,
            'total_value' => $this->total_value,
            'last_movement_id' => $this->last_movement_id,
            'last_movement_at' => $this->last_movement_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
