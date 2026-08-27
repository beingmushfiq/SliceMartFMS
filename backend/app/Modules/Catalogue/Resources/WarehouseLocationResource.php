<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Resources;

use App\Models\WarehouseLocation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin WarehouseLocation */
final class WarehouseLocationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $includeRaw = $request->query('include', '');
        $include = is_string($includeRaw) ? array_filter(explode(',', $includeRaw)) : [];
        $includeParent = in_array('parent', $include, true);

        return [
            'id' => $this->uuid,
            'warehouse_id' => $this->warehouse->uuid,
            'parent_id' => $this->parent?->uuid,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type,
            'is_active' => $this->is_active,
            'parent' => $includeParent && $this->relationLoaded('parent') && $this->parent !== null
                ? ['id' => $this->parent->uuid, 'warehouse_id' => $this->parent->warehouse->uuid, 'code' => $this->parent->code, 'name' => $this->parent->name, 'type' => $this->parent->type, 'is_active' => $this->parent->is_active]
                : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
