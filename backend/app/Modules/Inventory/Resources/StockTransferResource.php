<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Resources;

use App\Modules\Inventory\Models\StockTransfer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StockTransfer
 */
final class StockTransferResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'transfer_number' => $this->transfer_number,
            'from_warehouse_id' => $this->from_warehouse_id,
            'from_warehouse_name' => $this->fromWarehouse?->name,
            'to_warehouse_id' => $this->to_warehouse_id,
            'to_warehouse_name' => $this->toWarehouse?->name,
            'transfer_date' => $this->transfer_date,
            'status' => $this->status,
            'dispatched_by' => $this->dispatched_by,
            'dispatched_at' => $this->dispatched_at?->toIso8601String(),
            'received_by' => $this->received_by,
            'received_at' => $this->received_at?->toIso8601String(),
            'notes' => $this->notes,
            'items' => StockTransferItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
