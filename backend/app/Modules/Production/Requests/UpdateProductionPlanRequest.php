<?php

declare(strict_types=1);

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateProductionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'plan_date' => ['sometimes', 'date_format:Y-m-d'],
            'period_start' => ['sometimes', 'date_format:Y-m-d'],
            'period_end' => ['sometimes', 'date_format:Y-m-d'],
            'source' => ['sometimes', Rule::in(['manual', 'forecast', 'sales_order', 'mrp'])],
            'status' => ['sometimes', Rule::in(['draft', 'approved', 'in_progress', 'completed', 'cancelled'])],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_id' => ['required_with:items', 'uuid'],
            'items.*.bill_of_material_id' => ['required_with:items', 'uuid'],
            'items.*.planned_quantity' => ['required_with:items', 'numeric', 'gt:0', 'decimal:0,4'],
            'items.*.unit_id' => ['required_with:items', 'uuid'],
            'items.*.production_line_id' => ['sometimes', 'nullable', 'uuid'],
            'items.*.scheduled_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'items.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
