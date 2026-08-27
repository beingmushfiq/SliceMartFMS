<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ReconcileStockCountRequest extends FormRequest
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
            'items' => ['required_without:counts', 'array'],
            'items.*.item_id' => ['required_with:items', 'integer'],
            'items.*.counted_quantity' => ['required_with:items', 'numeric', 'gte:0'],
            'items.*.reason_code_id' => ['nullable', 'integer'],
            'counts' => ['required_without:items', 'array'],
            'counts.*.item_id' => ['required_with:counts', 'integer'],
            'counts.*.counted_quantity' => ['required_with:counts', 'numeric', 'gte:0'],
            'counts.*.reason_code_id' => ['nullable', 'integer'],
        ];
    }
}
