<?php

declare(strict_types=1);

namespace App\Modules\QC\Resources;

use App\Models\QcInspectionResult;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin QcInspectionResult
 */
final class QcInspectionResultResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'qc_parameter_id' => $this->qcParameter->uuid,
            'parameter_name' => $this->qcParameter->name,
            'value_numeric' => $this->value_numeric,
            'value_boolean' => $this->value_boolean !== null ? (bool) $this->value_boolean : null,
            'value_text' => $this->value_text,
            'is_within_spec' => (bool) $this->is_within_spec,
            'notes' => $this->notes,
        ];
    }
}
