<?php

declare(strict_types=1);

namespace App\Modules\Sales\Actions;

use App\Modules\Sales\Models\Invoice;
use Illuminate\Support\Facades\DB;

final class ApproveInvoiceAction
{
    public function execute(Invoice $invoice, int $userId): Invoice
    {
        return DB::transaction(function () use ($invoice, $userId): Invoice {
            if ($invoice->status !== 'draft') {
                throw new \DomainException("Invoice [{$invoice->invoice_number}] cannot be posted from status [{$invoice->status}].");
            }

            $invoice->status    = 'posted';
            $invoice->posted_by = $userId;
            $invoice->posted_at = now();
            $invoice->save();

            return $invoice->refresh();
        });
    }
}
