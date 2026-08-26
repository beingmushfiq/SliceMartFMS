<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
final class ProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid, 'sku' => $this->sku, 'barcode' => $this->barcode, 'name' => $this->name, 'description' => $this->description,
            'type' => $this->type, 'category_id' => $this->category?->uuid, 'brand_id' => $this->brand?->uuid,
            'base_unit_id' => $this->baseUnit->uuid, 'purchase_unit_id' => $this->purchaseUnit?->uuid, 'sales_unit_id' => $this->salesUnit?->uuid,
            'is_produced' => $this->is_produced, 'is_purchased' => $this->is_purchased, 'is_sold' => $this->is_sold, 'is_stock_tracked' => $this->is_stock_tracked, 'has_variants' => $this->has_variants,
            'tracking_mode' => $this->tracking_mode, 'shelf_life_days' => $this->shelf_life_days, 'reorder_level' => $this->reorder_level, 'reorder_quantity' => $this->reorder_quantity,
            'standard_cost' => $this->standard_cost, 'default_sale_price' => $this->default_sale_price, 'tax_profile_id' => $this->taxProfile?->uuid, 'weight' => $this->weight,
            'dimensions' => $this->dimensions, 'is_online' => $this->is_online, 'online_slug' => $this->online_slug, 'online_meta' => $this->online_meta, 'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(), 'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
