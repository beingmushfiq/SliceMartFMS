# Production-Ready SaaS Platform: Implementation Plan
## DevCenterPoint → ProERP → Multi-Tenant Manufacturing SaaS

---

## Phase 0 Audit Findings: What Actually Exists

This section documents reality — the actual state of the codebase — before any action is taken.

### 1. What the Codebase Is

A **Laravel 13 + React 19 / Vite 8** monorepo multi-tenant SaaS ERP platform. The codebase is architecturally sophisticated and substantially complete. It is **not** a demo or skeleton — it contains:

- 207 database migrations covering a full manufacturing ERP
- 19 backend modules (Assets, Audit, Auth, Catalogue, Delivery, Documents, Ecommerce, Finance, HR, Inventory, Notifications, Platform, POS, Pricing, Production, Purchasing, QC, Reports, Sales)
- 18 frontend module directories mirroring the backend
- A custom JWT authentication system (not Laravel Sanctum or Passport)
- A full tenant resolution/context system
- A platform administration panel with its own authentication context
- A multi-tenant storefront with SEO, CMS, and e-commerce
- 75 documentation files in `/docs`

### 2. Current Deployment Configuration (CRITICAL MISMATCH)

The codebase has **three contradictory deployment configurations simultaneously**:

| Configuration | Target |
|---|---|
| `docker-compose.yml` | PostgreSQL 16 + Nginx + PHP-FPM + Docker |
| `.env.production.example` (root) | `DB_CONNECTION=pgsql`, `APP_URL=https://app.slicemart.com`, Docker |
| `backend/.env` (development) | SQLite, `APP_URL=http://localhost:8000` |
| **Actual target** | **Websuru cPanel + Apache + MySQL + no Docker** |

> [!CAUTION]
> The `.env.production.example` file at the root documents a PostgreSQL + Docker deployment targeting `app.slicemart.com`. **This is entirely wrong for the actual production target.** It must be replaced — not edited — with a MySQL + cPanel + `proerp.devcenterpoint.com` configuration.

### 3. Authentication Architecture (What Exists)

**Three authentication contexts exist and are already separated:**

```
Platform Admin     → POST /api/v1/platform/auth/login  → is_platform_user=true, tenant_id=null
Tenant User        → POST /api/v1/auth/login (public)   → is_platform_user=false, tenant_id=N
Storefront Customer→ POST /api/v1/storefront/auth/*     → StorefrontCustomer model (separate)
```

- JWT-based custom auth (`firebase/php-jwt`)
- `AuthenticateJwt` middleware validates token version for revocation
- `EnsurePlatformAdmin` checks `tenant_id === null` — correct
- `ResolveTenant` reads `tenant_id` from JWT claim only, never from request body
- Body `tenant_id` disagreement with JWT throws `TenantMismatch` + logs security event

**⚠️ Issue found:** `ResolveStorefrontTenant` middleware accepts `X-Storefront-Domain`, `X-Storefront-Subdomain`, `X-Tenant-Subdomain` headers and query parameters — these are client-supplied and bypass the verified domain lookup. This is a security concern in production.

**⚠️ Issue found:** In `ResolveStorefrontTenant`, if a tenant slug is found but has no storefront, the middleware **creates a storefront automatically**. This is a side-effect in a read-path middleware and is incorrect behavior for production.

**⚠️ Issue found:** The `getAccessToken()` function in `client.ts` falls back to `localStorage` — this means tokens CAN be read by XSS. The comment in the file says "in memory only" but the implementation contradicts that.

### 4. Tenant Resolution (What Exists)

**`ResolveTenant` middleware** resolves from JWT claim `tenant_id` (correct).

**`ResolveStorefrontTenant` middleware** resolves from:
1. `X-Storefront-Domain` header (client-supplied — risk)
2. Host header (correct — but only for wildcard subdomain extraction)
3. `X-Storefront-Subdomain` / `X-Tenant-Subdomain` headers (client-supplied — risk)
4. Query parameter `?subdomain=` (client-supplied — risk)
5. Route parameter `{subdomain}` from path `/store/{subdomain}`
6. Host header extraction (correct)

**`TenantDomain` model and `tenant_domains` table** already exist with:
- `domain`, `type`, `is_primary`, `verification_status`, `ssl_status`
- `verification_token`, `verified_at`, `activated_at`
- Verification flow infrastructure is in place

**What's missing:** A hostname-first resolution for the ERP management app (not storefront). The management app login at `slicemart.devcenterpoint.com/login` needs to resolve the tenant from the hostname before the user authenticates, to present tenant-branded login.

### 5. Seeder / Mock Data Situation (CRITICAL FOR PRODUCTION)

The `DatabaseSeeder.php` calls **23 seeders** including:
- `EnterpriseDataSeeder.php` (41KB — bulk business data: orders, production batches, etc.)
- `ProductsTableSeeder.php` (18KB — Slice Mart product catalog)
- `PartiesTableSeeder.php` (6.8KB — fake customers/suppliers)
- `CrmLeadsTableSeeder.php` (4KB — fake CRM leads)
- `PlansAndTenantsSeeder.php` — **hardcodes `name: 'SliceMart'`, `slug: 'slicemart'`**
- `StockTableSeeder.php`, `PosTableSeeder.php` etc.

> [!WARNING]
> The `DatabaseSeeder` is a **development fixture runner** that seeds fake business data. It must NOT run in production. Production seeding must be separated from development seeding.

**What must survive:** Plans, BusinessTypes, IndustryProfiles, ReportDefinitions, Units, Categories, Roles/Permissions, DocumentTemplates — these are structural defaults.

**What must NOT run in production:** EnterpriseDataSeeder, ProductsTableSeeder, PartiesTableSeeder, CrmLeadsTableSeeder, StockTableSeeder, PosTableSeeder, BOMTableSeeder, EmployeesTableSeeder, BrandsTableSeeder (Slice Mart specific), StorefrontTableSeeder, PricingTableSeeder — all contain fake business data.

### 6. Frontend Mock Data (`/src/mocks/`)

Two files exist: `db.ts` and `envelope.ts`. These are **MSW (Mock Service Worker) fixtures for testing only** — they are NOT bundled into production because:
- MSW is in `devDependencies`
- The mock service worker is only activated in test/development environments
- The `mocks/` directory is used only in Vitest tests

These are legitimate test fixtures — **do not delete them**.

**`VITE_ENABLE_MOCK`** is not currently referenced in the Vite config or `main.tsx` — the MSW conditional activation is handled elsewhere. This needs to be verified.

### 7. Domain / URL Hardcoding Issues

- `.env.production.example`: `APP_URL=https://app.slicemart.com` ❌
- `.env.production.example`: `CORS_ALLOWED_ORIGINS=https://app.slicemart.com,https://pos.slicemart.com,https://store.slicemart.com` ❌
- `PlansAndTenantsSeeder`: `'name' => 'SliceMart'`, `'slug' => 'slicemart'` ❌ (dev only, acceptable if isolated)
- `ResolveStorefrontTenant`: hardcoded `'currency' => 'BDT'` in auto-created storefront ❌
- Multiple docs reference `app.slicemart.com`, `pos.slicemart.com` — documentation only, acceptable

### 8. Migration SQLite/MySQL Compatibility

Quick audit of patterns:
- JSON columns: used extensively — ✅ works in both (MySQL 5.7+, SQLite modern)
- `$table->json()`: compatible
- `$table->uuid()`: compatible
- `$table->softDeletes()`: compatible
- Potential issue: `use Pdo\Mysql;` imported in `database.php` — must confirm this class exists under all PHP versions used on cPanel
- `collation` / `charset` defaults: MySQL `utf8mb4_unicode_ci` already configured in `database.php`
- `DB_FOREIGN_KEYS` for SQLite: ✅ handled

### 9. Queue / Scheduler Reality

Current config: `QUEUE_CONNECTION=database` (in `.env`) — correct for cPanel.
Current: `CACHE_STORE=database` — correct for cPanel (no Redis).

Docker `docker-compose.yml` uses `queue:work` as a persistent daemon — **not available on cPanel**. Must use cron-driven `queue:work --stop-when-empty` or `queue:listen` pattern.

### 10. Frontend Build

- Vite 8 + React 19 + TypeScript
- Production build: `npm run build` → `tsc -b && vite build`
- No `VITE_ENABLE_MOCK` in current `vite.config.ts` — MSW activation path needs to be found
- Screenshots (`prod_*.png`, `qc_*.png` etc.) sitting in frontend root — should not be in deployment
- `take_screenshot.mjs`, `take_qc_screenshot.mjs`, `test_print.js`, `test_print_real.js` in frontend root — development scripts

### 11. What Is Already Done Well (DO NOT BREAK)

- ✅ JWT custom auth with token versioning for revocation
- ✅ Platform admin isolation (`is_platform_user` + `tenant_id === null`)
- ✅ `TenantContext` singleton — immutable, throws if called without bind
- ✅ `BelongsToTenant` trait — global scope for tenant isolation
- ✅ Body `tenant_id` mismatch detection → security log + 403
- ✅ Structured exception handler with correlation IDs
- ✅ Rate limiting (login: 5 attempts/5min by email + IP; API: 300/min)
- ✅ Idempotency key table
- ✅ Database-backed sessions, cache, queues (Redis-free)
- ✅ `tenant_domains` table with verification workflow
- ✅ Separate route files per authentication context
- ✅ CORS and CSRF consideration built-in
- ✅ Soft deletes throughout
- ✅ `.htaccess` for Apache/cPanel

---

## User Review Required

> [!IMPORTANT]
> **Deployment Environment Confirmation Required**
> Before any production configuration is created, the exact Websuru cPanel environment must be known. The following must be confirmed:
> - PHP version available (project requires PHP ^8.5)
> - MySQL version (needs 5.7+ for JSON columns)
> - Is SSH access available for Composer/Artisan?
> - Are cPanel cron jobs available?
> - Is Node.js available (for frontend build)?
> - What is the document root structure?
> - Is wildcard subdomain (`*.devcenterpoint.com`) configured or configurable?

> [!WARNING]
> **Seeder Separation is a Release Blocker**
> The current `DatabaseSeeder` runs fake business data. Running `php artisan db:seed` on production would populate the database with Slice Mart test data. This must be resolved before any deployment.

> [!IMPORTANT]
> **Token Storage Security**
> The `getAccessToken()` function in `client.ts` reads from `localStorage` as a fallback. The design intent (ADR-007) is in-memory only. This behavioral divergence must be clarified and resolved before production.

---

## Open Questions

1. **Websuru cPanel PHP version**: Does cPanel have PHP 8.5? (Composer requires it per `composer.json`)
2. **Wildcard DNS**: Is `*.devcenterpoint.com` currently configured to point to the Websuru server?
3. **Frontend build location**: Should the built React assets be served by Laravel (inside `public/`) or as a separate subdomain/directory?
4. **Platform domain isolation**: Should `proerp.devcenterpoint.com` be a separate cPanel addon domain from `*.devcenterpoint.com`, or the same application?
5. **Slice Mart domain**: Is `slicemart.tech` already owned? Does it currently point anywhere?
6. **Existing production data**: Is there any existing production data in MySQL that must be preserved, or is this a fresh deployment?
7. **Queue workers**: Can a cron job run every minute on Websuru? (Required for Laravel scheduler)

---

## Proposed Changes by Phase

---

### PHASE 0: Audit ✅ COMPLETE (This document)

---

### PHASE 1: Architecture Reconciliation

#### [MODIFY] [`.env.production.example`](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/.env.production.example)
Replace entirely. Target: MySQL + cPanel + `proerp.devcenterpoint.com`. Remove all Docker, PostgreSQL, `app.slicemart.com` references.

#### [NEW] [`backend/.env.production.example`](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/backend/.env.production.example)
Production-specific backend env template. MySQL, database-driven cache/session/queue, correct URLs.

#### [NEW] [`docs/PRODUCTION_ARCHITECTURE.md`](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/docs/PRODUCTION_ARCHITECTURE.md)
Authoritative production architecture document replacing contradictory Docker docs.

#### [NEW] [`docs/WEBSURU_CPANEL_DEPLOYMENT.md`](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/docs/WEBSURU_CPANEL_DEPLOYMENT.md)
Hosting constraints document. Must be completed after Websuru environment is inspected.

#### [NEW] [`docs/DECISIONS.md` update](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/docs/DECISIONS.md)
Document the PostgreSQL→MySQL, Docker→cPanel, `app.slicemart.com`→`proerp.devcenterpoint.com` decisions.

---

### PHASE 2: Mock Data / Production Seeder Separation

#### [NEW] `database/seeders/ProductionSeeder.php`
Structural-only seeder: Plans, BusinessTypes, IndustryProfiles, ReportDefinitions, Units (generic), Categories (generic), Roles/Permissions, DocumentTemplates. No Slice Mart-specific data.

#### [MODIFY] `database/seeders/DatabaseSeeder.php`
Rename to `DevSeeder.php`. Keep all current fake-data seeders for local development only. `DatabaseSeeder` becomes the alias of `ProductionSeeder`.

#### [MODIFY] `database/seeders/PlansAndTenantsSeeder.php`
Remove hardcoded `'name' => 'SliceMart'` tenant creation. Plans seeding stays — plan names are structural platform data, not tenant data.

#### [NEW] `app/Modules/Platform/Actions/ProvisionTenantAction.php`
If it doesn't already exist — the transactional tenant creation action, replacing the seeder-based provisioning.

---

### PHASE 3: Database Compatibility

#### Audit all 207 migrations for MySQL compatibility
- Verify `json()` columns (MySQL 5.7.8+)
- Check string lengths for `utf8mb4` (191 char index limit on MySQL < 5.7.7 — may need to adjust)
- Check enum usage vs string constraints
- Verify `use Pdo\Mysql;` in `config/database.php` (PHP 8.5 PDO namespace change)

#### [NEW] `docs/DATABASE_MIGRATION_AUDIT.md`
Per-migration compatibility notes.

---

### PHASE 4: Tenant/Domain Resolution Hardening

#### [MODIFY] [`ResolveStorefrontTenant.php`](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/backend/app/Core/Http/Middleware/ResolveStorefrontTenant.php)

**Changes:**
1. Remove `X-Storefront-Domain`, `X-Storefront-Subdomain`, `X-Tenant-Subdomain` header trust in production — only use actual `Host` header
2. Remove auto-creation of storefront on missing (`Storefront::create(...)`) — return 404 instead
3. Priority order: verified custom domain → platform subdomain extraction → 404
4. Add `platform_domain` check: if host matches master domain, skip tenant resolution

#### [NEW] `app/Core/Tenancy/TenantResolver.php`
Centralized hostname resolution service used by both `ResolveStorefrontTenant` and the management app login endpoint.

Resolution order:
1. If host = `proerp.devcenterpoint.com` → Master Panel (no tenant)
2. If host matches verified `tenant_domains.domain` with `verification_status='verified'` → resolve that tenant
3. If host matches `{slug}.devcenterpoint.com` pattern → resolve by slug from `tenants` table
4. Otherwise → 404 / tenant not found

#### [NEW] `app/Modules/Auth/Controllers/TenantLoginController.php`
Endpoint: `GET /api/v1/auth/resolve-tenant` — given a hostname (from frontend), returns the tenant branding info for login page customization. Called before authentication so the login page can show tenant logo/name.

---

### PHASE 5: Master / Tenant Authentication Isolation

#### [MODIFY] [`EnsurePlatformAdmin.php`](file:///d:/Production ERP with Storefront/slicemart-fms/backend/app/Core/Http/Middleware/EnsurePlatformAdmin.php)
Add check for `is_platform_user === true` (not just `tenant_id === null`) — defense in depth.

#### [MODIFY] [`AuthenticateJwt.php`](file:///d:/Production ERP with Storefront/slicemart-fms/backend/app/Core/Http/Middleware/AuthenticateJwt.php)
Already correct, but add explicit rejection of platform-user JWT on tenant routes (currently only checked in ResolveTenant, which runs after).

#### [MODIFY] `client.ts` — `getAccessToken()`
Remove localStorage fallback for non-platform paths. Access token must live in memory only for tenant sessions (ADR-007). localStorage is acceptable only for platform admin sessions where the security model is different.

---

### PHASE 6: Production Environment Configuration

#### [NEW] `backend/.env.production.example`
```
APP_NAME="DevCenterPoint ProERP"
APP_ENV=production
APP_KEY=base64:GENERATE_WITH_PHP_ARTISAN_KEY_GENERATE
APP_DEBUG=false
APP_URL=https://proerp.devcenterpoint.com

# Platform Identity
PLATFORM_NAME="DevCenterPoint"
MASTER_DOMAIN=proerp.devcenterpoint.com
TENANT_BASE_DOMAIN=devcenterpoint.com

# Database (MySQL — Websuru cPanel)
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=YOUR_CPANEL_DB_NAME
DB_USERNAME=YOUR_CPANEL_DB_USER
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

# Cache / Session / Queue (database driver — no Redis required)
CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

# JWT
JWT_SECRET=GENERATE_64_CHAR_RANDOM
JWT_TTL=900
REFRESH_TOKEN_TTL=1209600

# CORS
CORS_ALLOWED_ORIGINS=https://proerp.devcenterpoint.com,https://*.devcenterpoint.com

# Mail
MAIL_MAILER=smtp
MAIL_HOST=mail.devcenterpoint.com
MAIL_PORT=465
MAIL_USERNAME=noreply@devcenterpoint.com
MAIL_PASSWORD=YOUR_MAIL_PASSWORD
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=noreply@devcenterpoint.com
MAIL_FROM_NAME="DevCenterPoint ProERP"

LOG_CHANNEL=daily
LOG_LEVEL=error

VITE_API_BASE_URL=/api
VITE_APP_TITLE="DevCenterPoint ProERP"
VITE_ENABLE_MOCK=false
VITE_MASTER_DOMAIN=proerp.devcenterpoint.com
VITE_TENANT_BASE_DOMAIN=devcenterpoint.com
```

#### [NEW] `backend/config/platform.php`
Centralized platform configuration:
```php
return [
    'master_domain'      => env('MASTER_DOMAIN', 'proerp.devcenterpoint.com'),
    'tenant_base_domain' => env('TENANT_BASE_DOMAIN', 'devcenterpoint.com'),
    'platform_name'      => env('PLATFORM_NAME', 'DevCenterPoint'),
    'reserved_slugs'     => ['www','api','admin','platform','master','proerp','mail','ftp','smtp','pop','imap','ns1','ns2','cpanel','webmail'],
];
```

---

### PHASE 7: cPanel Deployment Architecture

#### [NEW] `docs/WEBSURU_CPANEL_DEPLOYMENT.md`
Documents exact deployment steps, cPanel document root configuration, cron setup, PHP version requirements.

#### [NEW] `docs/DOMAIN_SETUP.md`
DNS requirements for `*.devcenterpoint.com` wildcard, `proerp.devcenterpoint.com`, and custom tenant domain verification flow.

#### [MODIFY] `backend/public/.htaccess`
Add security headers compatible with Apache/cPanel:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Remove `Authorization` header passthrough issue (already handled, but verify)

#### Deployment structure decision:
Laravel's `public/` becomes the cPanel document root. React SPA build output (`frontend/dist/`) is copied into `backend/public/` during deployment. Laravel serves the SPA fallback.

---

### PHASE 8: Cache / Queue / Scheduler (cPanel)

#### Queue Strategy (no Supervisor):
- `QUEUE_CONNECTION=database` (already set)
- cPanel cron: `* * * * * php /path/to/artisan queue:work --once 2>/dev/null` (runs one job per minute)
- Alternative: `php artisan queue:work --stop-when-empty` in cron if cPanel allows longer-running jobs

#### Scheduler:
- cPanel cron: `* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1`

#### [NEW] `docs/QUEUE_SCHEDULER_SETUP.md`
Exact cron commands for Websuru cPanel.

---

### PHASE 9: Security Hardening

1. **ResolveStorefrontTenant**: Fix header trust (Phase 4)
2. **Subdomain injection prevention**: Validate extracted subdomain against `[a-z0-9-]{1,63}` DNS label pattern
3. **Reserved slug validation**: Check against `config/platform.php` reserved list on tenant creation
4. **Slug normalization**: `strtolower`, replace spaces/special chars, trim hyphens
5. **Rate limiting audit**: Already in AppServiceProvider — verify login endpoint uses it
6. **CORS**: Verify `cors.php` config or Laravel CORS middleware matches production domains
7. **`APP_DEBUG=false`**: Enforced in production env
8. **File upload security**: Audit storage paths for tenant isolation

#### [NEW] `docs/SECURITY.md` update
Document the security model, what's enforced at backend, what frontend permissions mean.

---

### PHASE 10: Migration MySQL Compatibility Fix

Critical item: `use Pdo\Mysql;` in `config/database.php` line 6:

```php
use Pdo\Mysql;
```

This is a PHP 8.1+ namespaced PDO attribute. Must verify this class is available on the cPanel PHP version. If `pdo_mysql` extension is not available with this namespace, use the integer constant directly.

The `MYSQL_ATTR_SSL_CA` usage is inside `extension_loaded('pdo_mysql') ? array_filter([...])` guard — safe.

---

### PHASE 11: Production Build & Deployment

#### [NEW] `docs/PRODUCTION_CHECKLIST.md`
Step-by-step deployment checklist.

#### [NEW] Deployment script concept (documented, not automated via Docker):
```bash
# 1. Backup database
# 2. git pull / upload release
# 3. composer install --no-dev --optimize-autoloader
# 4. npm ci && npm run build (in frontend/)
# 5. cp -r frontend/dist/* backend/public/
# 6. php artisan config:cache
# 7. php artisan route:cache
# 8. php artisan view:cache
# 9. php artisan migrate --force
# 10. php artisan db:seed --class=ProductionSeeder (first deploy only)
# 11. php artisan storage:link
# 12. Verify health endpoint
```

---

### PHASE 12–13: Domain Verification & QA

#### [NEW] `docs/DOMAIN_SETUP.md`
- Wildcard DNS configuration for `*.devcenterpoint.com`
- `proerp.devcenterpoint.com` A record
- Custom domain verification flow (DNS TXT record)
- SSL requirements (Let's Encrypt via cPanel, or manual)

#### [NEW] `docs/PRODUCTION_SMOKE_TEST.md`
Per the 41 smoke test items in the prompt.

---

### PHASE 14: Documentation & Handover

#### [NEW] `docs/ROLLBACK.md`
#### [NEW] `docs/TENANT_PROVISIONING.md`
#### [NEW] `docs/PRODUCTION_ENVIRONMENT.md`
#### [NEW/MODIFY] `docs/CODEBASE_CLEANUP_REPORT.md`

---

## Files Identified for Cleanup (Before Any Deletion)

| File/Dir | Action | Reason |
|---|---|---|
| `docker-compose.yml` | DEPRECATE (keep but document) | Not used on cPanel but useful for local dev |
| `docker/` directory | DEPRECATE (keep) | Local dev only |
| `.env.production.example` (root) | REPLACE | Wrong target, wrong DB, wrong domain |
| `frontend/prod_*.png`, `qc_*.png`, `plans_actions_open.png` etc. | REMOVE | Dev screenshots in repo root |
| `frontend/take_screenshot.mjs`, `take_qc_screenshot.mjs` | REMOVE (or move to scripts/) | Dev utilities |
| `frontend/test_print.js`, `test_print_real.js` | REMOVE (or move to scripts/) | Dev test scripts |
| `database/seeders/EnterpriseDataSeeder.php` | ISOLATE (dev-only) | Bulk fake business data |
| `database/seeders/ProductsTableSeeder.php` | ISOLATE (dev-only) | Slice Mart products |
| `database/seeders/PartiesTableSeeder.php` | ISOLATE (dev-only) | Fake customers/suppliers |
| `database/seeders/CrmLeadsTableSeeder.php` | ISOLATE (dev-only) | Fake CRM data |

---

## Verification Plan

### Automated Tests to Add
- `tests/Feature/Tenancy/TenantIsolationTest.php` — Tenant A cannot access Tenant B's data
- `tests/Feature/Auth/PlatformAuthIsolationTest.php` — Platform JWT rejected on tenant routes
- `tests/Feature/Domain/TenantResolutionTest.php` — hostname resolution order
- `tests/Feature/Domain/SubdomainValidationTest.php` — reserved slug rejection
- `tests/Feature/Subscription/SubscriptionEnforcementTest.php` — expired/suspended tenant behavior
- `tests/Feature/Provisioning/TenantProvisioningTest.php` — full provisioning flow

### Manual Verification
1. `proerp.devcenterpoint.com` → Master Panel login
2. `slicemart.devcenterpoint.com/login` → Slice Mart tenant login
3. `slicemart.tech/login` → Slice Mart tenant login (custom domain)
4. Unknown hostname → 404, safe error message
5. Tenant A with Tenant B's data URL → 403 or 404, never Tenant B data

---

## Execution Order Summary

```
Phase 0  ✅ Audit complete (this document)
Phase 1  → Architecture reconciliation + docs
Phase 2  → Seeder separation (critical for production safety)
Phase 3  → MySQL migration compatibility audit
Phase 4  → Tenant resolver hardening + hostname-first resolution
Phase 5  → Auth context isolation tightening
Phase 6  → Production environment files
Phase 7  → cPanel deployment architecture + .htaccess
Phase 8  → Queue/scheduler/cache cPanel config
Phase 9  → Security hardening pass
Phase 10 → MySQL-specific fixes
Phase 11 → Build + deployment script documentation
Phase 12 → Domain setup + DNS documentation
Phase 13 → QA and smoke tests
Phase 14 → Final documentation handover
```

> [!IMPORTANT]
> **Awaiting user approval before any code changes begin.**
> No source files will be modified until this plan is reviewed and approved.
