<?php

declare(strict_types=1);

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class RecordBatchOutputRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid'],
            'variant_id' => ['sometimes', 'nullable', 'uuid'],
            'quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,4'],
            'unit_id' => ['required', 'uuid'],
            'output_type' => ['required', Rule::in(['primary', 'by_product', 'semi_finished'])],
            'batch_code' => ['sometimes', 'nullable', 'string', 'max:64'],
            'expiry_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'target_warehouse_id' => ['required', 'uuid'],
            'qc_required' => ['sometimes', 'boolean'],
        ];
    }
}
