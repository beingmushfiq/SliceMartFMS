<?php

declare(strict_types=1);

namespace App\Modules\Ecommerce\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class TenantCouponController extends Controller
{
    /**
     * List all coupons with search, status filters, and summary metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::query()->latest();

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());
            $query->where(function ($q) use ($search): void {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('discount_type') && $request->input('discount_type') !== 'all') {
            $query->where('discount_type', $request->input('discount_type'));
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            $now = now();
            if ($status === 'active') {
                $query->where('is_active', true)
                    ->where(function ($q) use ($now): void {
                        $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
                    });
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($status === 'expired') {
                $query->where('ends_at', '<', $now);
            }
        }

        $coupons = $query->paginate($request->integer('per_page', 50));

        // Aggregate summary metrics for the active tenant
        $allCoupons = Coupon::all();
        $now = now();
        $stats = [
            'total_coupons' => $allCoupons->count(),
            'active_coupons' => $allCoupons->where('is_active', true)->filter(function ($c) use ($now) {
                return ! $c->ends_at || $c->ends_at >= $now;
            })->count(),
            'total_redemptions' => (int) $allCoupons->sum(fn (Coupon $c): int => (int) $c->used_count),
            'expired_coupons' => $allCoupons->filter(function ($c) use ($now) {
                return $c->ends_at && $c->ends_at < $now;
            })->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $coupons->items(),
            'meta' => [
                'current_page' => $coupons->currentPage(),
                'last_page' => $coupons->lastPage(),
                'per_page' => $coupons->perPage(),
                'total' => $coupons->total(),
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Create a single new promotional coupon code.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:64',
            'name' => 'required|string|max:255',
            'discount_type' => 'required|string|in:percentage,fixed,free_shipping',
            'discount_value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'applies_to' => 'nullable|string|in:order,product,category',
            'applies_to_ids' => 'nullable|array',
            'usage_limit_total' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'nullable|boolean',
            'storefront_id' => 'nullable|integer',
        ]);

        $code = strtoupper(trim($validated['code']));

        if (Coupon::where('code', $code)->exists()) {
            return response()->json([
                'success' => false,
                'message' => "Coupon code '{$code}' already exists for this organization.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $coupon = Coupon::create([
            'uuid' => (string) Str::uuid(),
            'storefront_id' => $validated['storefront_id'] ?? null,
            'code' => $code,
            'name' => $validated['name'],
            'discount_type' => $validated['discount_type'],
            'discount_value' => (string) $validated['discount_value'],
            'min_order_amount' => isset($validated['min_order_amount']) ? (string) $validated['min_order_amount'] : null,
            'max_discount_amount' => isset($validated['max_discount_amount']) ? (string) $validated['max_discount_amount'] : null,
            'applies_to' => $validated['applies_to'] ?? 'order',
            'applies_to_ids' => $validated['applies_to_ids'] ?? null,
            'usage_limit_total' => $validated['usage_limit_total'] ?? null,
            'usage_limit_per_customer' => $validated['usage_limit_per_customer'] ?? 1,
            'used_count' => 0,
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => is_numeric(Auth::id()) ? (int) Auth::id() : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Coupon '{$coupon->code}' generated successfully!",
            'data' => $coupon,
        ], Response::HTTP_CREATED);
    }

    /**
     * Batch generator for promo vouchers / promotional campaign batches.
     */
    public function generateBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prefix' => 'nullable|string|max:16',
            'count' => 'required|integer|min:1|max:100',
            'name' => 'required|string|max:255',
            'discount_type' => 'required|string|in:percentage,fixed,free_shipping',
            'discount_value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'usage_limit_total' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'nullable|boolean',
        ]);

        $count = (int) $validated['count'];
        $prefix = strtoupper(trim($validated['prefix'] ?? 'PROMO'));
        $createdCoupons = [];

        DB::beginTransaction();
        try {
            for ($i = 0; $i < $count; $i++) {
                // Generate a collision-resistant clean alphanumeric code
                $attempts = 0;
                do {
                    $randomPart = strtoupper(substr(str_shuffle('23456789ABCDEFGHJKLMNPQRSTUVWXYZ'), 0, 6));
                    $code = $prefix ? "{$prefix}-{$randomPart}" : $randomPart;
                    $exists = Coupon::where('code', $code)->exists();
                    $attempts++;
                } while ($exists && $attempts < 10);

                if ($exists) {
                    continue;
                }

                $coupon = Coupon::create([
                    'uuid' => (string) Str::uuid(),
                    'code' => $code,
                    'name' => $validated['name'].($count > 1 ? ' #'.($i + 1) : ''),
                    'discount_type' => $validated['discount_type'],
                    'discount_value' => (string) $validated['discount_value'],
                    'min_order_amount' => isset($validated['min_order_amount']) ? (string) $validated['min_order_amount'] : null,
                    'max_discount_amount' => isset($validated['max_discount_amount']) ? (string) $validated['max_discount_amount'] : null,
                    'applies_to' => 'order',
                    'usage_limit_total' => $validated['usage_limit_total'] ?? 1,
                    'usage_limit_per_customer' => $validated['usage_limit_per_customer'] ?? 1,
                    'used_count' => 0,
                    'starts_at' => $validated['starts_at'] ?? null,
                    'ends_at' => $validated['ends_at'] ?? null,
                    'is_active' => $validated['is_active'] ?? true,
                    'created_by' => is_numeric(Auth::id()) ? (int) Auth::id() : null,
                ]);

                $createdCoupons[] = $coupon;
            }
            DB::commit();
        } catch (Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate batch coupons: '.$e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return response()->json([
            'success' => true,
            'message' => count($createdCoupons).' promo codes generated successfully!',
            'data' => $createdCoupons,
        ], Response::HTTP_CREATED);
    }

    /**
     * Show coupon details and redemptions.
     */
    public function show(int $id): JsonResponse
    {
        $coupon = Coupon::with(['redemptions' => function ($q): void {
            $q->latest()->take(20);
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $coupon,
        ]);
    }

    /**
     * Update coupon settings.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'discount_type' => 'sometimes|required|string|in:percentage,fixed,free_shipping',
            'discount_value' => 'sometimes|required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'usage_limit_total' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['discount_value'])) {
            $validated['discount_value'] = (string) $validated['discount_value'];
        }
        if (array_key_exists('min_order_amount', $validated)) {
            $validated['min_order_amount'] = $validated['min_order_amount'] !== null ? (string) $validated['min_order_amount'] : null;
        }
        if (array_key_exists('max_discount_amount', $validated)) {
            $validated['max_discount_amount'] = $validated['max_discount_amount'] !== null ? (string) $validated['max_discount_amount'] : null;
        }

        $userId = is_numeric(Auth::id()) ? (int) Auth::id() : null;
        $validated['updated_by'] = $userId;

        $coupon->fill($validated);
        $coupon->save();

        return response()->json([
            'success' => true,
            'message' => "Coupon '{$coupon->code}' updated successfully.",
            'data' => $coupon->fresh(),
        ]);
    }

    /**
     * Toggle coupon active/inactive status.
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->is_active = ! $coupon->is_active;
        $authId = Auth::id();
        $coupon->updated_by = is_numeric($authId) && (int) $authId >= 0 ? (int) $authId : null;
        $coupon->save();

        return response()->json([
            'success' => true,
            'message' => "Coupon '{$coupon->code}' is now ".($coupon->is_active ? 'Active' : 'Disabled').'.',
            'data' => $coupon,
        ]);
    }

    /**
     * Delete / soft-delete a coupon.
     */
    public function destroy(int $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $code = $coupon->code;
        $coupon->delete();

        return response()->json([
            'success' => true,
            'message' => "Coupon '{$code}' deleted.",
        ]);
    }
}
