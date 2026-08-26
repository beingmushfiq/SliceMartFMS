<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/**
 * Tenant-scope API routes (API_CONTRACT §9.1, ARCHITECTURE §5.1).
 *
 * These routes are loaded by bootstrap/app.php as the primary `api:` route file.
 * Every route here:
 *   - Is prefixed with /api automatically by Laravel's api route loader.
 *   - Inherits the `api` middleware group (throttle, json parsing, etc.).
 *   - Additionally runs: CorrelationId (prepended to the api group in
 *     bootstrap/app.php) → auth:api → tenant.resolve → tenant.active.
 *
 * Full middleware pipeline for these routes (ARCHITECTURE §5.1):
 *   EnsureHttps → CorrelationId → Authenticate(auth:api) → ResolveTenant
 *   → EnsureTenantActive → [Authorize] → [RateLimit] → [Idempotency] → Handler
 *
 * Endpoints are registered here as modules are built. At this stage the file
 * exists and is valid PHP — no endpoints are defined until Wave 5+ modules ship.
 */
Route::middleware(['auth.jwt', 'tenant.resolve', 'tenant.active'])
    ->prefix('v1')
    ->name('tenant.')
    ->group(static function (): void {
        Route::prefix('auth')->name('auth.')->group(static function (): void {
            Route::get('me', [App\Modules\Auth\Controllers\AuthController::class, 'me'])->name('me');
            Route::get('permissions', [App\Modules\Auth\Controllers\AuthController::class, 'permissions'])->name('permissions');
            Route::post('logout-all', [App\Modules\Auth\Controllers\AuthController::class, 'logoutAll'])->name('logout-all');
            Route::post('switch-branch', [App\Modules\Auth\Controllers\AuthController::class, 'switchBranch'])->name('switch-branch');
            Route::patch('preferences', [App\Modules\Auth\Controllers\AuthController::class, 'updatePreferences'])->name('preferences');
            Route::patch('change-password', [App\Modules\Auth\Controllers\AuthController::class, 'changePassword'])->name('change-password');
        });

        // ── Catalogue: Units ──────────────────────────────────────────
        Route::prefix('units')->name('units.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\UnitController::class, 'options'])
                ->middleware('permission:catalog.unit.view')
                ->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\UnitController::class, 'index'])
                ->middleware('permission:catalog.unit.view')
                ->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\UnitController::class, 'store'])
                ->middleware('permission:catalog.unit.manage')
                ->name('store');
            Route::get('{unit:uuid}', [App\Modules\Catalogue\Controllers\UnitController::class, 'show'])
                ->middleware('permission:catalog.unit.view')
                ->name('show');
            Route::patch('{unit:uuid}', [App\Modules\Catalogue\Controllers\UnitController::class, 'update'])
                ->middleware('permission:catalog.unit.manage')
                ->name('update');
            Route::delete('{unit:uuid}', [App\Modules\Catalogue\Controllers\UnitController::class, 'destroy'])
                ->middleware('permission:catalog.unit.manage')
                ->name('destroy');
        });

        Route::prefix('brands')->name('brands.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\BrandController::class, 'options'])
                ->middleware('permission:catalog.brand.view')->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\BrandController::class, 'index'])
                ->middleware('permission:catalog.brand.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\BrandController::class, 'store'])
                ->middleware('permission:catalog.brand.manage')->name('store');
            Route::get('{brand:uuid}', [App\Modules\Catalogue\Controllers\BrandController::class, 'show'])
                ->middleware('permission:catalog.brand.view')->name('show');
            Route::patch('{brand:uuid}', [App\Modules\Catalogue\Controllers\BrandController::class, 'update'])
                ->middleware('permission:catalog.brand.manage')->name('update');
            Route::delete('{brand:uuid}', [App\Modules\Catalogue\Controllers\BrandController::class, 'destroy'])
                ->middleware('permission:catalog.brand.manage')->name('destroy');
        });

        Route::prefix('categories')->name('categories.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\CategoryController::class, 'options'])
                ->middleware('permission:catalog.category.view')->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\CategoryController::class, 'index'])
                ->middleware('permission:catalog.category.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\CategoryController::class, 'store'])
                ->middleware('permission:catalog.category.manage')->name('store');
            Route::get('{category:uuid}', [App\Modules\Catalogue\Controllers\CategoryController::class, 'show'])
                ->middleware('permission:catalog.category.view')->name('show');
            Route::patch('{category:uuid}', [App\Modules\Catalogue\Controllers\CategoryController::class, 'update'])
                ->middleware('permission:catalog.category.manage')->name('update');
            Route::delete('{category:uuid}', [App\Modules\Catalogue\Controllers\CategoryController::class, 'destroy'])
                ->middleware('permission:catalog.category.manage')->name('destroy');
        });

        Route::prefix('products')->name('products.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\ProductController::class, 'options'])
                ->middleware('permission:catalog.product.view')->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\ProductController::class, 'index'])
                ->middleware('permission:catalog.product.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\ProductController::class, 'store'])
                ->middleware('permission:catalog.product.manage')->name('store');
            Route::get('{product:uuid}', [App\Modules\Catalogue\Controllers\ProductController::class, 'show'])
                ->middleware('permission:catalog.product.view')->name('show');
            Route::patch('{product:uuid}', [App\Modules\Catalogue\Controllers\ProductController::class, 'update'])
                ->middleware('permission:catalog.product.manage')->name('update');
            Route::delete('{product:uuid}', [App\Modules\Catalogue\Controllers\ProductController::class, 'destroy'])
                ->middleware('permission:catalog.product.manage')->name('destroy');
        });

        Route::prefix('bill-of-materials')->name('bill-of-materials.')->group(static function (): void {
            Route::get('/', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'index'])
                ->middleware('permission:catalog.bom.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'store'])
                ->middleware('permission:catalog.bom.manage')->name('store');
            Route::get('{billOfMaterial:uuid}', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'show'])
                ->middleware('permission:catalog.bom.view')->name('show');
            Route::patch('{billOfMaterial:uuid}', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'update'])
                ->middleware('permission:catalog.bom.manage')->name('update');
            Route::delete('{billOfMaterial:uuid}', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'destroy'])
                ->middleware('permission:catalog.bom.manage')->name('destroy');
        });
    });
