<?php

declare(strict_types=1);

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Actions\RollupProductionCostAction;
use App\Modules\Finance\Models\ProductCost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CostingController extends Controller
{
    public function __construct(
        private readonly RollupProductionCostAction $rollupProductionCostAction
    ) {}

    public function index(Request $request): JsonResponse
    {
        $costs = ProductCost::query()->with(['product', 'variant'])->orderByDesc('calculated_at')->paginate(20);

        return response()->json($costs);
    }

    public function rollup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer',
            'variant_id' => 'nullable|integer',
            'warehouse_id' => 'nullable|integer',
            'production_batch_id' => 'nullable|integer',
            'overhead_rate' => 'nullable|numeric|min:0',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);
        $cost = $this->rollupProductionCostAction->execute($validated, $userId);

        return response()->json([
            'data' => $cost->load(['product', 'variant']),
            'message' => 'Production cost rolled up successfully from material, labour, and overhead.',
        ], 201);
    }
}
