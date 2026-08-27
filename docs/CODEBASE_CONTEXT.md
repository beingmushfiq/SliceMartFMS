# CODEBASE CONTEXT & PERSISTENT PROJECT MEMORY

> **Status:** Canonical Single Source of Truth & Persistent Project Memory.
> **Repository:** `SliceMartFMS` (`d:\SliceMartFMS`)
> **Last updated:** 2026-08-27 · **Active Phase:** Phase 2 (Master Data & Catalogue CRUD)

---

## 1. Project Overview

**FMS Platform** is a multi-tenant enterprise Software-as-a-Service (SaaS) platform engineered for small to mid-sized manufacturers who make products from raw materials, store inventory across multi-level warehouses/bins, sell across multiple discrete channels (counter/POS, dealer, phone, field, ecommerce), compensate workers through piece-rate and production-linked incentives, and fulfill doorstep deliveries via internal fleets and external courier integrations.

* **Tenant #1:** Slice Mart — a customer and reference deployment, *never* a hardcoded assumption (ADR-001).
* **Core Philosophy:** One product sold many times. Every feature is configurable at the tenant level (ADR-002).
* **Guiding Test:** If a competitor of Slice Mart signed up tomorrow, could they run their factory on this system without a single code change? The answer must be 100% yes.

---

## 2. Current Architecture

The platform is designed as a **Modular Monolith, API-first, with a separate SPA client** (ADR-003, ADR-006):

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Clients                                                               │
│  ┌────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│  │ Back-office SPA    │  │ POS Counter      │  │ Public Storefront   │ │
│  │ React 19 + TS      │  │ Dedicated Shell  │  │ (Phase 9)           │ │
│  └─────────┬──────────┘  └────────┬─────────┘  └──────────┬──────────┘ │
└────────────┼──────────────────────┼───────────────────────┼────────────┘
             │ HTTPS / JSON         │                       │
             ▼                      ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│  API Layer (Laravel 13 HTTP Kernel / Routing Pipeline)                 │
│  CorrelationId → AuthenticateJwt → ResolveTenant → EnsureTenantActive  │
│  → AuthorizePermission → ErrorHandler Envelope (§2.3)                  │
├────────────────────────────────────────────────────────────────────────┤
│  Application Layer (Actions, FormRequests, Resources, Events, DTOs)    │
│  Single-responsibility Action classes, strict request validation       │
├────────────────────────────────────────────────────────────────────────┤
│  Domain Layer (Eloquent Models, Scopes, Invariants, Enums)             │
│  BelongsToTenant global scope, composite foreign keys, decimal casting │
├────────────────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (MySQL 8, SQLite Memory Test, Redis, Queues)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Architectural Principles:
1. **Layer Discipline:** Controllers do not hold business logic; they validate input, invoke an Action, and transform output via an API Resource.
2. **Module Boundary Discipline:** Modules interact via public services/actions and domain events, never reaching into internal raw queries of another domain.
3. **Immutability of Financial & Inventory Truth:** Stock quantities and monetary transactions are derived from append-only ledgers (`stock_movements`, `journal_entries`). Balance tables are performance caches rebuildable at any time.

---

## 3. Technology Stack & Exact Versions

| Tier / Component | Technology | Version | Purpose / Configuration |
|---|---|---|---|
| **Backend Runtime** | PHP | `^8.5` (cli `8.5.0` ZTS Visual C++ 2022 x64) | Strict types `declare(strict_types=1);` enforced |
| **Backend Framework** | Laravel | `13.26.1` (`laravel/framework ^13.17`) | Modular monolith backend API |
| **Auth Library** | `firebase/php-jwt` | `^7.1` | EdDSA / RS256 / HS256 JWT encoding/decoding |
| **Static Analysis** | PHPStan / Larastan | `phpstan ^2.2`, `larastan ^3.10` | **Level 9** strict analysis with `checkModelProperties` |
| **Code Style (PHP)** | Laravel Pint | `^1.27` | Strict rules: `declare_strict_types`, `strict_comparison`, `ordered_class_elements` |
| **Testing (Backend)** | PHPUnit | `^12.5.12` | Feature & Unit suites, in-memory SQLite (`:memory:`) |
| **Frontend Runtime** | Node.js | `>=22` (CI pinned Node 22, Engine `^24` / `^22`) | Monorepo root workspace |
| **Frontend Framework** | React | `^19.2.8` | Client SPA with React 19 concurrent features |
| **Frontend Language** | TypeScript | `~6.0.2` (`^5.8` / `^6.0`) | `strict: true`, `noUncheckedIndexedAccess: true` |
| **Build Tool** | Vite | `^8.2.0` | High-speed ESM bundler with bundle budget analyzer |
| **CSS & Styling** | Tailwind CSS | `v4.3.3` (`@tailwindcss/postcss`) | CSS-first `@theme` design tokens (no `tailwind.config.js`) |
| **Server State** | TanStack Query | `^5.101.4` | Single source of truth for remote server state |
| **UI State** | Zustand | `^5.0.15` | Transient client-only UI state (modals, drawers, density) |
| **Forms & Validation** | React Hook Form + Zod | RHF `^7.85.0`, Zod `^3.25.76` | Type-safe form validation matching backend contracts |
| **Data Tables** | TanStack Table | `^9.1.2` | Headless, virtualized, high-performance table views |
| **Virtualization** | TanStack Virtual | `^3.14.10` | DOM virtualization for large inventories/orders |
| **Motion & Animation** | Framer Motion + GSAP | `framer-motion ^13.1.0`, `gsap ^3.15.0` | Purposeful craft motion, token-mirrored, a11y reduced-motion |
| **Icons** | Lucide React | `^1.31.0` | Modern, consistent iconography |
| **Toasts** | Sonner | `^2.0.8` | Transient toast notifications re-themed with design tokens |
| **Internationalization** | i18next + react-i18next | `i18next ^26.4.0`, `react-i18next ^17.0.12` | English (`en`) & Bengali (`bn`) native localization |
| **Mocking / Testing** | MSW + Vitest + Testing Lib | MSW `^2.15.0`, Vitest `^4.1.11` | Contract-derived network mock testing & component tests |

---

## 4. Repository Structure

```text
d:\SliceMartFMS/
├── .agents/                    AI agent skill configurations and definitions
├── .antigravity/               IDE metadata and configuration
├── .github/
│   └── workflows/
│       └── ci.yml              Complete 3-job 9-leg CI pipeline
├── docs/                       Canonical binding specifications & documentation
│   ├── _legacy/                Archived legacy specifications (non-authoritative)
│   ├── API_CONTRACT.md         Detailed wire format, error codes & endpoint specifications
│   ├── ARCHITECTURE.md         System design, request lifecycle, tenancy & transaction boundaries
│   ├── CHANGELOG.md            Historical changelog of delivered capabilities
│   ├── CODEBASE_CONTEXT.md     Persistent codebase memory (this file)
│   ├── DATABASE.md             Authoritative database reference, tables & relationships
│   ├── DATABASE_DESIGN.md      Schema groups, ledger design & migration waves
│   ├── DECISIONS.md            Architectural Decision Records (ADR-001 to ADR-031)
│   ├── DEPLOYMENT.md           Deployment guide, infrastructure topology & environment config
│   ├── DEVELOPMENT_STATUS.md   Live ledger of implementation status
│   ├── IMPLEMENTATION_PLAN.md  Phase-by-phase execution plan & task definitions
│   ├── MODULE_MAP.md           41-module registry, dependency graph & Definition of Done
│   ├── PROJECT_CONTEXT.md      Product identity, domain language & business rules
│   ├── README.md               Documentation index & precedence rules
│   ├── REQUIREMENTS.md         Traceable requirements registry (REQ-001 onwards)
│   ├── RMS_REPORT_MATRIX.md    58-report analytics catalog and data sources
│   ├── ROADMAP.md              Phased delivery roadmap and exit gates
│   ├── SECURITY.md             Security architecture, threat model & compliance
│   ├── TASK_PROTOCOL.md        Task execution procedure & quality standards
│   ├── TESTING.md              Testing strategy, test suites & quality gates
│   ├── TODO.md                 Clean outstanding task ledger
│   ├── UI_SYSTEM.md            Design token cascade, 20-row state matrix & UI rules
│   └── UI_UX_SPECIFICATION.md  Design specifications & component patterns
├── backend/                    Laravel 13 Modular Monolith API
│   ├── app/
│   │   ├── Core/               Tenancy, JWT Auth, RBAC, Audit, Error Handling
│   │   │   ├── Actions/        Core reusable base Action contracts
│   │   │   ├── Audit/          AuditLogger service & activity tracking
│   │   │   ├── Auth/           JwtService, RefreshTokenService, PermissionCatalogue
│   │   │   ├── Http/           Middleware (Auth, Tenancy, CorrelationId) & ErrorResponse
│   │   │   └── Tenancy/        TenantContext, BelongsToTenant trait & Tenancy exceptions
│   │   ├── Models/             Eloquent domain models (26 active models)
│   │   ├── Modules/            Modular business domains
│   │   │   ├── Auth/           Auth Actions & AuthController
│   │   │   ├── Catalogue/      Units, Categories, Brands, Products, BOMs, Warehouses
│   │   │   └── Pricing/        Price Lists, Discount Rules, Tax Profiles
│   │   └── Providers/          AppServiceProvider & framework boots
│   ├── bootstrap/
│   │   └── app.php             Application routing & centralized exception mapping
│   ├── database/
│   │   ├── factories/          Model factories for test fixtures
│   │   ├── migrations/         170 migration files across Waves 1 to 25 (169 tables)
│   │   └── seeders/            Database seeders for platform & demo tenants
│   ├── routes/
│   │   ├── api_platform.php    Platform-level administrative routes
│   │   ├── api_public.php      Public authentication, storefront & webhook routes
│   │   ├── api_tenant.php      Tenant-scoped authenticated business routes
│   │   ├── console.php         Artisan console commands
│   │   └── web.php             Default web endpoints
│   ├── tests/
│   │   ├── Feature/            HTTP feature tests, tenancy tests & module tests
│   │   ├── Unit/               Unit tests, example tests & policy assertions
│   │   └── TestCase.php        Base test case with SQLite memory database
│   ├── composer.json           Composer manifest with PHP ^8.5 and dev tooling
│   ├── phpstan.neon            PHPStan Level 9 configuration
│   ├── phpunit.xml             Test runner configuration (SQLite in-memory)
│   └── pint.json               Laravel Pint strict styling rules
├── frontend/                   React 19 TypeScript SPA
│   ├── .dependency-cruiser.cjs Dependency boundary validation rules
│   ├── .storybook/             Storybook UI component catalog
│   ├── scripts/
│   │   └── check-bundle-budget.mjs Bundle size gate validator
│   ├── src/
│   │   ├── app/                Boot loader & lifecycle seams
│   │   ├── components/
│   │   │   ├── ErrorBoundary.tsx Four-level fault-tolerant error boundaries
│   │   │   ├── patterns/       StateView, QueryBoundary, LogInspector
│   │   │   └── ui/             9 Token-hardened UI primitives
│   │   ├── lib/
│   │   │   ├── api/            Single transport seam (client.ts, errors.ts, queryClient.ts)
│   │   │   ├── i18n/           i18next setup and locales (en, bn)
│   │   │   ├── motion/         Motion tokens & GSAP hooks
│   │   │   ├── observability/  In-memory ring buffer logger & exception handlers
│   │   │   └── utils.ts        Tailwind merge `cn()` helper
│   │   ├── mocks/              MSW mock DB & contract envelope handlers
│   │   ├── pages/              Application view screens (e.g. CataloguePage.tsx)
│   │   ├── styles/             6-file design token cascade + base.css
│   │   ├── App.tsx             Root shell
│   │   ├── index.html          Pre-paint theme resolver & accessible viewport
│   │   └── main.tsx            Application root with strict boundary hierarchy
│   ├── package.json            Frontend workspace package manifest
│   ├── tsconfig.json           TypeScript strict configuration
│   ├── vite.config.ts          Vite build configuration
│   └── vitest.config.ts        Vitest testing configuration
├── package.json                Root workspace coordinator
└── package-lock.json           Authoritative dependency lockfile
```

---

## 5. Frontend Architecture

1. **State Partitioning (ADR-021):**
   * **Server State:** Owned exclusively by **TanStack Query v5**. Stores data fetched from APIs, manages cache invalidation, stale times (`STALE_TIME` tiers: master data 5 min, transactional 30s, dashboard 60s), garbage collection, and retry policies.
   * **UI State:** Owned by **Zustand**. Holds transient UI states only: sidebar open/closed, active modal, table column visibility, user density preference. *Server data is strictly forbidden from entering Zustand stores.*
2. **Transport Seam (ARCHITECTURE §6.3):**
   * Centralized in `frontend/src/lib/api/client.ts`. All HTTP traffic passes through this single seam.
   * Automatic injection of `X-Correlation-Id`, `Authorization: Bearer <jwt>`, `Accept-Language`, `Idempotency-Key`, and `If-Match`.
   * Transparent 401 recovery protocol: on `TOKEN_EXPIRED`, queues requests, performs a single-flight refresh call via rotating cookie, and replays once.
3. **State Matrix & Resilience (ADR-024, ADR-025, `UI_SYSTEM.md` §8):**
   * Every screen and widget implements all 20 applicable states: loading, skeleton (120ms gate), empty, success, validation, error, network offline, 401, 403, 404, 500, timeout, conflict, unsaved changes.
   * Four-level Error Boundary hierarchy (`GlobalBoundary` → `RouteBoundary` → `SectionBoundary` → `WidgetBoundary`). A failure in a single table or widget never crashes the application.
4. **Token Cascade (ADR-020, ADR-026):**
   * CSS-first Tailwind v4 tokens split across:
     * `tokens.primitive.css` (raw scales)
     * `tokens.semantic.css` (semantic aliases for light mode)
     * `tokens.semantic.dark.css` (semantic overrides for dark mode)
     * `tokens.component.css` (component-specific variables)
     * `tokens.motion.css` (durations, easings, spring configs)
     * `base.css` (global styles & resets)
   * Primitive color classes (`bg-slate-500`, etc.) are stripped from the utility allow-list to prevent un-themed color leakage.
5. **Motion System (ADR-031):**
   * Framer Motion handles component entry/exit, modal transitions, and reactive UI feedback.
   * GSAP is loaded dynamically on-demand for orchestrated timeline and scroll-linked animations.
   * Strict reduced-motion support via `prefers-reduced-motion: reduce`.

---

## 6. Backend Architecture

1. **Routing & Dispatch:**
   * `routes/api_public.php`: Unauthenticated public routes (`/api/v1/auth/login`, `/api/v1/auth/refresh`, password reset, storefront).
   * `routes/api_tenant.php`: Authenticated, tenant-scoped routes (`/api/v1/...`). Wrapped in `['auth.jwt', 'tenant.resolve', 'tenant.active']`.
   * `routes/api_platform.php`: Platform super-admin endpoints (`/api/platform/...`). Requires platform permissions.
2. **Request Lifecycle & Middleware Pipeline:**
   ```text
   HTTP Request
       │
       ▼
   EnsureHttps (Production)
       │
       ▼
   CorrelationId (Generates or adopts X-Correlation-Id header)
       │
       ▼
   AuthenticateJwt (Decodes JWT, verifies signature, expiry, algorithm)
       │
       ▼
   ResolveTenant (Extracts tenant_id from token, validates tenant, binds TenantContext)
       │
       ▼
   EnsureTenantActive (Verifies tenant status is active; rejects suspended tenants with 402)
       │
       ▼
   AuthorizePermission (Evaluates required permission against user's compiled role-permission set)
       │
       ▼
   FormRequest Validation (Validates input structure, types, domain constraints)
       │
       ▼
   Controller Method (Orchestrates Action invocation)
       │
       ▼
   Action Class (Executes business logic inside DB::transaction where mutating)
       │
       ▼
   API Resource (Formats response into standard §2.1 data envelope)
       │
       ▼
   HTTP 200 / 201 Response (Includes X-Correlation-Id header)
   ```
3. **Database Transactions & Integrity (ADR-028):**
   * All mutations across multi-row entities, ledgers, or stock changes execute within explicit `DB::transaction()`.
   * Strict row-level locking (`lockForUpdate()`) on stock balance calculations and sequence allocations.
4. **Exception Handling & Response Envelope (API_CONTRACT §2.3):**
   * Handled uniformly in `bootstrap/app.php` using `ErrorResponse::make()`.
   * Maps domain exceptions to standard HTTP error codes (`VALIDATION_FAILED` 422, `NOT_FOUND` 404, `FORBIDDEN` 403, `DUPLICATE` 409, `IN_USE` 409, `TENANT_INACTIVE` 402, `INTERNAL_ERROR` 500).
   * Server stack traces are strictly stripped in non-local environments; logged with `correlation_id` for backend diagnostics.

---

## 7. Database Architecture & Schema

* **Engine:** MySQL 8.x in production / SQLite 3 in-memory for fast unit/feature tests.
* **Isolation Model:** Shared database, shared schema, partitioned by indexed `tenant_id` on all tenant-owned tables.
* **Migration Status:** **169 tables** created across **170 migrations** in **Waves 1 to 25**, fully verified.
* **Numeric Integrity (ADR-009):** All quantities and money amounts use `DECIMAL(18,4)`. Serialized as strings on the wire to prevent IEEE-754 floating point precision corruption in JavaScript runtimes.

### Migration Waves Summary:
* **Wave 1 (Platform):** `plans`, `tenants`, `tenant_subscriptions`, `tenant_usage_counters`, `settings`, `feature_flags`.
* **Wave 2 (Organization):** `companies`, `branches`, `factories`, `production_lines`.
* **Wave 3 (Identity & RBAC):** `users` (extended), `permissions`, `roles`, `role_permission`, `role_user`, `user_scopes`, `refresh_tokens`.
* **Wave 4 (Infrastructure):** `audit_logs`, `idempotency_keys`, `attachments`, `notifications`, `notification_preferences`, `document_sequences`, `activity_snapshots`.
* **Wave 5 (Master Data A - Units & Taxonomy):** `units`, `unit_conversions`, `categories`, `brands`, `tax_profiles`, `reason_codes`, capacity unit FK.
* **Wave 6 (Master Data B - Products & BOM):** `products`, `product_variants`, `product_images`, `bill_of_materials`, `bill_of_material_items`.
* **Wave 7 (Master Data C - Warehouses & Parties):** `warehouses`, `warehouse_locations`, `parties`, `party_addresses`, `party_contacts`, `price_lists`, `price_list_items`, `discount_rules`, deferred FK closure.
* **Wave 8–9 (HR & Organization):** `departments`, `designations`, `shifts`, `employees`, HR FK closures.
* **Wave 10 (Production Execution):** `production_plans`, `production_plan_items`, `production_batches`, `material_issues`, `material_issue_items`, `production_batch_inputs`, `worker_production_entries`, `production_outputs`.
* **Wave 11 (QC & Wastage):** `qc_parameters`, `qc_inspections`, `qc_inspection_results`, `qc_defects`, `wastage_records`, `rework_orders`.
* **Wave 12 (Stock Ledger):** `stock_movements`, `stock_balances`, `stock_reservations`.
* **Wave 13 (Stock Operations):** `stock_transfers`, `stock_transfer_items`, `stock_adjustments`, `stock_adjustment_items`, `stock_counts`, `stock_count_items`.
* **Wave 14 (Procurement):** `purchase_requisitions`, `purchase_requisition_items`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `purchase_bills`, `purchase_bill_items`, `purchase_returns`, `purchase_return_items`.
* **Wave 15 (CRM & Sales):** `crm_leads`, `crm_activities`, `sales_orders`, `sales_order_items`, `invoice_templates`, `invoices`, `invoice_items`, `sales_returns`, `sales_return_items`.
* **Wave 16 (Payments & Settlements):** `payments`, `payment_allocations`, `sales_order_payments`.
* **Wave 17 (POS Core):** `pos_terminals`, `pos_sessions`, `pos_offline_queue`.
* **Wave 18 (Delivery & Logistics):** `courier_providers`, `run_sheets`, `delivery_orders`, `delivery_order_items`, `delivery_status_events`, `courier_shipments`, `courier_webhook_events`, `cod_reconciliations`.
* **Wave 19 (Workforce & Payroll):** `leave_types`, `leave_requests`, `leave_balances`, `shift_assignments`, `holidays`, `employee_documents`, `salary_components`, `salary_structures`, `salary_structure_components`, `payroll_periods`, `attendances`, `payslips`, `payslip_items`, `payroll_advances`.
* **Wave 20 (Assets & Maintenance):** `asset_categories`, `assets`, `asset_assignments`, `asset_depreciation_entries`, `maintenance_schedules`, `maintenance_orders`, `maintenance_order_parts`, `asset_meter_readings`.
* **Wave 21 (Finance & Accounting):** `chart_of_accounts`, `journal_entries`, `journal_lines`, `expense_categories`, `bank_accounts`, `expenses`, `bank_transactions`, `payment_terms`, `party_credit_limits`, `product_costs`, `production_cost_allocations`.
* **Wave 22 (Reporting & Dashboards):** `report_definitions`, `report_saved_views`, `report_schedules`, `report_exports`, `dashboard_widgets`, daily/monthly summary rollup tables.
* **Wave 23 (Storefront & E-commerce):** `storefronts`, `storefront_pages`, `storefront_products`, `carts`, `cart_items`, `coupons`, `coupon_redemptions`, `shipping_zones`, `product_reviews`, `wishlists`.
* **Wave 24 (Integrations & Webhooks):** `webhook_endpoints`, `webhook_deliveries`, `imports`.
* **Wave 25 (Deferred Closures):** Final foreign key constraints tying cross-wave relations together cleanly.

---

## 8. Authentication & Authorization (RBAC)

1. **Dual-Token Authentication (ADR-007):**
   * **Access Token:** Short-lived JWT (15-minute validity), held in client memory only (never `localStorage` or `sessionStorage` to mitigate XSS).
   * **Refresh Token:** Long-lived opaque string (14-day validity), stored in an `httpOnly`, `Secure`, `SameSite=Lax` cookie.
   * **Token Rotation & Stolen Family Invalidation:** Every refresh generates a new refresh token and invalidates the previous one. If an already-invalidated refresh token is presented, the system detects a breach (`RefreshTokenReusedException`), revokes the entire token family, and triggers a forced logout across all devices.
2. **Multi-Tenant Context Resolution:**
   * JWT payload contains `sub` (user ID), `tenant_id`, `company_ids`, `branch_ids`, `factory_ids`, and `permissions` hash.
   * `ResolveTenant` validates tenant activity and populates `TenantContext`.
   * Scope limits (`user_scopes`) restrict access to specific physical facilities (branches, factories, warehouses).
3. **Role-Based Access Control (RBAC):**
   * Fine-grained permissions follow namespace format: `<domain>.<resource>.<action>` (e.g. `catalog.product.manage`, `inventory.warehouse.view`, `production.batch.create`).
   * `AuthorizePermission` middleware enforces permissions at the route level.

---

## 9. API Structure & Conventions

* **Prefixing:**
  * Public: `/api/v1/public/...` or `/api/v1/auth/...`
  * Tenant: `/api/v1/...`
  * Platform: `/api/platform/v1/...`
* **Response Envelope Format (API_CONTRACT §2):**
  * **Single Resource:** `{ "data": { ... } }`
  * **Collection / Paginated:** `{ "data": [ ... ], "meta": { "current_page": 1, "per_page": 25, "total": 120, "last_page": 5 } }`
  * **Error Envelope:**
    ```json
    {
      "error": {
        "code": "VALIDATION_FAILED",
        "message": "Please correct the highlighted fields.",
        "correlation_id": "req_01j7abc123",
        "details": null,
        "fields": {
          "code": ["The code has already been taken."]
        }
      }
    }
    ```
* **Idempotency:** Mutating endpoints accept an `Idempotency-Key` header stored in `idempotency_keys` with SHA-256 request payload hashing to guarantee exactly-once processing (ADR-016).

---

## 10. Multi-Tenancy Enforcement (5 Layers of Defense)

| Layer | Mechanism | Implementation Detail |
|---|---|---|
| **1. Request** | `ResolveTenant` Middleware | Extracts tenant from verified JWT claim, checks tenant status, binds `TenantContext`. |
| **2. Query** | `BelongsToTenant` Trait | Automatically applies global Eloquent scope `where tenant_id = TenantContext::getTenantId()`. |
| **3. Write** | Model `creating` hook | Stamped automatically in `BelongsToTenant`; `tenant_id` is guarded from mass-assignment. |
| **4. Schema** | Composite DB Constraints | `UNIQUE(tenant_id, code)` and composite foreign keys ensure physical isolation at the database engine level. |
| **5. Test** | Feature Test Suites | Every module test verifies that cross-tenant queries return `404 NOT_FOUND` (never `403` to prevent tenant resource enumeration). |

---

## 11. Implemented Features vs Outstanding Work

### Currently Completed & Verified:
* ✅ **Phase 0 Foundation:** Monorepo architecture, design token cascade, 9 UI primitives, four-level ErrorBoundary, §8 state-matrix reliability layer, single transport seam (`client.ts`, `queryClient.ts`), strict tooling (PHPStan L9, Pint, Prettier, ESLint, TypeScript strict), CI pipeline.
* ✅ **Phase 1 Auth & Tenancy Runtime:** 169 tables (Waves 1–25), `TenantContext`, `BelongsToTenant`, JWT & Refresh token services, token rotation, 12 Auth actions, `AuthController`, login/refresh/logout/switch-branch routes, 492 passing backend tests / 2575 assertions.
* ✅ **Phase 2 Catalogue CRUD (Backend In Progress):**
  * `UnitController`, `CategoryController`, `BrandController` (CRUD + options endpoints, actions, requests, resources).
  * `ProductController` (Products & variants CRUD, validation, composite unique checks).
  * `BillOfMaterialController` (Versioned BOMs with items).
  * `WarehouseController` & `WarehouseLocationController` (Warehouses, sub-locations, reference deletion protection).
  * `PriceListController`, `DiscountRuleController`, `TaxProfileController` (Actions, FormRequests, Resources created).

### Outstanding Work (Next Actions):
* 🔄 **Phase 2 Master Data Completion:**
  * Parties backend CRUD (`parties.party.{view,manage}`).
  * Connect Pricing routes into `api_tenant.php`.
  * Master data seeders & factories.
  * Build Phase-1 and Phase-2 authenticated React frontend shells (login, navigation shell, catalogue management screens).
* ⬜ **Phases 3–10 (Future Work):** Production execution, Procurement/Inventory, Sales/POS, Delivery, HR/Payroll, Reports/RMS, Storefront, SaaS hardening.

---

## 12. Important Files & Responsibilities

| File Path | Role & Responsibility |
|---|---|
| `backend/bootstrap/app.php` | Configures routes, middleware aliases, and the unified exception-to-JSON error response handler. |
| `backend/app/Core/Tenancy/TenantContext.php` | Thread-safe container managing the active tenant, branch, company, and facility scopes. |
| `backend/app/Core/Tenancy/Concerns/BelongsToTenant.php` | Eloquent trait injecting tenant global scopes and model creation stamping. |
| `backend/app/Core/Auth/JwtService.php` | Generates, parses, and cryptographically verifies JWT tokens. |
| `backend/app/Core/Auth/RefreshTokenService.php` | Manages rotating refresh token lifecycle and family reuse detection. |
| `backend/app/Core/Http/Responses/ErrorResponse.php` | Standardized API error response builder ensuring adherence to `API_CONTRACT.md`. |
| `frontend/src/lib/api/client.ts` | Single HTTP transport seam handling JWT headers, correlation IDs, 401 token refreshes, and timeouts. |
| `frontend/src/lib/api/queryClient.ts` | Configures TanStack Query retry policies, cache stale times, and mutation boundaries. |
| `frontend/src/components/ErrorBoundary.tsx` | Four-level fault-tolerant UI boundary capturing errors without crashing parent layouts. |
| `frontend/src/styles/index.css` | Composition entry point for Tailwind v4 primitive, semantic, component, and motion tokens. |
| `.github/workflows/ci.yml` | 3-job CI pipeline running linting, formatting, type checking, bundle budget checks, and backend test suites. |

---

## 13. Conventions, Patterns & Quality Gates

* **Zero-Warning Policy:** `npm run verify` and `composer check` must pass with zero warnings or errors.
* **Strict Immutability:** Ledgers are append-only. No `UPDATE` or `DELETE` queries on `stock_movements` or `journal_lines`.
* **String-Based Decimals:** Never parse money or stock quantities with `parseFloat()`; preserve string representation.
* **Data-Status Attributes:** UI elements expose `data-status`, `data-variant`, and `aria-*` tags for reliable automated testing and accessibility.

---

## 14. Risks & Known Constraints

1. **Windows Pathing & Tooling:** Workspace path contains spaces and symbols (`&`). Binary commands must be invoked through Node wrapper scripts or full quotes.
2. **Node Engine Pinning:** Local environment runs Node 24/25, while CI is pinned to Node 22 for `dependency-cruiser` engine compatibility.
3. **Database Performance on High Scale:** Single MySQL instance requires composite indexing on `(tenant_id, ...)` across all high-volume tables (`stock_movements`, `production_batch_inputs`, `audit_logs`).

---

## 15. Maintenance Rule

This file is the **persistent project memory**. Whenever the architecture, database schema, API contracts, workflows, or major modules are modified or added, this file must be updated in the same change set.
