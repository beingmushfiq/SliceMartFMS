<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreCategoryRequest extends FormRequest
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
            'parent_id' => ['nullable', 'uuid'],
            'code' => ['required', 'string', 'max:32'],
            'name' => ['required', 'string', 'max:191'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
