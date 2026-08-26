<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateBrandRequest extends FormRequest
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
            'code' => ['sometimes', 'string', 'max:32'],
            'name' => ['sometimes', 'string', 'max:191'],
            'logo_path' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
