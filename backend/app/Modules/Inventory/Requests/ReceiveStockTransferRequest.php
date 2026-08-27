<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ReceiveStockTransferRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer'],
            'items.*.received_quantity' => ['required', 'numeric', 'gte:0'],
            'items.*.damaged_quantity' => ['nullable', 'numeric', 'gte:0'],
        ];
    }
}
