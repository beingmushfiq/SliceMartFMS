<?php

declare(strict_types=1);

namespace App\Modules\QC\Resources;

use App\Models\QcDefect;
use App\Modules\Catalogue\Resources\ReasonCodeResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin QcDefect
 */
final class QcDefectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'defect_reason' => new ReasonCodeResource($this->whenLoaded('defectReason')),
            'quantity' => $this->quantity,
            'severity' => $this->severity,
            'notes' => $this->notes,
        ];
    }
}
