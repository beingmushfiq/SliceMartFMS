<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Resources;

use App\Modules\Inventory\Models\StockCount;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockCount
 */
final class StockCountResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'count_number' => $this->count_number,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'count_date' => $this->count_date,
            'type' => $this->type,
            'count_type' => $this->type,
            'status' => $this->status,
            'freeze_stock' => $this->freeze_stock,
            'counted_by' => $this->counted_by,
            'reconciled_by' => $this->reconciled_by,
            'reconciled_at' => $this->reconciled_at?->toIso8601String(),
            'items' => StockCountItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
