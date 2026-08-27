<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Purchasing\Actions\CreatePurchaseBillAction;
use App\Modules\Purchasing\Models\PurchaseBill;
use App\Modules\Purchasing\Requests\StorePurchaseBillRequest;
use App\Modules\Purchasing\Resources\PurchaseBillResource;
use App\Core\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class PurchaseBillController extends Controller
{
    public function __construct(
        private readonly CreatePurchaseBillAction $createBill
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $tenantId = TenantContext::current()->tenantId();

        $query = PurchaseBill::with(['supplier', 'purchaseOrder', 'goodsReceipt', 'items.product', 'items.unit'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('party_id')) {
            $query->where('party_id', (int) $request->query('party_id'));
        }

        if ($request->filled('q')) {
            $search = (string) $request->query('q');
            $query->where(function ($q) use ($search): void {
                $q->where('bill_number', 'like', "%{$search}%")
                    ->orWhere('supplier_bill_number', 'like', "%{$search}%");
            });
        }

        $bills = $query->orderByDesc('bill_date')
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 25));

        return PurchaseBillResource::collection($bills);
    }

    public function store(StorePurchaseBillRequest $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $validated = $request->validated();

        /** @var array{party_id: int, bill_date: string, bill_number?: string, purchase_order_id?: int|null, goods_receipt_id?: int|null, due_date?: string|null, supplier_invoice_number?: string|null, currency_code?: string, exchange_rate?: string, notes?: string|null, items: list<array{product_id: int, quantity: string, unit_id: int, unit_price: string, purchase_order_item_id?: int|null, goods_receipt_item_id?: int|null, variant_id?: int|null, discount_amount?: string, tax_profile_id?: int|null, tax_rate?: string, notes?: string|null}>} $validated */
        $bill = $this->createBill->execute([
            ...$validated,
            'tenant_id' => $tenantId,
            'created_by' => (int) $request->user()?->id,
        ]);

        return (new PurchaseBillResource($bill))
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): PurchaseBillResource
    {
        $tenantId = TenantContext::current()->tenantId();

        $bill = PurchaseBill::with(['supplier', 'purchaseOrder', 'goodsReceipt', 'items.product', 'items.unit'])
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return new PurchaseBillResource($bill);
    }
}
