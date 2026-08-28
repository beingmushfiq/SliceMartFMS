<?php

declare(strict_types=1);

namespace App\Modules\Ecommerce\Controllers;

use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\OrderFraudAssessment;
use App\Modules\Ecommerce\Services\OrderFraudScorerService;
use App\Modules\Sales\Models\SalesOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderFraudVerificationController extends Controller
{
    public function __construct(
        protected OrderFraudScorerService $scorerService
    ) {}

    /**
     * List all orders in the fraud review & verification queue.
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $query = OrderFraudAssessment::query()
            ->where('tenant_id', $tenantId)
            ->with(['salesOrder.customer', 'verifier']);

        if ($request->has('risk_level') && ! empty($request->input('risk_level'))) {
            $query->where('risk_level', $request->input('risk_level'));
        }

        if ($request->has('verification_status') && ! empty($request->input('verification_status'))) {
            $query->where('verification_status', $request->input('verification_status'));
        }

        $assessments = $query->orderBy('risk_score', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $assessments->items(),
            'meta' => [
                'current_page' => $assessments->currentPage(),
                'last_page' => $assessments->lastPage(),
                'total' => $assessments->total(),
            ],
        ]);
    }

    /**
     * Get detailed assessment for a specific order.
     */
    public function show(Request $request, int $orderId): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $order = SalesOrder::query()
            ->where('tenant_id', $tenantId)
            ->where('id', $orderId)
            ->with(['customer', 'items.product'])
            ->firstOrFail();

        $assessment = OrderFraudAssessment::query()
            ->where('tenant_id', $tenantId)
            ->where('sales_order_id', $order->id)
            ->first();

        if (! $assessment) {
            $assessment = $this->scorerService->assessOrder($order);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order' => $order,
                'assessment' => $assessment,
            ],
        ]);
    }

    /**
     * Verify and release the order.
     */
    public function verify(Request $request, int $orderId): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $userId = $request->user()?->id;

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
            'checklist' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($tenantId, $orderId, $userId, $validated): JsonResponse {
            $order = SalesOrder::query()
                ->where('tenant_id', $tenantId)
                ->where('id', $orderId)
                ->firstOrFail();

            $assessment = OrderFraudAssessment::query()
                ->where('tenant_id', $tenantId)
                ->where('sales_order_id', $order->id)
                ->firstOrFail();

            $assessment->update([
                'verification_status' => 'verified',
                'verification_notes' => $validated['notes'] ?? $assessment->verification_notes,
                'verification_checklist' => $validated['checklist'] ?? $assessment->verification_checklist,
                'verified_by' => $userId,
                'verified_at' => now(),
            ]);

            // Release order to approved
            $order->update([
                'status' => 'approved',
                'confirmed_by' => $userId,
                'confirmed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'verification_status' => 'verified',
                ],
                'message' => "Order {$order->order_number} has been verified and released.",
            ]);
        });
    }

    /**
     * Put the order on hold.
     */
    public function hold(Request $request, int $orderId): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $userId = $request->user()?->id;

        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        return DB::transaction(function () use ($tenantId, $orderId, $userId, $validated): JsonResponse {
            $order = SalesOrder::query()
                ->where('tenant_id', $tenantId)
                ->where('id', $orderId)
                ->firstOrFail();

            $assessment = OrderFraudAssessment::query()
                ->where('tenant_id', $tenantId)
                ->where('sales_order_id', $order->id)
                ->firstOrFail();

            $assessment->update([
                'verification_status' => 'on_hold',
                'verification_notes' => $validated['notes'],
                'verified_by' => $userId,
                'verified_at' => now(),
            ]);

            $order->update(['status' => 'on_hold']);

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'verification_status' => 'on_hold',
                ],
                'message' => "Order {$order->order_number} has been placed on hold.",
            ]);
        });
    }

    /**
     * Reject fraudulent order.
     */
    public function reject(Request $request, int $orderId): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $userId = $request->user()?->id;

        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        return DB::transaction(function () use ($tenantId, $orderId, $userId, $validated): JsonResponse {
            $order = SalesOrder::query()
                ->where('tenant_id', $tenantId)
                ->where('id', $orderId)
                ->firstOrFail();

            $assessment = OrderFraudAssessment::query()
                ->where('tenant_id', $tenantId)
                ->where('sales_order_id', $order->id)
                ->firstOrFail();

            $assessment->update([
                'verification_status' => 'rejected',
                'verification_notes' => $validated['notes'],
                'verified_by' => $userId,
                'verified_at' => now(),
            ]);

            $order->update([
                'status' => 'cancelled',
                'cancelled_by' => $userId,
                'cancelled_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'verification_status' => 'rejected',
                ],
                'message' => "Order {$order->order_number} has been marked as fraudulent/rejected.",
            ]);
        });
    }
}
