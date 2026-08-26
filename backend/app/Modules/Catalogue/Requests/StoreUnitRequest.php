<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Requests;

use App\Modules\Catalogue\Enums\UnitType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreUnitRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:32'],
            'name' => ['required', 'string', 'max:191'],
            'type' => ['required', Rule::in(UnitType::values())],
            'is_base' => ['sometimes', 'boolean'],
            'precision' => ['sometimes', 'integer', 'min:0', 'max:9'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
