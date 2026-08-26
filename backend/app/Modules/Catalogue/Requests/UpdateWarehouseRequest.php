<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['code' => ['sometimes', 'string', 'max:32'], 'name' => ['sometimes', 'string', 'max:191'], 'type' => ['sometimes', 'string', 'max:32'], 'address' => ['sometimes', 'nullable', 'string'], 'company_id' => ['sometimes', 'nullable', 'uuid'], 'branch_id' => ['sometimes', 'nullable', 'uuid'], 'factory_id' => ['sometimes', 'nullable', 'uuid'], 'is_default' => ['sometimes', 'boolean'], 'allows_negative_stock' => ['sometimes', 'boolean'], 'is_active' => ['sometimes', 'boolean']];
    }
}
