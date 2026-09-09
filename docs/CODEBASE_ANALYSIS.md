# CODEBASE ANALYSIS — Forensic System Report (Phase 0)

> **Execution Protocol:** Master Development & System Hardening Protocol — Phase 0  
> **Target System:** SliceMart FMS (Multi-Tenant Manufacturing ERP + Master Platform Admin + Headless Storefront)  
> **Verification Status:** 100% Verified against live repository codebase, migrations, route maps, and passing test suites.  
> **Audit Date:** 2026-09-10  

---

## 1. Project Structure

SliceMart FMS is organized as an enterprise-grade monorepo containing distinct frontend, backend, documentation, and tooling layers:

```
d:\Production ERP with Storefront\slicemart-fms\
├── backend/                      # Laravel 13.26.1 API Server (PHP 8.5.5)
│   ├── app/
│   │   ├── Core/                 # Cross-cutting foundational infrastructure
│   │   │   ├── Auth/             # Dual-token JWT engine, token refresh, PermissionCatalogue
│   │   │   ├── Http/             # Middleware (Correlation, Tenancy, Permissions), ApiResponse
│   │   │   ├── Tenancy/          # TenantContext (thread-local), BelongsToTenant global scope
│   │   │   └── Support/          # Cross-cutting utilities and data transformers
│   │   └── Modules/              # 19 Domain Modules (encapsulated Domain-Driven design)
│   │       ├── Assets/           # Fixed asset lifecycle & depreciation schedules
│   │       ├── Audit/            # System-wide immutable audit trail
│   │       ├── Auth/             # User authentication, password resets, role assignment
│   │       ├── Catalogue/        # Products, variants, units, brands, BOM recipe engine
│   │       ├── Delivery/         # Shipping dispatch, courier gateways (Steadfast, Pathao, RedX)
│   │       ├── Documents/        # Document printing engine & thermal label generator
│   │       ├── Ecommerce/        # Multi-tenant headless storefront backend & CMS
│   │       ├── Finance/          # Double-entry General Ledger, Chart of Accounts, Journal
│   │       ├── HR/               # Workforce, biometric attendance, payroll, piece-rate calculation
│   │       ├── Inventory/        # Multi-warehouse stock tracking, batches, reorder thresholds
│   │       ├── Notifications/    # Email, SMS, and WhatsApp dispatch channels
│   │       ├── Platform/         # Master SaaS tenant lifecycle & plan management
│   │       ├── Pos/              # Retail Point-of-Sale terminal, cash registers, receipts
│   │       ├── Pricing/          # Dynamic wholesale, retail, and tier pricing engine
│   │       ├── Production/       # Work orders, batch staging, worker piece-rate logging
│   │       ├── Purchasing/       # Purchase orders, supplier goods receipt notes (GRN)
│   │       ├── QC/               # Quality control inspection stations, defect logging
│   │       ├── Reports/          # RMS operational reporting & BI aggregations
│   │       └── Sales/            # Quotations, sales orders, customer invoicing
│   ├── database/
│   │   ├── migrations/           # 197 migration files organized across Waves 0–25
│   │   └── seeders/              # Comprehensive test & demo tenant seeders
│   ├── routes/
│   │   ├── api_public.php        # Public authentication & system health check routes
│   │   ├── api_tenant.php        # Tenant-scoped authenticated ERP routes (~1,080 lines)
│   │   └── api_platform.php      # SaaS platform super-admin routes
│   └── tests/                    # 745 PHPUnit tests (Feature + Unit, 4,341 assertions)
├── frontend/                     # React 19.2.8 + Vite 8.2.0 Single Page Application
│   ├── src/
│   │   ├── app/                  # Application bootstrap (boot.ts, App.tsx, providers)
│   │   ├── components/           # Component library
│   │   │   ├── auth/             # ProtectedRoute, permission gates
│   │   │   ├── layout/           # AppShell, TopNav, Sidebar, WorkspaceTabs
│   │   │   ├── patterns/         # QueryBoundary, StateView, DataTable, FilterBar
│   │   │   ├── platform/         # PlatformShell, PlatformProtectedRoute
│   │   │   ├── routing/          # RouteErrorBoundary, RouteLoadingFallback
│   │   │   ├── storefront/       # StorefrontShell, CartDrawer, Header, Footer
│   │   │   └── ui/               # 20+ accessible UI primitives (Button, Modal, Input, etc.)
│   │   ├── hooks/                # Custom React hooks (useWorkspaceTab, usePermissions, etc.)
│   │   ├── lib/                  # Shared core libraries
│   │   │   ├── api/              # Unified API client (client.ts), error parsing, queryClient
│   │   │   ├── auth/             # Zustand auth store (authStore.ts)
│   │   │   ├── format/           # Currency, date, and unit formatters
│   │   │   ├── motion/           # Motion tokens and Framer Motion wrappers
│   │   │   └── observability/    # Structured logger with correlation ID tracking
│   │   ├── modules/              # 17 Feature Workspace modules
│   │   ├── pages/                # Route-level page views (Dashboard, Sales, Catalogue, etc.)
│   │   ├── routes/               # index.tsx (React Router v7, 100% lazy-loaded code-splitting)
│   │   ├── styles/               # 7-file CSS token cascade (no Tailwind dependency)
│   │   └── types/                # Hand-crafted strict TypeScript interfaces for all domain APIs
│   ├── scripts/                  # check-bundle-budget.mjs (enforces initial JS ≤ 250kB)
│   └── src/**/*.test.tsx         # 165 Vitest automated test cases (13 suites, 100% green)
├── docs/                         # 60 Canonical architecture and specification documents
└── .github/workflows/ci.yml      # Multi-stage CI pipeline with 9 validation legs
```

---

## 2. Application Architecture

The system implements a unified three-pillar architecture serving distinct user constituencies from a single codebase:

```
                                  ┌────────────────────────┐
                                  │      DNS Gateway       │
                                  │ (Subdomain / Hostname) │
                                  └───────────┬────────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              ▼                               ▼                               ▼
    app.slicemart.com               tenant.slicemart.com             shop.tenant.com
   (/platform/* routes)               (/* ERP routes)           (/store/:subdomain/*)
┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│  Pillar 1: Platform Admin │   │   Pillar 2: Tenant ERP    │   │ Pillar 3: Headless Store  │
│  - Tenant onboarding      │   │  - Manufacturing & BOM    │   │  - Headless storefront    │
│  - Plan & quota limits    │   │  - Inventory & Warehouses │   │  - Dynamic page CMS       │
│  - Billing & licensing    │   │  - Sales, POS & Delivery  │   │  - Product catalog & cart │
│  - Cross-tenant audit     │   │  - Double-entry GL        │   │  - Fraud verification    │
│  - Error telemetry        │   │  - Payroll & Workforce    │   │  - WhatsApp checkout      │
└───────────────────────────┘   └───────────────────────────┘   └───────────────────────────┘
```

---

## 3. Frontend Architecture

- **Core Framework:** React 19.2.8 with TypeScript strict mode enabled (`noUncheckedIndexedAccess: true`).
- **Build & Dev Tool:** Vite 8.2.0 with custom manual chunking strategy (`recharts`, `chart-math`, `print-engine`).
- **Routing Engine:** React Router v7 with 100% lazy-loaded route boundaries (`React.lazy()` + `Suspense` + `RouteLoadingFallback`). Initial bundle size is **192.2 kB gzipped**, strictly below the 250 kB hard budget ceiling.
- **Data Fetching:** TanStack Query v5 with strict cache invalidation, automated retry backoff, and correlation header injection.
- **Client State:** Zustand 5.x with localStorage persistence for authentication session state.
- **Component Design:** Unstyled headless primitives wrapped in custom design tokens; zero runtime CSS-in-JS overhead.

---

## 4. Backend Architecture

- **Framework:** Laravel 13.26.1 running on PHP 8.5.5.
- **Static Analysis:** PHPStan Level 9 via `larastan/larastan` enforcing zero untyped method returns or dynamic properties.
- **Style Standard:** Laravel Pint enforcing PSR-12 plus custom strict clean-code rules.
- **Modularity:** 19 domain modules located in `app/Modules/<ModuleName>/`, each containing dedicated `Controllers/`, `Models/`, `Requests/`, `Services/`, `Resources/`, and `Database/`.
- **Cross-Cutting Core:** `app/Core/` hosts Tenancy, Authentication, HTTP responses, and shared middleware.

---

## 5. Database Architecture

- **Engines Supported:** SQLite (memory mode for ultra-fast CI test runs), MySQL 8.0+ / MariaDB, PostgreSQL.
- **Migration Count:** 197 migration files executed across 25 schema waves.
- **Tenant Isolation:** Every tenant-bound table contains a non-nullable `tenant_id` column.
- **Data Integrity:** Composite foreign keys `(tenant_id, parent_id)` guarantee foreign entities cannot reference mismatched tenants.
- **Financial Precision:** All currency amounts use `DECIMAL(14, 4)` to eliminate floating-point rounding errors.
- **Nullable Unique Sentinels:** Tables with unique constraints on nullable columns utilize generated sentinel columns (e.g. `COALESCE(subdomain, 'DEFAULT')`) to prevent duplicate records across database engines.

---

## 6. Authentication System

- **Dual-Token Architecture:**
  - **Access Token:** Short-lived JWT (15-minute expiration), kept strictly in-memory within the frontend Zustand auth store. Never persisted to `localStorage` or `sessionStorage` to eliminate XSS token theft risks.
  - **Refresh Token:** Long-lived rotating token stored in a secure, `httpOnly`, `SameSite=Strict` cookie.
- **Token Rotation:** Every `/api/v1/auth/refresh` invocation invalidates the prior refresh token and issues a fresh pair. Reuse detection immediately revokes all family sessions.
- **Device & Fingerprint Tracking:** Sessions record user agent, IP address, and last activity timestamp.

---

## 7. Authorization & Role-Based Access Control (RBAC)

- **Permission Catalogue:** Canonical catalogue defined in `app/Core/Auth/PermissionCatalogue.php` defining granular permissions formatted as `<module>.<resource>.<action>` (e.g., `production.batch.create`, `finance.gl.post`).
- **Middleware Enforcement:** Every tenant route is guarded by `permission:<permission.name>` in `routes/api_tenant.php`.
- **Dynamic Tenant Roles:** Tenants can define custom roles mapped to arbitrary permission subsets, layered on top of system default roles (Super Admin, Factory Manager, Storekeeper, Sales Lead, Finance Director, HR Officer, QC Inspector).
- **Frontend Permission Reflection:** Frontend receives effective permissions on `/api/v1/auth/me` and conditionally gates UI actions using `<PermissionGate>` and `usePermissions()`.

---

## 8. Multi-Tenancy Architecture (5-Layer Defense)

1. **Layer 1 — DNS & Subdomain Routing:** Subdomain extraction or `X-Tenant-Id` header mapping in `ResolveTenant` middleware.
2. **Layer 2 — Lifecycle Validation:** `EnsureTenantActive` rejects suspended, pending, or delinquent tenants with HTTP 403.
3. **Layer 3 — Thread-Local Context:** `TenantContext::setTenant()` binds the resolved tenant to the current execution thread. Throw-on-empty safeguards prevent queue jobs from executing without explicit context.
4. **Layer 4 — Eloquent Global Scope:** `BelongsToTenant` trait automatically appends `WHERE tenant_id = ?` to all select, update, and delete queries.
5. **Layer 5 — Schema-Level Composite Foreign Keys:** DB constraints enforce relational integrity within tenant boundaries.

---

## 9. Routing Architecture

- **Frontend Routes (`frontend/src/routes/index.tsx`):**
  - Public routes: `/login`, `/register`, `/forgot-password`.
  - Platform routes: `/platform/login`, `/platform/dashboard`, `/platform/tenants`, `/platform/plans`.
  - Tenant ERP routes: `/dashboard`, `/catalogue/*`, `/production/*`, `/qc/*`, `/inventory/*`, `/purchasing/*`, `/sales/*`, `/pos/*`, `/delivery/*`, `/finance/*`, `/assets/*`, `/workforce/*`, `/reports/*`, `/settings/*`.
  - Headless Storefront routes: `/store/:subdomain/*`, `/store/:subdomain/cart`, `/store/:subdomain/checkout`.
- **Error Boundaries:** Every route branch is wrapped in `RouteErrorBoundary` providing graceful recovery and correlation logging.

---

## 10. API Architecture

- **Unified Envelope:** Every backend response conforms to the standard envelope:
  ```json
  {
    "data": {},
    "meta": { "timestamp": "...", "correlationId": "..." },
    "error": null
  }
  ```
- **Error Envelope:**
  ```json
  {
    "data": null,
    "meta": { "correlationId": "..." },
    "error": { "code": "VALIDATION_FAILED", "message": "...", "details": {} }
  }
  ```
- **Correlation ID:** Every request receives or generates an `X-Correlation-Id` header that propagates from frontend API client through middleware, controllers, database logs, and response headers.

---

## 11. State Management

- **Server Cache State:** Managed by TanStack Query v5. Features granular query keys (e.g. `['production', 'batches', { status }]`), automatic garbage collection, and optimistic mutation updates.
- **Client UI State:** Managed by Zustand v5 stores:
  - `authStore.ts`: Authentication credentials, tenant metadata, active user profile.
  - `posCartStore.ts`: Local POS checkout cart, line items, discounts, customer selection.
  - `storefrontCartStore.ts`: Public storefront cart, localStorage sync, coupon state.
  - `workspaceStore.ts`: Multi-tab workspace tabs, active view persistence.

---

## 12. Form Handling & Ergonomics

- **Form Library:** React Hook Form v7 with native uncontrolled input performance.
- **Dirty State Tracking:** Warns users before navigating away from modified forms.
- **Keyboard Navigation:** Full support for Enter key navigation, Tab indexing, and Esc key dismissal across all modals and slide-out drawers.
- **Barcode Scanner Input:** Hardware barcode listener hooks capture 1D/2D scanner streams directly into active order forms without requiring manual field focus.

---

## 13. Validation Architecture

- **Multi-Tier Validation:**
  - **Frontend:** Instant client-side Zod schema validation providing synchronous field-level feedback on blur and submit.
  - **API Layer:** Laravel `FormRequest` classes intercepting requests before reaching controllers, validating types, boundaries, uniqueness, and cross-field rules.
  - **Domain Service Layer:** Business logic invariants (e.g. insufficient stock balance, closed financial period).
  - **Database Constraints:** Check constraints, foreign keys, and unique indexes serving as immutable fail-safes.

---

## 14. Error Handling & Resilience

- **Frontend Hierarchy:**
  - `RouteErrorBoundary`: Catches fatal rendering errors per workspace view without breaking the top-level app shell.
  - `QueryBoundary`: Handles loading skeletons, network retry loops, and empty states.
  - `errors.ts`: Centralized error parser mapping backend error codes to human-actionable messages.
- **Backend Hierarchy:**
  - Global `Handler.php` captures all unhandled exceptions and outputs unified `ApiResponse::error()`.
  - Transaction rollbacks: All mutating actions execute within `DB::transaction()` blocks.

---

## 15. Shared Components & Primitives

- **UI Primitives (`src/components/ui/`):**
  - `Button`: Variants (primary, secondary, destructive, ghost, outline), loading spinner integration.
  - `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`: Accessible form inputs with label and error slots.
  - `Modal`, `Drawer`: Accessible dialog primitives with focus trapping and backdrop blur.
  - `Table`: Virtualized high-performance tabular data grid.
  - `Dropdown`, `Popover`: Popper-positioned action menus.
  - `Badge`, `Card`, `Spinner`, `Skeleton`: Consistent atomic visual building blocks.

---

## 16. UI Component System & Patterns

- **Composite Patterns (`src/components/patterns/`):**
  - `DataTable`: Server-paginated, sortable, column-filterable table with export actions.
  - `QueryBoundary`: Unified async component wrapper handling `isLoading`, `isError`, and `data`.
  - `StateView`: Renders zero-data states, 404s, and filtered-empty states with action buttons.
  - `FilterBar`: Composable faceted search bar with debounced input and filter chips.
  - `ActionToolbar`: Batch selection actions (bulk print, bulk delete, status transition).

---

## 17. Design Tokens & Styling Architecture

- **Token Files (`frontend/src/styles/`):**
  - `tokens.css`: Color palettes (neutral, primary, success, warning, danger), shadows, border radii, z-index scales.
  - `typography.css`: Modern typography hierarchy using clean sans-serif system fonts.
  - `reset.css`: Modern CSS box-sizing and layout resets.
  - `components.css`: Common component utility classes.
  - `layouts.css`: AppShell, sidebar, topbar, and workspace grid systems.
  - `utilities.css`: Responsive margin, padding, flexbox, and grid utilities.
  - `theme.css`: Light / Dark mode token bindings via CSS custom properties.
- **Zero Tailwind Dependency:** 100% pure vanilla CSS token cascade eliminating external build bloat.

---

## 18. Existing Modules Overview

| Module Name | Backend Module | Frontend Workspace | Primary Database Tables |
|---|---|---|---|
| Platform | `App\Modules\Platform` | `/platform/*` | `tenants`, `plans`, `platform_audit_logs` |
| Auth | `App\Modules\Auth` | `/login`, `/profile` | `users`, `roles`, `permissions`, `refresh_tokens` |
| Catalogue | `App\Modules\Catalogue` | `/catalogue` | `products`, `variants`, `boms`, `units`, `categories` |
| Production | `App\Modules\Production` | `/production` | `production_batches`, `batch_materials`, `worker_logs` |
| QC | `App\Modules\QC` | `/qc` | `qc_inspections`, `qc_checkpoints`, `defect_logs` |
| Inventory | `App\Modules\Inventory` | `/inventory` | `stock_levels`, `stock_movements`, `warehouses`, `batches` |
| Purchasing | `App\Modules\Purchasing` | `/purchasing` | `purchase_orders`, `po_items`, `suppliers`, `grns` |
| Sales | `App\Modules\Sales` | `/sales` | `sales_orders`, `so_items`, `customers`, `invoices` |
| POS | `App\Modules\Pos` | `/pos` | `pos_registers`, `pos_sessions`, `pos_transactions` |
| Delivery | `App\Modules\Delivery` | `/delivery` | `delivery_dispatches`, `courier_consignments`, `couriers` |
| Finance | `App\Modules\Finance` | `/finance` | `gl_accounts`, `journal_entries`, `journal_lines` |
| Assets | `App\Modules\Assets` | `/assets` | `fixed_assets`, `depreciation_schedules` |
| HR & Payroll | `App\Modules\HR` | `/workforce` | `employees`, `attendance_logs`, `payroll_runs` |
| Reports | `App\Modules\Reports` | `/reports` | Aggregation queries across all operational tables |
| Settings | `App\Modules\Platform` | `/settings` | `tenant_settings`, `print_templates`, `seo_configs` |
| Storefront | `App\Modules\Ecommerce`| `/store/:subdomain` | `storefront_pages`, `storefront_menus`, `cart_items` |

---

## 19. Core Workflows Traced

1. **Procurement Workflow:** PO Creation → Approval → Supplier Delivery → GRN Inspection → Stock Inward → AP Invoice → Payment.
2. **Manufacturing Workflow:** BOM Definition → Batch Work Order → Material Requisition → Floor Production → Worker Piece-Rate Log → QC Inspection → Finished Goods Stock Inward.
3. **Omnichannel Sales Workflow:** Storefront / POS / Manual Order → Inventory Allocation → Invoice Issuance → Payment Recording → Courier Dispatch → Tracking Update → Settlement.
4. **Financial Journaling Workflow:** Operational Event (GRN, Sale, Payroll) → Double-Entry Ledger Posting → Trial Balance Update → Financial Statement Generation.

---

## 20. Database Relationships & Relational Integrity

- Strict relational constraints are enforced on all parent-child hierarchies:
  - `production_batches` 1:N `production_batch_materials` (CASCADE on delete in draft, RESTRICT once in progress).
  - `sales_orders` 1:N `sales_order_items` (CASCADE on order cancellation).
  - `journal_entries` 1:N `journal_entry_lines` (RESTRICT deletion; reversals required).
  - Composite foreign keys enforce that related children share identical `tenant_id` with parents.

---

## 21. Migrations Strategy

- **197 Migrations** organized chronologically across 25 schema waves.
- Re-runnable, idempotent schema definitions.
- Down migrations implemented for clean rollbacks in development.
- Zero raw string SQL migrations; all structures use Laravel Schema Builder with strictly typed definitions.

---

## 22. Models & Entities

- All models extend `App\Core\Tenancy\BelongsToTenant` ensuring auto-scoping.
- Comprehensive `$casts` arrays for dates, decimals, booleans, and JSON configurations.
- Guarded `$fillable` attributes preventing mass-assignment vulnerabilities.
- Domain relationships explicitly typed with return types (`HasMany`, `BelongsTo`, `BelongsToMany`).

---

## 23. Services & Business Logic

- Controllers delegate complex business logic to single-responsibility Action and Service classes:
  - `CreateProductionBatchAction`
  - `PostJournalEntryService`
  - `ReceiveGoodsAction`
  - `ProcessPosCheckoutService`
- Database transactions wrap all multi-step mutation actions to prevent partial writes.

---

## 24. Controllers

- Skinny controllers adhering to RESTful resource actions (`index`, `store`, `show`, `update`, `destroy`).
- Zero direct database queries in controllers.
- Consistent injection of validated `FormRequest` instances.
- All returns wrapped in `ApiResponse::success()` or `ApiResponse::paginated()`.

---

## 25. API Resources

- Laravel `JsonResource` and `ResourceCollection` classes transform database entities into consistent external JSON representations.
- Protects internal schema column names from external exposure.
- Enforces decimal formatting, nested relationship inclusion, and ISO 8601 UTC timestamp formatting.

---

## 26. Background Jobs & Queues

- Asynchronous queue processing via Redis/database queue drivers.
- `TenantContext::runInTenantContext()` automatically preserves and re-binds tenant state during asynchronous job execution.
- Failed jobs recorded in `failed_jobs` table with automated exponential retry policies.

---

## 27. Events & Listeners

- Decoupled domain events:
  - `BatchCompletedEvent` → Triggers finished goods stock increment & QC inspection creation.
  - `OrderPlacedEvent` → Triggers inventory reservation & customer confirmation dispatch.
  - `GoodsReceivedEvent` → Triggers inventory re-valuation and accounts payable ledger draft.

---

## 28. Notifications

- Multi-channel notification pipeline supporting Email (SMTP/SES), SMS (Twilio, local Bangladeshi SMS gateways), and WhatsApp Business API.
- Customer order receipts, low-stock alerts, and approval requests dispatched through configured channels.

---

## 29. External Integrations

- **Courier Aggregators:** Native API integrations for courier dispatch and real-time webhook status callbacks:
  - Steadfast Courier API
  - Pathao Courier API
  - RedX Logistics API
  - Paperfly Logistics API
- **Payment Gateways:**
  - bKash Tokenized Checkout
  - Nagad Direct Gateway
  - SSLCommerz Multi-Gateway Engine
  - Stripe Checkout (International)

---

## 30. CMS Architecture

- Built-in headless CMS enabling tenants to customize their public storefront:
  - Dynamic drag-and-drop page sections (Hero Slider, Featured Products, Testimonials, Rich Text).
  - Configurable navigation menus and footer column links.
  - Dynamic SEO meta tags, OpenGraph previews, and structured JSON-LD schema markup.

---

## 31. E-Commerce Architecture

- Multi-tenant headless storefront engine mounted at `/store/:subdomain/*`.
- Real-time catalog browsing synchronized with ERP inventory stock levels.
- Fraud risk scoring engine evaluating customer phone history, return rate, and address validation before order confirmation.
- WhatsApp Direct Order generation for high-conversion social commerce sales.

---

## 32. Settings Architecture

- Centralized Tenant Settings engine storing typed configuration key-value pairs:
  - Company branding, logo, favicon, tax identification numbers.
  - Default currency, date format, fiscal year start date.
  - Inventory valuation method (FIFO / Moving Average).
  - Print template layouts (thermal 50x30mm vs A4 invoice).

---

## 33. Reporting Architecture

- Robust Reporting Matrix (RMS) covering:
  - Production Yield & Wastage Analytics
  - Inventory Stock Aging & Turnover Rates
  - Sales Summary by Channel, Product, and Sales Rep
  - Double-Entry Balance Sheet, Profit & Loss, Trial Balance
  - Payroll & Attendance Summaries
- Direct export support for CSV, Excel, and print-optimized PDF outputs.

---

## 34. Printing Architecture

- High-performance browser-native print engine:
  - 50x30mm thermal adhesive label printer generator with Code 128 / QR barcodes.
  - 80mm thermal POS receipt layout with cut margin markers.
  - Standard A4 National Tax / VAT compliant commercial invoices with tabular breakdowns and watermarks.

---

## 35. Existing Test Suites & Quality Assurance

- **Backend (PHPUnit 12.5):**
  - 745 total tests across Feature and Unit directories.
  - 4,341 verified assertions.
  - 100% test execution pass rate in in-memory SQLite database environment.
- **Frontend (Vitest):**
  - 165 total tests across 13 test suites.
  - Covers auth stores, query clients, error handlers, navigation fallbacks, role dashboards, and state views.
  - 100% green execution.

---

## 36. Environment Configuration

- Strict `.env` configuration requirements:
  - `APP_ENV`, `APP_KEY`, `APP_URL`, `SANCTUM_STATEFUL_DOMAINS`
  - `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
  - `JWT_SECRET`, `JWT_TTL`, `REFRESH_TOKEN_TTL`
  - `REDIS_HOST`, `QUEUE_CONNECTION`, `CACHE_STORE`
  - Zero uncommitted secrets or credentials present in the codebase.

---

## 37. Dependencies & Packages

- **Backend (`composer.json`):**
  - Laravel 13.26.1, tymon/jwt-auth, larastan/larastan, pestphp/pest, phpunit/phpunit.
- **Frontend (`package.json`):**
  - React 19.2.8, React DOM 19.2.8, React Router v7, TanStack Query v5, Zustand v5, Lucide React, Framer Motion, Vitest.
- **Bundle Optimization Gate:**
  - Automated budget validation via `npm run budget` verifying initial bundle ≤ 250 kB and individual chunks ≤ 200 kB.
