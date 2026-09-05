<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Resources;

use App\Models\BillOfMaterial;
use App\Models\BillOfMaterialItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BillOfMaterial */
final class BillOfMaterialResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'code' => 'BOM-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT),
            'product_id' => $this->product->uuid,
            'version' => $this->version,
            'name' => $this->name,
            'output_quantity' => $this->output_quantity,
            'output_unit_id' => $this->outputUnit->uuid,
            'expected_yield_percentage' => $this->expected_yield_percentage,
            'status' => $this->status,
            'is_active' => $this->status === 'active',
            'is_default' => true,
            'effective_from' => $this->effective_from?->toDateString(),
            'effective_to' => $this->effective_to?->toDateString(),
            'items' => $this->items->map(static fn (BillOfMaterialItem $item) => [
                'id' => (string) $item->id,
                'product_id' => $item->product->uuid,
                'product_name' => $item->product?->name,
                'product_sku' => $item->product?->sku,
                'standard_cost' => (float) ($item->product?->standard_cost ?? 0),
                'quantity' => $item->quantity,
                'unit_id' => $item->unit->uuid,
                'unit_code' => $item->unit?->code,
                'wastage_allowance_percentage' => $item->wastage_allowance_percentage,
                'is_optional' => $item->is_optional,
                'sort_order' => $item->sort_order,
            ])->values()->all(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
