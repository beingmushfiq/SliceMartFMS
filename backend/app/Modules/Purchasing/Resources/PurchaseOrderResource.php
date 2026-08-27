<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseOrder
 */
final class PurchaseOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'po_number' => $this->po_number,
            'party_id' => $this->party_id,
            'supplier_name' => $this->supplier?->name,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'order_date' => $this->order_date,
            'expected_date' => $this->expected_date,
            'expected_delivery_date' => $this->expected_date,
            'currency_code' => $this->currency_code,
            'subtotal' => $this->subtotal,
            'subtotal_amount' => $this->subtotal,
            'discount_amount' => $this->discount_amount,
            'tax_amount' => $this->tax_amount,
            'shipping_amount' => $this->shipping_amount,
            'total_amount' => $this->total_amount,
            'grand_total' => $this->total_amount,
            'received_value' => $this->received_value,
            'billed_value' => $this->billed_value,
            'payment_terms' => $this->payment_terms,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'notes' => $this->notes,
            'terms' => $this->terms,
            'terms_and_conditions' => $this->terms,
            'items' => PurchaseOrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
