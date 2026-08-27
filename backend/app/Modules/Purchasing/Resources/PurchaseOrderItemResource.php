<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\PurchaseOrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseOrderItem
 */
final class PurchaseOrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'purchase_order_id' => $this->purchase_order_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'variant_id' => $this->variant_id,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'received_quantity' => $this->received_quantity,
            'billed_quantity' => $this->billed_quantity,
            'unit_id' => $this->unit_id,
            'unit_code' => $this->unit?->code,
            'unit_price' => $this->unit_price,
            'discount_percentage' => $this->discount_percentage,
            'discount_amount' => $this->discount_amount,
            'tax_profile_id' => $this->tax_profile_id,
            'tax_amount' => $this->tax_amount,
            'line_total' => $this->line_total,
            'total_amount' => $this->line_total,
            'sort_order' => $this->sort_order,
        ];
    }
}
