<?php

declare(strict_types=1);

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreProductionPlanRequest extends FormRequest
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
            'company_id' => ['required', 'uuid'],
            'factory_id' => ['required', 'uuid'],
            'plan_number' => ['required', 'string', 'max:64'],
            'plan_date' => ['required', 'date_format:Y-m-d'],
            'period_start' => ['required', 'date_format:Y-m-d'],
            'period_end' => ['required', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'source' => ['required', Rule::in(['manual', 'forecast', 'sales_order', 'mrp'])],
            'status' => ['sometimes', Rule::in(['draft', 'approved', 'in_progress', 'completed', 'cancelled'])],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid'],
            'items.*.bill_of_material_id' => ['required', 'uuid'],
            'items.*.planned_quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,4'],
            'items.*.unit_id' => ['required', 'uuid'],
            'items.*.production_line_id' => ['sometimes', 'nullable', 'uuid'],
            'items.*.scheduled_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'items.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
