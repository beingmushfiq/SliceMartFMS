<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdatePartyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'string', 'max:32'],
            'name' => ['sometimes', 'string', 'max:191'],
            'legal_name' => ['sometimes', 'nullable', 'string', 'max:191'],
            'is_supplier' => ['sometimes', 'boolean'],
            'is_customer' => ['sometimes', 'boolean'],
            'is_dealer' => ['sometimes', 'boolean'],
            'is_agent' => ['sometimes', 'boolean'],
            'type' => ['sometimes', Rule::in(['individual', 'business'])],
            'tax_identifier' => ['sometimes', 'nullable', 'string', 'max:64'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'email' => ['sometimes', 'nullable', 'email', 'max:191'],
            'credit_limit' => ['sometimes', 'numeric', 'min:0'],
            'credit_days' => ['sometimes', 'integer', 'min:0', 'max:65535'],
            'price_list_id' => ['sometimes', 'nullable', 'uuid'],
            'tax_profile_id' => ['sometimes', 'nullable', 'uuid'],
            'opening_balance' => ['sometimes', 'numeric'],
            'assigned_to' => ['sometimes', 'nullable', 'uuid'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'blacklisted', 'blocked'])],

            // Optional nested addresses
            'addresses' => ['sometimes', 'array'],
            'addresses.*.uuid' => ['sometimes', 'nullable', 'uuid'],
            'addresses.*.type' => ['required_with:addresses', Rule::in(['billing', 'shipping'])],
            'addresses.*.label' => ['sometimes', 'nullable', 'string', 'max:64'],
            'addresses.*.contact_name' => ['sometimes', 'nullable', 'string', 'max:191'],
            'addresses.*.phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'addresses.*.line1' => ['required_with:addresses', 'string', 'max:191'],
            'addresses.*.line2' => ['sometimes', 'nullable', 'string', 'max:191'],
            'addresses.*.area' => ['sometimes', 'nullable', 'string', 'max:100'],
            'addresses.*.city' => ['required_with:addresses', 'string', 'max:100'],
            'addresses.*.district' => ['sometimes', 'nullable', 'string', 'max:100'],
            'addresses.*.postal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'addresses.*.country_code' => ['sometimes', 'string', 'size:2'],
            'addresses.*.latitude' => ['sometimes', 'nullable', 'numeric'],
            'addresses.*.longitude' => ['sometimes', 'nullable', 'numeric'],
            'addresses.*.is_default' => ['sometimes', 'boolean'],

            // Optional nested contacts
            'contacts' => ['sometimes', 'array'],
            'contacts.*.uuid' => ['sometimes', 'nullable', 'uuid'],
            'contacts.*.name' => ['required_with:contacts', 'string', 'max:191'],
            'contacts.*.designation' => ['sometimes', 'nullable', 'string', 'max:100'],
            'contacts.*.phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'contacts.*.email' => ['sometimes', 'nullable', 'email', 'max:191'],
            'contacts.*.is_primary' => ['sometimes', 'boolean'],
        ];
    }
}
