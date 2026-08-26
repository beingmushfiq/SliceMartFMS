<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Resources;

use App\Models\PriceList;
use App\Models\PriceListItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serialises a PriceList into the API_CONTRACT §15.6 resource shape.
 *
 * @mixin PriceList
 */
final class PriceListResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'code' => $this->code,
            'name' => $this->name,
            'currency_code' => $this->currency_code,
            'applies_to' => $this->applies_to,
            'channel' => $this->channel,
            'priority' => $this->priority,
            'valid_from' => $this->valid_from?->toDateString(),
            'valid_to' => $this->valid_to?->toDateString(),
            'is_active' => $this->is_active,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(static fn (PriceListItem $item): array => [
                'product_id' => $item->product->uuid,
                'variant_id' => $item->variant?->uuid,
                'min_quantity' => $item->min_quantity,
                'unit_price' => $item->unit_price,
                'discount_percentage' => $item->discount_percentage,
            ])->values()->all()),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
