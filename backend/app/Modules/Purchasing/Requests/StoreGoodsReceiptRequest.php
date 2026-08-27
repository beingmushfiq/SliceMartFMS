<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreGoodsReceiptRequest extends FormRequest
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
            'party_id' => ['required', 'integer'],
            'warehouse_id' => ['required', 'integer'],
            'receipt_date' => ['required', 'date'],
            'grn_number' => ['nullable', 'string', 'max:64'],
            'purchase_order_id' => ['nullable', 'integer'],
            'supplier_document_number' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.received_quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_id' => ['required', 'integer'],
            'items.*.unit_cost' => ['required', 'numeric', 'gte:0'],
            'items.*.rejected_quantity' => ['nullable', 'numeric', 'gte:0'],
            'items.*.accepted_quantity' => ['nullable', 'numeric', 'gte:0'],
            'items.*.purchase_order_item_id' => ['nullable', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.warehouse_location_id' => ['nullable', 'integer'],
            'items.*.batch_code' => ['nullable', 'string', 'max:64'],
            'items.*.serial_number' => ['nullable', 'string', 'max:64'],
            'items.*.expiry_date' => ['nullable', 'date'],
        ];
    }
}
