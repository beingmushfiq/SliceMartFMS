<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/**
 * Public / unauthenticated API routes (ARCHITECTURE §5.1).
 *
 * Loaded by bootstrap/app.php in the `then:` closure with the `api` middleware
 * group and CorrelationId prepended. No auth middleware.
 *
 * Public surfaces:
 *   - Auth: POST /api/v1/auth/login, POST /api/v1/auth/refresh,
 *            POST /api/v1/auth/logout, POST /api/v1/auth/forgot-password,
 *            POST /api/v1/auth/reset-password (API_CONTRACT §8).
 *   - Public storefront read endpoints (API_CONTRACT §9.1, §10).
 *   - Inbound webhooks: POST /api/v1/webhooks/{provider} (API_CONTRACT §14).
 *
 * Rate limiting on public routes is applied per endpoint (API_CONTRACT §10):
 *   - Login: 5/5min per email, 20/5min per IP.
 *   - Forgot password: 3/1h per email.
 *   - Storefront: 120/1min per IP.
 *   - Webhooks: 600/1min per provider.
 *
 * Endpoints are registered here as modules are built. At this stage the file
 * exists and is valid PHP — no endpoints are defined until Wave 5+ ships.
 */
Route::prefix('v1')
    ->name('public.')
    ->group(static function (): void {
        Route::prefix('auth')->name('auth.')->group(static function (): void {
            Route::post('login', [App\Modules\Auth\Controllers\AuthController::class, 'login'])->name('login');
            Route::post('refresh', [App\Modules\Auth\Controllers\AuthController::class, 'refresh'])->name('refresh');
            Route::post('select-tenant', [App\Modules\Auth\Controllers\AuthController::class, 'selectTenant'])->name('select-tenant');
            Route::post('logout', [App\Modules\Auth\Controllers\AuthController::class, 'logout'])->name('logout');
            Route::post('forgot-password', [App\Modules\Auth\Controllers\AuthController::class, 'forgotPassword'])->name('forgot-password');
            Route::post('reset-password', [App\Modules\Auth\Controllers\AuthController::class, 'resetPassword'])->name('reset-password');
            Route::get('branding', [App\Modules\Auth\Controllers\AuthController::class, 'branding'])->name('branding');
        });

        Route::prefix('webhooks')->name('webhooks.')->group(static function (): void {
            Route::post('couriers/{providerCode}', [App\Modules\Delivery\Controllers\CourierWebhookController::class, 'handle'])->name('couriers.handle');
        });

        Route::get('industry-profiles', [\App\Modules\Platform\Controllers\IndustryProfileController::class, 'index'])->name('industry-profiles.index');
        Route::get('industry-profiles/{key}', [\App\Modules\Platform\Controllers\IndustryProfileController::class, 'show'])->name('industry-profiles.show');
        Route::get('business-types', [\App\Modules\Platform\Controllers\IndustryProfileController::class, 'businessTypes'])->name('business-types.index');

        Route::match(['get', 'head'], 'health', function () {
            return response()->json([
                'status' => 'ok',
                'timestamp' => now()->toIso8601String(),
                'version' => '1.0.0',
            ]);
        })->name('health');
    });
