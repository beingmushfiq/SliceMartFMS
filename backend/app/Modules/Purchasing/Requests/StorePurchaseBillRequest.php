<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StorePurchaseBillRequest extends FormRequest
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
            'bill_date' => ['required', 'date'],
            'bill_number' => ['nullable', 'string', 'max:64'],
            'purchase_order_id' => ['nullable', 'integer'],
            'goods_receipt_id' => ['nullable', 'integer'],
            'due_date' => ['nullable', 'date'],
            'supplier_invoice_number' => ['nullable', 'string', 'max:64'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_id' => ['required', 'integer'],
            'items.*.unit_price' => ['required', 'numeric', 'gte:0'],
            'items.*.purchase_order_item_id' => ['nullable', 'integer'],
            'items.*.goods_receipt_item_id' => ['nullable', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.discount_percentage' => ['nullable', 'numeric', 'gte:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'gte:0'],
            'items.*.tax_profile_id' => ['nullable', 'integer'],
            'items.*.tax_percentage' => ['nullable', 'numeric', 'gte:0'],
            'items.*.tax_amount' => ['nullable', 'numeric', 'gte:0'],
        ];
    }
}
