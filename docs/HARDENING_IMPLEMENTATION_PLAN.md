# HARDENING IMPLEMENTATION PLAN — Prioritized Engineering Roadmap (Phase 0)

> **Execution Protocol:** Master Development & System Hardening Protocol — Phase 0  
> **Prioritization Tiers:**  
> - **P0 (Critical):** Data loss, security vulnerabilities, multi-tenant leaks, broken transactional boundaries.  
> - **P1 (High):** Broken CRUD, unwired routes, missing API endpoints, form validation bypasses.  
> - **P2 (Medium):** UI responsiveness on tablet/mobile, missing UX empty/error states, type sync.  
> - **P3 (Low):** Micro-animations, visual polish, industrial dark mode refinements, kiosk modes.  
> **Audit Date:** 2026-09-10  

---

## 1. Prioritized Roadmap & Milestone Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE 0: AUDIT & DISCOVERY                      │
│            (Complete: 10 Comprehensive Canonical Documents)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: P0 & P1 SYSTEM HARDENING                   │
│  - Wire routes/api_platform.php for Master SaaS Admin Panel            │
│  - Scaffold app/Support/ with shared formatting & calculation helpers  │
│  - Multi-tenant boundary checks & rate-limit hardening                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: P2 RESILIENCE & RESPONSIVENESS             │
│  - Tablet/mobile ergonomics for Factory Floor & POS Shell              │
│  - Full UX state audit across all 17 ERP workspaces                    │
│  - Strict type synchronization across all remaining API contracts     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    PHASE 3: P3 VISUAL ELEVATION & POLISH               │
│  - Production Floor Kiosk Mode (fullscreen auto-refreshing wall TV)    │
│  - Thermal 50x30mm label visual layout refinement                      │
│  - Smooth tab-gliding micro-interactions and Framer Motion transitions │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    PHASE 4: E2E AUTOMATION & RELEASE                   │
│  - Playwright automated browser test suite for the 5 core lifecycles   │
│  - Production deployment validation and zero-downtime migration check  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Task Breakdown

### Milestone 1: P0 & P1 Infrastructure & API Wiring
- **Task 1.1: Wire Master SaaS Platform Admin Routes (`routes/api_platform.php`)**
  - Bind `PlatformAuthController` (`/api/v1/platform/auth/login`, `/refresh`, `/logout`).
  - Bind `TenantDirectoryController` (`/api/v1/platform/tenants`).
  - Bind `TenantProvisioningController` (`POST /api/v1/platform/tenants`).
  - Bind `PlanManagementController` (`/api/v1/platform/plans`).
  - Bind `PlatformAuditController` (`/api/v1/platform/audit-logs`).
  - *Verification:* Add PHPUnit feature tests in `backend/tests/Feature/Platform/` verifying that super-admin credentials access platform endpoints while standard tenant users receive HTTP 403 Forbidden.

- **Task 1.2: Scaffold Shared Helpers (`backend/app/Support/`)**
  - Create `MathHelper` for consistent 4-decimal currency and fractional unit math.
  - Create `DateHelper` for fiscal year period calculations and timezone conversions.
  - *Verification:* PHPStan Level 9 clean check.

- **Task 1.3: Enforce Tenant Quota Limits at Middleware Layer**
  - Implement `CheckTenantQuota` middleware checking current record counts against the tenant's subscribed plan (e.g. `max_products`, `max_users`, `max_warehouses`).
  - Reject requests exceeding quotas with HTTP 402 / 403 and actionable upgrade URL.

---

### Milestone 2: P2 Operational Resilience & Responsive UX
- **Task 2.1: Factory Floor Tablet & POS Shell Responsive Ergonomics**
  - Optimize `POSShell` touch targets (minimum 48x48px touch targets) for 10-inch tablets.
  - Implement full keyboard shortcuts (F2 Search, F4 Customer, F9 Payment, Enter Print).
  - Add offline hold-and-resume cart buffer in `posCartStore`.

- **Task 2.2: Systematic UX State Audit across All Workspaces**
  - Audit every module workspace to ensure comprehensive handling of all states:
    `Loading Skeleton` → `Empty State` → `Filtered No Results` → `Validation Error` → `API Error with Correlation ID`.
  - Ensure zero unhandled `null` or `undefined` runtime exceptions in React components.

- **Task 2.3: Strict API Typing Expansion**
  - Extend the strict typing architecture established in `types/api/dashboard.ts` to cover `sales.ts`, `inventory.ts`, `production.ts`, and `catalogue.ts`.
  - Run `tsc -b --noEmit` to guarantee 0 TypeScript errors.

---

### Milestone 3: P3 UI Visual Elevation & Specialized Views
- **Task 3.1: Production Floor High-Contrast TV Kiosk Mode**
  - Add a 1-click fullscreen toggle in `ProductionWorkspace.tsx`.
  - Features high-contrast dark industrial theme, 32px+ bold numbers, and selectable auto-refresh intervals (10s / 30s / 60s).

- **Task 3.2: Thermal Label Print Preview Polish**
  - Enhance `DocumentPrintingModal.tsx` with interactive label zoom and thermal print simulation.
  - Verify exact Code 128 / QR vector SVG rendering via `bwip-js`.

- **Task 3.3: Micro-Interactions & Transitions**
  - Polish tab indicators with Framer Motion layout animations (`layoutId="activeTab"`).
  - Add subtle hover elevations on data table rows and interactive metric cards.
  - Enforce `prefers-reduced-motion` compliance across all animations.

---

### Milestone 4: Automated E2E Testing & Release Gate
- **Task 4.1: Playwright Test Suite Integration**
  - Create Playwright test specs in `frontend/e2e/`:
    - `01-auth-flow.spec.ts` (Login, token refresh, role routing)
    - `02-catalogue-bom.spec.ts` (Product creation, variant matrix, BOM recipe)
    - `03-production-batch.spec.ts` (Batch creation, material requisition, QC completion)
    - `04-sales-pos.spec.ts` (POS checkout, barcode scan, invoice generation)
    - `05-storefront-order.spec.ts` (Headless store checkout, fraud scoring, order tracking)
- **Task 4.2: Final Release Gate Execution**
  - Execute full test suite: 745+ PHPUnit tests + 165+ Vitest tests + Playwright E2E.
  - Verify bundle budget: `npm run budget` (Initial JS ≤ 250 kB).
  - Verify zero lints: `npm run lint` (`--max-warnings 0`).
  - Verify zero type errors: `npm run typecheck`.
