<?php

declare(strict_types=1);

namespace App\Modules\Production\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateProductionBatchRequest extends FormRequest
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
            'batch_date' => ['sometimes', 'date_format:Y-m-d'],
            'production_line_id' => ['sometimes', 'nullable', 'uuid'],
            'shift_id' => ['sometimes', 'nullable', 'uuid'],
            'planned_quantity' => ['sometimes', 'numeric', 'gt:0', 'decimal:0,4'],
            'status' => ['sometimes', Rule::in(['draft', 'scheduled', 'in_progress', 'completed', 'closed', 'cancelled'])],
            'supervisor_id' => ['sometimes', 'nullable', 'uuid'],
        ];
    }
}
