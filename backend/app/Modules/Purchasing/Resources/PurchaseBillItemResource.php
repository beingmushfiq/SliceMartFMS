<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\PurchaseBillItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseBillItem
 */
final class PurchaseBillItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'purchase_bill_id' => $this->purchase_bill_id,
            'goods_receipt_item_id' => $this->goods_receipt_item_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'unit_id' => $this->unit_id,
            'unit_code' => $this->unit?->code,
            'unit_price' => $this->unit_price,
            'tax_profile_id' => $this->tax_profile_id,
            'tax_amount' => $this->tax_amount,
            'line_total' => $this->line_total,
            'total_amount' => $this->line_total,
            'expense_account_id' => $this->expense_account_id,
        ];
    }
}
