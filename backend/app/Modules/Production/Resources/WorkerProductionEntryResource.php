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
        $rate = (float) ($this->rate ?? 0);
        $qty = (float) ($this->quantity ?? 0);
        $totalEarned = number_format($rate * $qty, 4, '.', '');

        return [
            'id' => $this->uuid,
            'batch_id' => $this->productionBatch->uuid,
            'production_batch_id' => $this->productionBatch->uuid,
            'batch_number' => $this->productionBatch->batch_number,
            'employee_id' => $this->employee->uuid,
            'employee_name' => $this->employee->display_name ?: trim("{$this->employee->first_name} {$this->employee->last_name}"),
            'employee_code' => $this->employee->employee_code,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'product_id' => $this->product->uuid,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'product' => new ProductResource($this->whenLoaded('product')),
            'work_date' => $this->work_date,
            'shift' => 'morning',
            'measure_type' => $this->measure_type,
            'quantity' => (string) $this->quantity,
            'good_quantity' => (string) $this->quantity,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'rework_quantity' => (string) ($this->rework_quantity ?? '0.0000'),
            'rejected_quantity' => (string) ($this->rejected_quantity ?? '0.0000'),
            'hours_worked' => $this->hours_worked !== null ? (string) $this->hours_worked : null,
            'rate_type' => $this->rate_type,
            'wage_type' => $this->rate_type ?? 'piece_rate',
            'rate' => $this->rate !== null ? (string) $this->rate : null,
            'piece_rate' => $this->rate !== null ? (string) $this->rate : null,
            'total_earned' => $totalEarned,
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
