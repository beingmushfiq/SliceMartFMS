<?php

declare(strict_types=1);

namespace App\Modules\Sales\Controllers;

use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Modules\Sales\Actions\ApproveInvoiceAction;
use App\Modules\Sales\Actions\CreateInvoiceAction;
use App\Modules\Sales\Actions\VoidInvoiceAction;
use App\Modules\Sales\Models\Invoice;
use App\Modules\Sales\Requests\StoreInvoiceRequest;
use App\Modules\Sales\Resources\InvoiceResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class InvoiceController extends Controller
{
    public function __construct(
        private readonly CreateInvoiceAction $createInvoice,
        private readonly ApproveInvoiceAction $approveInvoice,
        private readonly VoidInvoiceAction $voidInvoice
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $tenantId = TenantContext::current()->tenantId();

        $query = Invoice::with(['customer', 'items.product'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('party_id')) {
            $query->where('party_id', (int) $request->query('party_id'));
        }

        if ($request->filled('sales_order_id')) {
            $query->where('sales_order_id', (int) $request->query('sales_order_id'));
        }

        if ($request->filled('q')) {
            $search = (string) $request->query('q');
            $query->where('invoice_number', 'like', "%{$search}%");
        }

        $invoices = $query->orderByDesc('invoice_date')
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 25));

        return InvoiceResource::collection($invoices);
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $validated = $request->validated();

        /** @var array{invoice_date: string, items: list<array{quantity: string, unit_price: string}>} $validated */
        $invoice = $this->createInvoice->execute([
            ...$validated,
            'tenant_id'  => $tenantId,
            'created_by' => (int) $request->user()?->id,
        ]);

        return (new InvoiceResource($invoice))
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): InvoiceResource
    {
        $tenantId = TenantContext::current()->tenantId();

        $invoice = Invoice::with(['customer', 'items.product', 'salesOrder'])
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return new InvoiceResource($invoice);
    }

    public function approve(int $id, Request $request): InvoiceResource
    {
        $tenantId = TenantContext::current()->tenantId();

        $invoice = Invoice::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        $approved = $this->approveInvoice->execute(
            $invoice,
            (int) $request->user()?->id
        );

        return new InvoiceResource($approved);
    }

    public function void(int $id, Request $request): InvoiceResource
    {
        $tenantId = TenantContext::current()->tenantId();

        $invoice = Invoice::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        $request->validate([
            'void_reason' => ['required', 'string', 'max:500'],
        ]);

        $voided = $this->voidInvoice->execute(
            $invoice,
            (int) $request->user()?->id,
            (string) $request->input('void_reason')
        );

        return new InvoiceResource($voided);
    }
}
