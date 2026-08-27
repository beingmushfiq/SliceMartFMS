<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreStockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'integer'],
            'adjustment_date' => ['required', 'date'],
            'reason_code_id' => ['required', 'integer'],
            'adjustment_number' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.direction' => ['required', 'in:in,out'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_id' => ['required', 'integer'],
            'items.*.unit_cost' => ['nullable', 'numeric', 'gte:0'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.warehouse_location_id' => ['nullable', 'integer'],
            'items.*.batch_code' => ['nullable', 'string', 'max:64'],
        ];
    }
}
