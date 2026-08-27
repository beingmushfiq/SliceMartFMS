<?php

declare(strict_types=1);

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateWorkerProductionEntryRequest extends FormRequest
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
            'rework_quantity' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'rejected_quantity' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'hours_worked' => ['nullable', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'rate_type' => ['nullable', 'string', 'in:piece_rate,hourly,fixed,none'],
            'rate' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
            'incentive_amount' => ['nullable', 'numeric', 'gte:0', 'regex:/^\d+(\.\d{1,4})?$/'],
        ];
    }
}
