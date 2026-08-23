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
Route::middleware(['auth.jwt', 'tenant.active'])
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
    });
