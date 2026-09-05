<?php

declare(strict_types=1);

namespace App\Modules\QC\Resources;

use App\Models\QcParameter;
use App\Modules\Catalogue\Resources\ProductResource;
use App\Modules\Catalogue\Resources\UnitResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin QcParameter
 */
final class QcParameterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'code' => 'QC-'.strtoupper(substr($this->uuid, 0, 4)),
            'name' => $this->name,
            'type' => $this->type,
            'data_type' => $this->type,
            'category' => 'physical',
            'product' => new ProductResource($this->whenLoaded('product')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'min_value' => $this->min_value,
            'max_value' => $this->max_value,
            'options' => $this->options,
            'is_mandatory' => (bool) $this->is_mandatory,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
