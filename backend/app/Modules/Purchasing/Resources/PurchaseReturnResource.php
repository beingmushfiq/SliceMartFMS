<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\PurchaseReturn;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseReturn
 */
final class PurchaseReturnResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'return_number' => $this->return_number,
            'goods_receipt_id' => $this->goods_receipt_id,
            'party_id' => $this->party_id,
            'supplier_name' => $this->supplier?->name,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'return_date' => $this->return_date,
            'reason_code_id' => $this->reason_code_id,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,
            'status' => $this->status,
            'debit_note_number' => $this->debit_note_number,
            'items' => PurchaseReturnItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
