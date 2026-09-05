<?php

declare(strict_types=1);

namespace App\Modules\QC\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateWastageRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'quantity' => ['sometimes', 'required', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'unit_id' => ['sometimes', 'required', 'string', 'uuid'],
            'reason_code_id' => ['sometimes', 'required', 'string', 'uuid'],
            'estimated_cost' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'is_recoverable' => ['nullable', 'boolean'],
            'recovered_quantity' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'warehouse_id' => ['nullable', 'string', 'uuid'],
            'stage' => ['nullable', 'string', 'in:input,in_process,output,qc'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
