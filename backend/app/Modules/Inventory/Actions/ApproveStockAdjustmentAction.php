<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Actions;

use App\Models\Product;
use App\Modules\Inventory\Models\StockAdjustment;
use Illuminate\Support\Facades\DB;

final class ApproveStockAdjustmentAction
{
    public function __construct(
        private readonly RecordStockMovementAction $recordMovement
    ) {}

    public function execute(StockAdjustment $adjustment, ?int $approvedBy = null): StockAdjustment
    {
        return DB::transaction(function () use ($adjustment, $approvedBy): StockAdjustment {
            $adjustment->status = 'approved';
            $adjustment->approved_by = $approvedBy;
            $adjustment->approved_at = now();
            $adjustment->save();

            /** @var \App\Modules\Inventory\Models\StockAdjustmentItem $item */
            foreach ($adjustment->items as $item) {
                /** @var numeric-string $diffQty */
                $diffQty = is_numeric($item->difference_quantity) ? (string) $item->difference_quantity : '0.0000';
                $direction = bccomp($diffQty, '0.0000', 4) >= 0 ? 'in' : 'out';
                /** @var numeric-string $qty */
                $qty = bccomp($diffQty, '0.0000', 4) >= 0 ? $diffQty : bcmul($diffQty, '-1', 4);
                $movementType = $direction === 'in' ? 'adjustment_gain' : 'adjustment_loss';

                /** @var Product|null $product */
                $product = $item->product;
                $unitId = $product instanceof Product ? $product->base_unit_id : 1;

                $movement = $this->recordMovement->execute([
                    'tenant_id' => $adjustment->tenant_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'warehouse_id' => $adjustment->warehouse_id,
                    'batch_code' => $item->batch_code,
                    'movement_type' => $movementType,
                    'direction' => $direction,
                    'quantity' => $qty,
                    'unit_id' => $unitId,
                    'unit_cost' => $item->unit_cost,
                    'reference_type' => 'stock_adjustments',
                    'reference_id' => $adjustment->id,
                    'reason_code_id' => $adjustment->reason_code_id,
                    'created_by' => $approvedBy,
                ]);

                $item->stock_movement_id = $movement->id;
                $item->save();
            }

            $refreshed = $adjustment->fresh(['items.product', 'warehouse', 'reasonCode']);

            return $refreshed instanceof StockAdjustment ? $refreshed : $adjustment;
        });
    }
}
