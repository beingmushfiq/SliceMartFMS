<?php

declare(strict_types=1);

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class RecordBatchInputRequest extends FormRequest
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
            'quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,4'],
            'unit_id' => ['required', 'uuid'],
            'source' => ['required', Rule::in(['material_issue', 'manual_count', 'weighbridge', 'carry_forward'])],
            'material_issue_item_id' => ['sometimes', 'nullable', 'uuid'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
