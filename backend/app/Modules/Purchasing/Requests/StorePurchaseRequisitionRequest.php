<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StorePurchaseRequisitionRequest extends FormRequest
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
            'requisition_date' => ['nullable', 'date'],
            'requisition_number' => ['nullable', 'string', 'max:64'],
            'required_by_date' => ['nullable', 'date'],
            'department' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_id' => ['required', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.estimated_unit_cost' => ['nullable', 'numeric', 'gte:0'],
            'items.*.reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
