<?php

declare(strict_types=1);

namespace App\Modules\QC\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateQcInspectionRequest extends FormRequest
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
            'sample_size' => ['sometimes', 'required', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'inspected_quantity' => ['sometimes', 'required', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'passed_quantity' => ['sometimes', 'required', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'failed_quantity' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'rework_quantity' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'scrap_quantity' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'result' => ['sometimes', 'required', 'string', 'in:pass,fail,partial,hold'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
