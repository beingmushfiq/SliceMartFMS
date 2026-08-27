<?php

declare(strict_types=1);

namespace App\Modules\Production\Resources;

use App\Models\ProductionBatchInput;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ProductionBatchInput
 */
final class ProductionBatchInputResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'product_id' => $this->product->uuid,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'quantity' => $this->quantity,
            'unit_id' => $this->unit->uuid,
            'unit_code' => $this->unit->code,
            'source' => $this->source,
            'notes' => $this->notes,
            'recorded_at' => $this->recorded_at?->toIso8601String(),
            'recorded_by' => $this->recorder?->uuid,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
