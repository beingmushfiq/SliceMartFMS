# Codebase Audit & Hardening Cleanup Report

**Platform:** DevCenterPoint ProERP  
**Date:** September 2026  
**Auditor:** Lead Production Architect & Senior Full-Stack Engineer  
**Status:** PRODUCTION READY / CERTIFIED  

---

## 1. Executive Summary

This report documents the transformation of the Laravel 13 + React 19 multi-tenant SaaS codebase from a fragmented development state into a hardened, production-ready platform tailored for **Websuru cPanel shared/reseller hosting** under `proerp.devcenterpoint.com` and `devcenterpoint.com`.

The audit followed the strict principle:
> **AUDIT → UNDERSTAND → DOCUMENT → CLEAN → CORRECT → HARDEN → CONFIGURE → TEST → DEPLOY**  
> *Do not destroy working functionality merely to make code look cleaner. Reuse good existing implementations.*

---

## 2. Detailed Remediation Matrix

### 2.1 Architecture & Deployment Reconciliation (Phase 1)
- **Problem:** Three contradictory deployment configurations existed simultaneously (`docker-compose.yml` with PostgreSQL 16 on `app.slicemart.com`, SQLite development, and cPanel shared hosting without Docker).
- **Remediation:**
  - Replaced root `.env.production.example` with canonical MySQL + cPanel + `proerp.devcenterpoint.com` configuration.
  - Created `backend/.env.production.example` for backend deployment.
  - Created `backend/config/platform.php` centralizing domain names, reserved subdomains, JWT TTLs, and CORS allowed origins.
  - Authored `docs/PRODUCTION_ARCHITECTURE.md` and `docs/WEBSURU_CPANEL_DEPLOYMENT.md`.
  - Formally recorded **ADR-035** in `docs/DECISIONS.md`.

---

### 2.2 Seeder Segregation & Production Purity (Phase 2)
- **Problem:** `DatabaseSeeder.php` called `PlansAndTenantsSeeder.php` which hardcoded tenant 1 ("SliceMart") along with factories, branches, products, and fake orders. Running `db:seed` in production polluted client databases with demo data.
- **Remediation:**
  - Created `backend/database/seeders/PlansSeeder.php` to seed subscription plans independently of tenants.
  - Created `backend/database/seeders/SystemPermissionsSeeder.php` to seed the universal permissions catalog.
  - Created `backend/database/seeders/ProductionSeeder.php` to run structural seeders only (Platform Roles, Permissions, Business Types, Industry Profiles, Plans).
  - Created `backend/database/seeders/DevelopmentSeeder.php` containing all demo seeders.
  - Modified `backend/database/seeders/DatabaseSeeder.php` to conditionally delegate based on `app()->environment('production')`.

---

### 2.3 MySQL & PHP Version Compatibility (Phase 3 & 10)
- **Problem:** `backend/config/database.php` used `use Pdo\Mysql;` and `Mysql::ATTR_SSL_CA`, causing fatal `Class not found` errors on PHP 8.2 and 8.3 environments.
- **Remediation:**
  - Removed `use Pdo\Mysql;`.
  - Implemented dynamic detection: `(defined('Pdo\Mysql::ATTR_SSL_CA') ? \Pdo\Mysql::ATTR_SSL_CA : \PDO::MYSQL_ATTR_SSL_CA)`.
  - Explicitly set `'engine' => 'InnoDB'` on MySQL and MariaDB connections.
  - Verified that all migration JSON columns are nullable, preventing MySQL strict mode syntax errors.

---

### 2.4 Tenancy & Domain Resolution Hardening (Phase 4)
- **Problem:** `ResolveStorefrontTenant.php` blindly trusted client headers (`X-Storefront-Domain`, `X-Tenant-Subdomain`) allowing tenant spoofing, and executed `Storefront::create(...)` inside a GET request middleware.
- **Remediation:**
  - Created `app/Core/Tenancy/TenantResolver.php` with:
    - Master domain guard (`proerp.devcenterpoint.com` is never treated as a tenant).
    - RFC-1123 DNS label regex validation (`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`).
    - Platform reserved subdomain verification.
    - Header trust restricted strictly to `local` and `testing` environments.
  - Removed on-the-fly storefront creation from `ResolveStorefrontTenant.php`.
  - Integrated `TenantResolver` into `TenantProvisioningService.php`.

---

### 2.5 Authentication Context Isolation (Phase 5)
- **Problem:**
  - `EnsurePlatformAdmin.php` only checked `$user->tenant_id !== null`, neglecting to verify `is_platform_user === true`.
  - Frontend `client.ts` fell back to `localStorage.getItem('platform_access_token')` on tenant requests when `access_token` was null.
- **Remediation:**
  - Hardened `EnsurePlatformAdmin.php` with `if (! $user->is_platform_user || $user->tenant_id !== null)`.
  - Refactored `client.ts:getAccessToken()` to enforce strict partitioning: platform requests only access `platform_access_token`, and tenant requests only access `access_token`.

---

### 2.6 Frontend Routing & Build Verification (Phase 6 & 11)
- **Problem:** Frontend route configuration treated `proerp.devcenterpoint.com` as a custom storefront domain because it did not start with `admin.` or `app.`.
- **Remediation:**
  - Added `isMasterPlatformDomain` guard in `frontend/src/routes/index.tsx` routing `proerp.devcenterpoint.com/` to `/platform`.
  - Created `frontend/.env.production` and `frontend/.env.example`.
  - Verified `npm run build`: built in 2.29s with 0 errors.

---

### 2.7 cPanel Background Jobs & Deployment (Phase 7 & 8)
- **Problem:** cPanel shared hosting terminates persistent queue daemons (`artisan queue:work`) and lacks Redis.
- **Remediation:**
  - Configured `QUEUE_CONNECTION=database`, `CACHE_STORE=database`, and `SESSION_DRIVER=database`.
  - Configured two non-overlapping cPanel cron jobs:
    - Task Scheduler: `* * * * * php artisan schedule:run`
    - Queue Worker: `* * * * * php artisan queue:work --stop-when-empty --max-time=50 --memory=128`
  - Created `backend/config/cors.php` with regex patterns for subdomains and credential support.
  - Updated `backend/public/.htaccess` with SPA fallback, direct API routing, and security headers.

---

## 3. Verification & Test Evidence

| Test Suite | Tests Run | Result | Key Invariants Verified |
|---|---|---|---|
| **ProductionHardeningTest** | 5 | **PASSED (100%)** | Master domain guard, reserved subdomains, RFC-1123 regex, platform admin auth isolation, clean ProductionSeeder. |
| **TenancyRuntimeTest** | 3 | **PASSED (100%)** | Layer-5 schema isolation, withoutTenantScope audit logging, context-free queue rejection. |
| **PlatformAdministrationTest** | 10 | **PASSED (100%)** | Platform tenant directory, KPIs, plans, impersonation, feature flags, audit logging. |
| **Frontend Production Build** | Full Bundle | **PASSED (100%)** | TypeScript clean compile, Vite bundle, manual chunks. |

---

## 4. Documentation Index

The following canonical documents have been authored and placed in `docs/`:
1. `docs/PRODUCTION_ARCHITECTURE.md`: Complete topology, hosting, database, and auth design.
2. `docs/WEBSURU_CPANEL_DEPLOYMENT.md`: Step-by-step cPanel deployment manual.
3. `docs/DOMAIN_SETUP.md`: DNS records, wildcard subdomains, and custom domain verification.
4. `docs/QUEUE_SCHEDULER_SETUP.md`: cPanel cron jobs and queue telemetry.
5. `docs/DATABASE_MIGRATION_AUDIT.md`: Schema, MySQL 8+, InnoDB, and PDO compatibility audit.
6. `docs/PRODUCTION_CHECKLIST.md`: Pre-deployment and go-live checklist.
7. `docs/PRODUCTION_SMOKE_TEST.md`: Post-deployment verification protocol.
8. `docs/ROLLBACK.md`: Emergency rollback and disaster recovery procedures.
9. `docs/TENANT_PROVISIONING.md`: Multi-tenant lifecycle and provisioning specifications.
10. `docs/DECISIONS.md`: Updated with **ADR-035**.
