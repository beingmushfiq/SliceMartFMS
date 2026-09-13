# DevCenterPoint ProERP — Production Architecture Specification

**Document Version:** 1.0.0  
**Date:** September 2026  
**Status:** Canonical / Approved  
**Target Environment:** Websuru cPanel Hosting (MySQL 8+ / Apache / PHP 8.2+ / No Docker)

---

## 1. Executive Summary & Topology

DevCenterPoint ProERP is a high-performance multi-tenant manufacturing and enterprise resource planning (ERP) platform with an integrated headless storefront engine.

In production on **Websuru cPanel hosting**, the system operates without container orchestration (Docker/Kubernetes) or standalone in-memory daemons (Redis/Supervisor). Instead, it leverages:
- **Web Server:** Apache with `mod_rewrite`, `mod_headers`, and `mod_ssl`
- **Application Engine:** PHP 8.2+ running under cPanel PHP-FPM / FastCGI
- **Database:** Single shared MySQL 8+ instance with strict row-level multitenancy (`tenant_id` column and Eloquent global scopes)
- **Frontend Delivery:** Static Single Page Application (React 19 / Vite) compiled and served from the web root (`public/`)
- **Background Tasks & Scheduler:** Driven by cPanel cron executing `php artisan schedule:run` and `php artisan queue:work --stop-when-empty`

```
                                  [ Internet / Visitors ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [ Wildcard Subdomains ]                     [ Master Domain ]
           *.devcenterpoint.com                      proerp.devcenterpoint.com
           (or Verified Custom CNAME)                              │
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             ▼
                               [ Websuru cPanel Apache ]
                       (SSL termination / vHost / .htaccess)
                                             │
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
            [ Static Frontend Assets ]                   [ Laravel Backend Engine ]
             (/assets/*.js, *.css)                     (index.php -> bootstrap/app.php)
                        │                                         │
                        │                             ┌───────────┴───────────┐
                        │                             ▼                       ▼
                        │                    [ Tenant Context ]      [ Platform Context ]
                        │                    (ResolveTenant /        (EnsurePlatformAdmin)
                        │                     ResolveStorefront)              │
                        │                             │                       │
                        └──────────────────────┬──────┴───────────────────────┘
                                               ▼
                                  [ MySQL Database (Localhost) ]
                                   - Shared schema (InnoDB)
                                   - Scoped queries via tenant_id
                                   - Queues / Jobs / Sessions tables
```

---

## 2. Domain & Routing Topology

### 2.1 Domain Allocations
| Hostname Pattern | Audience | Role | Frontend Route / Space |
|---|---|---|---|
| `proerp.devcenterpoint.com` | Super Admins & Platform Ops | Platform Control Plane | `/platform/*` (Platform Admin Workspace) |
| `{tenant-slug}.devcenterpoint.com` | Tenant Employees & Admins | SaaS ERP Workspace | `/` to `/settings/*` (Core ERP Modules) |
| `{tenant-slug}.devcenterpoint.com` (Store) | Public Consumers / Buyers | Headless B2B/B2C Storefront | `/store/:subdomain` (or auto-rendered storefront root) |
| `custom-domain.com` (CNAME) | Public Consumers / Wholesale | Verified Custom Storefront Domain | Storefront Root with custom branding |

### 2.2 Domain Resolution Rules
1. **Master Domain Exemption:** Requests arriving at `proerp.devcenterpoint.com` are recognized by `TenantResolver` as the platform control plane. Tenancy scoping is NOT activated; instead, the platform admin guard is enforced.
2. **Subdomain Extraction:** Subdomains are extracted strictly by matching against the base domain (`devcenterpoint.com`). Extracted slugs must match RFC-1123 DNS label regex (`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`) and cannot match reserved terms.
3. **Custom Domain Verification:** Requests arriving on non-base domains query `tenant_domains` where `verification_status = 'verified'`. Unverified domains receive an HTTP 404/403.
4. **Header Spoofing Prevention:** In production (`APP_ENV=production`), `X-Tenant-Subdomain`, `X-Storefront-Subdomain`, and `X-Storefront-Domain` headers are ignored unless specifically coming from a trusted local proxy. Host resolution relies on `$request->getHost()`.

---

## 3. Database & Multitenancy Architecture

### 3.1 Single Database, Multi-Tenant Partitioning
- **Engine:** MySQL 8.0+ / MariaDB 10.5+ with `InnoDB` storage engine.
- **Character Set & Collation:** `utf8mb4` with `utf8mb4_unicode_ci`.
- **Tenant Scoping:** Every business entity table contains `tenant_id unsignedBigInteger NOT NULL` indexed with compound keys `(tenant_id, id)` and `(tenant_id, uuid)`.
- **Global Scope Enforcement:** Models implement the `BelongsToTenant` trait which applies `TenantScope`. No raw database queries bypass tenant filtering without explicit `withoutTenantScope()` calls in audited system jobs.
- **Tenant Context:** `TenantContext::bind($tenant)` is an immutable request-scoped container. Once bound, attempts to re-bind throw `TenantContextLockedException`.

### 3.2 Seeder Hygiene & Production Readiness
- **Production Seeder (`ProductionSeeder.php`):** Seeds only non-destructive structural prerequisites:
  - Default Subscription Plans (`Starter`, `Professional`, `Enterprise`, `Manufacturing Suite`)
  - Standard Global Currencies & Units of Measurement
  - Seeded System Roles & Permissions Matrix
- **Development Seeder (`DevelopmentSeeder.php`):** Contains demo tenants (such as SliceMart), fake inventory, simulated batch cards, and mock sales data. NEVER run on production.

---

## 4. Authentication, Sessions & Security

### 4.1 Token Separation
The platform utilizes a cryptographic JWT framework:
- **Platform Tokens:** Issued exclusively to platform administrative accounts (`is_platform_user = true`). Contain `is_platform_admin: true` in the token payload and are signed with the application key or `JWT_SECRET`.
- **Tenant Tokens:** Issued to tenant staff and administrators. Payload contains `tenant_id`, `subdomain`, `user_id`, and `token_version`.
- **Rejection of Cross-Context Tokens:**
  - Tenant API endpoints reject platform tokens missing a bound `tenant_id`.
  - Platform API endpoints (`api/platform/*`) reject any token where `is_platform_user != true`.
  - Invalidation: Users possess a `token_version` integer in the database. Password changes or session revokes increment this version, immediately invalidating issued JWTs.

### 4.2 Storage & File Isolation
Tenant uploads (e.g., invoices, QC attachments, logos, design files) are stored strictly under:
```
backend/storage/app/tenants/{tenant_id}/{module}/{filename}
```
Public downloads are served via authenticated download controllers verifying that the active `TenantContext::id()` matches the path's `{tenant_id}`. Direct unauthenticated directory listing is forbidden via `.htaccess`.

---

## 5. Queue, Cache & Scheduler Architecture (cPanel Native)

### 5.1 No Daemon Dependency
Standard production setups rely on systemd or Supervisor to keep `php artisan queue:work` running continuously. In Websuru cPanel shared/reseller hosting, long-running daemon processes are typically killed by cPanel resource monitors (LVE / CloudLinux).

**The Solution:**
1. **Queue Driver:** `QUEUE_CONNECTION=database` using the `jobs` and `failed_jobs` tables.
2. **Queue Processing Cron:** A cron job scheduled every minute:
   ```bash
   /usr/local/bin/php /home/CPANEL_USER/backend/artisan queue:work --stop-when-empty --max-time=50 --memory=128
   ```
   This processes pending jobs and exits cleanly before the next minute's cron execution.
3. **Scheduler Cron:** Standard Laravel scheduler execution every minute:
   ```bash
   /usr/local/bin/php /home/CPANEL_USER/backend/artisan schedule:run >> /dev/null 2>&1
   ```
4. **Cache:** `CACHE_STORE=database`. Fast MySQL InnoDB lookups for cached permissions and tenant configs, isolated with keys formatted as `tenant:{id}:{key}`.

---

## 6. Frontend Compilation & Hybrid Delivery

### 6.1 Unified Single-Page Application
The frontend is built once using Vite:
```bash
npm run build
```
The output directory `frontend/dist/` contains:
- `index.html`
- `assets/*.js` and `assets/*.css`
- Static images, icons, and fonts

### 6.2 Deployment Structure
On the cPanel server:
- Backend code lives safely outside the web root: `/home/CPANEL_USER/backend/`
- Public assets live in the public web root: `/home/CPANEL_USER/public_html/` (or mapped subdomain directories).
- The frontend build output is synced directly into `/home/CPANEL_USER/public_html/` alongside Laravel's `index.php`.
- Apache `.htaccess` routes all `/api/*` requests to `index.php` and rewrites all other browser page routes to `index.html`.
