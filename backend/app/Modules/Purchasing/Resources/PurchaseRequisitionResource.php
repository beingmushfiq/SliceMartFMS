<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Resources;

use App\Modules\Purchasing\Models\PurchaseRequisition;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PurchaseRequisition
 */
final class PurchaseRequisitionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'requisition_number' => $this->requisition_number,
            'branch_id' => $this->branch_id,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'required_by_date' => $this->required_by_date,
            'requisition_date' => $this->required_by_date,
            'status' => $this->status,
            'requested_by' => $this->requested_by,
            'requester_name' => $this->requester?->name,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'notes' => $this->notes,
            'items' => PurchaseRequisitionItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
