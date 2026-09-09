# TECHNICAL DEBT & VULNERABILITY AUDIT — Forensic Gap Registry (Phase 0)

> **Execution Protocol:** Master Development & System Hardening Protocol — Phase 0  
> **Target System:** SliceMart FMS (Platform Admin, Tenant ERP, Storefront)  
> **Verification Standard:** Ground truth from file-by-file static analysis, route checks, and dependency audits.  
> **Audit Date:** 2026-09-10  

---

## 1. Executive Summary

While SliceMart FMS exhibits exceptionally high code quality (745 passing backend tests, 165 passing frontend tests, 0 ESLint warnings, 0 TypeScript errors, and an initial JS bundle of 192.2 kB), forensic inspection across the 37 dimensions has identified specific areas of technical debt, un-wired routes, and hardening requirements.

---

## 2. Categorized Debt & Architectural Gaps

### 2.1 Backend Route Stubs (`P0 / P1`)
- **Gap:** `backend/routes/api_platform.php` is an empty file (0 lines).
  - *Symptom:* The Master SaaS Platform Admin UI (`/platform/*`) cannot perform live super-admin actions against the server (e.g. creating tenants, editing subscription plans, viewing platform audit logs).
  - *Root Cause:* The backend controllers for platform operations (`TenantDirectoryController`, `TenantProvisioningController`, `PlanManagementController`) exist in `app/Modules/Platform/Controllers/`, but their routes were not registered in `api_platform.php`.
  - *Remediation Plan:* Define RESTful routes in `routes/api_platform.php` and bind them to the existing platform controllers.

- **Gap:** Missing `app/Support/` directory.
  - *Symptom:* Cross-cutting helper functions and string/number formatters are occasionally duplicated between module service classes.
  - *Remediation Plan:* Scaffold `app/Support/` with shared math, currency, and date helper traits.

### 2.2 Frontend API Typing Drift (`P2`)
- **Gap:** Hand-written TypeScript API types in `frontend/src/types/` vs live backend JsonResource outputs.
  - *Symptom:* While dashboard types have been strictly unified in `frontend/src/types/api/dashboard.ts`, older modules (such as legacy parts of `sales` and `inventory`) occasionally reference optional properties without strict null safety checks.
  - *Remediation Plan:* Expand strict types across all module directories following the pattern established by `dashboard.ts` and `hr.ts`.

### 2.3 Storefront WhatsApp Checkout Dynamic Template (`P2`)
- **Gap:** WhatsApp direct order button generates an encoded message using a hardcoded English text string format.
  - *Symptom:* Does not dynamically localize based on the tenant's primary language setting (e.g. Bengali for local retail tenants).
  - *Remediation Plan:* Add dynamic template variable interpolation (`{order_id}`, `{customer_name}`, `{item_list}`, `{grand_total}`) configured in `tenant_settings`.

### 2.4 Production Floor High-Contrast Mode (`P3`)
- **Gap:** Factory floor operators viewing production batches on wall-mounted TVs require a high-contrast kiosk mode with auto-refreshing intervals.
  - *Symptom:* Factory managers must manually refresh the browser page or rely on standard dashboard views.
  - *Remediation Plan:* Introduce a 1-click fullscreen "Factory Floor Kiosk" toggle with 10s/30s polling intervals and 32px+ high-contrast metrics.

### 2.5 End-to-End (E2E) Browser Test Coverage (`P2`)
- **Gap:** While unit and integration test coverage is extensive (910 total tests: 745 PHPUnit + 165 Vitest), there is no automated Playwright E2E browser test running in the CI pipeline.
  - *Symptom:* Multi-page user flows (e.g. POS cart addition through thermal print modal invocation) rely on manual QA.
  - *Remediation Plan:* Configure Playwright test suite to execute the 5 core lifecycles in the GitHub Actions CI pipeline.

---

## 3. Risk Impact Matrix

| ID | Issue Description | Severity | Risk Area | Effort |
|---|---|:---:|---|:---:|
| **TD-01** | `routes/api_platform.php` route registry empty | `P1` | Master SaaS Admin Panel Functionality | Medium |
| **TD-02** | Older module frontend types needing strict contract sync | `P2` | Frontend Type Safety & Defensiveness | Low |
| **TD-03** | Missing Playwright E2E integration in CI | `P2` | Automated Multi-Step Regression Defense | Medium |
| **TD-04** | Missing `app/Support/` shared helper directory | `P3` | Code Deduplication & Maintainability | Low |
| **TD-05** | Production Floor TV Kiosk view with auto-poll toggle | `P3` | Factory Floor UX & Ergonomics | Low |
