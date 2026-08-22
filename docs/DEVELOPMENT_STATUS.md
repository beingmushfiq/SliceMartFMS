# DEVELOPMENT STATUS

> **Status:** Live ledger (rank 6). This file records what is **actually true**
> in the repository — not what is planned. Update it in the same change as the
> code.
>
> **Last updated:** 2026-08-23

---

## 0. How to read this file

`ROADMAP.md` says what *will* be built. This file says what *is* built. When
they disagree, this file is the honest one.

Three states only:

| State | Meaning |
|---|---|
| ✅ **Complete** | Every exit-gate item verified. Nothing outstanding. |
| 🔄 **In progress** | Started. The open items are listed explicitly. |
| ⬜ **Not started** | No code exists. Gate not opened. |

There is no "mostly done", no "90 %", no "just needs testing". A module that
needs testing is not done — testing is one of the thirteen Definition of Done
artefacts (`MODULE_MAP.md` §6), not a follow-up.

---

## 1. Where the project stands

| | |
|---|---|
| **Current phase** | Phase 0 — Architecture & documentation |
| **Phase 0 status** | ✅ Documentation complete (7 canonical + 5 supporting = 12 documents) · ✅ Monorepo restructure · ✅ Dependency reconciliation · ✅ Token cascade · ✅ UI primitive hardening · ✅ Tooling config files · ✅ CI |
| **Next phase** | Phase 1 — Auth, Tenancy, RBAC, Design System — **⬜ not started** |
| **Backend** | 🔄 Laravel 13.26.1 skeleton installed at `/backend`. Stock scaffold only — no `app/Core`, no `app/Modules`, no tenancy, no migrations beyond the three Laravel defaults, no API routes. |
| **Frontend** | ✅ `/frontend`. Token cascade, boot loader, all 9 UI primitives rebuilt, tooling configured, §8 state-matrix primitives complete (errors, logger, StateView, QueryBoundary, AsyncButton, LogInspector, four-level ErrorBoundary). See §4. |
| **Database** | ⬜ Designed (159 tables) but **zero project migrations written**. |
| **Tests** | ⬜ Runners installed (`vitest`, `phpunit`), `vitest.config.ts` exists, **zero tests written**. |
| **CI** | ✅ `.github/workflows/ci.yml` with lint, typecheck, test, build & bundle budget, depcruise. |

**The most important thing to know:** this project still has **no feature code and
no business logic**. What exists is a design-system foundation and two framework
skeletons. No endpoint, no table, no screen. Any statement that a feature "works"
is false.

---

## 2. Phase status at a glance

| Phase | Scope | Status |
|---|---|---|
| **0** | Architecture & documentation | ✅ See §3 |
| **1** | Auth · Tenancy · RBAC · Design System | ⬜ Not started |
| **2** | Master data · Products · Warehouses | ⬜ Not started |
| **3** | Production · Worker Production · QC | ⬜ Not started |
| **4** | Purchase · Inventory | ⬜ Not started |
| **5** | CRM · Sales · POS · Invoice Builder | ⬜ Not started |
| **6** | Delivery · Courier integrations | ⬜ Not started |
| **7** | HR · Assets · Finance | ⬜ Not started |
| **8** | Reports/RMS · Notifications · Audit | ⬜ Not started |
| **9** | E-commerce | ⬜ Not started |
| **10** | SaaS hardening · Testing · Deployment | ⬜ Not started |

All 41 modules in `MODULE_MAP.md` §2 are ⬜ **not started**. No module has any
of the thirteen Definition of Done artefacts.

---

## 3. Phase 0 detail

### 3.1 Complete — documentation

| Deliverable | Output | Notes |
|---|---|---|
| Legacy archival | 14 files moved to `docs/_legacy/`, marked non-authoritative | Two incompatible documentation generations, 30 contradictions catalogued |
| `DECISIONS.md` | ✅ 31 ADRs, all `Accepted` | Rank 1. Includes ADR-031 (motion & craft mandate) |
| `PROJECT_CONTEXT.md` | ✅ Product, domain language, business rules, UI/UX charter | Rank 2 |
| `ARCHITECTURE.md` | ✅ Layering, tenancy (5 layers), auth, request lifecycle, 11 transaction boundaries, exception→HTTP map | Rank 3 |
| `DATABASE_DESIGN.md` | ✅ 159 tables in groups A–L, ledger design, migration waves 0–25 | Rank 4 |
| `API_CONTRACT.md` | ✅ Envelope, 42 server error codes + 4 client pseudo-codes, pagination, idempotency, auth, webhooks, endpoint families | Rank 4 |
| `UI_SYSTEM.md` | ✅ 21 sections: tokens, dark mode, motion, 20-row state matrix, a11y, tables, forms, charts, print | Rank 4 |
| `MODULE_MAP.md` | ✅ 41 modules, dependency graph, phase mapping, Definition of Done, permission registry | Rank 5 |
| `ROADMAP.md` | ✅ Phases 0–10 with numbered exit gates, cross-cutting concerns, risk register | Rank 5 |
| `RMS_REPORT_MATRIX.md` | ✅ 58 reports in 9 groups, each with source of truth, filters, permission and tier | Rank 5 |
| `README.md` | ✅ Index + binding precedence table | — |
| `TASK_PROTOCOL.md` | ✅ Five-phase task procedure, build order, anti-patterns | Rank 6 |
| `DEVELOPMENT_STATUS.md` | ✅ This file | Rank 6 |

**Resolved by documentation:** all 30 catalogued contradictions between the two
legacy generations (`DECISIONS.md` §6 traceability table).

### 3.2 Complete — restructure and foundation

| Deliverable | Output |
|---|---|
| Monorepo restructure | ✅ `/frontend` + `/backend`. Root `package.json` is workspace-level only (`workspaces: ["frontend"]`, Node ≥ 22, `prettier` its sole dependency) and proxies `dev`/`build`/`lint`/`typecheck`/`test`/`depcruise`/`storybook` into the workspace. Dependencies hoist to the **root** `node_modules`, not `frontend/node_modules`. |
| Backend skeleton | ✅ Laravel **13.26.1** on PHP `^8.3` at `/backend`, with `larastan/larastan ^3.10`, `phpstan ^2.2`, `laravel/pint ^1.27`, `phpunit ^12.5`. Stock scaffold — **no** project code yet. |
| Dependency reconciliation | ✅ All 13 gaps in the former §5 closed. See §5 for the installed set. |
| Token cascade | ✅ Six CSS files under `src/styles/`: `tokens.primitive.css`, `tokens.semantic.css`, `tokens.semantic.dark.css`, `tokens.component.css`, `tokens.motion.css`, `base.css`, composed by `index.css` in that order. The former 717-line `index.css` is gone; `tailwind.config.js` is deleted. |
| Motion token mirror | ✅ `src/lib/motion/tokens.ts` mirrors `tokens.motion.css` into TypeScript, because Framer Motion v13 cannot resolve `var()` inside transition values. The two files carry a documented **drift rule**: they change in the same commit, and the CSS file is canonical. |
| `index.html` | ✅ Rebuilt: accessible viewport, pre-paint theme/density/reduced-motion resolver reading `localStorage` (never writing), and a tier-1 boot loader advanced only by real milestones via `window.__boot`, with honest escalation at 8 s and 20 s. |
| Boot seam | ✅ `src/app/boot.ts` — typed access to `window.__boot`; every export is a no-op when the loader is absent. |
| Prototype deletions | ✅ All rebuild-marked and delete-marked surface removed: `pages/**`, `data/mockData.ts`, `store/`, `router/`, `components/layout/`, `components/modals/`, `App.css`, Vite scaffold assets. |

### 3.3 Outstanding — Phase 0 is not closed until these are done

| # | Item | Detail |
|---|---|---|
| 1 | UI primitive hardening | ✅ All 8 files rebuilt. See §4.1. |
| 2 | `lib/utils.ts` delocalisation | ✅ Five locale-hardcoded formatters deleted. Dead `getStatusVariant()` deleted. Only `cn()` remains. |
| 3 | `ErrorBoundary.tsx` | ✅ Four-level model (`UI_SYSTEM.md` §8.4) with `level` prop. De-tenanted. |
| 4 | `registerSW.ts` de-tenanting | ✅ `[SliceMart FMS]` → `[App]`. |
| 5 | Tooling config files | ✅ `eslint.config.js`, `.dependency-cruiser.cjs`, `vitest.config.ts`, `.storybook/`, `.prettierrc` created. TS `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` enabled. |
| 6 | CI skeleton | ✅ `.github/workflows/ci.yml` with lint · typecheck · test · build · depcruise jobs. |

---

## 4. What exists in the repository today

### 4.1 `frontend/src/components/ui/` — the active work item

Rebuilt files are token-only, `lucide-react` **v1**-correct, and carry no legacy
class names. Outstanding files are the unmigrated prototype as-is.

| File | State | Detail |
|---|---|---|
| `Button.tsx` | ✅ Rebuilt | Discriminated props union (`variant: 'link'` forbids `loading`). Variants are exactly `primary · secondary · ghost · danger · link` — **there is no `warning`**. Width-preserving label swap while loading. Also exports `IconButton` (required `label`) and `ButtonGroup`. |
| `Badge.tsx` | ✅ Rebuilt | Six `-subtle` tones; `STATUS_REGISTRY` covering all 7 status families (25 statuses) with an `UNKNOWN_STATUS` fallback; `StatusBadge` emits `data-status` and never calls `t()`. |
| `Modal.tsx` | ✅ Rebuilt | All twelve §4.2 defects resolved. `useId()`, focus trap with restore, `inert`, `m.*` motion (scrim fade + panel scale / drawer slide), token-only classes, `isDirty` suppression, `hideHeader` for ConfirmDialog. Exports `Modal`, `ConfirmDialog` (variant: `danger` | `primary` only), `Drawer`. |
| `Feedback.tsx` | ✅ Rebuilt | Dynamic classes killed. `error` → `danger`. lucide v1 imports. `Pagination` moved to `Navigation.tsx`. Token-only classes throughout. §7.5 Tier 2/3: `useDelayedFlag` (120ms skeleton gate), `Spinner` (icon-replacement, no layout reflow), `ProgressBar` (discriminated union — real values only), `RefetchBar` (2px top rail, CLS 0). `EmptyState` supports row 3 (no data) + row 4 (filtered to zero) via `secondaryAction` slot. |
| `Navigation.tsx` | ✅ New | `Pagination` extracted from Feedback.tsx per §10.2 Navigation group. Token-only classes. |
| `Tabs.tsx` | ✅ Rebuilt | Full WAI-ARIA tabs pattern: roving `tabIndex`, ArrowLeft/Right/Home/End, controlled API (`value` + `onValueChange`), panel crossfade via `AnimatePresence`. Compound component (`Tabs.Root`, `.List`, `.Trigger`, `.Panel`). |
| `FormElements.tsx` | ✅ Rebuilt | All legacy classes (`form-group`, `form-input`, etc.) replaced with `--input-*` component tokens. Shared `inputBase` / `inputError` maps. Token-only throughout. |
| `KPICard.tsx` | ✅ Rebuilt | `motion.*` → `m.*`. All legacy classes (`kpi-card`, `kpi-value`, etc.) replaced with token classes. All hardcoded motion values → `enterBase`/`stagger`/`craft` tokens. `error` → `danger` in alert prop. |
| `PWAInstallBanner.tsx` | ✅ Rebuilt | `motion.*` → `m.*`. `size="xs"` → `size="sm"`. `z-50` → `z-(--z-toast)`. All primitive colours → semantic tokens. De-tenanted. |
| `AsyncButton.tsx` | ✅ New | §8.2 §8.1 row 5. Managed async mutation button: idle → submitting (Tier 3 spinner) → success flash (1.5s, `CircleCheckBig`) → error (inline, `role="alert"`). Controlled (`status` prop) or uncontrolled. Width-preserving via Button's `grid place-items-center`. No optimistic UI — waits for Promise. |

### 4.2 The twelve Modal defects — ✅ All resolved

All twelve defects listed below were resolved in the Modal.tsx rewrite on
2026-08-23. See the §4.1 Modal row for a summary of the solution.

1. ✅ `useId()` — unique, safe when two dialogs exist simultaneously.
2. ✅ Focus trap, focus move, restore to trigger, background `inert`.
3. ✅ All six deleted legacy classes removed.
4. ✅ All non-compiling primitive colours and `font-600` removed.
5. ✅ `TriangleAlert` (lucide v1).
6. ✅ `sizeClasses` → `max-w-(--modal-width-*)`. `full` dropped.
7. ✅ `drawerWidths` → `w-(--drawer-width)` / `w-(--drawer-width-lg)`.
8. ✅ `ConfirmDialog` accessible name via `hideHeader` + real title; only `danger` | `primary` variants.
9. ✅ `isDirty` prop suppresses scrim click.
10. ✅ Framer Motion enter/exit with per-variant transitions.
11. ✅ `z-(--z-overlay)` / `z-(--z-modal)`.
12. ✅ No focus ring re-implementation.

### 4.3 Other frontend files

| Path | State |
|---|---|
| `src/styles/*` (6 files) | ✅ The authoritative design asset. `index.css` is also the utility allow-list: **no primitive colour ramp is exposed**, so `bg-slate-*` and friends silently do not compile. Enforcement is by omission. |
| `index.html` · `src/app/boot.ts` · `src/App.tsx` | ✅ Complete. `App.tsx` is a token-exercise root with no placeholder copy. |
| `src/lib/motion/tokens.ts` | ✅ Complete. |
| `src/lib/motion/useGsap.ts` | ✅ Complete. Lazy-loaded GSAP hook: `gsap.context()` + `ctx.revert()`, module-level caching, respects `prefersReducedMotion()`. |
| `src/main.tsx` | ✅ Complete. `StrictMode > MotionConfig(reducedMotion) > LazyMotion(domAnimation) > ErrorBoundary > App`. |
| `src/lib/utils.ts` | ✅ Complete. Contains only `cn()`. Locale-hardcoded formatters and `getStatusVariant()` deleted. |
| `src/components/ErrorBoundary.tsx` | ✅ Rebuilt | §8.4 four-level model (`GlobalBoundary`, `RouteBoundary`, `SectionBoundary`, `WidgetBoundary`). Wired to `logBoundaryError` (correlation id, route, user/tenant id, component stack). Stack traces gated on `import.meta.env.DEV`. `onReset` prop for custom recovery. Safe copy only in production (§8.3, §8.5 rule 3). |
| `src/components/ui/AsyncButton.tsx` | ✅ New | §8.2 §8.1 row 5. Managed async mutation button with internal state machine. |
| `src/components/patterns/StateView.tsx` | ✅ New | §8.2 §8.1 rows 3, 4, 9, 11, 12, 13, 14, 15. Canonical state registry keyed by `ErrorCode` — icon, tone, heading, body copy, actions per row. Falls back to `INTERNAL_ERROR` for unregistered codes. |
| `src/components/patterns/QueryBoundary.tsx` | ✅ New | §8.2. Declarative shell for TanStack Query lifecycle: pending (120ms-gated skeleton) → error (StateView) → success (children) → empty (EmptyState/EmptyFilterState). Cancelled requests silently ignored. |
| `src/components/patterns/LogInspector.tsx` | ✅ New | §8.4 §8.5. Diagnostic log viewer on real `Modal` (focus trap, Escape). `useSyncExternalStore` over logger ring buffer. Level filter, clear, scrollable list, dev-only stack traces. |
| `src/lib/api/errors.ts` | ✅ New | §8 API_CONTRACT.md §8. `ApiError` branded object, `ErrorCode` closed union (42 server + 4 client codes), `normalizeError`, `isCancelled`/`isFixable`/`isSessionProblem`/`isPermissionProblem`/`isUserRetryable` predicates. |
| `src/lib/observability/logger.ts` | ✅ New | §8.4 §8.5. Ring buffer (50 entries) + localStorage mirror. `logBoundaryError`, `logApiError`, `logEvent`. `installGlobalErrorHandlers` (unhandledrejection + window.error). `useSyncExternalStore`-shaped subscribe/snapshot. |
| `src/registerSW.ts` | ✅ Complete. De-tenanted (`[App]` not `[SliceMart FMS]`). |
| `src/types/index.ts` | ⬜ Prototype types. Will be superseded by contract-generated types. |

### 4.4 Backend

Laravel 13.26.1 stock scaffold. Present: `app/Http/Controllers/Controller.php`,
`app/Models/User.php`, `app/Providers/AppServiceProvider.php`, the three default
migrations, `routes/web.php`, `routes/console.php`.

**Absent — all of Phase 1:** `app/Core`, `app/Modules`, `app/Support`,
`routes/api_platform.php`, `routes/api_tenant.php`, `routes/api_public.php`,
`BelongsToTenant`, `ResolveTenant`, and every project migration.

---

## 5. Dependency state — reconciled

All 13 gaps recorded on 2026-08-22 are closed. Installed at `frontend/package.json`:

| Concern | Package | Version |
|---|---|---|
| Server state | `@tanstack/react-query` | `^5.101.4` |
| Tables | `@tanstack/react-table` · `@tanstack/react-virtual` | `^9.1.2` · `^3.14.10` |
| Motion | `framer-motion` · `gsap` | `^13.1.0` · `^3.15.0` |
| Forms | `react-hook-form` · `@hookform/resolvers` · `zod` | `^7.85.0` · `^5.9.0` · `^3.25.76` |
| i18n | `i18next` · `react-i18next` | `^26.4.0` · `^17.0.12` |
| UI | `lucide-react` · `sonner` · `recharts` · `clsx` · `tailwind-merge` | `^1.31.0` · `^2.0.8` · `^3.10.1` · `^2.1.1` · `^3.6.0` |
| UI state · routing · dates | `zustand` · `react-router-dom` · `date-fns` | `^5.0.15` · `^7.18.2` · `^4.4.0` |
| Test | `vitest` · `@testing-library/*` · `axe-core` · `jsdom` · `@vitest/coverage-v8` | `^4.1.11` · — · `^4.13.0` · `^30.0.1` · `^4.1.11` |
| Mocking | `msw` | `^2.15.0` (worker directory `public/`) |
| Docs | `storybook` · `@storybook/react-vite` | `^10.5.10` |
| Lint | `eslint` · `eslint-plugin-jsx-a11y` · `typescript-eslint` · `oxlint` | `^10.9.0` · `^6.10.2` · `^8.67.0` · `^1.75.0` |
| Layer rules | `dependency-cruiser` | `^18.2.0` |
| Build | `vite` · `@vitejs/plugin-react` · `@tailwindcss/postcss` · `typescript` | `^8.2.0` · `^6.0.4` · `^4.3.3` · `~6.0.2` |

Backend, at `backend/composer.json`: `laravel/framework` **v13.26.1**,
`larastan/larastan ^3.10`, `phpstan/phpstan ^2.2`, `laravel/pint ^1.27`,
`phpunit/phpunit ^12.5.12`, `laravel/pail`, `laravel/pao`, `mockery`, `collision`.

> **Installed ≠ working.** Five of these have no configuration file, so their
> scripts currently fail. That is §3.3 item 5, and it is the reason Phase 0 is
> still open.

Two version notes to carry into Phase 1:

- `@tanstack/react-table` is **v9**. `UI_SYSTEM.md` §11 was written against v8
  assumptions; verify the API on first real `DataTable` use.
- `zod` is **v3**, not v4. Contract-derived schemas must be written to v3.

---

## 6. Open questions currently blocking future work

From `DECISIONS.md` §7. None block Phase 1.

| # | Question | Blocks | Needed by |
|---|---|---|---|
| Q1 | Incentive calculation formula — slab boundaries, base (revenue vs gross profit), whether returns claw back | Phase 5 | Before Phase 5 gate |
| Q2 | Tax model — single VAT rate, per-product, inclusive vs exclusive per channel | Phase 5 | Before Phase 5 build |
| Q3 | Invoice numbering per tenant — prefix, reset period, padding, separate POS series | Phase 5 | Before Phase 5 build |
| Q10 | Storybook vs Ladle | Phase 1 | Default: **Storybook**. Decide at Phase 1 start. |
| Q11 | Public design-token package | — | Answered: **no** in v1 |
| Q12 | A third "ultra-compact" density | — | Answered: **no** — measure first |
| Q13 | Storefront token sharing | Phase 9 | Answered: shares layers 1–2, own layer 3 and motion budget |

**No business rule is invented to unblock work.** If a task requires Q1, Q2 or
Q3, it stops and asks (`TASK_PROTOCOL.md` §3.2).

---

## 7. Immediate next actions, in order

| # | Action | State |
|---|---|---|
| 1 | Rewrite `ui/Modal.tsx` — `Modal` + `ConfirmDialog` + `Drawer`, resolving all twelve defects in §4.2 | ✅ |
| 2 | `ui/Feedback.tsx` — kill the dynamic class, rename the `error` tone to `danger`, split per `UI_SYSTEM.md` §10.2 | ✅ |
| 3 | `ui/Tabs.tsx` — full WAI-ARIA tabs pattern, controlled API, panel crossfade | ✅ |
| 4 | `ui/FormElements.tsx`, `ui/KPICard.tsx`, `ui/PWAInstallBanner.tsx` | ✅ |
| 5 | `ErrorBoundary.tsx` → four levels; de-tenant it and `registerSW.ts` | ✅ |
| 6 | `lib/utils.ts` delocalisation; delete `getStatusVariant()` | ✅ |
| 7 | Install the motion provider in `main.tsx`; write `lib/motion/useGsap.ts` | ✅ |
| 8 | Tooling config files + TS strict flags + CI skeleton | ✅ |
| 9 | `lib/api/errors.ts` — ApiError contract, 42+4 error codes, normalizer | ✅ |
| 10 | `lib/observability/logger.ts` — ring buffer, boundary/API/app logging, global handlers | ✅ |
| 11 | `ui/Feedback.tsx` §7.5 Tier 2/3 — Spinner, ProgressBar (discriminated union), RefetchBar, EmptyState row 3+4 | ✅ |
| 12 | `patterns/StateView.tsx` — canonical registry keyed by `ErrorCode`, rows 3,4,9,11,12,13,14,15 | ✅ |
| 13 | `patterns/QueryBoundary.tsx` — pending (120ms gate) → error → empty → children | ✅ |
| 14 | `ErrorBoundary.tsx` rebuild — four levels, logger wiring, dev-only stack traces, convenience wrappers | ✅ |
| 15 | `ui/AsyncButton.tsx` — idle → submitting → success flash → error inline | ✅ |
| 16 | `patterns/LogInspector.tsx` — diagnostic log viewer on real Modal | ✅ |
| 17 | Wire `main.tsx`: `installGlobalErrorHandlers` before mount | ✅ |
| 18 | **Close Phase 0.** Then Phase 1 wave 0 migrations. | `ROADMAP.md` §3 Phase 1 |

---

## 8. Resuming work in a new session

Read, in precedence order: `DECISIONS.md` · `PROJECT_CONTEXT.md` ·
`ARCHITECTURE.md` · `UI_SYSTEM.md` (§2, §7, §8, §9.2, §10.2–10.4, §17, §18) ·
this file. Phase 0 is complete — begin Phase 1 wave 0 migrations per
`ROADMAP.md` §3.

These constraints are already settled. Do not re-derive them, and do not
contradict them:

| Constraint | Consequence if ignored |
|---|---|
| Tailwind **v4**, CSS-first. No `tailwind.config.js`. Read tokens with the variable shorthand — `h-(--btn-height-md)`, `max-w-(--modal-width-md)`, `z-(--z-modal)`, `text-(length:--badge-font-size)`. | Arbitrary values re-introduce magic numbers. |
| **No primitive colour exists in the utility namespace.** `bg-slate-*`, `text-blue-*`, `bg-error-*` do not compile — they fail *silently*. Semantic roles only, and the semantic name is `danger`, never `error`. | Invisible styling bugs. |
| **No dynamically constructed class names, ever.** | This is §9.2 defect 3. |
| `lucide-react` is **v1**: `TriangleAlert`, `CircleCheckBig`, `CircleX`, `FilePen` — not the v0 names. | Compile error. |
| `Button` variants are exactly `primary · secondary · ghost · danger · link`. | Passing `warning` is a compile error. |
| Framer Motion **cannot** read CSS variables in transitions — import from `lib/motion/tokens.ts`. Under `LazyMotion` use `m.*`, never `motion.*`. | Silent no-op animation, or a thrown dev invariant. |
| Reduced motion is read from `<html data-reduced-motion>`, never `matchMedia`, because the stored preference overrides the OS in both directions. | Preference ignored. |
| `base.css` already supplies `:focus-visible`, scrollbars and print rules globally. | Duplicated, conflicting focus rings. |
| Money and quantity are **strings** end to end (`"1234.5000"`). | Float drift in financial data. |
| Slice Mart is tenant #1, never hardcoded. No tenant name, currency symbol or locale in component code. | Breaks multi-tenancy. |

---

## 9. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Created. Replaces `_legacy/DEVELOPMENT_STATUS.md`, which claimed "pre-development" while a prototype application existed (contradiction C24). Records Phase 0 documentation complete, all 41 modules not started, and the five outstanding Phase 0 work items. |
| 2026-08-22 | Consistency pass: document count stated as 7 canonical + 5 supporting; §5 renumbered to Phase 0 item 5; the Phase 1 gate now requires items **1–5** (dependency reconciliation is a hard gate, since the Phase 1 exit criteria cannot be verified without the missing test, mock and Storybook tooling). |
| 2026-08-23 | **Truth-up.** The file had drifted: it still described the prototype as living at the repository root, the backend as non-existent, and thirteen dependencies as absent — all three untrue. Records the monorepo restructure, the Laravel 13.26.1 skeleton, the six-file token cascade, the rebuilt `index.html` and boot loader, the closed dependency reconciliation, and per-file state for all eight UI primitives. Former §3.2 (outstanding) split into §3.2 complete / §3.3 outstanding, renumbered 1–6. Added §4.2 (the twelve Modal defects) and §8 (a settled-constraints table so a new session resumes without re-deriving them). |
| 2026-08-23 | **Phase 0 code items closed.** §3.3 items 1–6 marked complete. All 9 `ui/` files rebuilt (Modal, Feedback, Navigation (new), Tabs, FormElements, KPICard, PWAInstallBanner, Button, Badge) — each token-only, lucide v1-correct, no dynamic classes, no primitive colours. Modal: all 12 defects resolved (useId, focus trap + restore, inert, m.* motion, token classes, isDirty, hideHeader for ConfirmDialog). Motion provider installed in `main.tsx` (`LazyMotion` + `MotionConfig` + `reducedMotion`). `useGsap.ts` created (lazy-loaded, `gsap.context()` + `ctx.revert()`). `ErrorBoundary.tsx` rewritten to four-level model, de-tenanted. `registerSW.ts` de-tenanted. `lib/utils.ts` delocalised to `cn()` only. New file: `Navigation.tsx` (Pagination extracted from Feedback). Tooling configs added: `.eslintrc.js` (typescript-eslint + react-hooks + react-refresh + jsx-a11y), `.dependency-cruiser.cjs`, `vitest.config.ts`, `.storybook/main.ts` + `preview.ts`, `.prettierrc`. TS strict flags added to `tsconfig.app.json`. CI skeleton: `.github/workflows/ci.yml` (lint, typecheck, test, build & bundle budget, depcruise). §7 items 1–8 complete. |
| 2026-08-23 | **§8 state-matrix primitives complete.** Seven new/modified files implementing the UI_SYSTEM.md §8 reliability layer. `lib/api/errors.ts` — `ApiError` branded object, `ErrorCode` closed union (42 server + 4 client codes), `normalizeError`, `isCancelled`/`isFixable`/`isSessionProblem`/`isPermissionProblem`/`isUserRetryable` predicates. `lib/observability/logger.ts` — ring buffer (50 entries) + localStorage mirror, `logBoundaryError`/`logApiError`/`logEvent`, `installGlobalErrorHandlers` (unhandledrejection + window.error), `useSyncExternalStore`-shaped subscribe/snapshot. `ui/Feedback.tsx` updated — `useDelayedFlag` (120ms skeleton gate), `Spinner` (icon-replacement, no layout reflow), `ProgressBar` (discriminated union, real values only), `RefetchBar` (2px top rail, CLS 0), `EmptyState` row 3+4 via `secondaryAction`. `patterns/StateView.tsx` — canonical state registry keyed by `ErrorCode`: icon, tone, heading, body copy, actions for rows 3,4,9,11,12,13,14,15; falls back to `INTERNAL_ERROR` for unregistered codes. `patterns/QueryBoundary.tsx` — declarative shell for TanStack Query lifecycle: pending (120ms-gated skeleton) → error (StateView) → empty (EmptyState/EmptyFilterState) → children; cancelled requests silently ignored. `ErrorBoundary.tsx` rebuilt — four levels (`GlobalBoundary`, `RouteBoundary`, `SectionBoundary`, `WidgetBoundary`), wired to `logBoundaryError` (correlation id, route, user/tenant id, component stack), stack traces gated on `import.meta.env.DEV`, `onReset` prop for custom recovery, safe copy only in production. `ui/AsyncButton.tsx` — managed async mutation button: idle → submitting (Tier 3 spinner) → success flash (1.5s, `CircleCheckBig`) → error (inline, `role="alert"`); controlled or uncontrolled. `patterns/LogInspector.tsx` — diagnostic log viewer on real `Modal` (focus trap, Escape), `useSyncExternalStore` over logger ring buffer, level filter, clear, scrollable list, dev-only stack traces. `main.tsx` wired: `installGlobalErrorHandlers()` before React mount. §7 items 9–17 complete. |
