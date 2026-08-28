<?php

declare(strict_types=1);

namespace App\Modules\Delivery\Resources;

use App\Modules\Delivery\Models\CourierProvider;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CourierProvider
 */
class CourierProviderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'code' => $this->code,
            'name' => $this->name,
            'adapter_class' => $this->adapter_class,
            'is_active' => (bool) $this->is_active,
            'capabilities' => $this->capabilities ?? [],
            'default_charge' => $this->default_charge,
            'settings' => $this->settings ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
