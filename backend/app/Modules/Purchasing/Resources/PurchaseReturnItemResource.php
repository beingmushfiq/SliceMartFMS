<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\PurchaseReturnItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseReturnItem
 */
final class PurchaseReturnItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'purchase_return_id' => $this->purchase_return_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'variant_id' => $this->variant_id,
            'batch_code' => $this->batch_code,
            'quantity' => $this->quantity,
            'unit_id' => $this->unit_id,
            'unit_code' => $this->unit?->code,
            'unit_cost' => $this->unit_cost,
            'line_total' => $this->line_total,
            'stock_movement_id' => $this->stock_movement_id,
        ];
    }
}
