<?php

declare(strict_types=1);

namespace App\Modules\Finance\Actions;

use App\Models\Product;
use App\Models\ProductionBatch;
use App\Modules\Finance\Models\ProductCost;
use Illuminate\Support\Facades\DB;

class RollupProductionCostAction
{
    /**
     * Calculates and saves itemized production cost for a batch or product.
     *
     * @param array{
     *     product_id: int,
     *     variant_id?: int,
     *     warehouse_id?: int,
     *     production_batch_id?: int,
     *     overhead_rate?: float|string,
     * } $data
     */
    public function execute(array $data, int $userId): ProductCost
    {
        return DB::transaction(function () use ($data, $userId): ProductCost {
            $productId = $data['product_id'];
            $batchId = $data['production_batch_id'] ?? null;

            $materialCost = '0.0000';
            $labourCost = '0.0000';
            $overheadCost = (string) ($data['overhead_rate'] ?? '25.0000');

            if ($batchId) {
                $batch = ProductionBatch::findOrFail($batchId);
                $outputQty = (float) $batch->planned_quantity > 0 ? (float) $batch->planned_quantity : 1.0;

                // 1. Material cost rollup from batch inputs
                $totalMaterialCost = DB::table('production_batch_inputs')
                    ->where('production_batch_id', $batchId)
                    ->sum(DB::raw('consumed_quantity * unit_cost'));
                $materialCost = bcdiv((string) ($totalMaterialCost ?: '0.0000'), (string) $outputQty, 4);

                // 2. Labour cost rollup from worker production piece-rate entries
                $totalLabour = DB::table('worker_production_entries')
                    ->where('production_batch_id', $batchId)
                    ->sum(DB::raw('quantity * COALESCE(rate, 0) + COALESCE(incentive_amount, 0)'));
                $labourCost = bcdiv((string) ($totalLabour ?: '0.0000'), (string) $outputQty, 4);
            } else {
                // Default / standard BOM rollup calculation
                $bom = DB::table('bill_of_materials')
                    ->where('product_id', $productId)
                    ->where('is_active', true)
                    ->first();

                if ($bom) {
                    $materialCost = (string) ($bom->total_material_cost ?? '50.0000');
                    $labourCost = (string) ($bom->total_labour_cost ?? '20.0000');
                    $overheadCost = (string) ($bom->total_overhead_cost ?? '10.0000');
                }
            }

            $totalCost = bcadd(bcadd($materialCost, $labourCost, 4), $overheadCost, 4);

            return ProductCost::create([
                'product_id' => $productId,
                'variant_id' => $data['variant_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'costing_method' => 'standard',
                'material_cost' => $materialCost,
                'labour_cost' => $labourCost,
                'overhead_cost' => $overheadCost,
                'total_cost' => $totalCost,
                'standard_cost' => $totalCost,
                'effective_from' => date('Y-m-d'),
                'source' => $batchId ? 'production' : 'recalculation',
                'source_reference_type' => $batchId ? ProductionBatch::class : null,
                'source_reference_id' => $batchId,
                'calculated_at' => now(),
                'created_by' => $userId,
            ]);
        });
    }
}
