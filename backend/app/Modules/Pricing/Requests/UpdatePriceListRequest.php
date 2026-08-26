<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdatePriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'string', 'max:32'],
            'name' => ['sometimes', 'string', 'max:191'],
            'currency_code' => ['sometimes', 'string', 'size:3'],
            'applies_to' => ['sometimes', Rule::in(['all', 'customer_group', 'channel'])],
            'channel' => ['sometimes', 'nullable', 'string', 'max:32'],
            'priority' => ['sometimes', 'integer', 'min:0'],
            'valid_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'valid_to' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:valid_from'],
            'is_active' => ['sometimes', 'boolean'],
            'items' => ['sometimes', 'array'],
            'items.*.product_id' => ['required_with:items', 'uuid'],
            'items.*.variant_id' => ['sometimes', 'nullable', 'uuid'],
            'items.*.min_quantity' => ['sometimes', 'numeric', 'gt:0', 'decimal:0,4'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'gte:0', 'decimal:0,4'],
            'items.*.discount_percentage' => ['sometimes', 'numeric', 'gte:0', 'lte:100', 'decimal:0,4'],
        ];
    }
}
