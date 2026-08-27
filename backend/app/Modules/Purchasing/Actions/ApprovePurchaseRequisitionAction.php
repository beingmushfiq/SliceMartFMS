<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Actions;

use App\Modules\Purchasing\Models\PurchaseRequisition;
use Illuminate\Support\Facades\DB;

final class ApprovePurchaseRequisitionAction
{
    public function execute(PurchaseRequisition $requisition, ?int $approvedBy = null): PurchaseRequisition
    {
        return DB::transaction(function () use ($requisition, $approvedBy): PurchaseRequisition {
            $requisition->status = 'approved';
            $requisition->approved_by = $approvedBy;
            $requisition->approved_at = now();
            $requisition->save();

            $refreshed = $requisition->fresh(['items.product', 'items.unit', 'warehouse', 'requester']);

            return $refreshed instanceof PurchaseRequisition ? $refreshed : $requisition;
        });
    }
}
