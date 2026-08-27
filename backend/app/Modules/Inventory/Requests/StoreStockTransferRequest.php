<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreStockTransferRequest extends FormRequest
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
            'from_warehouse_id' => ['required', 'integer'],
            'to_warehouse_id' => ['required', 'integer', 'different:from_warehouse_id'],
            'transfer_date' => ['required', 'date'],
            'transfer_number' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.sent_quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_id' => ['required', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.batch_code' => ['nullable', 'string', 'max:64'],
        ];
    }
}
