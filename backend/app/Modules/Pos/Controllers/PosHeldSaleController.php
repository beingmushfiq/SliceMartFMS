<?php

declare(strict_types=1);

namespace App\Modules\Pos\Controllers;

use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Modules\Pos\Models\PosHeldSale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PosHeldSaleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $query = PosHeldSale::where('tenant_id', $tenantId)
            ->with(['customer:id,party_name,phone_number', 'creator:id,name'])
            ->latest();

        if ($request->filled('pos_session_id')) {
            $query->where('pos_session_id', $request->integer('pos_session_id'));
        }

        $heldSales = $query->get();

        return response()->json([
            'data' => $heldSales,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $validated = $request->validate([
            'pos_session_id' => ['required', 'integer'],
            'pos_terminal_id' => ['nullable', 'integer'],
            'customer_party_id' => ['nullable', 'integer'],
            'reference_note' => ['nullable', 'string', 'max:128'],
            'cart_payload' => ['required', 'array'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $heldSale = PosHeldSale::create([
            'tenant_id' => $tenantId,
            'pos_session_id' => $validated['pos_session_id'],
            'pos_terminal_id' => $validated['pos_terminal_id'] ?? null,
            'customer_party_id' => $validated['customer_party_id'] ?? null,
            'reference_note' => $validated['reference_note'] ?? 'Parked Cart',
            'cart_payload' => $validated['cart_payload'],
            'subtotal' => (string) $validated['subtotal'],
            'tax_amount' => (string) ($validated['tax_amount'] ?? '0'),
            'discount_amount' => (string) ($validated['discount_amount'] ?? '0'),
            'total_amount' => (string) $validated['total_amount'],
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => $heldSale->load(['customer:id,party_name,phone_number', 'creator:id,name']),
            'message' => 'Sale held successfully',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $heldSale = PosHeldSale::where('tenant_id', $tenantId)
            ->with(['customer:id,party_name,phone_number', 'creator:id,name'])
            ->findOrFail($id);

        return response()->json([
            'data' => $heldSale,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $heldSale = PosHeldSale::where('tenant_id', $tenantId)->findOrFail($id);
        $heldSale->delete();

        return response()->json([
            'message' => 'Held sale retrieved or discarded successfully',
        ]);
    }
}
