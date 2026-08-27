<?php

declare(strict_types=1);

namespace App\Modules\Sales\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'direction'        => ['required', 'string', 'in:in,out'],
            'payment_date'     => ['required', 'date'],
            'method'           => ['required', 'string', 'in:cash,bank_transfer,cheque,card,mobile_banking,credit_adjustment'],
            'amount'           => ['required', 'numeric', 'gt:0'],
            'party_id'         => ['nullable', 'integer'],
            'company_id'       => ['nullable', 'integer'],
            'branch_id'        => ['nullable', 'integer'],
            'bank_account_id'  => ['nullable', 'integer'],
            'reference_number' => ['nullable', 'string', 'max:128'],
            'currency_code'    => ['nullable', 'string', 'size:3'],
            'notes'            => ['nullable', 'string', 'max:2000'],
            'payment_number'   => ['nullable', 'string', 'max:64'],
            'allocations'                         => ['nullable', 'array'],
            'allocations.*.allocatable_type'      => ['required_with:allocations', 'string', 'in:invoice,purchase_bill'],
            'allocations.*.allocatable_id'        => ['required_with:allocations', 'integer'],
            'allocations.*.amount'                => ['required_with:allocations', 'numeric', 'gt:0'],
        ];
    }
}
