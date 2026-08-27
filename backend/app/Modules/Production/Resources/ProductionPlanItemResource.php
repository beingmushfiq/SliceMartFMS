<?php

declare(strict_types=1);

namespace App\Modules\Production\Resources;

use App\Models\ProductionPlanItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

/**
 * @mixin ProductionPlanItem
 */
final class ProductionPlanItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $lineUuid = $this->production_line_id !== null
            ? DB::table('production_lines')->where('id', $this->production_line_id)->value('uuid')
            : null;

        return [
            'id' => $this->uuid,
            'product_id' => $this->product->uuid,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'bill_of_material_id' => $this->billOfMaterial->uuid,
            'bom_version' => $this->billOfMaterial->version,
            'planned_quantity' => $this->planned_quantity,
            'produced_quantity' => $this->produced_quantity,
            'unit_id' => $this->unit->uuid,
            'unit_code' => $this->unit->code,
            'production_line_id' => is_string($lineUuid) ? $lineUuid : null,
            'scheduled_date' => $this->scheduled_date?->toDateString(),
            'status' => $this->status,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
