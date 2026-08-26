<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateBillOfMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'product_id' => ['sometimes', 'uuid'], 'version' => ['sometimes', 'string', 'max:32'], 'name' => ['sometimes', 'string', 'max:191'],
            'output_quantity' => ['sometimes', 'numeric', 'gt:0', 'decimal:0,4'], 'output_unit_id' => ['sometimes', 'uuid'],
            'expected_yield_percentage' => ['sometimes', 'numeric', 'gte:0', 'lte:100', 'decimal:0,4'], 'status' => ['sometimes', Rule::in(['draft', 'active', 'archived'])],
            'effective_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'], 'effective_to' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:effective_from'],
            'items' => ['sometimes', 'array', 'min:1'], 'items.*.product_id' => ['required_with:items', 'uuid'], 'items.*.quantity' => ['required_with:items', 'numeric', 'gt:0', 'decimal:0,4'],
            'items.*.unit_id' => ['required_with:items', 'uuid'], 'items.*.wastage_allowance_percentage' => ['sometimes', 'numeric', 'gte:0', 'lte:100', 'decimal:0,4'],
            'items.*.is_optional' => ['sometimes', 'boolean'], 'items.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
