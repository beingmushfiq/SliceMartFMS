<?php

declare(strict_types=1);

namespace App\Modules\Sales\Controllers;

use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Modules\Sales\Actions\CreateDeliveryOrderAction;
use App\Modules\Sales\Actions\DispatchDeliveryOrderAction;
use App\Modules\Sales\Models\DeliveryOrder;
use App\Modules\Sales\Requests\StoreDeliveryOrderRequest;
use App\Modules\Sales\Resources\DeliveryOrderResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class DeliveryOrderController extends Controller
{
    public function __construct(
        private readonly CreateDeliveryOrderAction $createDelivery,
        private readonly DispatchDeliveryOrderAction $dispatchDelivery
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $tenantId = TenantContext::current()->tenantId();

        $query = DeliveryOrder::with(['salesOrder', 'warehouse', 'party', 'items.product'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('sales_order_id')) {
            $query->where('sales_order_id', (int) $request->query('sales_order_id'));
        }

        $deliveries = $query->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 25));

        return DeliveryOrderResource::collection($deliveries);
    }

    public function store(StoreDeliveryOrderRequest $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $validated = $request->validated();

        /** @var array{sales_order_id: int, warehouse_id: int, recipient_name: string, recipient_phone: string, items: list<array{product_id: int, quantity: string, unit_id: int}>} $validated */
        $delivery = $this->createDelivery->execute([
            ...$validated,
            'tenant_id'  => $tenantId,
            'created_by' => (int) $request->user()?->id,
        ]);

        return (new DeliveryOrderResource($delivery))
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): DeliveryOrderResource
    {
        $tenantId = TenantContext::current()->tenantId();

        $delivery = DeliveryOrder::with(['salesOrder', 'warehouse', 'party', 'items.product'])
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return new DeliveryOrderResource($delivery);
    }

    public function dispatch(int $id, Request $request): DeliveryOrderResource
    {
        $tenantId = TenantContext::current()->tenantId();

        $delivery = DeliveryOrder::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        $dispatched = $this->dispatchDelivery->execute(
            $delivery,
            (int) $request->user()?->id
        );

        return new DeliveryOrderResource($dispatched);
    }
}
