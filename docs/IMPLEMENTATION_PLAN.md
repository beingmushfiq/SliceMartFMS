# MASTER IMPLEMENTATION PLAN

> **Status:** Authoritative Phased Execution Plan & Verification Ledger.
> **Repository:** `SliceMartFMS` (`d:\Production ERP with Storefront\slicemart-fms`)
> **Last updated:** 2026-08-29

---

## 1. Plan Overview & Execution Principles

This implementation plan orchestrates the construction and system-wide UI/UX redesign of the multi-tenant SaaS FMS platform (Tenant #1: Slice Mart) from foundational architecture through full production readiness.

### Core Rules:
1. **Never Mark Work Complete Without Verification:** A task is only marked `[COMPLETE]` after passing tests, linting, static analysis, and manual/automated verification.
2. **Strict Phased Dependencies:** Downstream modules must strictly depend on verified upstream primitives.
3. **Traceability:** Every task links back to explicit requirement IDs (`docs/REQUIREMENTS.md`) and database tables (`docs/DATABASE_DESIGN.md`).

---

## 2. Phased Roadmap & Status

```text
Phase 0: Complete System Audit & Gap Analysis ──► [COMPLETE] ✅ (docs/UI_UX_AUDIT.md)
Phase 1: Architecture & Master Blueprints ──────► [COMPLETE] ✅
Phase 2: Design System, Tokens & UI Primitives ──► [READY FOR EXECUTION] 🚀
Phase 3: Core App Shell, Navigation & Command ──► [PLANNED] ⬜
Phase 4: Operational Dashboards & Factory Display► [PLANNED] ⬜
Phase 5: Core Manufacturing, Inventory & QC ────► [PLANNED] ⬜
Phase 6: Sales, CRM, POS & Profitability Engine ─► [PLANNED] ⬜
Phase 7: HR, Workforce, Assets & Finance GL ────► [PLANNED] ⬜
Phase 8: Logistics & Courier Integrations ──────► [PLANNED] ⬜
Phase 9: Master SaaS Platform Admin ────────────► [PLANNED] ⬜
Phase 10: Storefront CMS & E-Commerce Customer ─► [PLANNED] ⬜
Phase 11: Settings Center & API Integrations ───► [PLANNED] ⬜
Phase 12: QA, Responsive Testing & Visual Polish► [PLANNED] ⬜
Phase 13: Production Hardening & Deployment ────► [PLANNED] ⬜
```

---

## 3. Detailed Work Breakdown

### Phase 0: System Audit (✅ COMPLETE)
* Comprehensive audit across 16 module domains, UI/UX tokens, state matrices, RBAC, multi-tenancy, and database schemas.
* Deliverable: [`docs/UI_UX_AUDIT.md`](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/docs/UI_UX_AUDIT.md).

### Phase 1: Architecture & Master Implementation Plan (✅ COMPLETE)
* Updated master implementation roadmap, database impact, API contracts, and testing strategy.

### Phase 2: Design System & Token Primitives (🚀 NEXT)
* Fine-tune semantic token cascade (`tokens.semantic.css`, `tokens.semantic.dark.css`).
* Verify 100% WCAG 2.2 AA contrast in Light and Dark modes.
* Polish motion tokens and custom branded loading / skeleton components.

### Phase 3: Core Application Shell & Navigation
* Redesign desktop sidebar, mobile drawer, quick switcher, and command palette (`Ctrl+K`).

### Phase 4: Dashboards & Factory Operational UX
* Add Factory Floor Mode (high-contrast display for kiosks/tablets with live throughput rates).
* Live KPI sparklines and bottleneck indicators.

### Phase 5: Core Manufacturing & Supply Chain
* Worker production quick-touch tally interface.
* BOM interactive cost rollup calculator.
* QC defect heatmap and printable QC stickers with QR codes.

### Phase 6: Sales, CRM, POS & Profitability
* Multi-cart Hold & Resume tabs in POS.
* Keyboard hotkeys (F2-F10) for instant cashier checkout.
* Invoice gross profit margin calculations with historical cost locking.

### Phase 7: HR, Workforce & Financial Ledger
* Monthly payroll generator (salary + overtime + piece-rate + commissions).
* Financial statements: Balance Sheet, Profit & Loss, Trial Balance.

### Phase 8: Logistics & Courier Integrations
* Automated sync with **Steadfast**, **Pathao**, and **REDX** APIs.
* Courier webhook listener and API logs viewer.

### Phase 9: Master SaaS Platform Administration
* Instant subdomain availability validator, plan limit enforcement, and super-admin tenant preview.

### Phase 10: Storefront CMS & E-Commerce
* Visual drag-and-drop page builder for public storefront.
* Dynamic SEO meta tags preview.

### Phase 11: Centralized Settings & Integrations Center
* 1-click connection ping verification for Couriers, SMS, WhatsApp, and Payment gateways.

### Phase 12–15: System-Wide QA & Production Hardening
* Complete multi-device visual inspection, Vitest test suite, PHPUnit test suite, and bundle size budget checks.
