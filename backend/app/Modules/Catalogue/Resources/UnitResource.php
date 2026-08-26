<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Resources;

use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serialises a Unit into the API_CONTRACT §15.4.1 resource shape.
 *
 * The public identifier is the `uuid`; the auto-increment `id` is never
 * exposed (API_CONTRACT §1.3). Timestamps are ISO-8601 UTC.
 *
 * @mixin Unit
 */
final class UnitResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type,
            'is_base' => $this->is_base,
            'precision' => $this->precision,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
