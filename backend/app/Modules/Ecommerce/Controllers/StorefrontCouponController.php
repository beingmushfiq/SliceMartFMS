<?php

declare(strict_types=1);

namespace App\Modules\Ecommerce\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Storefront;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class StorefrontCouponController extends Controller
{
    /**
     * Apply coupon code to visitor's cart.
     */
    public function applyCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:32',
        ]);

        /** @var Storefront|null $storefront */
        $storefront = $request->attributes->get('storefront');
        if (! $storefront) {
            return response()->json([
                'success' => false,
                'message' => 'Storefront not resolved.',
            ], Response::HTTP_NOT_FOUND);
        }

        $sessionToken = $request->header('X-Cart-Session') ?? $request->input('cart_token');
        if (! $sessionToken) {
            return response()->json([
                'success' => false,
                'message' => 'Active cart session is required.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $cart = Cart::where('tenant_id', $storefront->tenant_id)
            ->where('session_token', $sessionToken)
            ->where('status', 'active')
            ->first();

        if (! $cart || $cart->items()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot apply coupon to an empty cart.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $coupon = Coupon::where('tenant_id', $storefront->tenant_id)
            ->where('code', strtoupper(trim($validated['code'])))
            ->first();

        if (! $coupon) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired coupon code.',
            ], Response::HTTP_NOT_FOUND);
        }

        $subtotal = (float) $cart->subtotal;

        if (! $coupon->isValidForSubtotal($subtotal)) {
            $msg = 'Coupon conditions not met.';
            if ($coupon->min_order_amount && $subtotal < (float) $coupon->min_order_amount) {
                $msg = "Minimum order amount of {$storefront->currency} {$coupon->min_order_amount} required for this coupon.";
            } elseif (! $coupon->is_active) {
                $msg = 'This coupon is no longer active.';
            }

            return response()->json([
                'success' => false,
                'message' => $msg,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $discount = $coupon->calculateDiscount($subtotal);

        $cart->coupon_code = $coupon->code;
        $cart->discount_amount = number_format($discount, 4, '.', '');
        $cart->recalculateTotals();

        return response()->json([
            'success' => true,
            'message' => "Coupon '{$coupon->code}' applied successfully!",
            'data' => $cart->fresh(['items']),
        ]);
    }

    /**
     * Remove applied coupon code from cart.
     */
    public function removeCoupon(Request $request): JsonResponse
    {
        /** @var Storefront|null $storefront */
        $storefront = $request->attributes->get('storefront');
        if (! $storefront) {
            return response()->json([
                'success' => false,
                'message' => 'Storefront not resolved.',
            ], Response::HTTP_NOT_FOUND);
        }

        $sessionToken = $request->header('X-Cart-Session') ?? $request->input('cart_token');
        if (! $sessionToken) {
            return response()->json([
                'success' => false,
                'message' => 'Active cart session is required.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $cart = Cart::where('tenant_id', $storefront->tenant_id)
            ->where('session_token', $sessionToken)
            ->where('status', 'active')
            ->first();

        if ($cart) {
            $cart->coupon_code = null;
            $cart->discount_amount = '0.0000';
            $cart->recalculateTotals();
        }

        return response()->json([
            'success' => true,
            'message' => 'Coupon removed.',
            'data' => $cart?->fresh(['items']),
        ]);
    }
}
