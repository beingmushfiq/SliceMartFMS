# SYSTEM ARCHITECTURE — Forensic Blueprint (Phase 0)

> **Execution Protocol:** Master Development & System Hardening Protocol — Phase 0  
> **Target System:** SliceMart FMS (Multi-Tenant Manufacturing ERP + Master Platform Admin + Headless Storefront)  
> **Verification Status:** 100% Verified against live repository codebase, middleware chains, and schema constraints.  
> **Audit Date:** 2026-09-10  

---

## 1. High-Level Architectural Model

SliceMart FMS is designed as an event-driven, modular multi-tenant software-as-a-service (SaaS) platform built on a decoupled headless architecture:

```
                            ┌─────────────────────────────────┐
                            │    Cloudflare / Edge Gateway    │
                            │  (SSL, WAF, Rate Limiter, DNS)  │
                            └────────────────┬────────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             ▼                               ▼                               ▼
    app.slicemart.com               tenant.slicemart.com             shop.tenant.com
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│ Master Platform Admin   │     │ Tenant ERP Workspace    │     │ Headless Storefront     │
│ - Super Admin Control   │     │ - Role-Adaptive App     │     │ - Public Catalog & Cart │
│ - Tenant Provisioning   │     │ - Real-Time Dashboard   │     │ - Checkout & Tracking   │
│ - Subscription / Plans  │     │ - Modular Workspaces    │     │ - Social Commerce       │
└────────────┬────────────┘     └────────────┬────────────┘     └────────────┬────────────┘
             │                               │                               │
             └───────────────────────────────┼───────────────────────────────┘
                                             │
                                  HTTPS / JSON (REST API)
                             (X-Tenant-Id / Subdomain Binding)
                                             │
                                             ▼
                                ┌─────────────────────────┐
                                │   Laravel 13 REST API   │
                                └────────────┬────────────┘
                                             │
      ┌──────────────────────────────────────┼──────────────────────────────────────┐
      ▼                                      ▼                                      ▼
┌─────────────┐                      ┌─────────────┐                         ┌─────────────┐
│ Core Tenancy│                      │ 19 Business │                         │ Async Queue │
│ & Security  │                      │   Modules   │                         │  & Workers  │
└──────┬──────┘                      └──────┬──────┘                         └──────┬──────┘
       │                                    │                                       │
       └────────────────────────────────────┼───────────────────────────────────────┘
                                            │
                                            ▼
                      ┌───────────────────────────────────────────┐
                      │    Relational Database (MySQL / SQLite)   │
                      │  - 197 Migrations / 159 Relational Tables │
                      │  - Composite (tenant_id, id) Foreign Keys │
                      │  - Strictly Isolated Tenant Data Records  │
                      └───────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy Defense-in-Depth (The 5 Layers)

Data isolation is guaranteed through five non-bypassable architectural gates:

```
Request Entry
   │
   ├─► [Layer 1] DNS / Header Resolution
   │     └─ Subdomain mapped or 'X-Tenant-Id' extracted via ResolveTenant middleware.
   │
   ├─► [Layer 2] Tenant Lifecycle & Entitlement Verification
   │     └─ EnsureTenantActive verifies status ('active') and plan expiration.
   │
   ├─► [Layer 3] Thread-Local Execution Context
   │     └─ TenantContext::setTenant($tenant) binds context to execution thread.
   │        Empty context triggers immediate 500 fatal failure for safety.
   │
   ├─► [Layer 4] Eloquent Global Query Scoping
   │     └─ BelongsToTenant trait automatically injects 'WHERE tenant_id = ?'
   │        into all SELECT, UPDATE, and DELETE operations.
   │
   └─► [Layer 5] Database Schema Relational Integrity
         └─ Composite Foreign Keys (tenant_id, foreign_id) physically prevent
            cross-tenant relational association at the database engine level.
```

### Layer Details:
- **`ResolveTenant` Middleware:** Inspects incoming Host header or `X-Tenant-Id` header against the `tenants` table. If not found or invalid, returns HTTP 404 with structured error envelope.
- **`EnsureTenantActive` Middleware:** Blocks suspended, deactivated, or delinquent tenants with HTTP 403 Forbidden.
- **`TenantContext` Class:** Implements thread-local storage (`app(TenantContext::class)`). In queue jobs, the tenant is serialized into the job payload and restored using `TenantContext::runInTenantContext($tenant, fn() => ...)`.
- **`BelongsToTenant` Trait:** Enforces an Eloquent Global Scope (`TenantScope`) on all domain models. Cross-tenant queries are disallowed unless explicitly authorized via `withoutTenantScope()`, which records a mandatory warning log.
- **Composite Foreign Keys:** Tables use composite primary/foreign keys `(tenant_id, id)` and `(tenant_id, parent_id)` to guarantee database-level physical isolation.

---

## 3. Authentication & Authorization Lifecycle

```
Client (Zustand authStore)                           Backend (Laravel API)
          │                                                   │
          │── POST /api/v1/auth/login ───────────────────────►│
          │   { email, password }                             │ Authenticate credentials
          │                                                   │ Generate Access Token (JWT 15m)
          │                                                   │ Generate Refresh Token (UUID 7d)
          │◄── 200 OK + JSON { accessToken, user, tenant } ───│ Set-Cookie: refreshToken (httpOnly)
          │                                                   │
          │── GET /api/v1/tenant/production/batches ─────────►│
          │   Header: Authorization: Bearer <accessToken>     │ Verify JWT signature & claims
          │                                                   │ Verify permission: production.batch.view
          │◄── 200 OK + JSON { data, meta } ──────────────────│ Execute query within TenantScope
          │                                                   │
     (15 minutes pass - Access Token expires)                 │
          │                                                   │
          │── GET /api/v1/tenant/production/batches ─────────►│
          │   Header: Authorization: Bearer <expiredToken>    │ JWT Expired
          │◄── 401 Unauthorized { code: "TOKEN_EXPIRED" } ────│
          │                                                   │
          │── POST /api/v1/auth/refresh ─────────────────────►│
          │   Cookie: refreshToken=...                        │ Validate refresh token in DB
          │                                                   │ Invalidate old token (Rotation)
          │                                                   │ Issue fresh Access Token + Refresh Cookie
          │◄── 200 OK + JSON { accessToken } ─────────────────│
          │                                                   │
          │── (Re-issue original failed request) ────────────►│ Success!
```

---

## 4. Frontend State & Caching Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User Interface (React 19)                     │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│        Server State (Asynchronous)   │ │   Client UI State (Synchronous│
│        TanStack Query v5             │ │   Zustand v5 Stores           │
├──────────────────────────────────────┤ ├───────────────────────────────┤
│ - Cache key isolation by tenant      │ │ - authStore (token, user)     │
│ - Automated query deduplication      │ │ - posCartStore (active cart)  │
│ - Optimistic mutation updates        │ │ - storefrontCartStore (local) │
│ - Background refetch on window focus │ │ - workspaceStore (tabs state) │
│ - Error & retry backoff policies     │ │ - printModalStore (print cfg) │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

---

## 5. API Seam & Communication Contracts

All client-server interactions flow through a single unified API client: `frontend/src/lib/api/client.ts`.

### Unified Response Specification
Every response strictly adheres to the standard envelope:
```json
{
  "data": { ... } | [ ... ] | null,
  "meta": {
    "timestamp": "2026-09-10T00:00:00.000Z",
    "correlationId": "c2cc837f-714a-48b1-a9d6-dd524ab6322e",
    "pagination": {
      "currentPage": 1,
      "perPage": 25,
      "total": 142,
      "lastPage": 6
    }
  },
  "error": null | {
    "code": "VALIDATION_FAILED",
    "message": "The given data was invalid.",
    "details": {
      "batch_number": ["The batch number has already been taken."]
    }
  }
}
```

---

## 6. Database Schema Waves Topology

The relational database architecture is partitioned into 25 chronological migration waves guaranteeing zero circular foreign key dependencies:

1. **Wave 0 — Core System:** `tenants`, `domains`, `users`, `roles`, `permissions`, `refresh_tokens`.
2. **Wave 1 — Platform Management:** `plans`, `subscriptions`, `platform_audit_logs`, `platform_metrics`.
3. **Wave 2 — Multi-Tenancy Foundations:** `tenant_settings`, `tenant_users`, `branch_offices`.
4. **Wave 3 — Master Units & Categories:** `units`, `unit_conversions`, `categories`, `brands`.
5. **Wave 4 — Products & Variants:** `products`, `product_variants`, `variant_attributes`, `barcodes`.
6. **Wave 5 — Bill of Materials (BOM):** `boms`, `bom_items`, `bom_stages`, `recipe_costs`.
7. **Wave 6 — Multi-Warehouse Inventory:** `warehouses`, `warehouse_bins`, `stock_levels`, `stock_batches`.
8. **Wave 7 — Stock Operations:** `stock_transfers`, `stock_adjustments`, `stock_movements_ledger`.
9. **Wave 8 — Suppliers & Purchasing:** `suppliers`, `purchase_orders`, `po_items`, `supplier_quotations`.
10. **Wave 9 — Goods Receipt Notes (GRN):** `grns`, `grn_items`, `landed_costs`, `purchase_returns`.
11. **Wave 10 — Production Batches:** `production_batches`, `batch_materials`, `stage_progressions`.
12. **Wave 11 — Worker Production & Piece-Rate:** `workers`, `worker_shift_logs`, `piece_rate_entries`.
13. **Wave 12 — Quality Control (QC):** `qc_checkpoints`, `qc_inspections`, `defect_logs`, `quarantine_items`.
14. **Wave 13 — Customers & CRM:** `customers`, `customer_addresses`, `credit_limits`, `sales_quotations`.
15. **Wave 14 — Sales Orders & Invoicing:** `sales_orders`, `so_items`, `invoices`, `invoice_items`.
16. **Wave 15 — Payments & Cash Receipts:** `payments`, `payment_allocations`, `credit_notes`.
17. **Wave 16 — POS Terminals:** `pos_registers`, `pos_sessions`, `pos_sales`, `pos_line_items`.
18. **Wave 17 — Delivery & Dispatch:** `delivery_dispatches`, `courier_consignments`, `delivery_runs`.
19. **Wave 18 — Couriers & Integrations:** `couriers`, `courier_accounts`, `webhook_events`.
20. **Wave 19 — Chart of Accounts & GL:** `gl_accounts`, `fiscal_periods`, `journal_entries`, `journal_lines`.
21. **Wave 20 — Fixed Assets:** `asset_categories`, `fixed_assets`, `depreciation_schedules`.
22. **Wave 21 — HR & Payroll:** `departments`, `designations`, `employees`, `attendance_logs`, `payroll_runs`.
23. **Wave 22 — Document Printing & Barcoding:** `print_templates`, `barcode_configurations`.
24. **Wave 23 — E-Commerce Storefront CMS:** `storefront_pages`, `storefront_menus`, `storefront_banners`.
25. **Wave 24 & 25 — Fraud Verification & System Auditing:** `fraud_check_logs`, `system_audit_logs`.

---

## 7. Design System Token Cascade

The frontend adheres to a strictly structured 7-tier CSS cascade without utility classes or CSS-in-JS dependencies:

```
tokens.css          (Raw design primitives: colors, radii, shadows, z-indexes)
   │
   ▼
typography.css      (Type scale: font-family, sizes, line heights, weights)
   │
   ▼
reset.css           (Modern box-sizing, focus-visible, form element resets)
   │
   ▼
components.css      (UI Primitives styling: buttons, inputs, tables, cards)
   │
   ▼
layouts.css         (AppShell, TopNav, Sidebar, responsive workspace grids)
   │
   ▼
utilities.css       (Atomic margin, padding, flex, grid helpers)
   │
   ▼
theme.css           (Light/Dark contextual variable bindings: --bg-primary, --text-primary)
```

---

## 8. High-Performance Printing & Barcoding Architecture

```
User Click "Print Label / Receipt / Invoice"
          │
          ▼
Select Print Template (Thermal 50x30mm / POS 80mm / A4 Commercial)
          │
          ▼
Assemble Payload & Render Headless HTML Component
          │
          ├─► Barcode Generation: Render Vector SVG via bwip-js (isolated bundle chunk)
          │
          ├─► Inject CSS Paged Media Rules (@page { size: 50mm 30mm; margin: 0; })
          │
          ▼
Browser Print Preview Window Opened (Native window.print() or Silent Thermal Agent)
```

---

## 9. Scalability & Asynchronous Processing

- **Stateless API:** The Laravel API is 100% stateless; horizontal scaling across multiple container instances is supported out-of-the-box.
- **Queue Workers:** Heavy operations (PDF rendering, bulk payroll calculation, courier dispatch webhooks, email/SMS broadcasts) run through background queue workers with tenant context bound.
- **Cache Strategy:** Redis caching with tenant prefix tags (`tenant:{id}:{cache_key}`) enables instantaneous invalidation of tenant-specific data without polluting global cache.
