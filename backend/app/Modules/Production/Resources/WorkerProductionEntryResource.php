<?php

declare(strict_types=1);

namespace App\Modules\Production\Resources;

use App\Models\WorkerProductionEntry;
use App\Modules\Catalogue\Resources\ProductResource;
use App\Modules\Catalogue\Resources\UnitResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WorkerProductionEntry
 */
final class WorkerProductionEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'production_batch_id' => $this->productionBatch->uuid,
            'batch_number' => $this->productionBatch->batch_number,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'work_date' => $this->work_date,
            'measure_type' => $this->measure_type,
            'quantity' => $this->quantity,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'rework_quantity' => $this->rework_quantity,
            'rejected_quantity' => $this->rejected_quantity,
            'hours_worked' => $this->hours_worked,
            'rate_type' => $this->rate_type,
            'rate' => $this->rate,
            'incentive_amount' => $this->incentive_amount,
            'status' => $this->status,
            'entered_by' => $this->enteredByUser?->uuid,
            'verified_by' => $this->verifiedByUser?->uuid,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
