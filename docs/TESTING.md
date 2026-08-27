# AUTHORITATIVE TESTING STRATEGY & QUALITY GATES

> **Status:** Canonical Testing Strategy & Verification Guide.
> **Backend Runner:** PHPUnit 12 on PHP 8.5 with in-memory SQLite.
> **Frontend Runner:** Vitest 4 + React Testing Library + MSW + JSDOM.
> **Last updated:** 2026-08-27

---

## 1. Testing Philosophy & Architecture

Testing in this platform is **contract-driven, fault-tolerant, and non-negotiable**.

* **No Empty Test Passes:** `passWithNoTests: false` is enforced on both runners. A test suite with 0 assertions is treated as a failed build.
* **Testing In-Memory by Default:** Backend feature tests use `:memory:` SQLite databases for sub-second execution speeds without requiring external MySQL service dependencies during local and CI runs.
* **Network Mocking via MSW:** Frontend tests use Mock Service Worker (MSW) handlers strictly derived from `docs/API_CONTRACT.md`.

---

## 2. Test Suites Overview

### 2.1 Backend Test Suites (`backend/tests/`)

* **Unit Tests (`tests/Unit/`):**
  * `ExampleTest.php`: Verifies interpreter satisfies PHP floor (`^8.5`) dynamically read from `composer.json`.
  * Domain calculation tests: Piece-rate wage calculations, BOM quantity expansions, tax math.
* **Feature & Integration Tests (`tests/Feature/`):**
  * `Tenancy/`: Tests `TenantContext`, `BelongsToTenant` scope injection, and cross-tenant data leak isolation (`404 NOT_FOUND`).
  * `Auth/`: Tests `LoginAction`, JWT cryptographic signing, token expiration, refresh rotation, stolen token reuse detection, and permission middleware.
  * `Database/`: Tests migration wave integrity, foreign key closures, and table column types.
  * `Models/`: Tests all Eloquent model relationships, composite primary/foreign keys, and decimal casts.
  * `Catalogue/`: Tests full HTTP CRUD lifecycles for Units, Categories, Brands, Products, BOMs, and Warehouses.

### 2.2 Frontend Test Suites (`frontend/src/`)

* **Reliability & State Matrix Tests:**
  * `ErrorBoundary.test.tsx`: Tests 4-level error boundary hierarchy (`Global`, `Route`, `Section`, `Widget`) and error isolation.
  * `QueryBoundary.test.tsx`: Tests TanStack Query lifecycle (Pending, Skeleton gate, Error StateView, EmptyState, Stale RefetchBar).
  * `client.test.ts` & `errors.test.ts`: Tests transport seam, correlation ID injection, 401 refresh single-flight queuing, and error normalization.
* **UI Primitive Component Tests:**
  * Tests button loading states, modal focus trapping, accessibility attributes (`aria-*`, `role="alert"`), and keyboard navigation.

---

## 3. Verification Commands & Execution Matrix

| Test Gate | Command | Execution Scope | Acceptance Target |
|---|---|---|---|
| **Root Verify** | `npm run verify` | Root workspace | Executes format check, lint, typecheck, depcruise, unit tests |
| **Frontend Lint** | `npm run lint --workspace frontend` | Frontend | 0 warnings, 0 errors |
| **Frontend Types** | `npm run typecheck --workspace frontend` | Frontend | `tsc -b --noEmit` exits with code 0 |
| **Frontend Tests** | `npm run test --workspace frontend` | Frontend | Vitest 100% passing tests (currently 128 tests) |
| **Bundle Budget** | `npm run budget --workspace frontend` | Frontend | Initial JS ≤ 250 kB gzipped, CSS ≤ 50 kB |
| **Backend Lint** | `composer lint` (in `backend/`) | Backend | Laravel Pint passes all files |
| **Backend Static**| `composer analyse` (in `backend/`) | Backend | PHPStan Level 9 passes with 0 errors |
| **Backend Tests** | `composer test` (in `backend/`) | Backend | PHPUnit 100% passing (currently 549 tests / 3148 assertions) |

---

## 4. Continuous Integration (CI) Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request across 3 parallel jobs and 9 execution legs:

```text
GitHub Push / PR
       │
       ├───► Job 1: Frontend Matrix (Ubuntu Latest, Node 22)
       │      ├── Task 1: lint (eslint --max-warnings 0)
       │      ├── Task 2: typecheck (tsc -b --noEmit)
       │      ├── Task 3: test (vitest run)
       │      ├── Task 4: depcruise (boundary linting)
       │      └── Task 5: format:check (prettier check)
       │
       ├───► Job 2: Frontend Build & Bundle Budget
       │      ├── vite build
       │      └── node scripts/check-bundle-budget.mjs
       │
       └───► Job 3: Backend Matrix (Ubuntu Latest, PHP 8.5)
              ├── Task 1: lint (pint --test)
              ├── Task 2: analyse (phpstan level 9)
              └── Task 3: test (phpunit tests)
```
