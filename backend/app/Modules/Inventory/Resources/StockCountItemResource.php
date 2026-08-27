<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Resources;

use App\Modules\Inventory\Models\StockCountItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockCountItem
 */
final class StockCountItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'stock_count_id' => $this->stock_count_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_sku' => $this->product?->sku,
            'variant_id' => $this->variant_id,
            'warehouse_location_id' => $this->warehouse_location_id,
            'batch_code' => $this->batch_code,
            'system_quantity' => $this->system_quantity,
            'snapshot_quantity' => $this->system_quantity,
            'counted_quantity' => $this->counted_quantity,
            'variance_quantity' => $this->variance_quantity,
            'recount_quantity' => $this->recount_quantity,
            'status' => $this->status,
        ];
    }
}
