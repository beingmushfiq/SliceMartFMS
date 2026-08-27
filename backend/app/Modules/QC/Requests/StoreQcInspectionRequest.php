<?php

declare(strict_types=1);

namespace App\Modules\QC\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreQcInspectionRequest extends FormRequest
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
            'inspection_number' => ['required', 'string', 'max:64'],
            'production_batch_id' => ['nullable', 'string', 'uuid'],
            'production_output_id' => ['nullable', 'string', 'uuid'],
            'inspection_date' => ['required', 'date_format:Y-m-d'],
            'inspector_id' => ['required', 'string', 'uuid'],
            'sample_size' => ['required', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'inspected_quantity' => ['required', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'passed_quantity' => ['required', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'failed_quantity' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'rework_quantity' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'scrap_quantity' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'result' => ['required', 'string', 'in:pass,fail,partial,hold'],
            'notes' => ['nullable', 'string'],

            // Nested inspection results
            'results' => ['nullable', 'array'],
            'results.*.qc_parameter_id' => ['required', 'string', 'uuid'],
            'results.*.value_numeric' => ['nullable', 'numeric', 'regex:/^-?\d+(\.\d{1,4})?$/'],
            'results.*.value_boolean' => ['nullable', 'boolean'],
            'results.*.value_text' => ['nullable', 'string'],
            'results.*.is_within_spec' => ['required', 'boolean'],
            'results.*.notes' => ['nullable', 'string'],

            // Nested defects
            'defects' => ['nullable', 'array'],
            'defects.*.defect_reason_id' => ['required', 'string', 'uuid'],
            'defects.*.quantity' => ['required', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'defects.*.severity' => ['nullable', 'string', 'in:minor,major,critical'],
            'defects.*.notes' => ['nullable', 'string'],
        ];
    }
}
