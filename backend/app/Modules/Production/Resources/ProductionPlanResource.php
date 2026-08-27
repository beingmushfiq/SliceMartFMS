<?php

declare(strict_types=1);

namespace App\Modules\Production\Resources;

use App\Models\ProductionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

/**
 * @mixin ProductionPlan
 */
final class ProductionPlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $companyUuid = DB::table('companies')->where('id', $this->company_id)->value('uuid');
        $factoryUuid = DB::table('factories')->where('id', $this->factory_id)->value('uuid');

        return [
            'id' => $this->uuid,
            'company_id' => is_string($companyUuid) ? $companyUuid : '',
            'factory_id' => is_string($factoryUuid) ? $factoryUuid : '',
            'plan_number' => $this->plan_number,
            'plan_date' => $this->plan_date->toDateString(),
            'period_start' => $this->period_start->toDateString(),
            'period_end' => $this->period_end->toDateString(),
            'source' => $this->source,
            'status' => $this->status,
            'notes' => $this->notes,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'approved_by' => $this->approver?->uuid,
            'items' => ProductionPlanItemResource::collection($this->items),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
