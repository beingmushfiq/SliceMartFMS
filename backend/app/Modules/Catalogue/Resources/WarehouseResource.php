<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Resources;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Warehouse */
final class WarehouseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return ['id' => $this->uuid, 'code' => $this->code, 'name' => $this->name, 'type' => $this->type, 'address' => $this->address, 'company_id' => null, 'branch_id' => null, 'factory_id' => null, 'is_default' => $this->is_default, 'allows_negative_stock' => $this->allows_negative_stock, 'is_active' => $this->is_active, 'locations' => $this->whenLoaded('locations'), 'created_at' => $this->created_at?->toIso8601String(), 'updated_at' => $this->updated_at?->toIso8601String()];
    }
}
