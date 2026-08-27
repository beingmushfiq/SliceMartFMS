<?php

declare(strict_types=1);

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreProductionBatchRequest extends FormRequest
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
            'batch_number' => ['required', 'string', 'max:64'],
            'production_plan_item_id' => ['sometimes', 'nullable', 'uuid'],
            'factory_id' => ['required', 'uuid'],
            'production_line_id' => ['sometimes', 'nullable', 'uuid'],
            'product_id' => ['required', 'uuid'],
            'bill_of_material_id' => ['required', 'uuid'],
            'shift_id' => ['sometimes', 'nullable', 'uuid'],
            'batch_date' => ['required', 'date_format:Y-m-d'],
            'planned_quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,4'],
            'output_unit_id' => ['required', 'uuid'],
            'status' => ['sometimes', Rule::in(['draft', 'scheduled', 'in_progress', 'completed', 'closed', 'cancelled'])],
            'supervisor_id' => ['sometimes', 'nullable', 'uuid'],
        ];
    }
}
