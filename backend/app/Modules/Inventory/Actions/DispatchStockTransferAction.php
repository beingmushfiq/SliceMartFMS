<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Actions;

use App\Modules\Inventory\Models\StockTransfer;
use Illuminate\Support\Facades\DB;

final class DispatchStockTransferAction
{
    public function __construct(
        private readonly RecordStockMovementAction $recordMovement
    ) {}

    public function execute(StockTransfer $transfer, ?int $dispatchedBy = null): StockTransfer
    {
        return DB::transaction(function () use ($transfer, $dispatchedBy): StockTransfer {
            $transfer->status = 'in_transit';
            $transfer->dispatched_by = $dispatchedBy;
            $transfer->dispatched_at = now();
            $transfer->save();

            /** @var \App\Modules\Inventory\Models\StockTransferItem $item */
            foreach ($transfer->items as $item) {
                // Record stock movement OUT from source warehouse
                $movement = $this->recordMovement->execute([
                    'tenant_id' => $transfer->tenant_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'warehouse_id' => $transfer->from_warehouse_id,
                    'batch_code' => $item->batch_code,
                    'movement_type' => 'transfer_out',
                    'direction' => 'out',
                    'quantity' => $item->sent_quantity,
                    'unit_id' => $item->unit_id,
                    'reference_type' => 'stock_transfers',
                    'reference_id' => $transfer->id,
                    'created_by' => $dispatchedBy,
                ]);

                $item->out_movement_id = $movement->id;
                $item->save();
            }

            $refreshed = $transfer->fresh(['items.product', 'items.unit', 'fromWarehouse', 'toWarehouse']);

            return $refreshed instanceof StockTransfer ? $refreshed : $transfer;
        });
    }
}
