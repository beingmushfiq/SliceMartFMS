<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Actions;

use App\Modules\Inventory\Models\StockTransfer;
use Illuminate\Support\Facades\DB;

final class ReceiveStockTransferAction
{
    public function __construct(
        private readonly RecordStockMovementAction $recordMovement
    ) {}

    /**
     * @param list<array{
     *     item_id: int,
     *     received_quantity: numeric-string|string,
     *     damaged_quantity?: numeric-string|string
     * }> $receiptItems
     */
    public function execute(StockTransfer $transfer, array $receiptItems, ?int $receivedBy = null): StockTransfer
    {
        return DB::transaction(function () use ($transfer, $receiptItems, $receivedBy): StockTransfer {
            $itemsMap = [];
            foreach ($receiptItems as $ri) {
                $itemsMap[$ri['item_id']] = [
                    'received' => is_numeric($ri['received_quantity']) ? (string) $ri['received_quantity'] : '0.0000',
                    'damaged' => isset($ri['damaged_quantity']) && is_numeric($ri['damaged_quantity']) ? (string) $ri['damaged_quantity'] : '0.0000',
                ];
            }

            /** @var \App\Modules\Inventory\Models\StockTransferItem $item */
            foreach ($transfer->items as $item) {
                /** @var numeric-string $receivedQty */
                $receivedQty = isset($itemsMap[$item->id]['received'])
                    ? $itemsMap[$item->id]['received']
                    : (is_numeric($item->sent_quantity) ? (string) $item->sent_quantity : '0.0000');
                /** @var numeric-string $damagedQty */
                $damagedQty = isset($itemsMap[$item->id]['damaged'])
                    ? $itemsMap[$item->id]['damaged']
                    : '0.0000';

                $item->received_quantity = $receivedQty;
                $item->damaged_quantity = $damagedQty;

                // Record IN movement at destination warehouse for received quantity
                if (bccomp($receivedQty, '0.0000', 4) > 0) {
                    $inMovement = $this->recordMovement->execute([
                        'tenant_id' => $transfer->tenant_id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'warehouse_id' => $transfer->to_warehouse_id,
                        'batch_code' => $item->batch_code,
                        'movement_type' => 'transfer_in',
                        'direction' => 'in',
                        'quantity' => $receivedQty,
                        'unit_id' => $item->unit_id,
                        'reference_type' => 'stock_transfers',
                        'reference_id' => $transfer->id,
                        'created_by' => $receivedBy,
                    ]);

                    $item->in_movement_id = $inMovement->id;
                }

                // If damaged, record as damaged stock state
                if (bccomp($damagedQty, '0.0000', 4) > 0) {
                    $this->recordMovement->execute([
                        'tenant_id' => $transfer->tenant_id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'warehouse_id' => $transfer->to_warehouse_id,
                        'batch_code' => $item->batch_code,
                        'movement_type' => 'transfer_damage',
                        'direction' => 'in',
                        'stock_state' => 'damaged',
                        'quantity' => $damagedQty,
                        'unit_id' => $item->unit_id,
                        'reference_type' => 'stock_transfers',
                        'reference_id' => $transfer->id,
                        'created_by' => $receivedBy,
                    ]);
                }

                $item->save();
            }

            $transfer->status = 'received';
            $transfer->received_by = $receivedBy;
            $transfer->received_at = now();
            $transfer->save();

            $refreshed = $transfer->fresh(['items.product', 'items.unit', 'fromWarehouse', 'toWarehouse']);

            return $refreshed instanceof StockTransfer ? $refreshed : $transfer;
        });
    }
}
