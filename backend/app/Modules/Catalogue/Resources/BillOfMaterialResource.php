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
            'id' => $this->uuid, 'product_id' => $this->product->uuid, 'version' => $this->version, 'name' => $this->name,
            'output_quantity' => $this->output_quantity, 'output_unit_id' => $this->outputUnit->uuid, 'expected_yield_percentage' => $this->expected_yield_percentage,
            'status' => $this->status, 'effective_from' => $this->effective_from?->toDateString(), 'effective_to' => $this->effective_to?->toDateString(),
            'items' => $this->items->map(static fn (BillOfMaterialItem $item) => [
                'product_id' => $item->product->uuid, 'quantity' => $item->quantity, 'unit_id' => $item->unit->uuid,
                'wastage_allowance_percentage' => $item->wastage_allowance_percentage, 'is_optional' => $item->is_optional, 'sort_order' => $item->sort_order,
            ])->values()->all(),
            'created_at' => $this->created_at?->toIso8601String(), 'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
