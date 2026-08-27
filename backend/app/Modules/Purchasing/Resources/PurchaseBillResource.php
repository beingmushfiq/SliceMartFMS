<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\PurchaseBill;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseBill
 */
final class PurchaseBillResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'bill_number' => $this->bill_number,
            'purchase_order_id' => $this->purchase_order_id,
            'po_number' => $this->purchaseOrder?->po_number,
            'goods_receipt_id' => $this->goods_receipt_id,
            'party_id' => $this->party_id,
            'supplier_name' => $this->supplier?->name,
            'bill_date' => $this->bill_date,
            'due_date' => $this->due_date,
            'supplier_bill_number' => $this->supplier_bill_number,
            'supplier_invoice_number' => $this->supplier_bill_number,
            'subtotal' => $this->subtotal,
            'subtotal_amount' => $this->subtotal,
            'discount_amount' => $this->discount_amount,
            'tax_amount' => $this->tax_amount,
            'other_charges' => $this->other_charges,
            'total_amount' => $this->total_amount,
            'grand_total' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'status' => $this->status,
            'posted_by' => $this->posted_by,
            'posted_at' => $this->posted_at?->toIso8601String(),
            'items' => PurchaseBillItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
