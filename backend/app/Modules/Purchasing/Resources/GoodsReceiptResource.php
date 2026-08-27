<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\GoodsReceipt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin GoodsReceipt
 */
final class GoodsReceiptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'grn_number' => $this->grn_number,
            'purchase_order_id' => $this->purchase_order_id,
            'po_number' => $this->purchaseOrder?->po_number,
            'party_id' => $this->party_id,
            'supplier_name' => $this->supplier?->name,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'receipt_date' => $this->receipt_date,
            'supplier_document_number' => $this->supplier_document_number,
            'status' => $this->status,
            'received_by' => $this->received_by,
            'notes' => $this->notes,
            'items' => GoodsReceiptItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
