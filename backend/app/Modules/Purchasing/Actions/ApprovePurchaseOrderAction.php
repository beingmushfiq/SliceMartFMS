<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Actions;

use App\Modules\Purchasing\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

final class ApprovePurchaseOrderAction
{
    public function execute(PurchaseOrder $order, ?int $approvedBy = null): PurchaseOrder
    {
        return DB::transaction(function () use ($order, $approvedBy): PurchaseOrder {
            $order->status = 'approved';
            $order->approved_by = $approvedBy;
            $order->approved_at = now();
            $order->save();

            $refreshed = $order->fresh(['items.product', 'items.unit', 'supplier', 'warehouse']);

            return $refreshed instanceof PurchaseOrder ? $refreshed : $order;
        });
    }
}
