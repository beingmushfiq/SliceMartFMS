<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreStockCountRequest extends FormRequest
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
            'count_date' => ['required', 'date'],
            'count_type' => ['required', 'string', 'in:full,cycle,spot'],
            'count_number' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer'],
        ];
    }
}
