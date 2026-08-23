<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/**
 * Platform-scope API routes (ARCHITECTURE §3.2, API_CONTRACT §9.1).
 *
 * Loaded by bootstrap/app.php in the `then:` closure with the `api` middleware
 * group and CorrelationId prepended. These routes are NOT behind `tenant.resolve`
 * or `tenant.active` — they operate across tenants.
 *
 * Platform-only surfaces:
 *   - Tenant provisioning / suspension / cancellation.
 *   - Plan management, billing.
 *   - Platform super-admin impersonation (requires JWT + X-Tenant header,
 *     audited on every request — API_CONTRACT §1.6).
 *   - Feature flag overrides.
 *
 * Access requires a JWT belonging to a user whose `is_platform_user` generated
 * column is `1` (DATABASE_DESIGN §3). Any tenant user reaching this group
 * receives 403 PLATFORM_ONLY.
 *
 * Endpoints are registered here as the platform admin module is built.
 * At this stage the file exists and is valid PHP — no endpoints are defined.
 */
Route::middleware(['auth:api'])
    ->prefix('v1/platform')
    ->name('platform.')
    ->group(static function (): void {
        // Future: tenant CRUD, plan management, impersonation, feature flags.
    });
