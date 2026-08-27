<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\GoodsReceiptItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin GoodsReceiptItem
 */
final class GoodsReceiptItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'goods_receipt_id' => $this->goods_receipt_id,
            'purchase_order_item_id' => $this->purchase_order_item_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'variant_id' => $this->variant_id,
            'warehouse_location_id' => $this->warehouse_location_id,
            'batch_code' => $this->batch_code,
            'expiry_date' => $this->expiry_date,
            'ordered_quantity' => $this->ordered_quantity,
            'received_quantity' => $this->received_quantity,
            'rejected_quantity' => $this->rejected_quantity,
            'accepted_quantity' => $this->accepted_quantity,
            'unit_id' => $this->unit_id,
            'unit_code' => $this->unit?->code,
            'unit_cost' => $this->unit_cost,
            'stock_movement_id' => $this->stock_movement_id,
            'reason_code_id' => $this->reason_code_id,
        ];
    }
}
