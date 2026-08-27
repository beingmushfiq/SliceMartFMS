<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Resources;

use App\Models\Category;
use App\Models\DiscountRule;
use App\Models\Party;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serialises a DiscountRule into the API_CONTRACT §15.6 resource shape.
 *
 * `scope_id` is stored as an integer FK with no relation (polymorphic by
 * `scope`), so it is resolved back to the referenced row's public uuid here.
 *
 * @mixin DiscountRule
 */
final class DiscountRuleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'scope' => $this->scope,
            'scope_id' => $this->resolveScopeUuid(),
            'condition' => $this->condition,
            'discount_type' => $this->discount_type,
            'value' => $this->value,
            'valid_from' => $this->valid_from?->toDateString(),
            'valid_to' => $this->valid_to?->toDateString(),
            'priority' => $this->priority,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    private function resolveScopeUuid(): ?string
    {
        if ($this->scope_id === null) {
            return null;
        }
        $modelClass = match ($this->scope) {
            'product' => Product::class,
            'category' => Category::class,
            'party' => Party::class,
            default => null,
        };
        if ($modelClass === null) {
            return null;
        }
        /** @var Category|Party|Product|null $row */
        $row = $modelClass::query()->whereKey($this->scope_id)->first();
        $uuid = $row?->getAttribute('uuid');

        return is_string($uuid) ? $uuid : null;
    }
}
