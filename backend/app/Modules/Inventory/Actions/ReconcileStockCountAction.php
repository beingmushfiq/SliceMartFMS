<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Actions;

use App\Models\Product;
use App\Modules\Inventory\Models\StockCount;
use Illuminate\Support\Facades\DB;

final class ReconcileStockCountAction
{
    public function __construct(
        private readonly RecordStockMovementAction $recordMovement
    ) {}

    /**
     * @param list<array{
     *     item_id: int,
     *     counted_quantity: numeric-string|string,
     *     reason_code_id?: int|null
     * }> $counts
     */
    public function execute(StockCount $stockCount, array $counts, ?int $reconciledBy = null): StockCount
    {
        return DB::transaction(function () use ($stockCount, $counts, $reconciledBy): StockCount {
            $countsMap = [];
            foreach ($counts as $c) {
                $countsMap[$c['item_id']] = [
                    'counted' => is_numeric($c['counted_quantity']) ? (string) $c['counted_quantity'] : '0.0000',
                    'reason_code_id' => $c['reason_code_id'] ?? null,
                ];
            }

            /** @var \App\Modules\Inventory\Models\StockCountItem $item */
            foreach ($stockCount->items as $item) {
                if (! isset($countsMap[$item->id])) {
                    continue;
                }

                /** @var numeric-string $counted */
                $counted = $countsMap[$item->id]['counted'];
                $reasonCodeId = $countsMap[$item->id]['reason_code_id'];
                /** @var numeric-string $systemQty */
                $systemQty = is_numeric($item->system_quantity) ? (string) $item->system_quantity : '0.0000';
                /** @var numeric-string $variance */
                $variance = bcsub($counted, $systemQty, 4);

                $item->counted_quantity = $counted;
                $item->variance_quantity = $variance;
                $item->status = 'accepted';
                $item->counted_by = $reconciledBy;
                $item->counted_at = now();

                // If non-zero variance, post adjusting stock movement
                if (bccomp($variance, '0.0000', 4) !== 0) {
                    $direction = bccomp($variance, '0.0000', 4) > 0 ? 'in' : 'out';
                    /** @var numeric-string $adjQty */
                    $adjQty = bccomp($variance, '0.0000', 4) > 0 ? $variance : bcmul($variance, '-1', 4);
                    $movementType = $direction === 'in' ? 'adjustment_gain' : 'adjustment_loss';

                    /** @var Product|null $product */
                    $product = $item->product;
                    $unitId = $product instanceof Product ? $product->base_unit_id : 1;

                    $this->recordMovement->execute([
                        'tenant_id' => $stockCount->tenant_id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'warehouse_id' => $stockCount->warehouse_id,
                        'warehouse_location_id' => $item->warehouse_location_id,
                        'batch_code' => $item->batch_code,
                        'movement_type' => $movementType,
                        'direction' => $direction,
                        'quantity' => $adjQty,
                        'unit_id' => $unitId,
                        'reference_type' => 'stock_counts',
                        'reference_id' => $stockCount->id,
                        'reason_code_id' => $reasonCodeId,
                        'created_by' => $reconciledBy,
                    ]);
                }

                $item->save();
            }

            $stockCount->status = 'reconciled';
            $stockCount->reconciled_by = $reconciledBy;
            $stockCount->reconciled_at = now();
            $stockCount->save();

            $refreshed = $stockCount->fresh(['items.product', 'warehouse']);

            return $refreshed instanceof StockCount ? $refreshed : $stockCount;
        });
    }
}
