# MASTER IMPLEMENTATION PLAN

> **Status:** Authoritative Phased Execution Plan & Verification Ledger.
> **Repository:** `SliceMartFMS` (`d:\SliceMartFMS`)
> **Last updated:** 2026-08-27

---

## 1. Plan Overview & Execution Principles

This implementation plan orchestrates the construction of the multi-tenant FMS platform from foundational architecture through full production readiness.

### Core Rules:
1. **Never Mark Work Complete Without Verification:** A task is only marked `[COMPLETE]` after passing tests, linting, static analysis, and manual/automated verification.
2. **Strict Phased Dependencies:** Downstream modules must strictly depend on verified upstream primitives (e.g. Master Data must precede Production, which must precede Payroll).
3. **Traceability:** Every task links back to explicit requirement IDs (`docs/REQUIREMENTS.md`) and database tables (`docs/DATABASE.md`).

---

## 2. Phase Breakdown & Implementation Status

```text
Phase 0: Foundation & Documentation ───► [COMPLETE] ✅
Phase 1: Tenancy, Auth & RBAC Pipeline ───► [COMPLETE] ✅
Phase 2: Master Data & Catalogue CRUD ───► [IN PROGRESS] 🔄
Phase 3: Production, Worker Logging & QC ───► [PLANNED] ⬜
Phase 4: Procurement & Stock Operations ───► [PLANNED] ⬜
Phase 5: Sales, CRM & Point of Sale (POS) ──► [PLANNED] ⬜
Phase 6: Logistics & Courier Integrations ──► [PLANNED] ⬜
Phase 7: Workforce, HR & Payroll ─────────► [PLANNED] ⬜
Phase 8: Reporting, RMS & Observability ───► [PLANNED] ⬜
Phase 9: Storefront & E-Commerce ────────► [PLANNED] ⬜
Phase 10: SaaS Hardening, QA & Deployment ─► [PLANNED] ⬜
```

---

## 3. Detailed Work Breakdown

### Phase 0: System Architecture & Foundation (✅ COMPLETE)

* **Task 0.1: Documentation & Architecture Blueprint**
  * **Objective:** Establish the 12 binding architecture documents and 31 ADRs.
  * **Files:** `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE_DESIGN.md`, `docs/API_CONTRACT.md`, `docs/UI_SYSTEM.md`, `docs/MODULE_MAP.md`, `docs/ROADMAP.md`.
  * **Status:** Complete ✅.

* **Task 0.2: Monorepo & Tooling Setup**
  * **Objective:** Configure workspace root, Laravel 13 backend, React 19 frontend, PHPStan Level 9, Pint, Vitest, ESLint, and CI workflows.
  * **Files:** `package.json`, `backend/composer.json`, `backend/phpstan.neon`, `backend/pint.json`, `frontend/vite.config.ts`, `.github/workflows/ci.yml`.
  * **Status:** Complete ✅.

* **Task 0.3: Design System Tokens & UI Primitives**
  * **Objective:** Author 6-file Tailwind v4 token cascade, motion tokens, 9 UI primitives, and 4-level ErrorBoundary.
  * **Files:** `frontend/src/styles/*`, `frontend/src/components/ui/*`, `frontend/src/components/ErrorBoundary.tsx`, `frontend/src/components/patterns/*`.
  * **Status:** Complete ✅ (128 frontend unit tests passing).

---

### Phase 1: Tenancy, Auth, RBAC & Core Runtime (✅ COMPLETE)

* **Task 1.1: Database Migration Waves 1–25**
  * **Objective:** Author and migrate all 169 database tables across Waves 1 to 25.
  * **Files:** `backend/database/migrations/*` (170 migration files).
  * **Status:** Complete ✅.

* **Task 1.2: Multi-Tenancy Runtime Engine**
  * **Objective:** Implement `TenantContext`, `BelongsToTenant` global scope, `ResolveTenant`, `EnsureTenantActive`, and tenancy exception handling.
  * **Files:** `backend/app/Core/Tenancy/*`, `backend/app/Core/Http/Middleware/*`.
  * **Status:** Complete ✅.

* **Task 1.3: Dual-Token JWT & Rotating Refresh Token Pipeline**
  * **Objective:** Implement cryptographic JWT signing/verification, 14-day rotating refresh tokens in httpOnly cookies, and stolen token family revocation.
  * **Files:** `backend/app/Core/Auth/JwtService.php`, `backend/app/Core/Auth/RefreshTokenService.php`, `backend/app/Models/RefreshToken.php`.
  * **Status:** Complete ✅.

* **Task 1.4: RBAC & Authentication Endpoints**
  * **Objective:** Implement `AuthController`, `PermissionCatalogue`, and all 12 Auth Actions with complete route mapping.
  * **Files:** `backend/app/Modules/Auth/*`, `backend/routes/api_public.php`, `backend/routes/api_tenant.php`.
  * **Status:** Complete ✅ (492 tests / 2575 assertions passing).

---

### Phase 2: Master Data, Products & Catalogue (🔄 IN PROGRESS)

* **Task 2.1: Units, Categories, and Brands CRUD (Backend)**
  * **Objective:** Provide full tenant-scoped CRUD and lookup endpoints for units, unit conversions, categories, and brands.
  * **Files:** `backend/app/Modules/Catalogue/Controllers/{UnitController,CategoryController,BrandController}.php`, Actions, Requests, Resources.
  * **Status:** Complete ✅.

* **Task 2.2: Product & Variant Engine (Backend)**
  * **Objective:** Multi-variant product catalog, inventory tracking attributes, SKU generation, and image attachments.
  * **Files:** `backend/app/Modules/Catalogue/Controllers/ProductController.php`, `backend/app/Models/Product.php`, `backend/app/Models/ProductVariant.php`.
  * **Status:** Complete ✅.

* **Task 2.3: Bill of Materials (BOM / Recipe) Engine (Backend)**
  * **Objective:** Version-controlled multi-item BOMs for manufacturing recipe definitions.
  * **Files:** `backend/app/Modules/Catalogue/Controllers/BillOfMaterialController.php`, `backend/app/Models/BillOfMaterial.php`.
  * **Status:** Complete ✅.

* **Task 2.4: Warehouses & Multi-Tier Locations (Backend)**
  * **Objective:** Manage warehouses, aisles, racks, and bins with deletion reference guards.
  * **Files:** `backend/app/Modules/Catalogue/Controllers/{WarehouseController,WarehouseLocationController}.php`.
  * **Status:** Complete ✅.

* **Task 2.5: Parties Management (Suppliers, Customers, Dealers, Agents) (Backend)**
  * **Objective:** Multi-role party registry, credit limits, opening balances, addresses, and contacts.
  * **Dependencies:** Tasks 1.1–1.4.
  * **Files:** `backend/app/Modules/Catalogue/Controllers/PartyController.php`, Actions, Requests, Resources.
  * **Approach:** Implement CRUD with composite unique code per tenant, manage nested addresses and contacts.
  * **Status:** Complete ✅.

* **Task 2.6: Pricing, Price Lists & Discount Rules (Backend)**
  * **Objective:** Tenant-scoped price lists, tiered quantity discount rules, and tax profiles.
  * **Files:** `backend/app/Modules/Pricing/Controllers/{PriceListController,DiscountRuleController,TaxProfileController}.php`, wire into `routes/api_tenant.php`.
  * **Status:** Complete ✅.

* **Task 2.7: Authenticated Frontend Application Shell & Catalogue UI**
  * **Objective:** Build React 19 authenticated layout shell, navigation, login flow, token refresh handler, and catalogue management screens.
  * **Files:** `frontend/src/app/*`, `frontend/src/modules/catalogue/*`, `frontend/src/pages/*`, `frontend/src/routes/*`.
  * **Status:** Complete ✅.

---

### Phase 3: Production, Worker Output & Quality Control (⬜ PLANNED)

* **Task 3.1: Production Planning & Batch Scheduling**
  * **Objective:** Batch lifecycle management (`draft → scheduled → in_progress → completed → closed`).
  * **Dependencies:** Phase 2 (Products, BOMs, Warehouses).
  * **Files:** `backend/app/Modules/Production/Actions/*`, `backend/app/Models/ProductionBatch.php`.
  * **Status:** Planned ⬜.

* **Task 3.2: Material Issue & Requisition Integration**
  * **Objective:** Issue raw materials to production lines; post immutable stock movement rows.
  * **Dependencies:** Task 3.1, Phase 4 (Stock Ledger).
  * **Files:** `backend/app/Modules/Production/Actions/IssueMaterialAction.php`, `backend/app/Models/MaterialIssue.php`.
  * **Status:** Planned ⬜.

* **Task 3.3: Total Input & Worker Production Logging**
  * **Objective:** Capture factory-floor physical worker entries (piece/weight output) independently of warehouse issues.
  * **Files:** `backend/app/Modules/Production/Actions/RecordWorkerOutputAction.php`.
  * **Status:** Planned ⬜.

* **Task 3.4: Production Output, QC Inspection & Wastage Reconciliation**
  * **Objective:** QC inspection (Pass / Fail / Rework / Scrap), automatic yield calculation upon `context_completeness`, and scrap stock routing.
  * **Files:** `backend/app/Modules/Production/Actions/{InspectBatchAction,ReconcileYieldAction}.php`.
  * **Status:** Planned ⬜.

---

### Phase 4: Procurement, Inventory & Stock Operations (⬜ PLANNED)

* **Task 4.1: Append-Only Stock Movements Ledger**
  * **Objective:** Atomic stock transaction handler updating `stock_movements` and refreshing `stock_balances` cache under row-level locks.
  * **Files:** `backend/app/Modules/Inventory/Actions/PostStockMovementAction.php`.
  * **Status:** Planned ⬜.

* **Task 4.2: Inter-Warehouse Transfers & Stock Adjustments**
  * **Objective:** Multi-step transfers (`in_transit` state) and reason-coded stock adjustments.
  * **Files:** `backend/app/Modules/Inventory/Actions/{TransferStockAction,AdjustStockAction}.php`.
  * **Status:** Planned ⬜.

* **Task 4.3: Physical Stock Auditing & Reconciliation**
  * **Objective:** Full and cycle stock count sheets with variance resolution workflows.
  * **Files:** `backend/app/Modules/Inventory/Actions/ReconcileStockCountAction.php`.
  * **Status:** Planned ⬜.

* **Task 4.4: Procurement Chain (Requisition → PO → GRN → Bill)**
  * **Objective:** End-to-end purchasing workflow with supplier returns and debit notes.
  * **Files:** `backend/app/Modules/Procurement/*`.
  * **Status:** Planned ⬜.

---

### Phase 5: CRM, Sales, POS & Invoice Builder (⬜ PLANNED)

* **Task 5.1: Omnichannel Sales Orders & Invoicing**
  * **Objective:** Unified sales pipeline supporting Counter, Dealer, Phone, Field, and Online orders with credit limit validation.
  * **Files:** `backend/app/Modules/Sales/*`.
  * **Status:** Planned ⬜.

* **Task 5.2: Dedicated Point of Sale (POS) Interface**
  * **Objective:** High-speed, keyboard-first, offline-tolerant counter checkout with cash drawer shift management.
  * **Files:** `frontend/src/modules/pos/*`, `backend/app/Modules/POS/*`.
  * **Status:** Planned ⬜.

* **Task 5.3: Custom Invoice & Document Template Builder**
  * **Objective:** Drag-and-drop visual invoice builder with printable PDF generation.
  * **Files:** `frontend/src/modules/invoice-builder/*`, `backend/app/Modules/Sales/Services/InvoiceRenderer.php`.
  * **Status:** Planned ⬜.

* **Task 5.4: Payment Allocations & Accounts Receivable**
  * **Objective:** Cash, bank, mobile payments, multi-invoice settlement allocations.
  * **Files:** `backend/app/Modules/Finance/Actions/AllocatePaymentAction.php`.
  * **Status:** Planned ⬜.

---

### Phase 6: Logistics, Fleet & Courier Integrations (⬜ PLANNED)

* **Task 6.1: Delivery Orders & Run Sheets**
  * **Objective:** Fleet dispatch, internal driver run sheets, proof of delivery (POD), and signature capture.
  * **Files:** `backend/app/Modules/Logistics/*`.
  * **Status:** Planned ⬜.

* **Task 6.2: Courier Provider Adapter Engine**
  * **Objective:** Capability-matrix adapters for external couriers (Pathao, Steadfast, RedX, eCourier, Paperfly) with webhook processors.
  * **Files:** `backend/app/Modules/Logistics/Adapters/*`.
  * **Status:** Planned ⬜.

* **Task 6.3: Cash on Delivery (COD) Reconciliation**
  * **Objective:** Automated courier cash collection and deposit reconciliation.
  * **Files:** `backend/app/Modules/Logistics/Actions/ReconcileCodAction.php`.
  * **Status:** Planned ⬜.

---

### Phase 7: Workforce Management, HR & Production Payroll (⬜ PLANNED)

* **Task 7.1: Employee Directory, Shifts & Attendance**
  * **Objective:** Employee records, biometric/manual attendance, shift scheduling, and leave accruals.
  * **Files:** `backend/app/Modules/HR/*`.
  * **Status:** Planned ⬜.

* **Task 7.2: Production-Linked Payroll & Incentive Calculation Engine**
  * **Objective:** Combine base salary with verified worker output piece-rates; generate immutable payslips upon period locking.
  * **Files:** `backend/app/Modules/Payroll/*`.
  * **Status:** Planned ⬜.

* **Task 7.3: Assets & Preventative Maintenance Registry**
  * **Objective:** Machinery register, depreciation schedules, maintenance work orders, and spare parts tracking.
  * **Files:** `backend/app/Modules/Assets/*`.
  * **Status:** Planned ⬜.

---

### Phase 8: Reporting, RMS & Observability (⬜ PLANNED)

* **Task 8.1: Report Management System (RMS) Core**
  * **Objective:** 58 standard reports across Production, Inventory, Sales, Finance, HR, and Quality (`docs/RMS_REPORT_MATRIX.md`).
  * **Files:** `backend/app/Modules/Reports/*`, `frontend/src/modules/reports/*`.
  * **Status:** Planned ⬜.

* **Task 8.2: Role-Based Executive & Operational Dashboards**
  * **Objective:** Persona-tailored dashboards (MD, Production Supervisor, Storekeeper, Accountant) with Recharts and TanStack Table.
  * **Files:** `frontend/src/modules/dashboard/*`.
  * **Status:** Planned ⬜.

* **Task 8.3: Data Export Pipelines (PDF / XLSX / CSV)**
  * **Objective:** High-throughput streaming asynchronous exports via Laravel Queue and Redis.
  * **Files:** `backend/app/Modules/Reports/Jobs/GenerateExportJob.php`.
  * **Status:** Planned ⬜.

---

### Phase 9: Storefront & Customer E-Commerce (⬜ PLANNED)

* **Task 9.1: Public Storefront API & Product Catalog**
  * **Objective:** Unauthenticated tenant-branded online catalogue, categories, search, and dynamic pricing.
  * **Files:** `backend/routes/api_public.php`, `backend/app/Modules/Storefront/*`.
  * **Status:** Planned ⬜.

* **Task 9.2: Cart, Checkout & Order Intake Pipeline**
  * **Objective:** Online shopping cart, discount coupons, shipping zone calculation, and instant sales order creation.
  * **Files:** `frontend/src/modules/storefront/*`.
  * **Status:** Planned ⬜.

---

### Phase 10: SaaS Hardening, Security, QA & Production Deployment (⬜ PLANNED)

* **Task 10.1: Platform Administration & Subscription Quotas**
  * **Objective:** Tenant onboarding, subscription plans, feature flag toggles, and quota enforcement.
  * **Files:** `backend/routes/api_platform.php`, `backend/app/Modules/Platform/*`.
  * **Status:** Planned ⬜.

* **Task 10.2: End-to-End Testing & Security Audit**
  * **Objective:** Run full test matrices, automated WCAG 2.2 AA accessibility scans, penetration checks, and load tests.
  * **Status:** Planned ⬜.

* **Task 10.3: Production Deployment & Dockerization**
  * **Objective:** Production container setup, Nginx reverse proxy, MySQL 8 clustering, Redis caching, queue workers, and automated backups.
  * **Files:** `docker-compose.yml`, `Dockerfile`, `docs/DEPLOYMENT.md`.
  * **Status:** Planned ⬜.

---

## 4. Verification & Quality Gates

Every task must pass the following verification gates before merge:

1. **Static Analysis & Linting:**
   * Backend: `php vendor/bin/pint --test` (0 errors), `php vendor/bin/phpstan analyse` (Level 9, 0 errors).
   * Frontend: `eslint . --max-warnings 0`, `tsc -b --noEmit`.
2. **Automated Testing:**
   * Backend: `php artisan test` (100% pass, cross-tenant isolation verified).
   * Frontend: `npm run test` (Vitest, 100% pass).
3. **Bundle Budget:**
   * `node scripts/check-bundle-budget.mjs` (Initial JS ≤ 250 kB, CSS ≤ 50 kB).
4. **Documentation Sync:**
   * Update `docs/CODEBASE_CONTEXT.md`, `docs/DEVELOPMENT_STATUS.md`, and `docs/CHANGELOG.md`.
