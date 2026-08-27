<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\PurchaseRequisitionItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseRequisitionItem
 */
final class PurchaseRequisitionItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'purchase_requisition_id' => $this->purchase_requisition_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'variant_id' => $this->variant_id,
            'quantity' => $this->quantity,
            'unit_id' => $this->unit_id,
            'unit_code' => $this->unit?->code,
            'ordered_quantity' => $this->ordered_quantity,
            'estimated_unit_cost' => $this->estimated_unit_cost,
            'notes' => $this->notes,
            'sort_order' => $this->sort_order,
        ];
    }
}
