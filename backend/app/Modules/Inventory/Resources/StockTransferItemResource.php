<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Resources;

use App\Modules\Inventory\Models\StockTransferItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockTransferItem
 */
final class StockTransferItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'stock_transfer_id' => $this->stock_transfer_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'variant_id' => $this->variant_id,
            'batch_code' => $this->batch_code,
            'sent_quantity' => $this->sent_quantity,
            'received_quantity' => $this->received_quantity,
            'damaged_quantity' => $this->damaged_quantity,
            'unit_id' => $this->unit_id,
            'unit_code' => $this->unit?->code,
            'out_movement_id' => $this->out_movement_id,
            'in_movement_id' => $this->in_movement_id,
        ];
    }
}
