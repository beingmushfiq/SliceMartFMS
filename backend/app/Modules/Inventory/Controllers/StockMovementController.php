<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\StockBalance;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Resources\StockBalanceResource;
use App\Modules\Inventory\Resources\StockMovementResource;
use App\Core\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class StockMovementController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenantId = TenantContext::current()->tenantId();

        $query = StockMovement::with(['product', 'warehouse', 'unit', 'reasonCode'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('product_id')) {
            $query->where('product_id', (int) $request->query('product_id'));
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->query('warehouse_id'));
        }

        if ($request->filled('movement_type')) {
            $query->where('movement_type', (string) $request->query('movement_type'));
        }

        if ($request->filled('direction')) {
            $query->where('direction', (string) $request->query('direction'));
        }

        if ($request->filled('q')) {
            $search = (string) $request->query('q');
            $query->where(function ($q) use ($search): void {
                $q->where('movement_number', 'like', "%{$search}%")
                    ->orWhere('batch_code', 'like', "%{$search}%");
            });
        }

        $movements = $query->orderByDesc('moved_at')
            ->orderByDesc('id')
            ->paginate((int) ($request->query('per_page') ?? 25));

        return StockMovementResource::collection($movements);
    }

    public function show(int $id): StockMovementResource
    {
        $tenantId = TenantContext::current()->tenantId();

        $movement = StockMovement::with(['product', 'warehouse', 'unit', 'reasonCode'])
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return new StockMovementResource($movement);
    }

    public function balances(Request $request): AnonymousResourceCollection
    {
        $tenantId = TenantContext::current()->tenantId();

        $query = StockBalance::with(['product', 'warehouse'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('product_id')) {
            $query->where('product_id', (int) $request->query('product_id'));
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->query('warehouse_id'));
        }

        if ($request->filled('stock_state')) {
            $query->where('stock_state', (string) $request->query('stock_state'));
        }

        $balances = $query->orderBy('warehouse_id')
            ->orderBy('product_id')
            ->paginate((int) ($request->query('per_page') ?? 50));

        return StockBalanceResource::collection($balances);
    }
}
