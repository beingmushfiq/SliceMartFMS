<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Resources;

use App\Modules\Inventory\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockMovement
 */
final class StockMovementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'movement_number' => $this->movement_number,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'variant_id' => $this->variant_id,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'warehouse_location_id' => $this->warehouse_location_id,
            'batch_code' => $this->batch_code,
            'serial_number' => $this->serial_number,
            'expiry_date' => $this->expiry_date,
            'movement_type' => $this->movement_type,
            'direction' => $this->direction,
            'stock_state' => $this->stock_state,
            'quantity' => $this->quantity,
            'unit_id' => $this->unit_id,
            'unit_name' => $this->unit?->name,
            'unit_code' => $this->unit?->code,
            'unit_cost' => $this->unit_cost,
            'total_cost' => $this->total_cost,
            'balance_after' => $this->balance_after,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'reason_code_id' => $this->reason_code_id,
            'reason_code' => $this->reasonCode?->code,
            'reason_name' => $this->reasonCode?->name,
            'moved_at' => $this->moved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
