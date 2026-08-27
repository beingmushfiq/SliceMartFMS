<?php

declare(strict_types=1);

namespace App\Modules\Sales\Actions;

use App\Modules\Sales\Models\Payment;
use App\Modules\Sales\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RecordPaymentAction
{
    /**
     * @param array{
     *     tenant_id: int,
     *     direction: string,
     *     party_id?: int|null,
     *     company_id?: int|null,
     *     branch_id?: int|null,
     *     payment_date: string,
     *     method: string,
     *     bank_account_id?: int|null,
     *     reference_number?: string|null,
     *     amount: string,
     *     currency_code?: string,
     *     notes?: string|null,
     *     received_by?: int|null,
     *     created_by?: int|null,
     *     payment_number?: string,
     *     allocations?: list<array{
     *         allocatable_type: string,
     *         allocatable_id: int,
     *         amount: string
     *     }>
     * } $data
     */
    public function execute(array $data): Payment
    {
        return DB::transaction(function () use ($data): Payment {
            $paymentNumber = $data['payment_number'] ?? ('PAY-' . date('Ymd') . '-' . strtoupper(Str::random(6)));

            /** @var numeric-string $amount */
            $amount = is_numeric($data['amount']) ? (string) $data['amount'] : '0.0000';

            // Calculate allocated_amount from provided allocations
            /** @var numeric-string $allocatedAmount */
            $allocatedAmount = '0.0000';
            foreach ($data['allocations'] ?? [] as $alloc) {
                /** @var numeric-string $allocAmt */
                $allocAmt = is_numeric($alloc['amount']) ? (string) $alloc['amount'] : '0.0000';
                $allocatedAmount = bcadd($allocatedAmount, $allocAmt, 4);
            }
            /** @var numeric-string $unallocated */
            $unallocated = bcsub($amount, $allocatedAmount, 4);

            $payment = Payment::create([
                'tenant_id'          => $data['tenant_id'],
                'payment_number'     => $paymentNumber,
                'direction'          => $data['direction'],
                'party_id'           => $data['party_id'] ?? null,
                'company_id'         => $data['company_id'] ?? null,
                'branch_id'          => $data['branch_id'] ?? null,
                'payment_date'       => $data['payment_date'],
                'method'             => $data['method'],
                'bank_account_id'    => $data['bank_account_id'] ?? null,
                'reference_number'   => $data['reference_number'] ?? null,
                'amount'             => $amount,
                'allocated_amount'   => $allocatedAmount,
                'unallocated_amount' => $unallocated,
                'currency_code'      => $data['currency_code'] ?? 'BDT',
                'status'             => 'posted',
                'received_by'        => $data['received_by'] ?? null,
                'posted_at'          => now(),
                'notes'              => $data['notes'] ?? null,
                'created_by'         => $data['created_by'] ?? null,
            ]);

            foreach ($data['allocations'] ?? [] as $alloc) {
                /** @var numeric-string $allocAmt */
                $allocAmt = is_numeric($alloc['amount']) ? (string) $alloc['amount'] : '0.0000';

                PaymentAllocation::create([
                    'tenant_id'        => $data['tenant_id'],
                    'payment_id'       => $payment->id,
                    'allocatable_type' => $alloc['allocatable_type'],
                    'allocatable_id'   => $alloc['allocatable_id'],
                    'amount'           => $allocAmt,
                    'created_by'       => $data['created_by'] ?? null,
                ]);
            }

            return $payment->load(['allocations', 'party']);
        });
    }
}
