<?php

declare(strict_types=1);

use App\Modules\Ecommerce\Controllers\StorefrontCartController;
use App\Modules\Ecommerce\Controllers\StorefrontCatalogController;
use App\Modules\Ecommerce\Controllers\StorefrontCheckoutController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Multi-Tenant Headless E-Commerce Storefront Routes
|--------------------------------------------------------------------------
|
| Public-facing storefront endpoints scoped automatically by
| ResolveStorefrontTenant middleware.
|
*/

Route::prefix('v1/storefront')->group(function (): void {
    // Catalog & Branding
    Route::get('/config', [StorefrontCatalogController::class, 'config']);
    Route::get('/categories', [StorefrontCatalogController::class, 'categories']);
    Route::get('/products', [StorefrontCatalogController::class, 'products']);
    Route::get('/products/{idOrSku}', [StorefrontCatalogController::class, 'product']);

    // Cart Operations
    Route::get('/cart', [StorefrontCartController::class, 'getCart']);
    Route::post('/cart/items', [StorefrontCartController::class, 'addItem']);
    Route::put('/cart/items/{id}', [StorefrontCartController::class, 'updateItem']);
    Route::delete('/cart/items/{id}', [StorefrontCartController::class, 'removeItem']);

    // Coupons
    Route::post('/cart/coupon', [\App\Modules\Ecommerce\Controllers\StorefrontCouponController::class, 'applyCoupon']);
    Route::delete('/cart/coupon', [\App\Modules\Ecommerce\Controllers\StorefrontCouponController::class, 'removeCoupon']);

    // Checkout
    Route::post('/checkout', [StorefrontCheckoutController::class, 'checkout']);

    // Public Order Tracking
    Route::get('/orders/track', [\App\Modules\Ecommerce\Controllers\StorefrontOrderTrackingController::class, 'track']);
});
