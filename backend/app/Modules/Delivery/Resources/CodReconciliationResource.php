<?php

declare(strict_types=1);

namespace App\Modules\Delivery\Resources;

use App\Modules\Delivery\Models\CodReconciliation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CodReconciliation
 */
class CodReconciliationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'reconciliation_number' => $this->reconciliation_number,
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'period_start' => $this->period_start?->format('Y-m-d'),
            'period_end' => $this->period_end?->format('Y-m-d'),
            'expected_amount' => $this->expected_amount,
            'received_amount' => $this->received_amount,
            'variance_amount' => $this->variance_amount,
            'status' => $this->status,
            'reconciled_by' => $this->reconciled_by,
            'reconciled_by_name' => $this->reconciledBy?->name,
            'reconciled_at' => $this->reconciled_at?->toIso8601String(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
