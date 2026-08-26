<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreBillOfMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid'], 'version' => ['required', 'string', 'max:32'], 'name' => ['required', 'string', 'max:191'],
            'output_quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,4'], 'output_unit_id' => ['required', 'uuid'],
            'expected_yield_percentage' => ['sometimes', 'numeric', 'gte:0', 'lte:100', 'decimal:0,4'], 'status' => ['sometimes', Rule::in(['draft', 'active', 'archived'])],
            'effective_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'], 'effective_to' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:effective_from'],
            'items' => ['required', 'array', 'min:1'], 'items.*.product_id' => ['required', 'uuid'], 'items.*.quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,4'],
            'items.*.unit_id' => ['required', 'uuid'], 'items.*.wastage_allowance_percentage' => ['sometimes', 'numeric', 'gte:0', 'lte:100', 'decimal:0,4'],
            'items.*.is_optional' => ['sometimes', 'boolean'], 'items.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
