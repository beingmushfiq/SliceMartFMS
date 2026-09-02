<?php

declare(strict_types=1);

use App\Modules\Platform\Controllers\PlatformAuditController;
use App\Modules\Platform\Controllers\PlatformAuthController;
use App\Modules\Platform\Controllers\PlatformDashboardController;
use App\Modules\Platform\Controllers\PlatformDomainController;
use App\Modules\Platform\Controllers\PlatformImpersonationController;
use App\Modules\Platform\Controllers\PlatformPlanController;
use App\Modules\Platform\Controllers\PlatformTenantController;
use Illuminate\Support\Facades\Route;

/**
 * Platform-scope API routes (ARCHITECTURE §3.2, SAAS_ARCHITECTURE §1, API_CONTRACT §9.1).
 *
 * Dedicated to DevCenterPoint Master SaaS Administrators.
 * Protected by `auth.jwt` and `platform.admin` middleware.
 */
Route::prefix('v1/platform')
    ->name('platform.')
    ->group(static function (): void {
        // Public Platform Login endpoint
        Route::post('auth/login', [PlatformAuthController::class, 'login'])->name('auth.login');

        // Authenticated Platform Super Admin routes
        Route::middleware(['auth.jwt', 'platform.admin'])->group(static function (): void {
            Route::get('auth/me', [PlatformAuthController::class, 'me'])->name('auth.me');

            // Operational SaaS Dashboard
            Route::get('dashboard/kpis', [PlatformDashboardController::class, 'kpis'])->name('dashboard.kpis');

            // Tenant Lifecycle & Management
            Route::get('tenants', [PlatformTenantController::class, 'index'])->name('tenants.index');
            Route::post('tenants', [PlatformTenantController::class, 'store'])->name('tenants.store');
            Route::get('tenants/{id}', [PlatformTenantController::class, 'show'])->name('tenants.show');
            Route::patch('tenants/{id}', [PlatformTenantController::class, 'update'])->name('tenants.update');
            Route::delete('tenants/{id}', [PlatformTenantController::class, 'destroy'])->name('tenants.destroy');
            Route::post('tenants/{id}/status', [PlatformTenantController::class, 'updateStatus'])->name('tenants.status');
            Route::post('tenants/{id}/manage-subscription', [PlatformTenantController::class, 'manageSubscription'])->name('tenants.manage-subscription');
            Route::post('tenants/{id}/override-capabilities', [PlatformTenantController::class, 'overrideCapabilities'])->name('tenants.override-capabilities');
            Route::post('tenants/{id}/override-quotas', [PlatformTenantController::class, 'overrideQuotas'])->name('tenants.override-quotas');
            Route::post('tenants/{id}/reset-password', [PlatformTenantController::class, 'resetOwnerPassword'])->name('tenants.reset-password');
            Route::post('tenants/{id}/impersonate', [PlatformImpersonationController::class, 'impersonate'])->name('tenants.impersonate');

            // Platform-wide Custom Domain Management
            Route::prefix('domains')->name('domains.')->group(static function (): void {
                Route::get('/', [PlatformDomainController::class, 'index'])->name('index');
                Route::get('{id}', [PlatformDomainController::class, 'show'])->name('show');
                Route::post('{id}/verify', [PlatformDomainController::class, 'verify'])->name('verify');
                Route::patch('{id}/status', [PlatformDomainController::class, 'updateStatus'])->name('status');
                Route::delete('{id}', [PlatformDomainController::class, 'destroy'])->name('destroy');
            });

            // Subscription Plan Management
            Route::get('plans', [PlatformPlanController::class, 'index'])->name('plans.index');
            Route::post('plans', [PlatformPlanController::class, 'store'])->name('plans.store');
            Route::patch('plans/{id}', [PlatformPlanController::class, 'update'])->name('plans.update');
            Route::delete('plans/{id}', [PlatformPlanController::class, 'destroy'])->name('plans.destroy');

            // Platform-wide System Audit Logs
            Route::get('audit-logs', [PlatformAuditController::class, 'index'])->name('audit-logs.index');
        });
    });
