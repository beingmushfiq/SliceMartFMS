<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware([\App\Core\Http\Middleware\ResolveStorefrontTenant::class])->group(function (): void {
    Route::get('/sitemap.xml', [\App\Modules\Ecommerce\Controllers\StorefrontSitemapController::class, 'index']);
    Route::get('/sitemap-products.xml', [\App\Modules\Ecommerce\Controllers\StorefrontSitemapController::class, 'products']);
    Route::get('/sitemap-categories.xml', [\App\Modules\Ecommerce\Controllers\StorefrontSitemapController::class, 'categories']);
    Route::get('/sitemap-pages.xml', [\App\Modules\Ecommerce\Controllers\StorefrontSitemapController::class, 'pages']);
    Route::get('/robots.txt', \App\Modules\Ecommerce\Controllers\StorefrontRobotsController::class);
});

