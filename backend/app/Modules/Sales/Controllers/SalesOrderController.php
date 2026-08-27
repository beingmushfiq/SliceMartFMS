<?php

declare(strict_types=1);

namespace App\Modules\Sales\Controllers;

use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Modules\Sales\Actions\ApproveSalesOrderAction;
use App\Modules\Sales\Actions\CreateSalesOrderAction;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Requests\StoreSalesOrderRequest;
use App\Modules\Sales\Resources\SalesOrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class SalesOrderController extends Controller
{
    public function __construct(
        private readonly CreateSalesOrderAction $createOrder,
        private readonly ApproveSalesOrderAction $approveOrder
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $tenantId = TenantContext::current()->tenantId();

        $query = SalesOrder::with(['customer', 'warehouse', 'items.product', 'items.unit'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', (string) $request->query('payment_status'));
        }

        if ($request->filled('channel')) {
            $query->where('channel', (string) $request->query('channel'));
        }

        if ($request->filled('party_id')) {
            $query->where('party_id', (int) $request->query('party_id'));
        }

        if ($request->filled('q')) {
            $search = (string) $request->query('q');
            $query->where('order_number', 'like', "%{$search}%");
        }

        $orders = $query->orderByDesc('order_date')
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 25));

        return SalesOrderResource::collection($orders);
    }

    public function store(StoreSalesOrderRequest $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $validated = $request->validated();

        /** @var array{order_date: string, items: list<array{product_id: int, quantity: string, unit_id: int, unit_price: string}>} $validated */
        $order = $this->createOrder->execute([
            ...$validated,
            'tenant_id'  => $tenantId,
            'created_by' => (int) $request->user()?->id,
        ]);

        return (new SalesOrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): SalesOrderResource
    {
        $tenantId = TenantContext::current()->tenantId();

        $order = SalesOrder::with(['customer', 'warehouse', 'items.product', 'items.unit'])
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return new SalesOrderResource($order);
    }

    public function approve(int $id, Request $request): SalesOrderResource
    {
        $tenantId = TenantContext::current()->tenantId();

        $order = SalesOrder::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        $approved = $this->approveOrder->execute(
            $order,
            (int) $request->user()?->id
        );

        return new SalesOrderResource($approved);
    }
}
