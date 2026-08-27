<?php

declare(strict_types=1);

namespace App\Modules\Sales\Actions;

use App\Modules\Sales\Models\SalesOrder;
use Illuminate\Support\Facades\DB;

final class ApproveSalesOrderAction
{
    public function execute(SalesOrder $order, int $userId): SalesOrder
    {
        return DB::transaction(function () use ($order, $userId): SalesOrder {
            if ($order->status !== 'draft') {
                throw new \DomainException("Sales order [{$order->order_number}] cannot be confirmed from status [{$order->status}].");
            }

            $order->status       = 'confirmed';
            $order->confirmed_by = $userId;
            $order->confirmed_at = now();
            $order->save();

            return $order->refresh();
        });
    }
}
