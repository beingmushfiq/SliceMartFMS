<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Resources;

use App\Models\TaxProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serialises a TaxProfile into the API_CONTRACT §15.6 resource shape.
 *
 * @mixin TaxProfile
 */
final class TaxProfileResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'code' => $this->code,
            'name' => $this->name,
            'rate' => $this->rate,
            'type' => $this->type,
            'is_compound' => $this->is_compound,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
