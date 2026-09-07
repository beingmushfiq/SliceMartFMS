<?php

declare(strict_types=1);

namespace App\Modules\QC\Resources;

use App\Models\QcInspection;
use App\Modules\Production\Resources\EmployeeResource;
use App\Modules\Production\Resources\ProductionBatchResource;
use App\Modules\Production\Resources\ProductionOutputResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin QcInspection
 */
final class QcInspectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'inspection_number' => $this->inspection_number,
            'production_batch' => new ProductionBatchResource($this->whenLoaded('productionBatch')),
            'batch_id' => $this->productionBatch?->uuid,
            'batch_number' => $this->productionBatch?->batch_number,
            'production_output' => new ProductionOutputResource($this->whenLoaded('productionOutput')),
            'product_id' => $this->productionBatch?->product?->uuid ?? $this->productionOutput?->product?->uuid,
            'product_name' => $this->productionBatch?->product?->name ?? $this->productionOutput?->product?->name,
            'inspection_type' => 'final',
            'inspection_date' => $this->inspection_date,
            'inspector' => new EmployeeResource($this->whenLoaded('inspector')),
            'sample_size' => $this->sample_size,
            'inspected_quantity' => $this->inspected_quantity,
            'passed_quantity' => $this->passed_quantity,
            'failed_quantity' => $this->failed_quantity,
            'rejected_quantity' => $this->failed_quantity,
            'rework_quantity' => $this->rework_quantity,
            'scrap_quantity' => $this->scrap_quantity,
            'result' => $this->result,
            'status' => $this->status,
            'notes' => $this->notes,
            'approved_by' => $this->approvedByUser?->uuid,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'results' => QcInspectionResultResource::collection($this->whenLoaded('results')),
            'defects' => QcDefectResource::collection($this->whenLoaded('defects')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
