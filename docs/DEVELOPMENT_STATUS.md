# DEVELOPMENT STATUS

> **Status:** Live ledger (rank 6). This file records what is **actually true**
> in the repository — not what is planned. Update it in the same change as the
> code.
>
> **Last updated:** 2026-08-24

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
| **Current phase** | Phase 1 — ✅ **Auth, RBAC, Tenancy Runtime, and Waves 1–25 Database Migrations 100% complete.** |
| **Phase 0 status** | ✅ Documentation complete (7 canonical + 5 supporting = 12 documents) · ✅ Monorepo restructure · ✅ Dependency reconciliation · ✅ Token cascade · ✅ UI primitive hardening · ✅ §8 state-matrix primitives · ✅ Tooling config files (frontend **and** backend) · ✅ Test suites · ✅ CI — **every gate verified green, see §3.4** |
| **Next phase** | Phase 2 — **Master data · Products · Warehouses**, per `MODULE_MAP.md` & `ARCHITECTURE.md`. |
| **Backend** | ✅ Laravel 13.26.1 skeleton at `/backend`, PHP floor `^8.5`. Tooling real and passing: `phpstan.neon` (level 9, `checkModelProperties`) + `pint.json`. **Waves 1–25 migrations written and verified (all 169 tables + all deferred closures), Tenancy runtime live, and Phase 1 Auth & RBAC pipeline complete** — `JwtService`, `RefreshTokenService`, `PermissionCatalogue`, `AuthenticateJwt`, `AuthorizePermission`, `AuthController`, and all 12 Auth Actions live. First tranche of **19 master-data Eloquent models** (`Unit`, `UnitConversion`, `Category`, `Brand`, `TaxProfile`, `ReasonCode`, `Product`, `ProductVariant`, `ProductImage`, `BillOfMaterial`, `BillOfMaterialItem`, `Warehouse`, `WarehouseLocation`, `Party`, `PartyAddress`, `PartyContact`, `PriceList`, `PriceListItem`, `DiscountRule`) authored on `BelongsToTenant` with composite-key relations, verified by `tests/Feature/Models/MasterDataModelTest.php`. Passing **496 tests** with PHPStan Level 9. |
| **Frontend** | ✅ `/frontend`. Token cascade, boot loader, all 9 UI primitives rebuilt, tooling configured, §8 state-matrix primitives complete (errors, logger, StateView, QueryBoundary, AsyncButton, Toast, LogInspector, four-level ErrorBoundary), and the single transport seam wired (`lib/api/client.ts` + `lib/api/queryClient.ts` + `QueryClientProvider`). See §4. |
| **Database** | ✅ Fully migrated (169 tables, 170 migrations). **All tables and closures exist** — Waves 1–25: platform (§4.6), org (§4.7), identity (§4.8), infrastructure (§4.9), master data A (§4.10), master data B (§4.11), master data C (§4.12), HR identity (§4.13), production (§4.14), QC & wastage (§4.15), ledger & stock inventory (§4.16), stock operations (§4.17), purchasing (§4.18), sales & invoicing (§4.19), payments & allocations (§4.20), POS (§4.21), delivery & logistics (§4.22), full HR & payroll (§4.23), assets & maintenance (§4.24), finance & costing (§4.25), reporting & analytics (§4.26), e-commerce (§4.27), integrations (§4.28), and deferred closures (§4.29). |
| **Tests** | ✅ Frontend **128 tests across 7 files**, all passing. Backend **496 tests / 2941 assertions** across schema contracts, tenancy runtime contracts, the full Auth/RBAC pipeline, and the 19 master-data model relations — 100% green. |
| **CI** | ✅ `.github/workflows/ci.yml` — 3 jobs, 9 legs. Frontend matrix (lint · typecheck · test · depcruise · format:check) installing at the **repository root**, build + bundle budget with a `dist` artifact, and a backend matrix (lint · analyse · test) on PHP 8.5. Every leg has a locally reproducible equivalent. |

---

## 2. Phase status at a glance

| Phase | Scope | Status |
|---|---|---|
| **0** | Architecture & documentation | ✅ See §3 |
| **1** | Auth · Tenancy · RBAC · Design System | ✅ Migration Waves 1–25, Tenancy Runtime, and Auth/RBAC Pipeline 100% Complete |
| **2** | Master data · Products · Warehouses | ⬜ Ready for implementation |
| **3** | Production · Worker Production · QC | ⬜ Not started |
| **4** | Purchase · Inventory | ⬜ Not started |
| **5** | CRM · Sales · POS · Invoice Builder | ⬜ Not started |
| **6** | Delivery · Courier integrations | ⬜ Not started |
| **7** | HR · Assets · Finance | ⬜ Not started |
| **8** | Reports/RMS · Notifications · Audit | ⬜ Not started |
| **9** | E-commerce | ⬜ Not started |
| **10** | SaaS hardening · Testing · Deployment | ⬜ Not started |

All 41 modules in `MODULE_MAP.md` §2 are ⬜ **not started** as modules — the
Wave 1–4 tables exist, but `platform`, `tenancy`, `audit` and `notifications` have
none of the thirteen Definition of Done artefacts, and a schema is not a module.

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
| Backend skeleton | ✅ Laravel **13.26.1** on PHP `^8.5` at `/backend`, with `larastan/larastan ^3.10`, `phpstan ^2.2`, `laravel/pint ^1.27`, `phpunit ^12.5`. Stock scaffold — **no** project code yet. The floor was `^8.3` until 2026-08-23; it was raised because the installed Symfony 8.1 tree hard-requires `>= 8.4.1` (`vendor/composer/platform_check.php`), so the declared constraint was one a real `composer install` would have rejected. |
| Dependency reconciliation | ✅ All 13 gaps in the former §5 closed. See §5 for the installed set. |
| Token cascade | ✅ Six CSS files under `src/styles/`: `tokens.primitive.css`, `tokens.semantic.css`, `tokens.semantic.dark.css`, `tokens.component.css`, `tokens.motion.css`, `base.css`, composed by `index.css` in that order. The former 717-line `index.css` is gone; `tailwind.config.js` is deleted. |
| Motion token mirror | ✅ `src/lib/motion/tokens.ts` mirrors `tokens.motion.css` into TypeScript, because Framer Motion v13 cannot resolve `var()` inside transition values. The two files carry a documented **drift rule**: they change in the same commit, and the CSS file is canonical. |
| `index.html` | ✅ Rebuilt: accessible viewport, pre-paint theme/density/reduced-motion resolver reading `localStorage` (never writing), and a tier-1 boot loader advanced only by real milestones via `window.__boot`, with honest escalation at 8 s and 20 s. |
| Boot seam | ✅ `src/app/boot.ts` — typed access to `window.__boot`; every export is a no-op when the loader is absent. |
| Prototype deletions | ✅ All rebuild-marked and delete-marked surface removed: `pages/**`, `data/mockData.ts`, `store/`, `router/`, `components/layout/`, `components/modals/`, `App.css`, Vite scaffold assets. |

### 3.3 Formerly outstanding — the items that gated Phase 0

Nothing outstanding. All items below are verified complete; §3.4 records how.
The heading kept its number because §3.4, §9 and `README.md` cite these items
by index.

| # | Item | Detail |
|---|---|---|
| 1 | UI primitive hardening | ✅ All 8 files rebuilt. See §4.1. |
| 2 | `lib/utils.ts` delocalisation | ✅ Five locale-hardcoded formatters deleted. Dead `getStatusVariant()` deleted. Only `cn()` remains. |
| 3 | `ErrorBoundary.tsx` | ✅ Four-level model (`UI_SYSTEM.md` §8.4) with `level` prop. De-tenanted. |
| 4 | `registerSW.ts` de-tenanting | ✅ `[SliceMart FMS]` → `[App]`. |
| 5 | Tooling config files | ✅ **Frontend:** `eslint.config.js`, `.dependency-cruiser.cjs`, `vitest.config.ts`, `.storybook/`, `.prettierrc`. TS `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` enabled. **Backend:** `phpstan.neon` (level 9, `checkModelProperties: true`, `reportWrongPhpDocTypeInVarTag: true`) and `pint.json` (`laravel` preset + `declare_strict_types`, `strict_comparison`, `strict_param`, `global_namespace_import`, `ordered_class_elements`, `void_return`). **Root:** `.prettierignore`. `ROADMAP.md` line 113 names PHPStan/Larastan and Pint in the Phase 0 baseline; both were missing until 2026-08-23, so `composer lint` and `composer analyse` did not exist. |
| 6 | CI | ✅ `.github/workflows/ci.yml` rewritten 2026-08-23. Was 5 jobs, all of which would have failed on a real runner. Now 3 jobs / 9 legs, each with a locally reproducible equivalent. See §3.4. |
| 7 | Test suites | ✅ 128 frontend tests over the reliability layer + 2 backend tests. `passWithNoTests` is deliberately **off**, so the runner cannot go green on an empty suite. |
| 8 | Bundle budget gate | ✅ `frontend/scripts/check-bundle-budget.mjs` — reads `dist/index.html` so it survives code splitting, measures gzipped size, fails on `ARCHITECTURE.md` §6.10 and warns on `UI_SYSTEM.md` §16. Replaces a `# TODO` comment that made the CI job name a lie. |

### 3.4 Gate verification — measured, not assumed

Every gate below was run locally on 2026-08-23 and its exit code recorded. A
claim of "CI exists" is worth nothing if no leg has ever executed; the whole
point of §3.3 item 6 was that the previous workflow had **never** run green.

| Gate | Command (from) | Result |
|---|---|---|
| Format | `prettier --check` (root globs + `.github/workflows/*.yml`) | ✅ exit 0 — all matched files |
| Types | `tsc -b --noEmit --force` (`frontend/`) | ✅ exit 0 |
| Lint | `eslint . --max-warnings 0` (`frontend/`) | ✅ exit 0 |
| Unit tests | `vitest run` (`frontend/`) | ✅ **128 passed (7 files)** |
| Build | `vite build` (`frontend/`) | ✅ exit 0 |
| Bundle budget | `node scripts/check-bundle-budget.mjs` | ✅ initial JS **109.7 kB / 250 kB**, CSS 10.2 kB |
| Layer rules | `depcruise src` (`frontend/`) | ⚠️ **Not runnable locally.** `dependency-cruiser@18` supports `^22 \|\| ^24 \|\| >=26` and this machine runs Node **25.1.0**, so it refuses to start. CI pins Node 22 — that pin is the reason this leg exists there and not here. |
| PHP lint | `php vendor/bin/pint --test` (`backend/`) | ✅ **PASS 26 files** |
| PHP analyse | `php vendor/bin/phpstan analyse` (`backend/`) | ✅ **[OK] No errors** at level 9 |
| PHP tests | `php artisan test` (`backend/`) | ✅ **2 passed (9 assertions)** |

Two Windows-specific notes for whoever runs these next:

- The repository path contains spaces and an `&`. That breaks any bare binary
  reference — `npx tsc`, `npm run typecheck`, and Composer's `vendor/bin/pint`
  form all fail on argument splitting. Invoke Node tools as
  `node "..\node_modules\<pkg>\bin\<bin>"` and Composer scripts as
  `@php vendor/bin/…`, which is why `composer.json` uses that form.
- PowerShell serialises stderr as CLIXML, so PHPStan's "Note: Using
  configuration file", Composer's script echo and Git's LF/CRLF warning all
  surface as a `#< CLIXML` block and a `NativeCommandError` **even on success**.
  The exit code is the only reliable signal.

---

## 4. What exists in the repository today

### 4.1 `frontend/src/components/ui/` — the primitive layer

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
| `Toast.tsx` | ✅ New | §8.1 row 5 **transient** half — the surface Sonner had no mount point for. Wraps `sonner` so nothing else imports it: `unstyled` + `richColors={false}` forced, every surface re-declared from semantic tokens, `theme="light"` so Sonner forms no `matchMedia` opinion (dark mode is class-based token re-mapping). Per-type background classes deliberately empty — the icon carries the semantic, not a tinted panel. Exports `Toaster` and `notify.{success,info,error,dismiss}`. `notify.error` is pinned `duration: Infinity`: §8.5 rule 2 forbids hiding an error, and a self-dismissing error is a hidden error for anyone who looked away. Sonner self-injects its CSS, so no stylesheet import. |

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
| `src/styles/*` (7 files) | ✅ The authoritative design asset. `index.css` is also the utility allow-list: **no primitive colour ramp is exposed**, so `bg-slate-*` and friends silently do not compile. Enforcement is by omission. Corollary: a mistyped semantic utility fails silently too — `border-border` compiled fine in TS and emitted no CSS. The allow-list is `border-default`/`-strong`/`-primary`/`-success`/`-warning`/`-danger`/`-info`; verify new utilities against the built stylesheet, not the typechecker. |
| `index.html` · `src/app/boot.ts` · `src/App.tsx` | ✅ Complete. `App.tsx` is a token-exercise root with no placeholder copy. |
| `src/lib/motion/tokens.ts` | ✅ Complete. |
| `src/lib/motion/useGsap.ts` | ✅ Complete. Lazy-loaded GSAP hook: `gsap.context()` + `ctx.revert()`, module-level caching, respects `prefersReducedMotion()`. |
| `src/main.tsx` | ✅ Complete. `StrictMode > GlobalBoundary > MotionConfig(reducedMotion) > LazyMotion(domAnimation) > QueryClientProvider > { App, Toaster }`. `GlobalBoundary` is deliberately **outside** every provider — §8.4 level ① assigns it provider/bootstrap failure, which it cannot catch from inside the providers. Verified: its fallback's import graph reaches only `react`, `lucide-react`, `ui/Button`, `lib/observability/logger` — no `framer-motion`, so it renders with no context at all. `<Toaster />` is a **sibling** of `<App />`, not a route child, so a route-level boundary tearing down cannot take an in-flight confirmation with it. `installGlobalErrorHandlers()` runs before mount. |
| `src/lib/utils.ts` | ✅ Complete. Contains only `cn()`. Locale-hardcoded formatters and `getStatusVariant()` deleted. |
| `src/components/ErrorBoundary.tsx` | ✅ Rebuilt | §8.4 four-level model (`GlobalBoundary`, `RouteBoundary`, `SectionBoundary`, `WidgetBoundary`). Wired to `logBoundaryError` (correlation id, route, user/tenant id, component stack). Stack traces gated on `import.meta.env.DEV`. `onReset` prop for custom recovery. Safe copy only in production (§8.3, §8.5 rule 3). |
| `src/components/ui/AsyncButton.tsx` | ✅ New | §8.2 §8.1 row 5. Managed async mutation button with internal state machine. |
| `src/components/patterns/StateView.tsx` | ✅ New | §8.2 §8.1 rows 3, 4, 9, 11, 12, 13, 14, 15. Canonical state registry keyed by `ErrorCode` — icon, tone, heading, body copy, actions per row. Falls back to `INTERNAL_ERROR` for unregistered codes. |
| `src/components/patterns/QueryBoundary.tsx` | ✅ New | §8.2. Declarative shell for the whole TanStack Query lifecycle: pending (120ms-gated skeleton) → error (StateView) → success (children) → empty (EmptyState/EmptyFilterState). Cancelled requests silently ignored. **Rows 2 + 20:** an `isFetching` prop drives a `RefetchBar` 2px top rail while stale data stays on screen — a background refetch never swaps data for a skeleton. §7.5's "dim to 60%" is gated behind `useDelayedFlag(…, 1000)`, because a 200ms refetch that dims and undims reads as a flicker; below 1s the rail alone carries the signal. The rail wraps the data **and both empty surfaces**, since a refetch over an empty list is exactly when the user is waiting for a row to appear. Opacity only, never `display`/`visibility` — stale rows stay readable and selectable. |
| `src/components/patterns/LogInspector.tsx` | ✅ New | §8.4 §8.5. Diagnostic log viewer on real `Modal` (focus trap, Escape). `useSyncExternalStore` over logger ring buffer. Level filter, clear, scrollable list, dev-only stack traces. |
| `src/lib/api/errors.ts` | ✅ New | §8 API_CONTRACT.md §8. `ApiError` branded object, `ErrorCode` closed union (42 server + 4 client codes), `normalizeError`, `isCancelled`/`isFixable`/`isSessionProblem`/`isPermissionProblem`/`isUserRetryable` predicates. |
| `src/lib/api/client.ts` | ✅ New | ARCHITECTURE.md §6.3 — **the single transport seam**. §10 forbids a raw `fetch` outside `lib/api`, so this is the only place one exists. Parses all three §2 envelopes; every failure becomes an `ApiError` with the server's `code`. §1.6/§1.7 headers (`X-Correlation-Id` client-generated and server-authoritative on echo, `Idempotency-Key`, `If-Match`, `Accept-Language`). §8.2/§8.4 401 protocol: `TOKEN_EXPIRED` → single-flight refresh → replay **once**, guarded by `isReplay`; any other 401 → session-expiry immediately, never a loop. Per-request deadline via `AbortSignal.any([caller, timeout])` with a `didTimeout` flag checked **before** the `AbortError` branch, because a timeout is row 15 (visible) and a cancellation is row 19 (silent). Cancellation bypasses logging entirely. Exactly one attempt per call — retry is policy, not transport. Every throw goes through `fail()`, so no exit path skips the log. |
| `src/lib/api/queryClient.ts` | ✅ New | ADR-025 + API_CONTRACT.md §16.6 — retry and freshness **policy**, kept out of the transport so it can vary per query. `STALE_TIME` tiers (master data 5 min · transactional 30 s · dashboard 60 s), `gcTime` 10 min. GETs retry ≤ 3 with exponential backoff + full jitter; excluded: cancelled, session codes, `NETWORK_OFFLINE` (`refetchOnReconnect` owns it), `RATE_LIMITED`, and anything with `retryable: false`. **Mutations never retry.** `placeholderData: previous` keeps data visible during refetch (rows 2 + 20). `throwOnError: false` on both — §8.4 boundaries catch render errors only. |
| `src/lib/observability/logger.ts` | ✅ New | §8.4 §8.5. Ring buffer (50 entries) + localStorage mirror. `logBoundaryError`, `logApiError`, `logEvent`. `installGlobalErrorHandlers` (unhandledrejection + window.error). `useSyncExternalStore`-shaped subscribe/snapshot. |
| `src/registerSW.ts` | ✅ Complete. De-tenanted (`[App]` not `[SliceMart FMS]`). |
| `src/types/index.ts` | ⬜ Prototype types. Will be superseded by contract-generated types. |

### 4.4 Backend

Laravel 13.26.1 stock scaffold. Present: `app/Http/Controllers/Controller.php`,
`app/Models/User.php`, `app/Providers/AppServiceProvider.php`, the three default
migrations, `routes/web.php`, `routes/console.php`.

| Path | State |
|---|---|
| `phpstan.neon` | ✅ New. Level **9** with `checkModelProperties: true` and `reportWrongPhpDocTypeInVarTag: true`. Paths `app`, `database`, `routes`, `tests`; excludes `bootstrap/cache`. `[OK] No errors`. |
| `pint.json` | ✅ New. `laravel` preset plus `declare_strict_types`, `strict_comparison`, `strict_param`, `global_namespace_import`, `fully_qualified_strict_types`, `ordered_class_elements`, `no_unused_imports`, `void_return`, `nullable_type_declaration_for_default_null_value`. The first run raised 26 findings; every one was fixed by conforming the code, none by relaxing a rule. `PASS 26 files`. |
| `database/factories/UserFactory.php` | ✅ Annotated `@return array<model-property<User>, mixed>` — the generic Larastan actually accepts. `model property of` is Larastan's `describe()` output, not valid PHPDoc, and level 9 rejects it. This is the pattern every Phase 1 factory copies. |
| `tests/Unit/ExampleTest.php` | ✅ Rewritten. Asserts the running interpreter satisfies the PHP floor, and **reads that floor out of `composer.json`** rather than hardcoding it, so the manifest and the test cannot drift. CI's `PHP_VERSION` pin is transitively guarded by it. |
| `phpunit.xml` | ✅ Stock. Pins `APP_ENV=testing`, `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, array cache/session, `QUEUE_CONNECTION=sync`, `BCRYPT_ROUNDS=4`. This is why the CI backend job installs `pdo_sqlite` and needs no MySQL service container. |

**Present — the tenancy runtime (§7 item 29):** `app/Core/Tenancy/TenantContext.php`,
`app/Core/Tenancy/Concerns/BelongsToTenant.php`, the three tenancy exceptions,
`app/Core/Actions/Action.php`, the `CorrelationId` · `ResolveTenant` ·
`EnsureTenantActive` middleware, `app/Core/Http/Responses/ErrorResponse.php`, and
`routes/api_public.php` · `routes/api_platform.php` · `routes/api_tenant.php` wired
through `bootstrap/app.php`. Migrations are present too — the six Wave 1 platform
tables (§4.6), four Wave 2 org tables (§4.7), seven Wave 3 identity tables (§4.8),
seven Wave 4 infrastructure tables (§4.9), six Wave 5 master data A tables
plus the deferred FK closure (§4.10), five Wave 6 master data B tables (§4.11),
nine Wave 7 master data C files (§4.12, including the deferred FK closure),
four Wave 8 HR identity tables (§4.13), one Wave 9 HR FK closure,
eight Wave 10 production tables (§4.14),
six Wave 11 QC & wastage tables (§4.15),
three Wave 12 ledger & stock tables (§4.16),
six Wave 13 stock operations tables (§4.17),
ten Wave 14 purchasing tables (§4.18),
three Wave 16 payments & allocations tables (§4.20),
three Wave 17 POS tables (§4.21),
eight Wave 18 delivery & logistics tables (§4.22),
fourteen Wave 19 full HR & payroll tables (§4.23),
eight Wave 20 assets & maintenance tables (§4.24),
eleven Wave 21 finance & costing tables (§4.25),
and fourteen Wave 22 reporting & analytics tables (§4.26)
exist and are verified.

**Present — the Auth module and master-data models (§7 items 50–51):**
`app/Modules/Auth/Controllers/AuthController.php` and all 12 Auth Actions,
`app/Core/Auth/{JwtService, RefreshTokenService, PermissionCatalogue}` + the JWT/refresh
exception types, `app/Core/Http/Middleware/{AuthenticateJwt, AuthorizePermission}`, and
the 19 master-data Eloquent models over Waves 5–7. Auth routes **are** registered in
`routes/api_public.php` (login, refresh, select-tenant, logout, forgot/reset-password)
and `routes/api_tenant.php` (me, permissions, logout-all, switch-branch, preferences,
change-password); `routes/api_platform.php` is an empty group awaiting platform modules.

**Absent — the rest of the application:** `app/Support`, and every module's CRUD
controllers, actions, policies, form requests and API resources over the master-data
tables and all downstream modules (production, inventory, sales, delivery, HR, finance,
reporting, e-commerce). No tenant CRUD endpoints are registered yet — the next action is
§7 item 52, the master-data module pipeline.

### 4.5 Test coverage

128 frontend tests over 7 files; **496 backend tests / 2941 assertions**. Frontend
tests sit beside the code they cover (`vitest.config.ts`
`include: ['src/**/*.{test,spec}.{ts,tsx}']`); backend schema contracts live in
`tests/Feature/Database/` and the tenancy-runtime contract in
`tests/Feature/Tenancy/`.

`passWithNoTests` is deliberately **off**. An empty suite exiting 0 is a green
badge that proves nothing — the same failure mode `UI_SYSTEM.md` §8.5 rule 1
bans in the UI. If this repository ever has no tests, the gate should go red.

| Suite | Tests | What it pins down |
|---|---|---|
| `lib/api/errors.test.ts` | 16 | `normalizeError` over every input shape it can receive; the predicate set; that an unknown code still yields a usable `ApiError` rather than throwing inside the error path. |
| `lib/api/queryClient.test.ts` | 19 | The retry **policy** as policy: GETs stop at 3, mutations never retry, cancelled/session/offline/rate-limited codes are excluded, and backoff carries real jitter. These are the rules that stop a duplicate stock movement, so they are asserted directly rather than inferred from a green screen. |
| `lib/observability/logger.test.ts` | 26 | Ring-buffer eviction at 50, the localStorage mirror surviving a quota failure, `installGlobalErrorHandlers`, and the `useSyncExternalStore` contract (a stable snapshot identity — an unstable one causes an infinite render loop, not a visible bug). |
| `components/ErrorBoundary.test.tsx` | 10 | All four levels, that each **logs before** rendering its fallback, that stack traces appear only under `DEV`, and that reset actually re-mounts. Two real defects were caught here: a raw `\u2019` in a JSX text node, and `Go back` bypassing `handleReset`. |
| `components/patterns/StateView.test.tsx` | 20 | The registry resolves every mapped `ErrorCode` to the right row, and an unmapped code falls back to `INTERNAL_ERROR` instead of rendering nothing. |
| `components/patterns/QueryBoundary.test.tsx` | 24 | The full lifecycle including the parts that only exist in time: the 120 ms skeleton gate, the refetch rail over **stale data**, the 1 s dim gate, and silent handling of `REQUEST_CANCELLED`. |
| `components/ui/AsyncButton.test.tsx` | 13 | The state machine end to end, that the button is disabled while in flight, and that failure surfaces inline with `role="alert"` rather than disappearing. |
| `tests/Unit/ExampleTest.php` | 1 | The PHP floor, read out of `composer.json` so the manifest and the test cannot drift. |
| `tests/Feature/ExampleTest.php` | 1 | Stock smoke test — the application boots and `/` responds. Kept because a suite that cannot boot Laravel should fail before any schema assertion runs. |
| `tests/Feature/Database/Wave1PlatformSchemaTest.php` | 11 | Wave 1's uniqueness claims, asserted **behaviourally** by attempting the duplicate insert (§4.6). Its migration scanner iterates every file in `database/migrations`, so this suite's **assertion** count rises with every future wave (76 → 97 when Wave 3 landed, 97 → 118 when Wave 4 did) while its test count stays at 11. |
| `tests/Feature/Database/Wave2OrgSchemaTest.php` | 17 | Wave 2's tenant isolation as a *schema* promise: cross-tenant references refused by composite FKs, the default sentinels derived and read-only, the deferred FK still owed (§4.7). |
| `tests/Feature/Database/Wave3IdentitySchemaTest.php` | 20 | Wave 3's identity contract, where a schema defect is a privilege escalation rather than a reporting error: email unique per tenant and reusable across tenants, role slugs scoped, grants cascading, tokens pruning down their rotation chain — and one test that pins a **hole** rather than a guarantee (§4.8). |
| `tests/Feature/Database/Wave4InfraSchemaTest.php` | 27 | Wave 4's infrastructure contract, and the first wave whose decisions live in **omitted** columns: an audit row outliving its actor, one idempotency key legitimately reused across routes and users, the document-sequence sentinel, and a queued notification distinguishable from a failed one without a `status` column (§4.9). |
| `tests/Feature/Database/Wave5MasterDataASchemaTest.php` | 23 | Wave 5's Group C master data contract: all six catalogue tables, composite FK isolation for `unit_conversions` and `categories`, the self-referential category tree, DECIMAL precision for factors and rates, and the full `reason_codes` context vocabulary (§4.10). |
| `tests/Feature/Database/Wave6MasterDataBSchemaTest.php` | 28 | Wave 6's product catalogue contract: five tables, SKU and barcode uniqueness, composite FK isolation on every reference (base unit, category, brand, tax profile, variant→product, image→product/variant, BoM→product/unit, BoM item→BoM/input-product/unit), BoM versioning unique `(tenant_id, product_id, version)`, CASCADE on BoM items, RESTRICT on raw-material products, and DECIMAL(18,4)/DECIMAL(8,4) precision (§4.11). |
| `tests/Feature/Tenancy/TenancyRuntimeTest.php` | 3 | The tenancy runtime as a *behavioural* contract, not a schema one: layer-5 isolation between two bound tenants, `withoutTenantScope()` emitting its mandatory audit `Log::warning`, and `TenantContext::current()` throwing when nothing is bound (a queue job with no request context). The first assertion over live application code rather than migration metadata (§7 item 29). |

The per-suite table above pins down the Phase 0 frontend reliability layer, the
Wave 1–2 schema contracts and the tenancy runtime. Since then the suite has grown
to **496 backend tests / 2941 assertions**: the Wave 3–25 schema contracts, the
`tests/Feature/Auth/` pipeline (Login, AuthMe, RefreshToken, Logout, Preferences,
RbacMiddleware), the `tests/Unit/Auth/` unit tests (JwtService, PermissionCatalogue),
and `tests/Feature/Models/MasterDataModelTest.php` over the 19 master-data models.

What is **not** covered, and why: there is no per-module CRUD Action, controller or
endpoint over the master-data tables yet, and therefore no store or MSW handler for
them. Contract-level testing against `API_CONTRACT.md` for the master-data families
begins with the first real CRUD endpoint (§7 item 52), which builds on the
now-complete tenancy runtime (§7 item 29) and Auth pipeline (§7 item 50).

### 4.6 Migrations — Wave 1 (platform) complete

**Wave 0 required no work.** DATABASE_DESIGN §16 lists it as `users(stub)`,
`cache`, `jobs`, `sessions`, `personal_access_tokens`, `failed_jobs`; Laravel's
three default migrations already provide all of those except
`personal_access_tokens`, which is Sanctum's and is never created because
ADR-007 uses JWT plus `refresh_tokens` (Wave 3). §16.1 now records this as
rule 0, and item 25 in §7 was re-labelled — it previously said "wave 0 tenancy
migrations", which conflated two different waves.

Six migrations, `2026_08_23_1001xx` … `1006xx`, ordered so every FK target
already exists:

| Table | Notes |
|---|---|
| `plans` | Platform-owned, so **exempt from `tenant_id`** (§2). `code` is globally unique — §1.1 tenant scoping cannot apply to a table with no tenant. Soft-deletable master data. |
| `tenants` | Exempt from `tenant_id` because it *is* the tenant. `slug` globally unique: it resolves the subdomain **before** any tenant context exists. `locale`/`timezone`/`currency_code`/`date_format`/`number_format` are NOT NULL **with no default** — ADR-002 forbids a hardcoded currency, so provisioning must resolve each from the platform defaults and write it explicitly. |
| `tenant_subscriptions` | No `deleted_at` — billing history is closed by `status`, never hidden (§1). `amount` is snapshotted rather than read from `plans`, so a later price change cannot rewrite history. Tenant FK is `RESTRICT`. |
| `tenant_usage_counters` | `CASCADE` on tenant — a counter has no meaning without its tenant, the one case §1.3 permits it. `value` is `UNSIGNED BIGINT`, not the §1 `DECIMAL(18,4)` quantity type: these are discrete counts mutated by atomic increments and a fractional quota is meaningless. Deliberate reading of §1, flagged in the migration. |
| `settings` | Carries the NULL-uniqueness correction below. No `deleted_at` — a soft-deleted setting would poison the §13.3 resolution chain the first time a caller forgot `whereNull`. |
| `feature_flags` | Same correction. `description` is NOT NULL, because an undescribed flag is the one nobody dares delete. |

**Finding, raised and corrected in `DATABASE_DESIGN.md` §13.3.** The documented
unique keys `settings (tenant_id, scope, scope_id, group, key)` and
`feature_flags (tenant_id, key)` **cannot be implemented literally**. Both
`tenant_id` and `scope_id` are nullable, and on MySQL 8 and SQLite alike a
`NULL` never equals another `NULL` inside a UNIQUE index — so the platform
default row, which §13.3 makes the final fallback of the whole resolution
order, was the least protected row in the table. Uniqueness is enforced over
stored generated columns (`tenant_key`, `scope_key`) that fold `NULL` to `0`.
The database computes them so they cannot drift; application code never writes
them; queries and FKs still use `tenant_id`/`scope_id`.

`Wave1PlatformSchemaTest` — **11 tests**, 76 assertions at Wave 1 close and **97**
today. The count moved without the file being touched: one test scans every
migration in the directory for `->float(`, `->double(` and `->enum(`, so Wave 3's
seven files added exactly 21 assertions. That coupling is deliberate — §1's money
and enum rules are then enforced for every wave still to come — but it means the
total must always be **re-measured**, never carried forward. It proves every
uniqueness claim **behaviourally**, by attempting the duplicate insert and
requiring rejection. Asserting on index metadata instead would have passed
happily for a unique index that can never fire, which is precisely the defect
above. Two details worth keeping:

- `assertInsertRejected` matches the driver message, so a `NOT NULL` violation
  from a typo'd fixture cannot masquerade as an enforced constraint. It also
  keeps the test from being reported *risky* — an early `return` inside `catch`
  records zero assertions, and PHPUnit is right to distrust that.
- One test deliberately reproduces the NULL-uniqueness defect on a scratch
  table. It documents *why* the sentinel columns exist and will fail loudly if
  a future engine starts colliding NULLs, at which point the workaround can go.

Verified at Wave 1 close: `migrate:fresh` ✅ · `migrate:rollback --step=6` then
re-migrate ✅ (§16.1 rule 6, reversible on SQLite) · `pint --test` **PASS 33
files** · `phpstan` level 9 **[OK] No errors** · `artisan test` **13 passed (73
assertions)**. Those two counts are a snapshot of this wave, not of the
repository; §4.7 carries the current totals.

### 4.7 Migrations — Wave 2 (org) complete

Four migrations, `2026_08_23_1007xx` … `1010xx`, in the order
`companies → branches → factories → production_lines` so every FK target
already exists. Wave 2 is where tenant isolation stops being an application
convention and becomes a **schema** guarantee — ARCHITECTURE §3.1 layer 4 —
because these are the first tenant-scoped tables that reference each other.

| Table | Notes |
|---|---|
| `companies` | The first tenant-scoped table, so it sets two patterns every later wave copies. `unique (tenant_id, id)` is **not** redundant beside the PK: it is the *target* a child's composite FK needs, and without it a single-column `company_id` FK would only prove the row exists, not that it belongs to the caller's tenant. "At most one default per tenant" is a stored generated column `default_key = case when is_default = 1 then tenant_id else null end` under a unique index. |
| `branches` | `default_key` folds to **`company_id`**, not `tenant_id` — a tenant with three companies needs a default branch in each. `code` is unique per **tenant**, not per company, because a branch code appears on documents where the company is not shown. Composite FK `(tenant_id, company_id)` → `companies`, `RESTRICT`. |
| `factories` | Carries the `SET NULL` finding below. `branch_id` is genuinely optional (a factory need not sit under a sales branch) and is still `RESTRICT`. |
| `production_lines` | This table is why the legacy "one production line" assumption is dead: capacity, shift and status are per line, per factory. `code` is unique per **factory**, not per tenant. `capacity_unit_id` is a deferred forward reference — see below. |

**Finding 1, raised and corrected in `DATABASE_DESIGN.md` §1.3.** **No composite
foreign key led by `tenant_id` may use `ON DELETE SET NULL`.** `SET NULL` nulls
*every* column of the referencing key, and `tenant_id` is `NOT NULL`, so the
delete fails with `NOT NULL constraint failed: factories.tenant_id` — a
confusing error at an unrelated call site instead of either a clean detach or a
clean rejection. `migrate:fresh` accepted `nullOnDelete()` happily and the DDL
read correctly; only exercising the delete exposed it. Fixed to
`restrictOnDelete()` and promoted to a general prohibition in §1.3.

**Finding 2, raised and corrected in `DATABASE_DESIGN.md` §16.1 rule 2.**
`production_lines.capacity_unit_id` targets `units`, which is Wave 5. Rule 2's
closure waves (9 and 25) cover *circular* pairs; a plain forward reference had
nowhere to be recorded and would simply have been forgotten. §16.1 now carries a
deferred-forward-reference table, the index is pre-created so Wave 5 needs no
`ALTER` (§16.1 rule 5), and a test fails the moment `units` appears.

**A note on the Wave 1 NULL behaviour becoming useful.** Wave 1's finding was
that a nullable column inside a UNIQUE index cannot protect the row where it is
NULL. Wave 2 uses exactly that behaviour on purpose: `unique (tenant_id,
is_default)` *cannot* express "one default per tenant" — it would also forbid a
second non-default — whereas folding the key to NULL unless `is_default = 1`
does. The two findings are the same engine rule read in both directions.

`Wave2OrgSchemaTest` — **17 tests / 60 assertions**, extending the new
`SchemaTestCase` base that also now hosts Wave 1's fixtures. Three details worth
keeping:

- `assertDeleteRejectedByForeignKey` **distinguishes the two failure modes**.
  Both `RESTRICT` and a broken `SET NULL` refuse the delete, so a test that only
  asserted "it threw" would pass on the defective schema; the helper rejects a
  `NOT NULL` message and points at §1.3.
- The guard was **seen red before being trusted**. The migration was temporarily
  reverted to `nullOnDelete()` and the test re-run; it failed with exactly the
  intended diagnosis, then the fix was restored. A test that has never failed is
  an unproven test.
- One test proves `default_key` is **read-only**: an `UPDATE` writing it throws,
  which is what stops a future Action from maintaining the sentinel by hand and
  letting it drift from `is_default`.

Fixtures live in `SchemaTestCase` rather than in each wave's test so that a
later wave inserts its parents exactly the way the wave that owns them proved
they must be inserted. `columnValue()` narrows `DB::table()->value()` once —
`mixed` cannot be cast at PHPStan level 9, and narrowing in one typed helper
beats an `assert()` at every call site.

Verified: `migrate:fresh` (13 migrations) ✅ · `migrate:rollback --step=4` then
re-migrate ✅ · `composer check` green end to end — `pint --test` **PASS 39
files** · `phpstan` level 9 **[OK] No errors** · `artisan test` **30 passed (145
assertions)**, none risky.

**Still open against Wave 2:** no Eloquent models, no `BelongsToTenant`, and
therefore no enforcement layers 1–3 (§7 item 29). The schema refuses
cross-tenant *references*; nothing yet refuses a cross-tenant *read*.

### 4.8 Migrations — Wave 3 (identity) complete

Seven migrations, `2026_08_23_1011xx` … `1017xx`. Wave 3 is where a schema
defect stops being a reporting error and becomes a **privilege escalation**, so
every claim below was exercised rather than read off the DDL.

| Table | Notes |
|---|---|
| `users` (finalised) | The **only** table §16.1 rule 1 permits to be created in two steps, because Wave 0's framework stub must exist before anything can authenticate. Adds `uuid`, nullable `tenant_id` (`RESTRICT`), `phone`, `status` (NOT NULL, **no default** — provisioning states it), `locale`, `perm_version` and `token_version` (both default 1), `last_login_at`/`last_login_ip`, the 2FA columns, actor columns and `deleted_at`. |
| `permissions` | Global catalogue with **no `tenant_id`** (§3, ADR-008) — a tenant-scoped catalogue would let two tenants disagree about what `production.batch.approve` means. `name` globally unique; the three segments are stored **both** joined and split, which is intentional duplication: the join is the wire format, the split is what a filtered admin screen indexes. No soft delete, no actor columns — the seeder is the only writer (§17.1). |
| `roles` | `tenant_id NULL` marks a platform **template**, not a platform actor. `level` is documented in the migration as *display ordering only, never a privilege ranking* — a numeric rank invites `level >= 80` checks that bypass the permission catalogue. |
| `role_permission` | Composite primary key on the pair alone, per §3 — no `id`, no `uuid`. `CASCADE` both ways: a grant has no meaning without either side. The migration records why adding `tenant_id` here **would create** a cross-tenant hazard rather than close one. |
| `role_user` | Carries the wave's central finding, below. `unique (role_id, user_id)` per §3, plus composite FKs `(tenant_id, role_id)` → `roles` `RESTRICT` and `(tenant_id, user_id)` → `users` `CASCADE`. |
| `user_scopes` | `tenant_id` is **NOT NULL** here deliberately, which is the finding's rule 1 applied: this table *grants* visibility, so it may not have a row on which its composite key silently stops being checked. `scope_id` is polymorphic across five scope types and therefore carries no FK. **No rows = whole-tenant access**, subject to permissions (§3). |
| `refresh_tokens` | `token_hash` is unique across the **whole platform**, not per tenant — a presented token is looked up before any tenant context exists (ADR-007). No soft delete: a revoked token is closed by `revoked_at`, and a soft-deleted one would vanish from the reuse-detection query that makes rotation safe. |

**Finding 1 — §16.1 rule 1 is only safe because rule 3 exists.** The second step
adds `NOT NULL` columns with no default, which SQLite rejects outright on a
**populated** table (`Cannot add a NOT NULL column with default value NULL`).
It succeeds only because rule 3 forbids migrations from writing data, so `users`
is guaranteed empty when the step runs. Recorded in the migration as a bounded
reading: this is not a general licence to backfill a live table.

**Finding 2 — the sentinels here are `VIRTUAL`, not `STORED`.** Wave 1 used
`STORED` inside `CREATE TABLE`; an `ALTER TABLE ... ADD COLUMN ... STORED` is
rejected by SQLite (`cannot add a STORED column`). `VIRTUAL` is accepted, is
indexable, recomputes for pre-existing rows and is equally read-only, so
`tenant_key = coalesce(tenant_id, 0)` and `is_platform_user = tenant_id is null`
are virtual. Both facts were **measured** — an earlier probe reported both forms
accepted, because it ran against an empty table.

**Finding 3, and the reconciliation §7 item 27 asked for.** The documented
`users.email` unique key **cannot enforce itself**: `tenant_id` is nullable for
platform users, and `NULL != NULL` inside a UNIQUE index, so
`unique (tenant_id, email)` would leave every platform account free to duplicate
— the one account type whose duplication matters most. The key is therefore on
`(tenant_key, email)`. Same rule as Wave 1's `settings`, same fix, now generalised
into `DATABASE_DESIGN.md` §1.1.

**Finding 4, the wave's substantive one — `role_user` has a hole with no schema
fix.** **A composite foreign key is not checked at all when any of its columns is
`NULL`** (MATCH SIMPLE, the only mode MySQL 8 and SQLite implement). On a
`NULL`-tenant `role_user` row neither composite key fires, so the database will
accept a **platform** role grant pointing at an ordinary tenant user — exactly the
escalation the composite keys were added to prevent. It also means `RESTRICT`
does not protect a platform role template from deletion. No schema fix exists:
a `CHECK` spanning three tables is inexpressible, SQLite cannot add a trigger via
`ALTER`, and MySQL 8 **rejects foreign keys on virtual generated columns**, so the
sentinel trick that solves uniqueness does not transfer. `DATABASE_DESIGN.md`
§1.3 now carries three rules in response: prefer `tenant_id NOT NULL` on any
table that *grants* something; where nullability is forced, the Action asserts
both sides are platform inside the transaction — the one documented case where
the database is not the last line of defence; and the gap is **pinned by a test**.

**Finding 5 — `refresh_tokens.replaced_by_id` cascades the opposite way from its
name.** Deleting a *newer* token deletes the older rows that point at it, which is
what the nightly purge of an expired rotation chain needs. Switching it to
`RESTRICT` would make that purge fail depending on the row order the driver
happens to produce. Pinned by its own test, with that diagnosis in the failure
message.

`Wave3IdentitySchemaTest` — **20 tests / 55 assertions**. Three of them are
flagged in the class docblock as tests that must not be casually "fixed":

- `test_two_platform_users_cannot_share_an_email` — asserts the documented key
  cannot enforce itself, which is why the sentinel exists.
- `test_a_platform_role_assignment_is_not_checked_by_the_database` — **asserts a
  hole, not a guarantee.** If it ever fails, the database has started enforcing
  something it documents as unenforced, and the test should be *replaced* by one
  asserting the rejection rather than deleted.
- `test_pruning_a_rotation_chain_takes_its_ancestors` — pins a delete rule that
  points the opposite way from the column name.

One further test explains the wave's single-column reference to `users`:
`created_by` is deliberately **not** tenant-scoped, because a platform admin has
no tenant, so a composite key would be unenforced on exactly the rows where
knowing the actor matters most and would reject a support action outright the
rest of the time. `created_by` records *who acted*; it grants nothing. The test
still proves it is a real key by rejecting a non-existent user id.

Fixtures for all seven tables live in `SchemaTestCase` alongside Waves 1–2, so
Wave 4 inserts an identity parent the way this wave proved it must be inserted.
`permissionAttributes()` splits a `module.resource.action` name into its columns
and **fails the test** on a malformed name rather than padding with defaults —
PHPStan flagged the `?? 'view'` fallbacks as dead code, and they were worse than
dead: they would have silently manufactured a row whose `name` disagreed with its
split columns, the exact defect the helper exists to prevent.

Verified: `migrate:fresh` (20 migrations) ✅ · `migrate:rollback --step=7` then
re-migrate ✅ — and for the two-step table, reversibility means the Wave 0 stub is
restored *exactly*, so it was probed: 8 columns with none of the 16 additions
surviving, `users_email_unique` the only index, and that key actually rejecting a
duplicate. The generated columns must be dropped **before** `tenant_id`, since a
generated column cannot outlive the column its expression reads. `composer check`
green end to end — `pint --test` **PASS 47 files** · `phpstan` level 9 **[OK] No
errors** · `artisan test` **50 passed (221 assertions)**, none risky.

**Still open against Wave 3:** no `User` model, no JWT, no `token_version`
consumer. `perm_version` and `token_version` are columns nothing reads yet — they
become meaningful with §7 item 29.

---

### 4.9 Migrations — Wave 4 (infrastructure) complete

Seven migrations, `2026_08_23_1018xx` … `1023xx`. Wave 4 is the first wave whose
design decisions live in **omitted** columns rather than in keys, so four of its
tests assert that a missing value is *refused* rather than defaulted.

| Table | Notes |
|---|---|
| `audit_logs` | **Append-only** (ADR-027): `timestamps()` is deliberately not called, `created_at` is NOT NULL with **no default**, and there is no `updated_at` and no `deleted_at`. Both FKs are `RESTRICT`, overruling §1.3's CASCADE-for-children guidance, because an audit row is the one row that must outlive its subject. `tenant_id` nullable for platform actions, `user_id` nullable for queue/system actions. Three indexes per §3. |
| `idempotency_keys` | Carries the wave's **rank-4 escalation**, below. Unique `uq_idempotency_keys_scope` on `(tenant_id, user_id, endpoint, key)`. `user_id` is **NOT NULL** — this row de-duplicates one actor's intent, so it may not exist without one. No `uuid`: the client-supplied `key` already is the external identifier. |
| `attachments` | The wave's only soft delete, and it means something different from usual: `deleted_at` here is *"unlinked, file pending removal"*, not *"hidden from the UI"*, because the blob outlives the row. `checksum` is indexed, **not unique** — two parties may legitimately attach the same file. Polymorphic pair indexed `(tenant_id, attachable_type, attachable_id)` per §1.2. |
| `notifications` | Every notification is a **persisted row, not a transient toast** (ADR-019). There is deliberately **no `status` column**: state is derived from three nullable outcome timestamps (`sent_at`, `read_at`, `failed_at`), so queued/sent/read/failed cannot drift out of sync with the facts. `title_key`/`body_key` + `params` per ADR-018. `severity` is restricted to UI_SYSTEM §5's four status colours — a fifth would have nothing to render in. |
| `notification_preferences` | `tenant_id` **NOT NULL**, which is Wave 3 finding 4's rule applied in the other direction: this table *suppresses* delivery, so a row on which the composite key silently stops being checked could mute another tenant's user. |
| `document_sequences` | Q3 is still open, so the schema **does not pre-empt it**: `company_id` and `branch_id` are both nullable and all three scope shapes insert. That makes the §3 key unenforceable, hence the wave's second sentinel finding, below. Both composite FKs `RESTRICT`. |
| `activity_snapshots` | The deliberate counterpoint to `audit_logs` in the same wave — a **cache** in §18's sense, recomputable, upserted onto `(tenant_id, snapshot_date)`, and therefore the one Wave 4 table that carries `updated_at`. Counts are NOT NULL with **no default** so an unmeasured metric fails loudly. No actor columns: the only writer is a scheduled job, and two forever-NULL columns imply an actor that does not exist. |

**Finding 1 — the `idempotency_keys` key is a precedence-rank-4 tie, resolved
against §3.** DATABASE_DESIGN §3 specified unique `(tenant_id, key)`;
API_CONTRACT §6.2 specifies scope `(tenant_id, user_id, route, key)`. Both are
rank 4, so per `README.md` §2 the contradiction is a **rank-1 problem**. It is
resolved in favour of §6.2 because the narrow key is not merely stricter, it is
**unsafe**: two users of one tenant who generate the same UUID would share a row,
and §6.3's replay rule would then hand one user's stored response body to the
other. Landed as a dated correction in `DATABASE_DESIGN.md` §3 and pinned by
`test_one_idempotency_key_may_be_reused_across_routes_and_users`, whose failure
message names the data-exposure path so the key cannot be quietly narrowed back
as a "simplification".

**Finding 2 — `document_sequences` needed the §1.1 sentinel, and the consequence
here is duplicate document numbers.** The documented key over `company_id` and
`branch_id` cannot fire: both are nullable, and the tenant-wide series that Q3
leaves on the table *is* the `(NULL, NULL)` row. A tenant could hold unlimited
tenant-wide series for one `document_type`, and §1.4's `FOR UPDATE` lock would be
taken on an arbitrary one of them — the first Wave-4 defect whose blast radius is
posted financial documents rather than a report. Fixed with `STORED`
`company_key`/`branch_key` = `coalesce(col, 0)`; the semantic columns stay
nullable and keep the FKs, which the sentinels cannot carry (§1.1). Third
occurrence of the same root cause after Wave 1's `settings` and Wave 3's
`users.email`.

**Finding 3 — two Wave 4 tables are NOT NULL on `tenant_id` specifically because
of Wave 3's unenforced-composite-FK hole.** A NULL-tenant row makes its composite
key unchecked, which is harmless on `audit_logs` and `notifications` (they grant
nothing) but not on a row that *grants or suppresses* something. Hence
`notification_preferences.tenant_id` and `idempotency_keys.user_id` are NOT NULL.
This is `DATABASE_DESIGN.md` §1.3's first rule being applied as a design input
rather than discovered as a defect — the wave where the amendment paid for itself.

**Finding 4 — `snapshot_date` is a tenant-local day, and that has a reporting
consequence worth stating once.** A UTC-bucketed day would split one tenant's
trading day across two rows and make a plan limit enforceable at the wrong
boundary. The cost is that rows sharing a `snapshot_date` across tenants do not
describe the same wall-clock interval, so a platform-wide cross-tenant sum for a
single date is an **approximation and must be labelled as one**. Recorded in
`DATABASE_DESIGN.md` §13.3 so it is not rediscovered inside a report.

`Wave4InfraSchemaTest` — **27 tests / 74 assertions**. Four are flagged in the
class docblock as tests that pin a decision rather than a mechanism:

- `test_an_audit_row_survives_the_deletion_of_its_actor` — §1.3 overruled by
  ADR-027, and the product constraint that follows: a user who has done anything
  can never be hard-deleted.
- `test_one_idempotency_key_may_be_reused_across_routes_and_users` — inserts four
  rows sharing one `key` and expects all four to persist.
- `test_a_tenant_cannot_hold_two_series_for_one_document_type` — the sentinel,
  with duplicate document numbers named as the consequence.
- `test_a_queued_notification_is_distinguishable_from_a_failed_one` — pins the
  **absence** of a `status` column as a decision, not an omission.

`SchemaTestCase` gained six Wave 4 fixture builders and a third constraint mode,
`notnull`, alongside `unique` and `foreign` — required because this is the first
wave that asserts refusals of missing values. `constraintPattern` became a
`match`. `documentSequenceAttributes()` never writes the generated columns, and
`auditLogAttributes()` supplies `created_at` explicitly because the table has no
database default.

Verified: `migrate:fresh` — all **27 migrations** green ✅ · `migrate:rollback
--step=7` then re-migrate ✅ (§16.1 rule 6). `composer check` green end to end —
`pint --test` **PASS 55 files** · `phpstan` level 9 (`--memory-limit=1G`) **[OK]
No errors** · `artisan test` **77 passed (316 assertions)**, none risky. Per-suite
measured, not inferred: Wave 1 **11/118**, Wave 2 **17/60**, Wave 3 **20/55**,
Wave 4 **27/74**. Wave 1 moved 97 → 118 assertions in a file nobody edited — its
migration scanner asserts 3 tokens per file, and Wave 4 added 7 files.

**Still open against Wave 4:** every table here is schema only. No `AuditLog`
model, no audit-writing trait, no `Idempotency-Key` middleware, no notification
driver, no `document_sequences` allocator — and the allocator stays blocked on
**Q3** (§6), which must be answered in `DECISIONS.md` before Phase 5, never in a
migration.

---

### 4.10 Migrations — Wave 5 (master data A) complete

Seven migrations closing this wave:
`2026_08_23_102500` … `102900` (the six catalogue tables) plus `103100` (deferred
FK closure on `production_lines.capacity_unit_id`).

| Table / Migration | Notes |
|---|---|
| `units` | Tenant-scoped unit catalogue: `type` (weight \| volume \| length \| piece \| time), `code`, `is_base`. Unique `(tenant_id, code)`. Carries `unique (tenant_id, id)` so child tables can declare composite FKs. Soft-deletable master data. Adding `units` also closes the forward reference from `production_lines.capacity_unit_id` (Wave 2 finding 2). |
| `unit_conversions` | Ordered pair `(tenant_id, from_unit_id, to_unit_id)` with composite FKs on both sides. Factor is `DECIMAL(18,8)` — eight decimal places for compound conversions that lose precision at fewer. No soft-delete (a conversion is changed by inserting a correcting row, not by editing). Unique `(tenant_id, from_unit_id, to_unit_id)`. |
| `categories` | Self-referential tree: composite FK `(tenant_id, parent_id) → categories(tenant_id, id)`. `parent_id = NULL` is a root (MATCH SIMPLE does not check a NULL FK column, which is the correct semantics). Code unique per tenant. |
| `brands` | Simple tenant-scoped catalogue. Code unique per tenant. Soft-deletable master data. |
| `tax_profiles` | Rate `DECIMAL(8,4)`, type `VARCHAR(32)` (not ENUM). Both `inclusive` and `exclusive` must insert so Q2's answer is not pre-empted — verified by a test. Code unique per tenant. Soft-deletable master data. |
| `reason_codes` | Context-partitioned catalogue (`qc_defect` \| `wastage` \| `stock_adjustment` \| `sales_return` \| `purchase_return` \| `cancellation` \| `rework`). Unique `(tenant_id, context, code)` — two contexts in the same tenant may share a code string; two reason codes in the same context may not. `requires_note` tells the Action whether to demand a free-text field. `sort_order UNSIGNED SMALLINT`. Soft-deletable master data. |
| `103100` (FK closure) | `ADD FOREIGN KEY fk_production_lines_tenant_capacity_unit` referencing `units(tenant_id, id)`, `RESTRICT`. No column is altered — the index `ix_production_lines_tenant_capacity_unit` was pre-created in Wave 2 (§16.1 rule 5). The Wave 2 test `test_the_deferred_capacity_unit_foreign_key_is_still_owed` is replaced in `Wave2OrgSchemaTest` by `test_a_production_line_capacity_unit_cannot_reference_a_unit_in_another_tenant`, which proves the FK is active by inserting a cross-tenant unit and requiring rejection. |

**No new findings requiring a doc correction in this wave.** The schema as
documented in `DATABASE_DESIGN.md` §4 Group C was implementable without
amendment. `reason_codes` was initially misclassified as a leaf table in the test
(omitting `softDeletes()`) — corrected before the suite was green.

`Wave5MasterDataASchemaTest` — **23 tests** covering: table existence, structural
`tenant_id` placement and soft-delete presence, no float/double/enum, uniqueness
enforcement for all six catalogues, composite FK isolation for `unit_conversions`
and `categories`, the self-referential category tree, the cascade refuse-on-child
delete for `categories` and `units`, DECIMAL precision for conversion factors and
tax rates, and the full context vocabulary for `reason_codes`. The deferred FK
closure test lives in `Wave2OrgSchemaTest` (replacing the placeholder) rather
than here, so it sits beside the original obligation.

`SchemaTestCase` gained six fixture builder pairs (insert + attributes for units,
unit_conversions, categories, brands, tax_profiles, reason_codes).

Verified: `migrate:fresh` — all **34 migrations** green ✅ · `pint lint:fix` **PASS**
(binary operator spacing, one unused import, class attribute separation fixed)
· `phpstan` level 9 (`--memory-limit=1G`) **[OK] No errors** · `artisan test`
**103 passed / 456 assertions**, none risky. Per-suite measured:
Wave 1 **11 tests** (assertion count now reflects 34 migration files × 3 tokens =
102 assertions from the scanner alone — **re-measure before quoting**), Wave 2 **17**,
Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Tenancy runtime **3**, Unit+Example **2**.

---

### 4.11 Migrations — Wave 6 (master data B) complete

Five migrations closing this wave:
`2026_08_23_103200` … `103600` — the product catalogue and bill-of-materials
tables.

| Table / Migration | Notes |
|---|---|
| `products` | The central catalogue referenced by every downstream wave (ADR-016). SKU unique `(tenant_id, sku)`. Barcode nullable-unique `(tenant_id, barcode)` — two products without a barcode are not duplicates (NULL ≠ NULL). Carries `has_variants`, `is_produced`, `is_purchased` flags. Composite FKs on `base_unit_id`, `purchase_unit_id`, `sales_unit_id` → `units`; `category_id` → `categories`; `brand_id` → `brands`; `tax_profile_id` → `tax_profiles` — all `RESTRICT`. `standard_cost` / `default_sale_price` are `DECIMAL(18,4)`. Soft-deletable master data. |
| `product_variants` | Child table of `products` for SKU-level size/colour/weight differentiation. SKU unique per tenant `(tenant_id, sku)`. `price_delta DECIMAL(18,4)` (may be negative). Composite FK `(tenant_id, product_id) → products`. Soft-deletable. |
| `product_images` | Leaf table — images have no independent lifecycle so **no `deleted_at`**. Optional `variant_id` with composite FK `(tenant_id, variant_id) → product_variants`. Composite FK `(tenant_id, product_id) → products`. `RESTRICT` on both. |
| `bill_of_materials` | Versioned recipe: unique `(tenant_id, product_id, version)` — two BoMs for the same product must use different version strings; two products in the same tenant may each have a version `'1'`. `expected_yield_percentage DECIMAL(8,4)`. No `deleted_at` — lifecycle is managed by `effective_from` / `effective_to` date-range columns plus a `status` column. Composite FK `(tenant_id, product_id)` → `products` and `(tenant_id, output_unit_id)` → `units`. |
| `bill_of_material_items` | Line-table for BoM ingredient lines. **`CASCADE` on `bill_of_material_id`** — items have no independent meaning and are orphaned the moment their recipe is deleted (the one case `DATABASE_DESIGN.md` §1.3 permits CASCADE). `RESTRICT` on `input_product_id` — a raw-material product that is referenced by any BoM line cannot be deleted. `wastage_allowance_percentage DECIMAL(8,4)`. No `deleted_at`. |

**No new doc corrections in this wave.** The documented schema was implementable
without amendment.

**Two test-infrastructure defects corrected before any test passed.** (a) The
initial Wave 6 test called `insertTenant($planArray, ...)` rather than
`insertTenant($planArray['id'], ...)` — `insertPlan()` returns `array{id, uuid}`,
not a bare `int`. The correct pattern, established in Wave 5, is
`$plan = $this->insertPlan(); $t = $this->insertTenant($plan['id'], 'slug')`. (b)
Three DECIMAL assertions used string equality (`'87.5000'` vs `'87.5'`) — SQLite
strips trailing zeros from DECIMAL columns on read. The canonical fix, also from
Wave 5's `assertSame(5.5, (float) $rate)` pattern, is to cast to `float` before
asserting. The cast still proves precision was not lost: `87.5000` and `87.5`
are identical as floats, but `87.4999` is not, so a rounding defect still fails.

`Wave6MasterDataBSchemaTest` — **28 tests / 64 assertions** covering: all five
tables exist, structural `tenant_id` placement, soft-delete presence per documented
rule (products + variants yes, images + BoM + items no), no float/double/enum, SKU
uniqueness and barcode nullable-uniqueness, composite FK isolation on every
foreignid in every table (ten cross-tenant rejection tests), BoM versioning unique
constraint, BoM item CASCADE on parent-BoM delete, RESTRICT on raw-material
product delete, and DECIMAL precision for cost, price, yield, wastage and
price-delta columns.

`SchemaTestCase` gained five fixture builder pairs: `insertProduct` /
`productAttributes`, `insertProductVariant` / `productVariantAttributes`,
`insertProductImage` / `productImageAttributes`, `insertBillOfMaterials` /
`billOfMaterialsAttributes`, `insertBillOfMaterialItem` /
`billOfMaterialItemAttributes`.

Verified: `migrate:fresh` — all **39 migrations** green ✅ · `pint lint:fix` **PASS**
(binary operator spacing in `SchemaTestCase` and `Wave6MasterDataBSchemaTest`)
· `phpstan analyse` level 9 (`--memory-limit=1G`) **[OK] No errors** · `artisan test`
**131 passed / 535 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests**, Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Tenancy runtime **3**, Unit+Example **2**.

---

### 4.12 Migrations — Wave 7 (master data C) complete

Nine migrations closing this wave:
`2026_08_24_103700` … `104500` — warehouses, locations, parties, contacts, addresses,
price lists, price list items, discount rules, and a deferred FK closure.

| Table / Migration | Notes |
|---|---|
| `warehouses` | Physical storage locations for a tenant. Optional scoping to `company_id`, `branch_id`, `factory_id` via nullable composite FKs — `NULL` = tenant-wide warehouse (MATCH SIMPLE skips the check). Unique `(tenant_id, code)`. `type` VARCHAR(32): `raw_material \| finished_goods \| packaging \| quarantine \| scrap \| transit \| general`. Composite FKs on all three scope columns → RESTRICT. Supporting unique `(tenant_id, id)` enables child composite FKs from `warehouse_locations`, future `stock_balances`, etc. Soft-deletable. |
| `warehouse_locations` | Named positions within a warehouse (zones, racks, bins). Tree structure via nullable `(tenant_id, parent_id) → warehouse_locations(tenant_id, id)` RESTRICT self-referential FK. Unique `(tenant_id, warehouse_id, code)`. Composite FK `(tenant_id, warehouse_id) → warehouses` RESTRICT. No soft delete — lifecycle managed by `is_active`. |
| `parties` | Unified external-actor table covering suppliers, customers, dealers, and agents simultaneously via independent role flags (`is_supplier`, `is_customer`, `is_dealer`, `is_agent`). Unique `(tenant_id, code)`. `credit_limit DECIMAL(18,4)`. Composite FK on `tax_profile_id` → `tax_profiles` RESTRICT. FK on `price_list_id` **deferred** to `104500` (price_lists created at `104200`, after this table). Soft-deletable. |
| `party_addresses` | Structured address rows for courier API integration (Phase 6). Fields: `line1`, `line2`, `area`, `city`, `district`, `postal_code`, `country_code`. Geo columns: `latitude / longitude DECIMAL(10,7)` (~1 cm precision). Composite FK `(tenant_id, party_id) → parties` **CASCADE** — addresses have no independent lifecycle. No soft delete. |
| `party_contacts` | Individual contact persons for a party. Composite FK `(tenant_id, party_id) → parties` **CASCADE**. No soft delete. |
| `price_lists` | Named price schedules with `applies_to VARCHAR(32)` (`all \| customer_group \| channel`), optional effective date window, and a `priority` tie-breaker. Unique `(tenant_id, code)`. Supporting `unique (tenant_id, id)` for child composite FKs. Soft-deletable. |
| `price_list_items` | Quantity-break pricing rows keyed by `(tenant_id, price_list_id, product_id, variant_id, min_quantity)`. `variant_id` nullable — base-product and variant-specific rows coexist (NULL ≠ NULL). **Known hole**: when `variant_id IS NULL` the unique key cannot prevent duplicate base-product rows; application layer must guard. Composite FKs on `price_list_id` → `price_lists`, `product_id` → `products`, and nullable `variant_id` → `product_variants` (MATCH SIMPLE). All RESTRICT. No soft delete. |
| `discount_rules` | Tenant-configurable discount engine rules. Polymorphic `scope_id` (product/category/party/NULL) — no DB FK possible, application layer enforces. `condition JSON` evaluated by engine. `value DECIMAL(18,4)` covers both percentage and fixed-amount cases. Soft-deletable. |
| `104500` deferred FK closure | Adds `(tenant_id, price_list_id) → price_lists(tenant_id, id)` RESTRICT to `parties` after `price_lists` exists. Same pattern as Wave 5's `103100` closure. |

**One doc amendment logged.** `parties.price_list_id` creates a circular dependency
within Wave 7: `parties` (103900) references `price_lists` (104200). This is
not a circular pair (as in DATABASE_DESIGN §16.1 rule 2's Waves 9 / 25 examples) —
it is a plain forward reference within the same wave. The resolution is the same:
deferred closure migration `104500`.

**One schema NULL behaviour hole documented.** The `price_list_items` unique key
`(tenant_id, price_list_id, product_id, variant_id, min_quantity)` cannot prevent
duplicate base-product rows when `variant_id IS NULL` because `NULL ≠ NULL`.
Two tests pin this: one proves the key fires for non-NULL `variant_id`; the other
proves (and names) the NULL hole so a later reader cannot mistake the key for
protection it does not provide. Documented the same way as Wave 3's platform-role
grant hole.

`Wave7MasterDataCSchemaTest` — **30 tests** covering: all 8 tables exist,
`tenant_id` structural placement, soft-delete presence per table class (master data
vs. child), no float/double/enum, warehouse code uniqueness, cross-tenant composite
FK rejection for warehouse scope columns, location tree self-referential RESTRICT,
party code uniqueness, cross-tenant tax_profile and price_list FK rejection
(including the deferred 104500 closure), CASCADE on party deletion for addresses
and contacts, price list code uniqueness, price_list_item unique key (non-NULL
variant fires; NULL-variant hole documented), cross-tenant price_list_id and
product_id rejection in items, DECIMAL(18,4) precision for credit_limit,
unit_price, discount_percentage and discount_rule value, and the deferred FK
CASCADE-refuse test (deleting a price_list referenced by a party is blocked).

`SchemaTestCase` gained eight fixture builder pairs: `insertWarehouse` /
`warehouseAttributes`, `insertWarehouseLocation` / `warehouseLocationAttributes`,
`insertParty` / `partyAttributes`, `insertPartyAddress` / `partyAddressAttributes`,
`insertPartyContact` / `partyContactAttributes`, `insertPriceList` /
`priceListAttributes`, `insertPriceListItem` / `priceListItemAttributes`,
`insertDiscountRule` / `discountRuleAttributes`.

Verified: `migrate:fresh` — all **48 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**166 passed / 745 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests**, Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.13 Migrations — Wave 8 (HR identity) + Wave 9 (HR FK closure) complete

Four Wave 8 migrations + one Wave 9 closure:
`2026_08_24_104600` … `104750` — departments, designations, shifts, employees.
`2026_08_24_104900` — Wave 9 deferred FK closure for three circular HR references.

| Table / Migration | Notes |
|---|---|
| `departments` | Organizational cost-centre units scoped to a company. Self-referential tree via `(tenant_id, parent_id) → departments(tenant_id, id)` RESTRICT (same NULL-root MATCH SIMPLE pattern as `categories` and `warehouse_locations`). Unique `(tenant_id, company_id, code)` — same code can exist in different companies. `head_employee_id` column created here; FK deferred to Wave 9 (circular: departments references employees which references departments). Soft-deletable. |
| `designations` | Tenant-wide job-title catalogue (e.g. "Senior Production Operator"). `grade` is VARCHAR(32), not ENUM — grade schemes vary per tenant. Unique `(tenant_id, code)`. Soft-deletable. |
| `shifts` | Named work schedules with TIME columns (not DATETIME). `crosses_midnight TINYINT` is a DATABASE_DESIGN invariant — when 1, `end_time < start_time` and the attendance engine attributes the shift to the **start** date; comparing raw times without this flag is a documented defect. Duration columns are SMALLINT(minutes). Unique `(tenant_id, code)`. Soft-deletable. |
| `employees` | The workforce record; distinct from `users` (the login record) by design (DECISIONS C18). `user_id` nullable and unique-when-set — not every employee logs in. Inline composite FKs on company/branch/factory/production_line/department/designation (all RESTRICT). Three FKs deferred to Wave 9: `reports_to_employee_id` (self-referential), `default_shift_id`, and `salary_structure_id` (Wave 19 table — added in Wave 25 closure). `employment_type` VARCHAR(32): `permanent \| contract \| daily_wage \| piece_rate \| probation`. DATABASE_DESIGN invariant: `piece_rate` makes a `worker_production_entries` row payable per unit. Soft-deletable. |
| Wave 9 FK closure (104900) | Adds three deferred FK constraints: (1) `departments.head_employee_id → employees(tenant_id, id)` RESTRICT; (2) `employees.reports_to_employee_id → employees(tenant_id, id)` RESTRICT (self-referential); (3) `employees.default_shift_id → shifts(tenant_id, id)` RESTRICT. `salary_structure_id → salary_structures` is NOT added here — `salary_structures` is Wave 19; that FK is added by Wave 25. |

**Three test-infrastructure defects corrected before green:**
(a) `insertCompany` fixture was called with a `code` override that does not exist
as a column on `companies` (unique by `(tenant_id, name)` not code). Fixed to pass
unique `name` overrides instead.
(b) Raw DB insert into `users` was missing `uuid` (NOT NULL). Added.
(c) Raw DB insert into `users` was missing `status` (NOT NULL, no default). Added
`'status' => 'active'`. Three successive runs, three distinct failure messages —
each corrected before re-declaring the suite green.

**Unique-key NULL hole documented (employees.user_id):** the `unique(tenant_id, user_id)`
key cannot prevent multiple `NULL` user_id rows because `NULL ≠ NULL`. Two tests
pin this: one proves the key fires when `user_id` is set; the other proves multiple
null-user_id employees are permitted (floor workers with no login account).

`Wave8HrIdentitySchemaTest` — **26 tests** covering: all 4 tables exist,
`tenant_id` placement, soft-delete on all 4 (all are master data), no float/double/enum,
department code uniqueness within a company (and allowed across companies), department
self-referential RESTRICT, cross-tenant company FK rejection, designation code
uniqueness, shift code uniqueness, `crosses_midnight` stores correctly, employee
code uniqueness, cross-tenant company/department/designation FK rejection, Wave 9
closure: head_employee_id cross-tenant rejection and delete-blocked-when-head,
reports_to self-referential cross-tenant rejection and delete-blocked-when-manager,
default_shift_id cross-tenant rejection and delete-blocked-when-referenced,
user_id unique-when-set and NULL-hole documented.

`SchemaTestCase` gained four fixture builder pairs: `insertDepartment` /
`departmentAttributes`, `insertDesignation` / `designationAttributes`,
`insertShift` / `shiftAttributes`, `insertEmployee` / `employeeAttributes`.

Verified: `migrate:fresh` — all **53 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**192 passed / 879 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests**, Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.14 Migrations — Wave 10 (Production) complete

Eight Wave 10 migrations:
`2026_08_24_105000` … `105700` — production_plans, production_plan_items, production_batches,
material_issues, material_issue_items, production_batch_inputs, worker_production_entries, production_outputs.

| Table / Migration | Notes |
|---|---|
| `production_plans` | Master planning header. Scoped to `(tenant_id, company_id)` and `(tenant_id, factory_id)` via composite FKs (RESTRICT). Unique `(tenant_id, plan_number)`. Status `draft \| approved \| in_progress \| completed \| cancelled`. Source `manual \| sales_order \| forecast \| reorder`. Soft-deletable. |
| `production_plan_items` | Recipe item rows for a production plan. References `(tenant_id, production_plan_id)` with **CASCADE** delete (plan items have no independent existence). Composite FKs on `products`, `bill_of_materials`, `units`, and nullable `production_lines` (all RESTRICT). Soft-deletable. |
| `production_batches` | The spine of the production chain (ADR-011). Unique `(tenant_id, batch_number)`. Optional `production_plan_item_id` (unplanned batches are legal). Composite FKs on `factory_id`, `production_line_id` (nullable), `product_id`, `bill_of_material_id` (freezes BoM version), `shift_id` (nullable), and `output_unit_id` (all RESTRICT). **ADR-012 invariant:** `yield_percentage`, `variance_quantity`, and `variance_percentage` are nullable with NO default (must remain NULL while `context_completeness` is `draft` or `collecting`; a default of 0 is a defect). Soft-deletable. |
| `material_issues` | Warehouse-side issue document posted to batch. Unique `(tenant_id, issue_number)`. Composite FKs on `(tenant_id, production_batch_id)` and `(tenant_id, warehouse_id)` (RESTRICT). Soft-deletable. |
| `material_issue_items` | Line items issued from warehouse to batch. References `(tenant_id, material_issue_id)` with **CASCADE** delete. Composite FKs on `products`, `units`, `warehouse_locations` (nullable) with RESTRICT. `stock_movement_id` is a deferred cross-group reference (Wave 12 / Wave 25). Soft-deletable. |
| `production_batch_inputs` | What actually entered the production line (recorded independently of warehouse issue). References `(tenant_id, production_batch_id)` with **CASCADE** delete. Composite FKs on `products`, `units`, and optional `material_issue_items` (RESTRICT). Soft-deletable. |
| `worker_production_entries` | Many-to-many worker logging per batch/product/shift (ADR-013). Composite unique `(tenant_id, production_batch_id, employee_id, product_id, work_date, shift_id)`. Composite FKs on `production_batches`, `employees`, `products`, `production_lines`, `shifts`, `units` (all RESTRICT). `rate` and `incentive_amount` nullable (NULL until payroll). `payroll_period_id` is a deferred FK (Wave 19 / Wave 25). Soft-deletable. |
| `production_outputs` | Output yield from batch. Composite FKs on `production_batches`, `products`, `product_variants` (nullable), `units`, and `target_warehouse_id` (all RESTRICT). Invariant: output is quarantined and does not become available stock until QC clears (`qc_required = 1`, `qc_status = 'pending'`). `stock_movement_id` is a deferred FK (Wave 12 / Wave 25). Soft-deletable. |

**Invariants and rules enforced:**
- `production_batches`: `yield_percentage`, `variance_quantity`, and `variance_percentage` strictly `NULL` on creation (ADR-012).
- `worker_production_entries`: 6-column composite uniqueness key strictly enforced per tenant.
- Cascading delete boundaries: `production_plan_items`, `material_issue_items`, and `production_batch_inputs` CASCADE on parent deletion; all cross-entity catalogue references strictly `RESTRICT`.

`Wave10ProductionSchemaTest` — **24 tests / 92 assertions** covering all 8 tables,
`tenant_id` second column placement, soft-deletes on all 8, no float/double/enum in migrations,
plan number uniqueness, cross-tenant FK rejection for company/factory/product/bom/warehouse/employee/batch,
plan item CASCADE, issue item CASCADE, batch input CASCADE, worker entry composite uniqueness,
batch ADR-012 NULL invariants, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained eight fixture builder pairs: `insertProductionPlan` /
`productionPlanAttributes`, `insertProductionPlanItem` / `productionPlanItemAttributes`,
`insertProductionBatch` / `productionBatchAttributes`, `insertMaterialIssue` /
`materialIssueAttributes`, `insertMaterialIssueItem` / `materialIssueItemAttributes`,
`insertProductionBatchInput` / `productionBatchInputAttributes`,
`insertWorkerProductionEntry` / `workerProductionEntryAttributes`,
`insertProductionOutput` / `productionOutputAttributes`.

Verified: `migrate:fresh` — all **61 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**216 passed / 995 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests**, Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.15 Migrations — Wave 11 (QC & Wastage) complete

Six Wave 11 migrations:
`2026_08_24_106000` … `106500` — qc_parameters, qc_inspections, qc_inspection_results,
qc_defects, wastage_records, rework_orders.

| Table / Migration | Notes |
|---|---|
| `qc_parameters` | Tenant-defined inspection checklist. Scoped to `(tenant_id, id)`. Nullable composite FK to `products` (global parameter when product_id IS NULL) and `units`. Types: `numeric \| boolean \| select \| text`. Soft-deletable. |
| `qc_inspections` | QC Inspection log header. Unique `(tenant_id, inspection_number)`. Composite FKs on `production_batches` (nullable), `production_outputs` (nullable), and `employees` (inspector_id, RESTRICT). Quantities: `sample_size`, `inspected_quantity`, `passed_quantity`, `failed_quantity`, `rework_quantity`, `scrap_quantity`. Statuses: `result` (`pass \| fail \| partial \| hold`), `status` (`draft \| submitted \| approved \| rejected`). Soft-deletable. |
| `qc_inspection_results` | Line-item inspection readings. References `(tenant_id, qc_inspection_id)` with **CASCADE** delete. Unique `(tenant_id, qc_inspection_id, qc_parameter_id)`. Composite FK on `qc_parameters` (RESTRICT). Soft-deletable. |
| `qc_defects` | Defect occurrences captured during inspection. References `(tenant_id, qc_inspection_id)` with **CASCADE** delete. Composite FK on `(tenant_id, defect_reason_id)` referencing `reason_codes(tenant_id, id)` (RESTRICT). Severity: `minor \| major \| critical`. Soft-deletable. |
| `wastage_records` | Material and production wastage tracking. Unique `(tenant_id, wastage_number)`. Composite FKs on `production_batches` (nullable), `products`, `units`, `reason_codes` (reason_code_id), and `warehouses` (nullable) with RESTRICT. Stage: `input \| in_process \| output \| qc \| storage \| transit`. Supports recovery: `is_recoverable`, `recovered_quantity`. `stock_movement_id` is a deferred FK (Wave 12 / Wave 25). Soft-deletable. |
| `rework_orders` | Production rework loop tracking. Unique `(tenant_id, rework_number)`. Composite FKs on `source_batch_id` (`production_batches`), `qc_inspections` (nullable), `products`, `units`, and `target_batch_id` (`production_batches`, nullable). `cycle_number` default 1 (guards infinite rework cycles). Status: `pending \| in_progress \| completed \| scrapped`. Soft-deletable. |

**Invariants and rules enforced:**
- `reason_codes`: Gained explicit `uq_reason_codes_tenant_id` on `(tenant_id, id)` in Wave 5 so child tables `qc_defects` and `wastage_records` can enforce composite FK referential integrity.
- Cascading delete boundaries: `qc_inspection_results` and `qc_defects` CASCADE delete with parent `qc_inspections`; all catalogue and batch links use `RESTRICT`.

`Wave11QcSchemaTest` — **24 tests / 73 assertions** covering all 6 tables,
`tenant_id` second column placement, soft-deletes on all 6, no float/double/enum in migrations,
inspection/wastage/rework number uniqueness, cross-tenant FK rejection for product/inspector/batch/parameter/reason_code/warehouse,
inspection result and defect CASCADE deletes, result parameter uniqueness, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained six fixture builder pairs: `insertQcParameter` /
`qcParameterAttributes`, `insertQcInspection` / `qcInspectionAttributes`,
`insertQcInspectionResult` / `qcInspectionResultAttributes`, `insertQcDefect` /
`qcDefectAttributes`, `insertWastageRecord` / `wastageRecordAttributes`,
`insertReworkOrder` / `reworkOrderAttributes`.

Verified: `migrate:fresh` — all **67 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**240 passed / 1086 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (136 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.16 Migrations — Wave 12 (Ledger & Stock Inventory) complete

Three Wave 12 migrations:
`2026_08_24_107000` … `107200` — stock_movements, stock_balances, stock_reservations.

| Table / Migration | Notes |
|---|---|
| `stock_movements` | Append-only central stock ledger (ADR-014). **Never updated. Never soft-deleted** (`no updated_at`, `no deleted_at`). Unique `(tenant_id, movement_number)`. 15 movement types (purchase_receipt, production_output, sales_return, transfer_in, adjustment_increase, opening_stock, rework_return, material_issue, sales_delivery, purchase_return, transfer_out, adjustment_decrease, wastage, scrap, sample_issue). 5 stock states (`available \| reserved \| in_transit \| quarantine \| damaged`). Direction (`in \| out`), positive quantity, unit/total costs, running `balance_after`. Self-referential `related_movement_id` (RESTRICT) pairs transfers/reversals. Composite FKs on `products`, `product_variants` (nullable), `warehouses`, `warehouse_locations` (nullable), `units`, `reason_codes` (nullable). |
| `stock_balances` | Transactional cache table updated synchronously with stock movements (ADR-014). Rebuildable by replaying movements. **Never soft-deleted**. Unique cache slot: `(tenant_id, product_id, variant_key, warehouse_id, location_key, batch_key, stock_state)` enforced over STORED generated sentinels `variant_key`, `location_key`, `batch_key` to eliminate NULL collision holes. Composite FKs on `products`, `product_variants` (nullable), `warehouses`, `warehouse_locations` (nullable), `stock_movements` (last_movement_id, nullable). |
| `stock_reservations` | Holds reserved stock state against a document without consuming it. Soft-deletable. Composite FKs on `products`, `product_variants` (nullable), `warehouses`, `units`. Status: `active \| consumed \| released \| expired`. |

**Invariants and rules enforced:**
- `stock_movements` & `stock_balances`: Immutability / cache invariant strictly enforced by omitting `deleted_at`.
- `stock_balances`: 7-column composite unique cache slot strictly enforced across all NULL combinations using stored sentinels.
- Foreign key referential integrity: Composite FKs on `products`, `warehouses`, `locations`, `reason_codes`, and `units` strictly enforced with `RESTRICT`.

`Wave12LedgerSchemaTest` — **18 tests / 47 assertions** covering all 3 tables,
`tenant_id` placement, immutable ledger & cache `no deleted_at` invariant, soft-deletes on reservations, no float/double/enum in migrations,
movement number uniqueness, cross-tenant FK rejection for product/warehouse/location/reason_code/related_movement,
balance cache slot sentinel uniqueness without NULL holes, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained three fixture builder pairs: `insertStockMovement` /
`stockMovementAttributes`, `insertStockBalance` / `stockBalanceAttributes`,
`insertStockReservation` / `stockReservationAttributes`.

Verified: `migrate:fresh` — all **70 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**258 passed / 1142 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (145 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.17 Migrations — Wave 13 (Stock Operations) complete

Six Wave 13 migrations:
`2026_08_24_108000` … `108500` — stock_transfers, stock_transfer_items, stock_adjustments, stock_adjustment_items, stock_counts, stock_count_items.

| Table / Migration | Notes |
|---|---|
| `stock_transfers` | Warehouse-to-warehouse stock transfer document. Unique `(tenant_id, transfer_number)`. Status: `draft \| in_transit \| partially_received \| received \| cancelled`. Composite FKs on `from_warehouse_id` and `to_warehouse_id` (`warehouses`, RESTRICT). Dispatch and receipt user tracking (`users`, nullOnDelete). |
| `stock_transfer_items` | Line items of transfer. Cascades on parent transfer (`stock_transfers`, CASCADE). Composite FKs on `products`, `product_variants` (nullable), `units`, `out_movement_id` (nullable), `in_movement_id` (nullable). Quantities: `sent_quantity`, `received_quantity`, `damaged_quantity` (`DECIMAL(18,4)`). |
| `stock_adjustments` | Stock reconciliation & revaluation adjustment header. Unique `(tenant_id, adjustment_number)`. Type: `increase \| decrease \| revaluation`. Status: `draft \| pending_approval \| approved \| rejected`. Total value impact `DECIMAL(18,4)`. Composite FKs on `warehouses` and `reason_codes` (`reason_codes`, RESTRICT). |
| `stock_adjustment_items` | Line items of adjustment. Cascades on parent adjustment (`stock_adjustments`, CASCADE). Composite FKs on `products`, `product_variants` (nullable), `stock_movements` (nullable). Quantities: `system_quantity`, `adjusted_quantity`, `difference_quantity`, `unit_cost` (`DECIMAL(18,4)`). |
| `stock_counts` | Physical stock count / cycle count session header. Unique `(tenant_id, count_number)`. Type: `full \| cycle \| spot`. Status: `draft \| counting \| review \| reconciled \| cancelled`. `freeze_stock` TINYINT flag. Composite FKs on `warehouses` and `stock_adjustments` (nullable, the resulting adjustment). |
| `stock_count_items` | Line items of physical count. Cascades on parent count (`stock_counts`, CASCADE). Composite FKs on `products`, `product_variants` (nullable), `warehouse_locations` (nullable). Quantities: `system_quantity` (frozen snapshot), `counted_quantity`, `variance_quantity`, `recount_quantity`. Status: `pending \| counted \| variance \| accepted`. |

**Invariants and rules enforced:**
- Cascade delete boundaries: Child items (`stock_transfer_items`, `stock_adjustment_items`, `stock_count_items`) cascade on parent header deletion, but reference catalog products/units/warehouses with `RESTRICT`.
- Multi-warehouse isolation: `warehouseAttributes` fixture enhanced with auto-increment counter to guarantee conflict-free `(tenant_id, code)` generation in multi-warehouse test topologies.
- Referential integrity: Composite FKs on `warehouses`, `reason_codes`, `products`, `product_variants`, `units`, and `stock_movements` strictly enforced.

`Wave13StockOpsSchemaTest` — **26 tests / 90 assertions** covering all 6 tables,
`tenant_id` placement, soft-delete compliance, no float/double/enum in migrations,
document number uniqueness across transfers/adjustments/counts, cross-tenant composite FK rejections,
cascading delete lifecycle for line items, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained six fixture builder pairs: `insertStockTransfer` / `stockTransferAttributes`,
`insertStockTransferItem` / `stockTransferItemAttributes`, `insertStockAdjustment` / `stockAdjustmentAttributes`,
`insertStockAdjustmentItem` / `stockAdjustmentItemAttributes`, `insertStockCount` / `stockCountAttributes`,
`insertStockCountItem` / `stockCountItemAttributes`.

Verified: `migrate:fresh` — all **76 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**284 passed / 1250 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (163 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.18 Migrations — Wave 14 (Purchasing) complete

Ten Wave 14 migrations:
`2026_08_24_109000` … `109900` — purchase_requisitions, purchase_requisition_items, purchase_orders, purchase_order_items, goods_receipts, goods_receipt_items, purchase_bills, purchase_bill_items, purchase_returns, purchase_return_items.

| Table / Migration | Notes |
|---|---|
| `purchase_requisitions` | Internal request for purchasing materials. Unique `(tenant_id, requisition_number)`. Status: `draft \| pending_approval \| approved \| rejected \| partially_ordered \| ordered \| cancelled`. Composite FKs on `branches` (nullable) and `warehouses` (nullable). |
| `purchase_requisition_items` | Line items of requisition. Cascades on parent requisition (`purchase_requisitions`, CASCADE). Composite FKs on `products`, `product_variants` (nullable), `units`. Quantities: `quantity`, `ordered_quantity`, `estimated_unit_cost` (`DECIMAL(18,4)`). |
| `purchase_orders` | Official purchase order sent to supplier. Unique `(tenant_id, po_number)`. Status: `draft \| pending_approval \| approved \| sent \| partially_received \| received \| closed \| cancelled`. Composite FKs on `parties` (`parties(tenant_id, id)`), `companies` (nullable), `branches` (nullable), `warehouses` (nullable), `purchase_requisitions` (nullable). Financials: `subtotal`, `discount_amount`, `tax_amount`, `shipping_amount`, `total_amount`, `received_value`, `billed_value` (`DECIMAL(18,4)`). |
| `purchase_order_items` | Line items of purchase order. Cascades on parent PO (`purchase_orders`, CASCADE). Composite FKs on `products`, `product_variants` (nullable), `units`, `tax_profiles` (nullable). Quantities and pricing: `quantity`, `unit_price`, `discount_percentage`, `discount_amount`, `tax_amount`, `line_total`, `received_quantity`, `billed_quantity` (`DECIMAL(18,4)`). |
| `goods_receipts` | Goods receipt note (GRN) recording inbound delivery at warehouse. Unique `(tenant_id, grn_number)`. Status: `draft \| received \| qc_pending \| completed \| cancelled`. Composite FKs on `purchase_orders` (nullable — direct receipts legal), `parties`, `warehouses`. |
| `goods_receipt_items` | Line items of GRN. Cascades on parent GRN (`goods_receipts`, CASCADE). Invariant: stock posts for `accepted_quantity` only; `rejected_quantity` posts to quarantine or supplier return. Composite FKs on `purchase_order_items` (nullable), `products`, `product_variants` (nullable), `units`, `warehouse_locations` (nullable), `stock_movements` (nullable), `reason_codes` (nullable). |
| `purchase_bills` | Vendor invoice / bill document. Unique `(tenant_id, bill_number)`. Status: `draft \| posted \| partially_paid \| paid \| cancelled`. Invariant: posted bill is immutable; corrections occur via debit/credit notes. Composite FKs on `parties`, `purchase_orders` (nullable), `goods_receipts` (nullable). |
| `purchase_bill_items` | Line items of purchase bill. Cascades on parent bill (`purchase_bills`, CASCADE). Composite FKs on `goods_receipt_items` (nullable), `products` (nullable), `units` (nullable), `tax_profiles` (nullable). `expense_account_id` integer placeholder for Wave 21 Chart of Accounts closure. |
| `purchase_returns` | Supplier return document. Unique `(tenant_id, return_number)`. Status: `draft \| posted \| credited \| cancelled`. Composite FKs on `parties`, `goods_receipts` (nullable), `warehouses`, `reason_codes`. |
| `purchase_return_items` | Line items of purchase return. Cascades on parent return (`purchase_returns`, CASCADE). Composite FKs on `products`, `product_variants` (nullable), `units`, `stock_movements` (nullable). |

**Invariants and rules enforced:**
- Cascade delete boundaries: All 5 line item tables (`purchase_requisition_items`, `purchase_order_items`, `goods_receipt_items`, `purchase_bill_items`, `purchase_return_items`) cascade on parent header deletion, but reference catalog products/units/parties/warehouses with `RESTRICT`.
- Direct receipt & non-catalog billing support: `goods_receipts.purchase_order_id` is nullable (supporting direct receipts); `purchase_bill_items.product_id` and `unit_id` are nullable (supporting direct service/expense items).
- Ledger and QC linkages: Composite FKs on `stock_movements` and `reason_codes` strictly enforced.

`Wave14PurchasingSchemaTest` — **24 tests / 124 assertions** covering all 10 tables,
`tenant_id` placement, soft-delete compliance, no float/double/enum in migrations,
document number uniqueness across requisitions/POs/GRNs/bills/returns, cross-tenant composite FK rejections,
cascading delete lifecycle for line items, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained ten fixture builder pairs: `insertPurchaseRequisition` / `purchaseRequisitionAttributes`,
`insertPurchaseRequisitionItem` / `purchaseRequisitionItemAttributes`, `insertPurchaseOrder` / `purchaseOrderAttributes`,
`insertPurchaseOrderItem` / `purchaseOrderItemAttributes`, `insertGoodsReceipt` / `goodsReceiptAttributes`,
`insertGoodsReceiptItem` / `goodsReceiptItemAttributes`, `insertPurchaseBill` / `purchaseBillAttributes`,
`insertPurchaseBillItem` / `purchaseBillItemAttributes`, `insertPurchaseReturn` / `purchaseReturnAttributes`,
`insertPurchaseReturnItem` / `purchaseReturnItemAttributes`.

Verified: `migrate:fresh` — all **86 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**308 passed / 1404 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (193 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.19 Migrations — Wave 15 (Sales & Invoicing) complete

Nine Wave 15 migrations:
`2026_08_24_110000` … `110800` — crm_leads, crm_activities, sales_orders, sales_order_items, invoice_templates, invoices, invoice_items, sales_returns, sales_return_items.

| Table / Migration | Notes |
|---|---|
| `crm_leads` | CRM leads pipeline. Unique `(tenant_id, lead_number)`. Stages: `new \| contacted \| qualified \| proposal \| won \| lost`. Sources: `walk_in \| phone \| referral \| online \| field_visit \| other`. Composite FKs on `reason_codes` (`lost_reason_id`, nullable) and `parties` (`converted_party_id`, nullable). Expected value: `DECIMAL(18,4)`. |
| `crm_activities` | Activities on leads or parties. Types: `call \| visit \| email \| sms \| note \| task`. Index `(tenant_id, subject_type, subject_id)` and `(tenant_id, assigned_to, due_at)`. FK on `users` (`assigned_to`, nullable). |
| `sales_orders` | Sales order core (ADR-015: one sales core discriminated by `channel`: `counter \| dealer \| phone \| field \| online`). Unique `(tenant_id, order_number)`. Walk-in support via nullable `party_id` + denormalized customer name/phone. Status: `draft \| confirmed \| partially_delivered \| delivered \| completed \| cancelled`. Payment status: `unpaid \| partial \| paid \| refunded`. Financials: `subtotal`, `discount_amount`, `tax_amount`, `shipping_amount`, `round_off`, `total_amount`, `paid_amount`, `due_amount` (`DECIMAL(18,4)`). |
| `sales_order_items` | Line items of sales order. Cascades on parent SO (`sales_orders`, CASCADE). Invariant: server-side unit price resolution (ARCHITECTURE §4.4). Composite FKs on `products`, `product_variants` (nullable), `units`, `tax_profiles` (nullable), `stock_reservations` (nullable). Quantities and pricing: `quantity`, `unit_price`, `discount_percentage`, `discount_amount`, `tax_amount`, `line_total`, `delivered_quantity`, `returned_quantity` (`DECIMAL(18,4)`). |
| `invoice_templates` | Invoice drag-and-drop template configurations. Unique `(tenant_id, type, name)`. Supported types: `invoice \| receipt \| delivery_note \| purchase_order \| quotation \| payslip`. Paper sizes: `a4 \| a5 \| letter \| thermal_80 \| thermal_58`. JSON `definition` holding element tree (fixed interpreter, no eval). |
| `invoices` | Official sales invoices. Unique `(tenant_id, invoice_number)`. Invariant: posted invoice is never edited or deleted (void + reissue). Composite FKs on `sales_orders` (nullable), `companies` (nullable), `branches` (nullable), `parties` (nullable), `invoice_templates` (nullable). Financials: `subtotal`, `discount_amount`, `tax_amount`, `shipping_amount`, `round_off`, `total_amount`, `paid_amount` (`DECIMAL(18,4)`). |
| `invoice_items` | Line items of invoice. Cascades on parent invoice (`invoices`, CASCADE). Composite FKs on `sales_order_items` (nullable), `products` (nullable), `units` (nullable), `tax_profiles` (nullable). Pricing: `quantity`, `unit_price`, `discount_amount`, `tax_amount`, `line_total` (`DECIMAL(18,4)`). |
| `sales_returns` | Customer return document. Unique `(tenant_id, return_number)`. Refund methods: `cash \| bank \| credit_note \| exchange`. Status: `draft \| approved \| posted \| cancelled`. Composite FKs on `invoices` (nullable), `sales_orders` (nullable), `parties` (nullable), `warehouses`, `reason_codes`. |
| `sales_return_items` | Line items of sales return. Cascades on parent return (`sales_returns`, CASCADE). Condition: `good \| damaged`. `stock_movement_id` (nullable — NULL when `restock = 0`). Composite FKs on `invoice_items` (nullable), `products`, `product_variants` (nullable), `units`, `stock_movements` (nullable). |

**Invariants and rules enforced:**
- ADR-015 single sales core: Channel discrimination (`counter`, `dealer`, `phone`, `field`, `online`) without separate schema silos.
- POS/walk-in agility: Nullable `party_id` on `sales_orders`, `invoices`, and `sales_returns` with denormalized customer attributes.
- Cascade delete boundaries: All 4 item tables (`sales_order_items`, `invoice_items`, `sales_return_items`, `crm_activities` via parent) maintain safe CASCADE rules from parents and RESTRICT on catalog entities.

`Wave15SalesSchemaTest` — **27 tests / 117 assertions** covering all 9 tables,
`tenant_id` placement, soft-delete compliance, no float/double/enum in migrations,
document number uniqueness across leads/orders/templates/invoices/returns, cross-tenant composite FK rejections,
cascading delete lifecycle for line items, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained nine fixture builder pairs: `insertCrmLead` / `crmLeadAttributes`,
`insertCrmActivity` / `crmActivityAttributes`, `insertSalesOrder` / `salesOrderAttributes`,
`insertSalesOrderItem` / `salesOrderItemAttributes`, `insertInvoiceTemplate` / `invoiceTemplateAttributes`,
`insertInvoice` / `invoiceAttributes`, `insertInvoiceItem` / `invoiceItemAttributes`,
`insertSalesReturn` / `salesReturnAttributes`, `insertSalesReturnItem` / `salesReturnItemAttributes`.

Verified: `migrate:fresh` — all **95 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**335 passed / 1548 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (220 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.20 Migrations — Wave 16 (Payments & Collections) complete

Three Wave 16 migrations:
`2026_08_24_111000` … `111200` — payments, payment_allocations, sales_order_payments.

| Table / Migration | Notes |
|---|---|
| `payments` | Covers customer receipts (`in`) and supplier payments (`out`). Unique `(tenant_id, payment_number)`. Methods: `cash \| bank_transfer \| cheque \| card \| mobile_banking \| credit_adjustment`. Status: `draft \| posted \| bounced \| cancelled`. Composite FKs on `parties` (nullable), `companies` (nullable), `branches` (nullable). `bank_account_id` integer placeholder for Wave 21 Chart of Accounts closure. Amounts: `amount`, `allocated_amount`, `unallocated_amount` (`DECIMAL(18,4)`). |
| `payment_allocations` | Allocates payment amounts to targets (`invoice`, `purchase_bill`, `sales_return`, `purchase_return`). Cascades on parent payment (`payments`, CASCADE). Invariant: sum of allocations <= payment amount. Amount: `DECIMAL(18,4)`. |
| `sales_order_payments` | Split-tender POS and sales order payment records (supports cash + card + mobile in a single sale). Cascades on parent sales order (`sales_orders`, CASCADE). Composite FK on `payments` (nullable, RESTRICT). Pricing: `amount`, `change_given` (`DECIMAL(18,4)`). |

**Invariants and rules enforced:**
- Bi-directional payment handling: Both incoming collections and outgoing disbursements tracked in a single core model discriminated by `direction`.
- Allocation integrity: `payment_allocations` cascades with payment lifecycle while preserving polymorphically typed target references.
- Split tender: `sales_order_payments` enables multi-method POS tender with full change-given tracking.

`Wave16PaymentsSchemaTest` — **13 tests / 48 assertions** covering all 3 tables,
`tenant_id` placement, soft-delete compliance, no float/double/enum in migrations,
payment number uniqueness, cross-tenant composite FK rejections,
cascading delete lifecycle, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained three fixture builder pairs: `insertPayment` / `paymentAttributes`,
`insertPaymentAllocation` / `paymentAllocationAttributes`, `insertSalesOrderPayment` / `salesOrderPaymentAttributes`.

Verified: `migrate:fresh` — all **98 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**348 passed / 1605 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (229 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.21 Migrations — Wave 17 (POS) complete

Three Wave 17 migrations:
`2026_08_24_112000` … `112200` — pos_terminals, pos_sessions, pos_offline_queue.

| Table / Migration | Notes |
|---|---|
| `pos_terminals` | Counter/hardware station registration. Composite FKs on `branches` and `warehouses` (nullable default warehouse). JSON `printer_config` (e.g. paper size, auto-cut). Unique `(tenant_id, code)`. |
| `pos_sessions` | Shift / cash-drawer session. Composite FKs on `branches`, `warehouses`, `pos_terminals`. User tracking on `user_id` and `closed_by`. Status: `open \| closing \| closed \| reconciled`. Financial counters: `opening_cash`, `expected_cash`, `counted_cash`, `cash_variance`, `card_total`, `mobile_total`, `credit_total`, `sales_count`, `refund_total` (`DECIMAL(18,4)`). Unique `(tenant_id, session_number)`. |
| `pos_offline_queue` | Server-side record of queued offline device transactions (ARCHITECTURE §6.8). Tracks `terminal_id`, `user_id`, `idempotency_key`, `payload` (JSON), `client_created_at`, `synced_at`, `status` (`pending \| synced \| rejected`), `rejection_reason`. Unique `(tenant_id, idempotency_key)`. |

**Invariants and rules enforced:**
- Session-gated POS sales: Architecture requirement that every point-of-sale checkout references an open session with full cash-drawer reconciliation audit.
- Offline resilience: Dedicated offline transaction sync buffer with idempotency key enforcement and client creation timestamp tracking.
- Financial integrity: Cash variance and multiple payment method totals tracked at high precision `DECIMAL(18,4)`.

`Wave17PosSchemaTest` — **14 tests / 44 assertions** covering all 3 tables,
`tenant_id` placement, soft-delete compliance, no float/double/enum in migrations,
terminal code uniqueness, session number uniqueness, offline queue idempotency uniqueness,
cross-tenant composite FK rejections (branch, warehouse, terminal),
and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained three fixture builder pairs: `insertPosTerminal` / `posTerminalAttributes`,
`insertPosSession` / `posSessionAttributes`, `insertPosOfflineQueue` / `posOfflineQueueAttributes`.

Verified: `migrate:fresh` — all **101 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**362 passed / 1658 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (238 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.22 Migrations — Wave 18 (Delivery & Logistics) complete

Eight Wave 18 migrations:
`2026_08_24_113000` … `113700` — courier_providers, run_sheets, delivery_orders, delivery_order_items, delivery_status_events, courier_shipments, courier_webhook_events, cod_reconciliations.

| Table / Migration | Notes |
|---|---|
| `courier_providers` | Courier gateway adapter definitions. `tenant_id` nullable (NULL = platform definition, integer = tenant credentials). Encrypted credentials, capability matrix JSON (`create_shipment`, `cancel_shipment`, `get_status`, `get_label`, `calculate_rate`, `schedule_pickup`, `webhook`, `cod`, `partial_delivery`, `return_pickup`). Unique `(tenant_id, code)`. |
| `run_sheets` | Own-fleet dispatch document. Composite FK on `branches`. Tracks stops (`total_stops`, `completed_stops`) and COD expected/collected totals (`DECIMAL(18,4)`). Unique `(tenant_id, run_sheet_number)`. |
| `delivery_orders` | Central fulfillment order. 11 status states (`pending`, `assigned`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `failed`, `rescheduled`, `returned`, `cancelled`, `on_hold`). Composite FKs on `sales_orders`, `invoices`, `parties`, `warehouses`, `party_addresses`, `run_sheets`, `reason_codes`, `stock_movements`. POD paths & signature. Unique `(tenant_id, delivery_number)`. |
| `delivery_order_items` | Line items for delivery order. Cascades on parent delivery order (`delivery_orders`, CASCADE). Product/variant/unit references enforce `RESTRICT`. |
| `delivery_status_events` | Append-only event timeline (no soft deletes / deleted_at). Unique `(tenant_id, delivery_order_id, courier_event_id)` serves as webhook idempotency guard (ADR-017). |
| `courier_shipments` | Third-party courier booking record with consignment/AWB tracking, label URL, raw provider payloads, retry counters, and COD amounts (`DECIMAL(18,4)`). Unique `(tenant_id, courier_provider_id, consignment_id)`. |
| `courier_webhook_events` | Inbound raw webhook payload buffer. Unique `(courier_provider_id, provider_event_id)`. |
| `cod_reconciliations` | Cash-on-delivery reconciliation audit sheet for run sheets and courier disbursements. Expected, received, and variance amounts (`DECIMAL(18,4)`). Unique `(tenant_id, reconciliation_number)`. |

**Invariants and rules enforced:**
- ADR-017 Webhook idempotency: Composite uniqueness on `(tenant_id, delivery_order_id, courier_event_id)` prevents duplicate status event processing.
- Capability matrix enforcement: Provider capabilities structured as boolean map to disable unsupported features in UI.
- Dual fulfillment: Complete support for both own-fleet dispatch (`run_sheets`) and automated third-party courier dispatch (`courier_shipments`).

`Wave18DeliverySchemaTest` — **18 tests / 97 assertions** covering all 8 tables,
`tenant_id` placement, soft-delete compliance, append-only timeline verification,
no float/double/enum in migrations, code and sequence number uniqueness,
cross-tenant composite FK rejections, cascading delete lifecycles, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained eight fixture builder pairs: `insertCourierProvider` / `courierProviderAttributes`,
`insertRunSheet` / `runSheetAttributes`, `insertDeliveryOrder` / `deliveryOrderAttributes`,
`insertDeliveryOrderItem` / `deliveryOrderItemAttributes`, `insertDeliveryStatusEvent` / `deliveryStatusEventAttributes`,
`insertCourierShipment` / `courierShipmentAttributes`, `insertCourierWebhookEvent` / `courierWebhookEventAttributes`,
`insertCodReconciliation` / `codReconciliationAttributes`.

Verified: `migrate:fresh` — all **109 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**380 passed / 1779 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (262 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.23 Migrations — Wave 19 (Full HR & Payroll) complete

Fourteen Wave 19 migrations:
`2026_08_24_114000` … `115300` — leave_types, leave_requests, leave_balances, shift_assignments, holidays, employee_documents, salary_components, salary_structures, salary_structure_components, payroll_periods, attendances, payslips, payslip_items, payroll_advances.

| Table / Migration | Notes |
|---|---|
| `leave_types` | Tenant-scoped leave type policies (`annual_quota_days`, `accrual_method`, `carry_forward_allowed`, `max_carry_forward_days`, `min_notice_days`). Unique `(tenant_id, code)`. |
| `leave_requests` | Workflow for employee leave applications (`start_date`, `end_date`, `total_days`, `is_half_day`, `reason`, `attachment_id`, `status`). Unique `(tenant_id, request_number)`. |
| `leave_balances` | Derived leave balance transactional cache per year. Unique `(tenant_id, employee_id, leave_type_id, year)`. |
| `shift_assignments` | Shift scheduling with effective date ranges. Composite FKs on `employees` and `shifts`. Index `(tenant_id, employee_id, effective_from)`. |
| `holidays` | Company and branch holiday calendar. Index `(tenant_id, holiday_date)`. |
| `employee_documents` | Employee compliance files and contracts. Cascades on `employees` delete. Composite FK on `attachments`. |
| `salary_components` | Earning, deduction, and employer contribution definitions (`is_taxable`, `affects_gross`). Unique `(tenant_id, code)`. |
| `salary_structures` | Salary template structures with effective date ranges and pay frequencies. Unique `(tenant_id, code, effective_from)`. |
| `salary_structure_components` | Component lines within salary structure. Cascades on `salary_structures` delete. Supports fixed, percentage, formula, per_unit, per_day, and per_hour calculation types. |
| `payroll_periods` | Closed payroll calculation cycles with total gross, deductions, net, and employee count. Unique `(tenant_id, company_id, period_code)`. |
| `attendances` | Daily attendance ledger with check-in/out stamps, worked/late/overtime minutes, sources, and payroll period locking stamp. Unique `(tenant_id, employee_id, attendance_date)`. |
| `payslips` | Individual employee payslip statements (`gross_amount`, `total_earnings`, `total_deductions`, `net_amount`, `paid_days`, `produced_quantity`). Unique `(tenant_id, payroll_period_id, employee_id)` and `(tenant_id, payslip_number)`. |
| `payslip_items` | Snapshotted payslip line breakdown per ADR-019 (`component_code`, `component_type`, `calculation_basis` JSON). Cascades on `payslips` delete. |
| `payroll_advances` | Salary advance issuance, installments, and recovery tracking. Unique `(tenant_id, advance_number)`. |

**Invariants and rules enforced:**
- One row per employee per date: `attendances` unique constraint `(tenant_id, employee_id, attendance_date)` ensures single source of daily attendance truth.
- Freezing via payroll lock: `attendances.payroll_period_id` freezes attendance records upon payroll calculation (ARCHITECTURE §6.1).
- ADR-019 Component snapshotting: `payslip_items` snapshots component labels and calculation basis to guarantee immutable payslip historical reproducibility.
- `attachments` referential integrity: Added `uq_attachments_tenant_id` on `attachments` to permit composite foreign key enforcement across `leave_requests` and `employee_documents`.

`Wave19HrPayrollSchemaTest` — **18 tests / 110 assertions** covering all 14 tables,
`tenant_id` placement, soft-delete compliance, code/request/advance/structure uniqueness,
attendance daily uniqueness, cascading delete lifecycles, and DECIMAL(18,4) & DECIMAL(8,4) precision round-trip.

`SchemaTestCase` gained 14 fixture builder pairs: `insertLeaveType` / `leaveTypeAttributes`,
`insertLeaveRequest` / `leaveRequestAttributes`, `insertLeaveBalance` / `leaveBalanceAttributes`,
`insertShiftAssignment` / `shiftAssignmentAttributes`, `insertHoliday` / `holidayAttributes`,
`insertEmployeeDocument` / `employeeDocumentAttributes`, `insertSalaryComponent` / `salaryComponentAttributes`,
`insertSalaryStructure` / `salaryStructureAttributes`, `insertSalaryStructureComponent` / `salaryStructureComponentAttributes`,
`insertPayrollPeriod` / `payrollPeriodAttributes`, `insertAttendance` / `attendanceAttributes`,
`insertPayslip` / `payslipAttributes`, `insertPayslipItem` / `payslipItemAttributes`,
`insertPayrollAdvance` / `payrollAdvanceAttributes`.

Verified: `migrate:fresh` — all **123 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**398 passed / 1931 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (304 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.24 Migrations — Wave 20 (Assets & Maintenance) complete

Eight Wave 20 migrations:
`2026_08_24_116000` … `116700` — asset_categories, assets, asset_assignments, asset_depreciation_entries, maintenance_schedules, maintenance_orders, maintenance_order_parts, asset_meter_readings.

| Table / Migration | Notes |
|---|---|
| `asset_categories` | Tree-structured asset category hierarchy (`default_depreciation_method`, `default_useful_life_months`, `default_salvage_percentage`). Self-referential `parent_id` (RESTRICT). Unique `(tenant_id, code)`. |
| `assets` | Capital assets ledger distinct from stock inventory (DECISIONS C21). Scoped by company, branch, factory, production line, warehouse, and assigned employee. Tracks `purchase_cost`, `salvage_value`, `accumulated_depreciation`, `book_value` cache (`DECIMAL(18,4)`), status, condition, disposal. Unique `(tenant_id, asset_code)`. |
| `asset_assignments` | Asset custody and operational assignment tracking (`employee`, `branch`, `factory`, `production_line`, `vehicle`). Tracks condition on return. Index `(tenant_id, asset_id, assigned_from)`. |
| `asset_depreciation_entries` | Append-only depreciation ledger (no soft deletes / `deleted_at`). Stores `opening_book_value`, `depreciation_amount`, `closing_book_value` (`DECIMAL(18,4)`). Unique `(tenant_id, asset_id, period_year, period_month)`. |
| `maintenance_schedules` | Preventive maintenance plans with time interval or meter-reading triggers. Stores checklist JSON. Unique `(tenant_id, code)`. |
| `maintenance_orders` | Execution work orders for preventive/corrective/breakdown maintenance (`scheduled_start`, `actual_start`, `downtime_minutes`, `status`, `labour_cost`, `parts_cost`, `external_cost`, `total_cost`). Unique `(tenant_id, order_number)`. |
| `maintenance_order_parts` | Spare parts consumed on maintenance work order. Cascades on parent `maintenance_orders`. References spare part `products` with `RESTRICT`. |
| `asset_meter_readings` | Monotonic operating meter reading log (`hours`, `kilometres`, `cycles`, `units_produced`). Index `(tenant_id, asset_id, reading_at)`. |

**Invariants and rules enforced:**
- Asset vs stock boundary: Capital equipment resides in `assets`; consumable spare parts reside in `products` with `product_type = spare_part`.
- Append-only depreciation ledger: `asset_depreciation_entries` is strictly immutable (no `deleted_at`).
- Cascading maintenance parts: `maintenance_order_parts` hard-cascades on parent maintenance order deletion while catalog references enforce `RESTRICT`.

`Wave20AssetsSchemaTest` — **12 tests / 64 assertions** covering all 8 tables,
`tenant_id` placement, soft-delete vs append-only ledger compliance, code/asset/order uniqueness,
cascading child deletes, cross-tenant composite FK rejections, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained 8 fixture builder pairs: `insertAssetCategory` / `assetCategoryAttributes`,
`insertAsset` / `assetAttributes`, `insertAssetAssignment` / `assetAssignmentAttributes`,
`insertAssetDepreciationEntry` / `assetDepreciationEntryAttributes`, `insertMaintenanceSchedule` / `maintenanceScheduleAttributes`,
`insertMaintenanceOrder` / `maintenanceOrderAttributes`, `insertMaintenanceOrderPart` / `maintenanceOrderPartAttributes`,
`insertAssetMeterReading` / `assetMeterReadingAttributes`.

Verified: `migrate:fresh` — all **131 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**410 passed / 2019 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (328 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Tenancy runtime **3**, Unit+Example **2**.


---

### 4.25 Migrations — Wave 21 (Finance & Costing) complete

Eleven Wave 21 migrations:
`2026_08_24_117000` … `118000` — chart_of_accounts, journal_entries, journal_lines, expense_categories, bank_accounts, expenses, bank_transactions, payment_terms, party_credit_limits, product_costs, production_cost_allocations.

| Table / Migration | Notes |
|---|---|
| `chart_of_accounts` | Standard chart of accounts hierarchy (`account_type`, `account_subtype`, `normal_balance`, `is_group`, `is_system`). Leaf accounts accept postings; group accounts cannot. Unique `(tenant_id, company_id, account_code)`. |
| `journal_entries` | General ledger header fed by upstream modules (`total_debit`, `total_credit`, `status` draft/posted/void, `reversal_of_entry_id`). Balanced invariant enforced on posting. Unique `(tenant_id, company_id, entry_number)`. |
| `journal_lines` | Debit/credit line entries with single-sided non-zero invariant. Hard cascades on parent `journal_entries`. References `chart_of_accounts`, `branches`, `parties` with `RESTRICT`. Index `(tenant_id, account_id)`. |
| `expense_categories` | Hierarchical expense classification tree with default accounting mapping, `requires_attachment` flag, and approval threshold. Unique `(tenant_id, code)`. |
| `bank_accounts` | Company bank, cash desk, and mobile wallet accounts with `current_balance` derived cache over `bank_transactions`. Unique `(tenant_id, company_id, code)`. |
| `expenses` | Operational expense capture and approval workflow with snapshot payee labeling, attachment link, and payment method dispatch. Unique `(tenant_id, expense_number)`. |
| `bank_transactions` | Immutable append-only cash/bank transaction ledger (`receipt`, `payment`, `transfer_in`, `transfer_out`, `pos_settlement`, `cod_settlement`, etc.). Transfers create paired records linked via `related_transaction_id`. Index `(tenant_id, bank_account_id, transaction_date)`. |
| `payment_terms` | Credit and payment settlement terms (`net_days`, `discount_percentage`, `discount_days`). Unique `(tenant_id, code)`. |
| `party_credit_limits` | Customer/party credit risk rules with `current_outstanding` cache and payment term binding. Unique `(tenant_id, party_id)`. |
| `product_costs` | Append-only and time-sliced unit cost history tracking material, labour, overhead, and total cost (`DECIMAL(18,4)`). Index `(tenant_id, product_id, effective_from)`. |
| `production_cost_allocations` | Append-only overhead, labour, and utility allocation records on completed production batches. Index `(tenant_id, production_batch_id)`. |

**Invariants and rules enforced:**
- Balanced Ledger Invariant: General ledger entries require balanced debits and credits on posted status.
- Derived Bank Cache: `bank_accounts.current_balance` is a rebuildable cache over immutable `bank_transactions`.
- Paired Transfer Integrity: Fund transfers between accounts write atomic double legs linked via `related_transaction_id`.
- Time-Sliced Costing: `product_costs` is append-only with effective date bounds to preserve historical margin integrity.

`Wave21FinanceSchemaTest` — **14 tests / 85 assertions** covering all 11 tables,
`tenant_id` placement, soft-delete vs append-only ledger compliance, code/entry/account uniqueness,
cascading child deletes, paired transfer references, cross-tenant composite FK rejections, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained 11 fixture builder pairs: `insertChartOfAccount` / `chartOfAccountAttributes`,
`insertJournalEntry` / `journalEntryAttributes`, `insertJournalLine` / `journalLineAttributes`,
`insertExpenseCategory` / `expenseCategoryAttributes`, `insertBankAccount` / `bankAccountAttributes`,
`insertExpense` / `expenseAttributes`, `insertBankTransaction` / `bankTransactionAttributes`,
`insertPaymentTerm` / `paymentTermAttributes`, `insertPartyCreditLimit` / `partyCreditLimitAttributes`,
`insertProductCost` / `productCostAttributes`, `insertProductionCostAllocation` / `productionCostAllocationAttributes`.

Verified: `migrate:fresh` — all **142 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**424 passed / 2137 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (361 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Wave 21 **14**, Tenancy runtime **3**, Unit+Example **2**.

### 4.26 Migrations — Wave 22 (Reporting & Analytics) complete

Fourteen migrations:

| Order | File | Table | Concern |
|---|---|---|---|
| 119000 | `2026_08_24_119000_create_report_definitions_table.php` | `report_definitions` | RMS registry definition table with nullable `tenant_id` (NULL = platform definition), generated `tenant_key`, category, permission, and export support flags. Unique `(tenant_key, code)` and `(tenant_key, id)`. |
| 119100 | `2026_08_24_119100_create_report_saved_views_table.php` | `report_saved_views` | User-customized report filters, column configurations, and sorting options. Unique `(tenant_id, id)` and index `(tenant_id, user_id, report_definition_id)`. |
| 119200 | `2026_08_24_119200_create_report_schedules_table.php` | `report_schedules` | Automated report generation digest schedules (`daily`, `weekly`, `monthly`) with recipient routing and next run tracking. |
| 119300 | `2026_08_24_119300_create_report_exports_table.php` | `report_exports` | Asynchronous queued report export jobs with file paths, byte sizes, lifecycle statuses (`queued` -> `processing` -> `completed`), and expiry timestamps. |
| 119400 | `2026_08_24_119400_create_dashboard_widgets_table.php` | `dashboard_widgets` | User and role-customizable dashboard layouts, grid coordinates (`grid_x`, `grid_y`, `grid_w`, `grid_h`), and JSON widget configurations. |
| 119500 | `2026_08_24_119500_create_summary_daily_production_table.php` | `summary_daily_production` | Tier 2 pre-aggregated daily production rollup across factory, line, and product grains with yield, input/output, wastage, scrap, and rework metrics (`DECIMAL(18,4)`). |
| 119510 | `2026_08_24_119510_create_summary_daily_worker_output_table.php` | `summary_daily_worker_output` | Worker daily output summary by employee and product grain tracking produced, rejected, hours, and piece rate earnings. |
| 119520 | `2026_08_24_119520_create_summary_daily_sales_table.php` | `summary_daily_sales` | Daily sales channel aggregates by branch tracking gross, discount, tax, net, and return amounts. |
| 119530 | `2026_08_24_119530_create_summary_daily_stock_table.php` | `summary_daily_stock` | Warehouse inventory daily snapshots tracking opening, in/out movements, closing stock quantities, and closing valuation. |
| 119540 | `2026_08_24_119540_create_summary_daily_delivery_table.php` | `summary_daily_delivery` | Logistics daily performance by branch and courier tracking dispatches, deliveries, failures, returns, and COD collections. |
| 119550 | `2026_08_24_119550_create_summary_monthly_finance_table.php` | `summary_monthly_finance` | General ledger monthly account movement and closing balance rollups by company and chart of account. |
| 119560 | `2026_08_24_119560_create_summary_monthly_payroll_table.php` | `summary_monthly_payroll` | Company-level monthly payroll summary tracking employee counts, gross earnings, deductions, net disbursements, and overtime hours. |
| 119570 | `2026_08_24_119570_create_summary_product_margin_table.php` | `summary_product_margin` | Monthly product profitability analysis tracking units sold, revenue, direct cost, gross margin, and margin percentage. |
| 119580 | `2026_08_24_119580_create_summary_taxes_table.php` | `summary_taxes` | Company monthly tax liability summary tracking taxable basis, tax collected, tax paid, and net tax payable. |

Key architectural rules:
- Tier 2 Read Models: All 9 summary tables are derived and rebuildable from transactional tables in Groups A–K with mandatory `refreshed_at` timestamps (DECISIONS ADR-017 / ADR-021).
- No Soft Deletes on Materialized Summaries: Summary tables are transactional aggregation caches without `deleted_at`.
- RMS Registry Architecture: `report_definitions` acts as a dynamic registry enabling tenant custom reports and platform defaults without hardcoded pages.

`Wave22ReportingSchemaTest` — **14 tests / 111 assertions** covering all 14 tables,
`tenant_id` placement, soft-delete vs summary table rebuildability, definition code uniqueness,
saved views, schedule indexing, summary table uniqueness slots, cross-tenant composite FK rejections, and DECIMAL(18,4) precision round-trip.

`SchemaTestCase` gained 14 fixture builder pairs: `insertReportDefinition` / `reportDefinitionAttributes`,
`insertReportSavedView` / `reportSavedViewAttributes`, `insertReportSchedule` / `reportScheduleAttributes`,
`insertReportExport` / `reportExportAttributes`, `insertDashboardWidget` / `dashboardWidgetAttributes`,
`insertSummaryDailyProduction` / `summaryDailyProductionAttributes`, `insertSummaryDailyWorkerOutput` / `summaryDailyWorkerOutputAttributes`,
`insertSummaryDailySales` / `summaryDailySalesAttributes`, `insertSummaryDailyStock` / `summaryDailyStockAttributes`,
`insertSummaryDailyDelivery` / `summaryDailyDeliveryAttributes`, `insertSummaryMonthlyFinance` / `summaryMonthlyFinanceAttributes`,
`insertSummaryMonthlyPayroll` / `summaryMonthlyPayrollAttributes`, `insertSummaryProductMargin` / `summaryProductMarginAttributes`,
`insertSummaryTax` / `summaryTaxAttributes`.

Verified: `migrate:fresh` — all **156 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**438 passed / 2290 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (403 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Wave 21 **14**, Wave 22 **14**, Tenancy runtime **3**, Unit+Example **2**.

### 4.27 Phase 1 Wave 23 — E-commerce (10 tables)

Per `DATABASE_DESIGN.md` §13.2 & §16, the storefront is an online sales channel over the unified sales core (ADR-016), rather than a separate application. Ten tables were written in `backend/database/migrations/`:

| Table | Migration File | Key Structure & Invariants |
|---|---|---|
| `storefronts` | `2026_08_24_120000_create_storefronts_table.php` | Storefront channel configurations with unique `(tenant_id, code)`, globally unique `subdomain` and optional unique custom `domain`. Composite FKs to `companies`, `branches`, `warehouses`, `price_lists`, and `attachments` (`logo_attachment_id`, `favicon_attachment_id`). JSON whitelisted branding tokens (`theme`). |
| `storefront_pages` | `2026_08_24_120100_create_storefront_pages_table.php` | Content and landing page definitions with composite unique `(tenant_id, storefront_id, slug)`. Hard-cascades on parent storefront deletion. JSON static block structures for safe rendering. |
| `storefront_products` | `2026_08_24_120200_create_storefront_products_table.php` | Merchandising catalog overrides. Virtual sentinel `variant_key = COALESCE(variant_id, 0)` under unique `(tenant_id, storefront_id, product_id, variant_key)` and unique `(tenant_id, storefront_id, seo_slug)`. Cascades on storefront, restricts on product/variant. |
| `carts` | `2026_08_24_120300_create_carts_table.php` | Public shopping cart state tracking guest/customer party tokens, subtotal, tax, shipping, discounts, and expiration timestamps. Indexed on `(tenant_id, storefront_id, status, last_activity_at)`. Reserving stock on cart add is strictly forbidden (reservations occur at checkout order placement). |
| `cart_items` | `2026_08_24_120400_create_cart_items_table.php` | Line items with snapshotted `product_name` and `unit_price`, line discounts, taxes, and `price_stale` flag for re-resolution detection at checkout. Cascades on parent cart deletion. No `deleted_at`. |
| `coupons` | `2026_08_24_120500_create_coupons_table.php` | Promo codes with unique `(tenant_id, code)`. Supports percentage, fixed amount, and free shipping discount types across order, product, or category targets with total/per-customer limits. |
| `coupon_redemptions` | `2026_08_24_120600_create_coupon_redemptions_table.php` | Immutable redemption ledger with unique `(tenant_id, coupon_id, sales_order_id)`. Tracks discount applied per order. |
| `shipping_zones` | `2026_08_24_120700_create_shipping_zones_table.php` | Geolocation delivery rule engine matching on district/city/postcode/country or `catch_all`. Flat, per-kg, per-item, or courier-quoted rate calculation with free-shipping thresholds. Indexed on `(tenant_id, storefront_id, sort_order)`. |
| `product_reviews` | `2026_08_24_120800_create_product_reviews_table.php` | Customer rating (1–5) and review body with moderation workflow (`pending` by default, `approved`, `rejected`, `spam`). Links to sales orders for verified purchase badges. Indexed on `(tenant_id, product_id, status)`. |
| `wishlists` | `2026_08_24_120900_create_wishlists_table.php` | Customer product wishlists with virtual sentinel `variant_key = COALESCE(variant_id, 0)` under unique `(tenant_id, storefront_id, customer_party_id, product_id, variant_key)`. Cascades on storefront, customer, product, and variant deletions. |

`SchemaTestCase` gained 10 fixture builder pairs: `insertStorefront` / `storefrontAttributes`,
`insertStorefrontPage` / `storefrontPageAttributes`, `insertStorefrontProduct` / `storefrontProductAttributes`,
`insertCart` / `cartAttributes`, `insertCartItem` / `cartItemAttributes`,
`insertCoupon` / `couponAttributes`, `insertCouponRedemption` / `couponRedemptionAttributes`,
`insertShippingZone` / `shippingZoneAttributes`, `insertProductReview` / `productReviewAttributes`,
`insertWishlist` / `wishlistAttributes`.

Verified: `migrate:fresh` — all **166 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**452 passed / 2404 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (535 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Wave 21 **14**, Wave 22 **14**, Wave 23 **14**, Tenancy runtime **3**, Unit+Example **2**.

### 4.28 Phase 1 Wave 24 — Integrations (3 tables)

Per `DATABASE_DESIGN.md` §13.3 & §16, outbound integration webhooks and batch data import entities were written in `backend/database/migrations/`:

| Table | Migration File | Key Structure & Invariants |
|---|---|---|
| `webhook_endpoints` | `2026_08_24_121000_create_webhook_endpoints_table.php` | Outbound webhook endpoint registrations with target URL, encrypted signing secret, subscribed event topics array, active flag, and auto-disabling circuit breaker on consecutive delivery failures. |
| `webhook_deliveries` | `2026_08_24_121100_create_webhook_deliveries_table.php` | Immutable append-only delivery attempt log with response statuses, truncated response bodies, delivery statuses (`pending`, `delivered`, `failed`, `abandoned`), and indexed on `(tenant_id, status, next_retry_at)` for async exponential retry workers. Hard cascades on endpoint deletion. No `deleted_at`. |
| `imports` | `2026_08_24_121200_create_imports_table.php` | Bulk import jobs (`products`, `parties`, `employees`, `opening_stock`, `price_list`, `attendance`) tracking total, processed, success, and failed row counts, JSON column mapping, dry-run simulation mode (`dry_run = 1`), error report spreadsheet path, and requesting user reference. |

`SchemaTestCase` gained 3 fixture builder pairs: `insertWebhookEndpoint` / `webhookEndpointAttributes`,
`insertWebhookDelivery` / `webhookDeliveryAttributes`, `insertImport` / `importAttributes`.

`Wave24IntegrationsSchemaTest` — **6 tests / 31 assertions** verifying table existence, tenant_id ordinality, soft-delete rules, webhook delivery cascading lifecycle, dry-run imports, and cross-tenant reference rejection.

### 4.29 Phase 1 Wave 25 — Deferred Cross-Group FK Closures (1 migration)

Per `DATABASE_DESIGN.md` §16, all deferred circular and forward-referenced foreign keys across earlier migration waves were closed in a single dedicated migration `backend/database/migrations/2026_08_24_122000_wave25_deferred_fk_closure.php`:

1. `employees.salary_structure_id` → `salary_structures(tenant_id, id)` (`SET NULL` on delete)
2. `material_issue_items.stock_movement_id` → `stock_movements(tenant_id, id)` (`RESTRICT` on delete)
3. `production_outputs.stock_movement_id` → `stock_movements(tenant_id, id)` (`RESTRICT` on delete)
4. `qc_inspections.goods_receipt_id` → `goods_receipts(tenant_id, id)` (`RESTRICT` on delete)
5. `wastage_records.stock_movement_id` → `stock_movements(tenant_id, id)` (`RESTRICT` on delete)
6. `worker_production_entries.payroll_period_id` → `payroll_periods(tenant_id, id)` (`RESTRICT` on delete)
7. `run_sheets.vehicle_id` → `assets(tenant_id, id)` (`RESTRICT` on delete)
8. `cod_reconciliations.bank_account_id` → `bank_accounts(tenant_id, id)` (`RESTRICT` on delete)
9. `asset_depreciation_entries.journal_entry_id` → `journal_entries(tenant_id, id)` (`RESTRICT` on delete)

`Wave25DeferredClosureSchemaTest` — **9 tests / 18 assertions** asserting that every single deferred foreign key strictly enforces composite `(tenant_id, parent_id)` referential integrity and rejects cross-tenant references across all 9 domain boundaries.

Verified: `migrate:fresh` — all **170 migrations** green ✅ · `pint lint:fix` **PASS** ·
`phpstan analyse` level 9 **[OK] No errors** · `artisan test`
**467 passed / 2465 assertions**, none risky. Per-suite re-measured:
Wave 1 **11 tests** (547 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**,
Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Wave 21 **14**, Wave 22 **14**, Wave 23 **14**, Wave 24 **6**, Wave 25 **9**, Tenancy runtime **3**, Unit+Example **2**.

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

Backend, at `backend/composer.json`: PHP `^8.5`, `laravel/framework` **v13.26.1**,
`larastan/larastan ^3.10`, `phpstan/phpstan ^2.2`, `laravel/pint ^1.27`,
`phpunit/phpunit ^12.5.12`, `laravel/pail`, `laravel/pao`, `mockery`, `collision`.
Scripts: `lint`, `lint:fix`, `analyse`, `test`, `check`.

> **Installed ≠ working — resolved.** This note previously read "five of these
> have no configuration file, so their scripts currently fail," and that was the
> stated reason Phase 0 stayed open. All of them now have one and all of them
> now pass; §3.4 records the measured result of each. The distinction is worth
> keeping in mind for Phase 1: a dependency in `package.json` is a claim, not a
> capability.

Version notes to carry into Phase 1:

- `@tanstack/react-table` is **v9**. `UI_SYSTEM.md` §11 was written against v8
  assumptions; verify the API on first real `DataTable` use.
- `zod` is **v3**, not v4. Contract-derived schemas must be written to v3.
- `axe-core` is installed but **unused** — there is no a11y suite yet, because
  there is no route to audit. The root `test:a11y` script proxied to a
  workspace script that did not exist and was removed rather than left to fail;
  it returns in Phase 1 with the first real screen. `ROADMAP.md` line 172 makes
  Lighthouse and bundle budgets a Phase 1 gate on the login and shell routes.
- `msw` is installed and its worker directory is configured, but **no handlers
  exist**. The transport seam is tested against a stubbed `fetch`, not MSW.

---

## 6. Open questions currently blocking future work

From `DECISIONS.md` §7. None block Phase 1.

| # | Question | Blocks | Needed by |
|---|---|---|---|
| Q1 | Incentive calculation formula — slab boundaries, base (revenue vs gross profit), whether returns claw back | Phase 5 | Before Phase 5 gate |
| Q2 | Tax model — single VAT rate, per-product, inclusive vs exclusive per channel | Phase 5 | Before Phase 5 build |
| Q3 | Invoice numbering per tenant — prefix, reset period, padding, separate POS series, and whether a series is scoped per company or per branch | Phase 5 | Before Phase 5 build. `document_sequences` (§4.9) is built so the schema does **not** pre-empt it: all three scope shapes insert. Answer it in `DECISIONS.md`, never in a migration. |
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
| 18 | `lib/api/client.ts` — the single transport seam: envelope parsing, §8.4 401 refresh + single replay, silent cancellation, visible timeout, idempotency key, `If-Match`, correlation id | ✅ |
| 19 | `lib/api/queryClient.ts` — retry policy (GETs ≤ 3 with jittered backoff, mutations never), `staleTime` tiers, `placeholderData: previous` | ✅ |
| 20 | Wire `main.tsx`: `QueryClientProvider` inside, `GlobalBoundary` outermost (outside all providers) | ✅ |
| 21 | `patterns/QueryBoundary.tsx` rows 2 + 20 — `isFetching` → `RefetchBar` rail over **stale data**, 60% dim gated past 1s, rail applied to the empty surfaces too | ✅ |
| 22 | `ui/Toast.tsx` + `<Toaster />` in `main.tsx` — row 5's transient surface. Sonner wrapped, `unstyled`, token-only; `notify.error` never self-dismisses | ✅ |
| 23 | Tooling gate made real: `phpstan.neon` + `pint.json`, 128 frontend tests, `check-bundle-budget.mjs`, PHP floor `^8.5`, `.prettierignore`, `ci.yml` rewritten to 3 jobs / 9 legs | ✅ |
| 24 | **Phase 0 closed.** Every gate in §3.4 measured green. | ✅ |
| 25 | Phase 1 **Wave 1 — platform**: `plans`, `tenants`, `tenant_subscriptions`, `tenant_usage_counters`, `settings`, `feature_flags`, plus `Wave1PlatformSchemaTest`. Wave 0 needed no work — see §4.6 | ✅ |
| 26 | Phase 1 **Wave 2 — org**: `companies`, `branches`, `factories`, `production_lines`, plus `SchemaTestCase` and `Wave2OrgSchemaTest`. Two findings raised against the approved schema — see §4.7 | ✅ |
| 27 | Phase 1 **Wave 3 — identity**: `users` finalise (`tenant_id`, `perm_version`, and the **global `email` unique** reconciled with §1.1 tenant scoping), `permissions`, `roles`, `role_permission`, `role_user`, `user_scopes`, `refresh_tokens`, plus `Wave3IdentitySchemaTest`. Five findings, one of them a hole with no schema fix — see §4.8 | ✅ |
| 28 | Phase 1 **Wave 4 — infrastructure**: `audit_logs`, `idempotency_keys`, `attachments`, `notifications`, `notification_preferences`, `document_sequences`, `activity_snapshots`, plus `Wave4InfraSchemaTest`. Four findings, one of them a precedence-rank-4 tie escalated and resolved against `DATABASE_DESIGN.md` §3 — see §4.9. `document_sequences` scope resolution remains open question **Q3**, which blocks the Phase 5 allocator but not the table | ✅ |
| 29 | **Tenancy runtime** — `app/Core` (`TenantContext`, tenancy exceptions, the `Action` base contract), the `BelongsToTenant` trait (global scope + `creating` hook stamping the guarded `tenant_id` + logged `withoutTenantScope`), `ResolveTenant`, `CorrelationId`, `EnsureTenantActive`, centralized error mapping, JWT `api` guard, and `routes/api_platform.php` · `api_tenant.php` · `api_public.php` wired through `bootstrap/app.php`. Tests: `TenancyRuntimeTest` (3 tests / 8 assertions). | ✅ |
| 30 | Phase 1 **Wave 5 — master data A**, per `DATABASE_DESIGN.md` §16: `units`, `unit_conversions`, `categories`, `brands`, `tax_profiles`, `reason_codes`. Note `units` is the deferred forward reference `production_lines.capacity_unit_id` waits on (§16.1 rule 2, closed in **Wave 5** — the index is already pre-created, so the closure is an `ADD` composite FK, not an `ALTER` of the column) | ✅ |
| 31 | Phase 1 **Wave 6 — master data B**, per `DATABASE_DESIGN.md` §16: `products`, `product_variants`, `product_images`, `bill_of_materials`, `bill_of_material_items`. First wave with a CASCADE delete rule (BoM items) and the first with versioned master data (BoM unique per product+version). See §4.11. | ✅ |
| 32 | Phase 1 **Wave 7 — master data C**, per `DATABASE_DESIGN.md` §16: `warehouses`, `warehouse_locations`, `parties`, `party_addresses`, `party_contacts`, `price_lists`, `price_list_items`, `discount_rules`. First wave with a within-wave deferred FK closure (`parties → price_lists`). Unique-key NULL hole documented for `price_list_items.variant_id`. See §4.12. | ✅ |
| 33 | Phase 1 **Wave 8 — HR identity** + **Wave 9 FK closure**, per `DATABASE_DESIGN.md` §16: `departments`, `designations`, `shifts`, `employees` (Wave 8), plus three circular FK closures in Wave 9. See §4.13. | ✅ |
| 34 | Phase 1 **Wave 10 — production**, per `DATABASE_DESIGN.md` §16: `production_plans`, `production_plan_items`, `production_batches`, `material_issues`, `material_issue_items`, `production_batch_inputs`, `worker_production_entries`, `production_outputs`. See §4.14. | ✅ |
| 35 | Phase 1 **Wave 11 — QC & wastage**, per `DATABASE_DESIGN.md` §16: `qc_parameters`, `qc_inspections`, `qc_inspection_results`, `qc_defects`, `wastage_records`, `rework_orders`. See §4.15. | ✅ |
| 36 | Phase 1 **Wave 12 — Ledger**, per `DATABASE_DESIGN.md` §16: `stock_movements`, `stock_balances`, `stock_reservations`. See §4.16. | ✅ |
| 37 | Phase 1 **Wave 13 — Stock ops**, per `DATABASE_DESIGN.md` §16: `stock_transfers`, `stock_transfer_items`, `stock_adjustments`, `stock_adjustment_items`, `stock_counts`, `stock_count_items`. See §4.17. | ✅ |
| 38 | Phase 1 **Wave 14 — Purchasing**, per `DATABASE_DESIGN.md` §16: `purchase_requisitions`, `purchase_requisition_items`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `purchase_bills`, `purchase_bill_items`, `purchase_returns`, `purchase_return_items`. See §4.18. | ✅ |
| 39 | Phase 1 **Wave 15 — Sales & Invoicing**, per `DATABASE_DESIGN.md` §16: `crm_leads`, `crm_activities`, `sales_orders`, `sales_order_items`, `invoice_templates`, `invoices`, `invoice_items`, `sales_returns`, `sales_return_items`. See §4.19. | ✅ |
| 40 | Phase 1 **Wave 16 — Payments & Collections**, per `DATABASE_DESIGN.md` §16: `payments`, `payment_allocations`, `sales_order_payments`. See §4.20. | ✅ |
| 41 | Phase 1 **Wave 17 — POS**, per `DATABASE_DESIGN.md` §16: `pos_terminals`, `pos_sessions`, `pos_offline_queue`. See §4.21. | ✅ |
| 42 | Phase 1 **Wave 18 — Delivery & Logistics**, per `DATABASE_DESIGN.md` §16: `delivery_orders`, `delivery_order_items`, `delivery_status_events`, `run_sheets`, `courier_providers`, `courier_shipments`, `courier_webhook_events`, `cod_reconciliations`. See §4.22. | ✅ |
| 43 | Phase 1 **Wave 19 — Full HR & Payroll**, per `DATABASE_DESIGN.md` §16: `shift_assignments`, `attendances`, `leave_types`, `leave_balances`, `leave_requests`, `holidays`, `employee_documents`, `salary_components`, `salary_structures`, `salary_structure_components`, `payroll_periods`, `payslips`, `payslip_items`, `payroll_advances`. See §4.23. | ✅ |
| 44 | Phase 1 **Wave 20 — Assets & Maintenance**, per `DATABASE_DESIGN.md` §16: `asset_categories`, `assets`, `asset_assignments`, `asset_depreciation_entries`, `maintenance_schedules`, `maintenance_orders`, `maintenance_order_parts`, `asset_meter_readings`. See §4.24. | ✅ |
| 45 | Phase 1 **Wave 21 — Finance & Costing**, per `DATABASE_DESIGN.md` §16: `chart_of_accounts`, `journal_entries`, `journal_lines`, `expense_categories`, `bank_accounts`, `expenses`, `bank_transactions`, `payment_terms`, `party_credit_limits`, `product_costs`, `production_cost_allocations`. See §4.25. | ✅ |
| 46 | Phase 1 **Wave 22 — Reporting & Analytics**, per `DATABASE_DESIGN.md` §16: `report_definitions`, `report_saved_views`, `report_schedules`, `report_exports`, `dashboard_widgets`, `summary_*` tables. See §4.26. | ✅ |
| 47 | Phase 1 **Wave 23 — E-commerce**, per `DATABASE_DESIGN.md` §16: `storefronts`, `storefront_pages`, `storefront_products`, `carts`, `cart_items`, `coupons`, `coupon_redemptions`, `shipping_zones`, `product_reviews`, `wishlists`. See §4.27. | ✅ |
| 48 | Phase 1 **Wave 24 — Integrations**, per `DATABASE_DESIGN.md` §16: `webhook_endpoints`, `webhook_deliveries`, `imports`. See §4.28. | ✅ |
| 49 | Phase 1 **Wave 25 — Deferred Closures**, per `DATABASE_DESIGN.md` §16: closed all 9 cross-group foreign keys. See §4.29. | ✅ |
| 50 | Phase 1 **Auth & RBAC Implementation**, per `ROADMAP.md` & `MODULE_MAP.md`: Token Service (ADR-004 / ADR-007), Password hashing (Argon2id), RBAC middleware & permission enforcement. `app/Core/Auth/{JwtService, RefreshTokenService, PermissionCatalogue}` + JWT/refresh exception types, `app/Core/Http/Middleware/{AuthenticateJwt, AuthorizePermission}`, `app/Modules/Auth/Controllers/AuthController` + all 12 Auth Actions, wired through `config/auth.php` and the three route files. Tests in `tests/Feature/Auth/` (Login, AuthMe, RefreshToken, Logout, Preferences, RbacMiddleware). | ✅ |
| 51 | Phase 2 **Master-data Eloquent models (tranche 1)**: 19 models over Waves 5–7 (`Unit`, `UnitConversion`, `Category`, `Brand`, `TaxProfile`, `ReasonCode`, `Product`, `ProductVariant`, `ProductImage`, `BillOfMaterial`, `BillOfMaterialItem`, `Warehouse`, `WarehouseLocation`, `Party`, `PartyAddress`, `PartyContact`, `PriceList`, `PriceListItem`, `DiscountRule`) on `BelongsToTenant`, string decimal casts per §1, composite-key relations. Verified by `tests/Feature/Models/MasterDataModelTest.php`. | ✅ |
| 52 | Phase 2 **Master-data module pipeline** — backend-first for `units`/`categories`/`brands` per ADR-029 build order and the **Pragmatic DoD (ADR-032)**: Form Requests · API Resources · Actions (audit inside the transaction) · controllers · routes · feature tests (cross-tenant isolation + permission matrix + envelope), authorised by `catalog.<resource>.{view,manage}` middleware (ADR-008), plus canonical `frontend/src/types/api/catalog.ts` and the spatie transformer path (ADR-033). UI paused for review afterwards. | ✅ |
| 53 | Phase 2 **Product CRUD vertical** — Product API contract (§15.4.4), UUID relation resolution, transactional Actions, Form Requests, API Resource, controller, options endpoint, tenant-safe routes, factory, and feature coverage for envelope, duplicate SKU, UUID serialization, cross-tenant isolation, and permissions. | ✅ |
| 54 | Phase 2 **Bill of materials CRUD vertical** — versioned recipes with nested component items, UUID relation resolution, atomic item replacement, archive lifecycle, transactional Actions, Form Requests, API Resource, controller, routes, factory, and isolation/duplicate/archive feature coverage. | ✅ |

---

## 8. Resuming work in a new session

Read, in precedence order: `DECISIONS.md` · `PROJECT_CONTEXT.md` ·
`ARCHITECTURE.md` · `UI_SYSTEM.md` (§2, §7, §8, §9.2, §10.2–10.4, §17, §18) ·
this file. Phase 0 is complete and Phase 1 database schema is **100% complete**: Wave 0 needed no work,
**Wave 1 (platform) is done** (§4.6), **Wave 2 (org) is done** (§4.7),
**Wave 3 (identity) is done** (§4.8), **Wave 4 (infrastructure) is done**
(§4.9), **the tenancy runtime (§7 item 29) is done**, **Wave 5 (master
data A) is done** (§4.10), **Wave 6 (master data B) is done** (§4.11),
**Wave 7 (master data C) is done** (§4.12), **Wave 8 (HR identity) +
Wave 9 (HR FK closure) are done** (§4.13), **Wave 10 (production) is done**
(§4.14), **Wave 11 (QC & wastage) is done** (§4.15), **Wave 12 (ledger &
stock inventory) is done** (§4.16), **Wave 13 (stock operations) is done**
(§4.17), **Wave 14 (purchasing) is done** (§4.18), **Wave 15 (sales & invoicing) is done**
(§4.19), **Wave 16 (payments & collections) is done** (§4.20),
**Wave 17 (POS) is done** (§4.21),
**Wave 18 (delivery & logistics) is done** (§4.22),
**Wave 19 (full HR & payroll) is done** (§4.23),
**Wave 20 (assets & maintenance) is done** (§4.24),
**Wave 21 (finance & costing) is done** (§4.25),
**Wave 22 (reporting & analytics) is done** (§4.26),
**Wave 23 (e-commerce) is done** (§4.27),
**Wave 24 (integrations) is done** (§4.28), and
**Wave 25 (deferred closures) is done** (§4.29) — all 169 tables and 170 migrations.
**Phase 1 Auth & RBAC is done** (§7 item 50): JWT + refresh-token rotation, Argon2id,
the `AuthenticateJwt`/`AuthorizePermission` middleware, `AuthController` with all 12
Actions, and the `tests/Feature/Auth/` suite. The **first tranche of 19 master-data
Eloquent models is done** (§7 item 51), verified by `tests/Feature/Models/MasterDataModelTest.php`.
Backend is green at **535 tests / 3082 assertions**, PHPStan level 9 clean.
§7 item 52 — the master-data module pipeline — is complete for Units, Categories and
Brands. §7 item 53 — the Product CRUD vertical — is also complete, as is §7 item 54,
the versioned BOM vertical. Continue with the next Phase 2 module in roadmap order
before beginning UI work. Per the newly recorded
**ADR-032 (Pragmatic DoD)** the backend template is Form Requests → API Resources →
Actions (audit row written inside the same DB transaction) → controller → routes →
feature tests (cross-tenant isolation + permission matrix + envelope), authorised by the
existing `catalog.<resource>.{view,manage}` middleware (ADR-008) — **no per-model Policy
class** unless a row-level rule needs one. Types are the canonical
`frontend/src/types/api/catalog.ts` wired to the spatie transformer path (**ADR-033**).
Backend-first for `units`/`categories`/`brands` in parallel, verify green, then **pause for
review before any UI**, per ADR-029's build order and `MODULE_MAP.md`.


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
| **Every** HTTP call goes through `api.get/post/patch/put/delete` from `lib/api/client.ts`. A raw `fetch` anywhere else is forbidden by `ARCHITECTURE.md` §10. | Loses correlation ids, the 401 protocol, timeouts and logging all at once. |
| The transport makes **one** attempt. Retry lives in `queryClient.ts`. Mutations never retry — double-click protection is a disabled button **and** an `Idempotency-Key`, not one or the other. | Duplicate stock movements and duplicate payments. |
| An `Idempotency-Key` identifies a **user intent**, not an HTTP attempt: generate it when the form opens or submit is first pressed, and reuse it for every retry of that intent. | Server treats each retry as a new operation. |
| `REQUEST_CANCELLED` is silent — never a toast, never a state, never a log line. | Every navigation away from a loading screen shows a fake error. |
| Server data lives only in TanStack Query. Zustand is UI-only. | Two sources of truth, stale screens. |
| Branch on `error.code`, never on `error.message`. Every code needs a designed state — there is no `catch {}`. | Untranslatable, brittle, and silently swallowed failures. |
| A toast is **only** row 5 (success) and errors with no owning surface. Validation (6), business rules (7), warnings (8), partial failure (9), permissions (11/12) and offline (18) are each "never a toast" in §8.1 — import `notify` from `ui/Toast`, never `sonner` directly. | A box that hides itself carries information the user had to act on. |
| Never `import { toast } from 'sonner'`. `notify.error` is pinned to `duration: Infinity` on purpose. | An error that self-dismisses is a hidden error (§8.5 rule 2). |
| Slice Mart is tenant #1, never hardcoded. No tenant name, currency symbol or locale in component code. | Breaks multi-tenancy. |
| This is an **npm workspaces** monorepo. The only lockfile is `package-lock.json` at the repository **root**; `frontend/package-lock.json` does not exist and must not be created. Install with `npm ci` at the root. | `npm ci` inside `frontend/` fails outright — it was CI defect 1. |
| The PHP floor is **`^8.5`** in `composer.json`, `DECISIONS.md` ADR-003, `PROJECT_CONTEXT.md`, `README.md` and `ci.yml`'s `PHP_VERSION`. `backend/tests/Unit/ExampleTest.php` reads it out of the manifest and asserts the running binary satisfies it. | Lowering it in one place turns the suite red, by design. |
| Root Prettier has **no** `.prettierrc`, so files outside `frontend/` are formatted with **double quotes**. `frontend/.prettierrc` (`singleQuote: true`) applies only inside `frontend/`. The `format`/`format:check` globs are `frontend/src`, `frontend/scripts` and `.github/workflows/*.yml`; `docs/` is in `.prettierignore` — approved artefacts are never reformatted. | `format:check` fails on `ci.yml`, or an approved doc gets rewritten. A file outside the globs is not gated at all. |
| Every reference to a tenant-scoped parent is a **composite** FK on `(tenant_id, <parent>_id)` targeting the parent's `unique (tenant_id, id)` — never `foreignId()->constrained()`. And **no composite FK led by `tenant_id` may use `ON DELETE SET NULL`** (`DATABASE_DESIGN.md` §1.3). | A single-column FK downgrades ARCHITECTURE §3.1 layer 4 from a database guarantee to an application convention. `SET NULL` nulls the whole key including `tenant_id NOT NULL`, so deletes fail with a misleading `NOT NULL` error. |
| "At most one default per tenant/company" is a **generated column** that folds to `NULL` unless the flag is set, under a unique index. It is read-only — never write it from application code. `STORED` inside `CREATE TABLE`; **`VIRTUAL` where an `ALTER` adds it**, because SQLite rejects `ADD COLUMN ... STORED`. | `unique (tenant_id, is_default)` also forbids a second *non*-default row. A hand-maintained sentinel drifts from its flag. A `STORED` column in an `ALTER` fails the migration outright. |
| A **composite FK is not checked at all when any of its columns is `NULL`** (`DATABASE_DESIGN.md` §1.3). Prefer `tenant_id NOT NULL` on any table that *grants* something. Where nullability is forced — `role_user` — the Action must assert both sides are platform **inside the transaction**. | A platform role grant can point at an ordinary tenant user and the database will accept it. There is no schema fix: MySQL 8 rejects FKs on virtual generated columns, so the sentinel trick does not transfer. |
| **Append-only means no update path in code, not just no `updated_at`.** `audit_logs` has no `updated_at`, no `deleted_at` and no database default on `created_at` (ADR-027, `DATABASE_DESIGN.md` §18). Its FKs are `RESTRICT`, so **a user or tenant that has done anything can never be hard-deleted** — offboarding is an archive-then-purge Action. | An `Auditable` trait that calls `save()` twice, or a cleanup job issuing a `DELETE`, destroys the only evidence the system keeps. A `CASCADE` here would let deleting a user erase what they did. |
| The `idempotency_keys` unique key is **`(tenant_id, user_id, endpoint, key)`**, per API_CONTRACT §6.2 — not §3's original `(tenant_id, key)`. `user_id` is NOT NULL. Pinned by a test whose failure message names the consequence. | The narrow key makes two users of one tenant share a row, so §6.3's replay hands one user's stored response body to the other. |
| A notification's state is **derived from `sent_at` / `read_at` / `failed_at`**, not stored in a `status` column, and `severity` is limited to UI_SYSTEM §5's four status colours. | A `status` column drifts out of sync with the timestamps that are the actual facts. A fifth severity has no colour to render in. |
| Run PHPStan through **`composer analyse`**, never the bare binary: the script passes `--memory-limit=1G` and the analyser now exceeds PHP's default 128 M. | The bare invocation dies with *"PHPStan process crashed because it reached configured PHP memory limit"* and reports an incomplete result — a false red that looks like a code error. |
| Backend test counts must be **re-measured, never carried forward**. `Wave1PlatformSchemaTest` scans every file in `database/migrations`, so its assertion count rises with each new wave. | A recorded total silently goes stale, and the arithmetic gap gets "reconciled" by guesswork instead of by running the suite. |
| Every gate has a verified local command in **§3.4**, including the Windows-specific invocations. `depcruise` cannot run on Node 25 — CI pins Node 22. | Time lost re-discovering that the path's spaces and `&` break bare binary references. |

---

## 9. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Created. Replaces `_legacy/DEVELOPMENT_STATUS.md`, which claimed "pre-development" while a prototype application existed (contradiction C24). Records Phase 0 documentation complete, all 41 modules not started, and the five outstanding Phase 0 work items. |
| 2026-08-26 | **Phase 2 catalogue master-data pipeline complete.** Added Category and Brand CRUD beside the existing Unit vertical: tenant-safe Actions with transactional audit logging, Form Requests, UUID resources, guarded controllers, options endpoints, permissioned routes, factories, materialised Category paths with subtree re-parenting and cycle protection, Product reference delete guards, and focused feature coverage. Added canonical frontend Category and Brand API types. Verification: 535 tests / 3082 assertions, PHPStan level 9 clean, Pint applied. UI remains paused for review. |
| 2026-08-26 | **Product CRUD vertical complete.** Added the §15.4.4 Product contract and two-action permission entry, UUID relation resolution across catalogue references, transactional create/update/delete Actions, full validation/resource/controller/routes, options endpoint, factory, and feature coverage. Verification: 539 tests / 3095 assertions, PHPStan level 9 clean, Pint applied. Next: the next Phase 2 master-data module in roadmap order. |
| 2026-08-26 | **Bill of materials CRUD vertical complete.** Added the §15.4.5 contract and versioned recipe API with nested item creation/replacement, UUID relation resolution, archive lifecycle, transactional audit logging, permissioned routes, factory, and focused feature coverage. Verification: 543 tests / 3117 assertions, PHPStan level 9 clean. Next: Warehouses. |
| 2026-08-22 | Consistency pass: document count stated as 7 canonical + 5 supporting; §5 renumbered to Phase 0 item 5; the Phase 1 gate now requires items **1–5** (dependency reconciliation is a hard gate, since the Phase 1 exit criteria cannot be verified without the missing test, mock and Storybook tooling). |
| 2026-08-23 | **Truth-up.** The file had drifted: it still described the prototype as living at the repository root, the backend as non-existent, and thirteen dependencies as absent — all three untrue. Records the monorepo restructure, the Laravel 13.26.1 skeleton, the six-file token cascade, the rebuilt `index.html` and boot loader, the closed dependency reconciliation, and per-file state for all eight UI primitives. Former §3.2 (outstanding) split into §3.2 complete / §3.3 outstanding, renumbered 1–6. Added §4.2 (the twelve Modal defects) and §8 (a settled-constraints table so a new session resumes without re-deriving them). |
| 2026-08-23 | **Phase 0 code items closed.** §3.3 items 1–6 marked complete. All 9 `ui/` files rebuilt (Modal, Feedback, Navigation (new), Tabs, FormElements, KPICard, PWAInstallBanner, Button, Badge) — each token-only, lucide v1-correct, no dynamic classes, no primitive colours. Modal: all 12 defects resolved (useId, focus trap + restore, inert, m.* motion, token classes, isDirty, hideHeader for ConfirmDialog). Motion provider installed in `main.tsx` (`LazyMotion` + `MotionConfig` + `reducedMotion`). `useGsap.ts` created (lazy-loaded, `gsap.context()` + `ctx.revert()`). `ErrorBoundary.tsx` rewritten to four-level model, de-tenanted. `registerSW.ts` de-tenanted. `lib/utils.ts` delocalised to `cn()` only. New file: `Navigation.tsx` (Pagination extracted from Feedback). Tooling configs added: `eslint.config.js` (flat config — typescript-eslint + react-hooks + react-refresh + jsx-a11y; this entry originally named it `.eslintrc.js`, which never existed), `.dependency-cruiser.cjs`, `vitest.config.ts`, `.storybook/main.ts` + `preview.ts`, `.prettierrc`. TS strict flags added to `tsconfig.app.json`. CI skeleton: `.github/workflows/ci.yml` (lint, typecheck, test, build & bundle budget, depcruise). §7 items 1–8 complete. |
| 2026-08-23 | **§8 state-matrix primitives complete.** Seven new/modified files implementing the UI_SYSTEM.md §8 reliability layer. `lib/api/errors.ts` — `ApiError` branded object, `ErrorCode` closed union (42 server + 4 client codes), `normalizeError`, `isCancelled`/`isFixable`/`isSessionProblem`/`isPermissionProblem`/`isUserRetryable` predicates. `lib/observability/logger.ts` — ring buffer (50 entries) + localStorage mirror, `logBoundaryError`/`logApiError`/`logEvent`, `installGlobalErrorHandlers` (unhandledrejection + window.error), `useSyncExternalStore`-shaped subscribe/snapshot. `ui/Feedback.tsx` updated — `useDelayedFlag` (120ms skeleton gate), `Spinner` (icon-replacement, no layout reflow), `ProgressBar` (discriminated union, real values only), `RefetchBar` (2px top rail, CLS 0), `EmptyState` row 3+4 via `secondaryAction`. `patterns/StateView.tsx` — canonical state registry keyed by `ErrorCode`: icon, tone, heading, body copy, actions for rows 3,4,9,11,12,13,14,15; falls back to `INTERNAL_ERROR` for unregistered codes. `patterns/QueryBoundary.tsx` — declarative shell for TanStack Query lifecycle: pending (120ms-gated skeleton) → error (StateView) → empty (EmptyState/EmptyFilterState) → children; cancelled requests silently ignored. `ErrorBoundary.tsx` rebuilt — four levels (`GlobalBoundary`, `RouteBoundary`, `SectionBoundary`, `WidgetBoundary`), wired to `logBoundaryError` (correlation id, route, user/tenant id, component stack), stack traces gated on `import.meta.env.DEV`, `onReset` prop for custom recovery, safe copy only in production. `ui/AsyncButton.tsx` — managed async mutation button: idle → submitting (Tier 3 spinner) → success flash (1.5s, `CircleCheckBig`) → error (inline, `role="alert"`); controlled or uncontrolled. `patterns/LogInspector.tsx` — diagnostic log viewer on real `Modal` (focus trap, Escape), `useSyncExternalStore` over logger ring buffer, level filter, clear, scrollable list, dev-only stack traces. `main.tsx` wired: `installGlobalErrorHandlers()` before React mount. §7 items 9–17 complete. |
| 2026-08-23 | **The last two undelivered states: rows 2/20 and row 5's transient half.** Both were cases of the documentation being ahead of the code, which is the failure mode §8.5 rule 10 exists to catch. (a) `patterns/QueryBoundary.tsx` — its own header contract already promised "refetching with stale data → RefetchBar + dimmed children", but the component had no `isFetching` input and never rendered `RefetchBar`. Combined with `placeholderData: previous` landing in `queryClient.ts` the previous commit, a background refetch had become **completely invisible**: the data silently changed under the user with no signal at all. Added the `isFetching` prop, a `withRefetchRail` wrapper shared by the data path *and* both empty paths (a refetch over an empty list is precisely when a user is waiting for a row to appear), and gated §7.5's 60% dim behind `useDelayedFlag(isFetching && status === 'success', 1000)` — a 200 ms refetch that dims and undims reads as a flicker, which is worse than showing nothing, so below 1 s the 2 px rail carries the signal alone. The dim is opacity-only, never `display`/`visibility`, so stale rows stay readable and selectable while they refresh. (b) `ui/Toast.tsx` — Sonner was installed and the `--toast-*` component tokens existed, but no `Toaster` had ever been mounted, so row 5's transient variant had no surface whatsoever. Sonner is now wrapped so nothing else imports it: `unstyled` and `richColors={false}` are forced (rich colours are the single largest source of untokenised colour in a Sonner install), `theme="light"` prevents Sonner resolving a colour scheme through `matchMedia` when dark mode here is class-based token re-mapping, and per-type background classes are left empty on purpose — the icon carries the semantic, because a tinted panel per outcome makes the genuinely rare error toast indistinguishable from routine confirmations. `notify.error` is pinned to `duration: Infinity`: §8.5 rule 2 forbids hiding an error, and a self-dismissing error is a hidden error for anyone who looked away. Mounted as a **sibling** of `<App />` inside `QueryClientProvider`, so a route boundary tearing down cannot take an in-flight confirmation with it. One defect caught in post-write verification: `TOAST_CLASS` used `border-border`, which typechecks cleanly and emits **no CSS** — the utility is `border-default`. Because the token cascade enforces by omission, a mistyped semantic utility fails as silently as a forbidden primitive one, so the built stylesheet was grepped to confirm `width:var(--toast-width)`, `.border-default{` and `.animate-indeterminate{` all emit. Typecheck and `vite build` clean. §7 items 21–22 complete; the state matrix has no unimplemented rows left. |
| 2026-08-23 | **The tooling gate made real, and Phase 0 closed.** Every quality gate this file had been claiming was audited by running it. Seven of ten were broken, and the pattern was uniform: a dependency in `package.json` or a job name in `ci.yml` is a *claim*, not a capability. (a) **CI would have failed on the first push, four ways.** `npm ci` ran in `frontend/`, which has no lockfile — this is an npm workspaces monorepo and the only lockfile is at the root. The `test` leg invoked a suite that did not exist. There was no PHP job at all, so `phpstan.neon` and `pint.json` being absent was invisible. The "build & bundle budget" job contained a `# TODO` where the budget check should be, making the job name a lie. Rewritten to 3 jobs / 9 legs, each with a locally reproducible equivalent recorded in the new **§3.4**. (b) **A backend ordering hazard, found by reading the manifest rather than the workflow.** `config.optimize-autoloader` is true and `post-autoload-dump` runs `artisan package:discover`, which *boots the application* — but `cp .env.example .env` was gated behind `if: matrix.task == 'test'`, so `lint` and `analyse` would have booted with no `.env`. `.env` now precedes `composer install`, `--no-scripts` is gone (one install now produces both the optimized autoloader and the discovery cache), and `key:generate` runs on every leg because Larastan boots the container for `checkModelProperties`. The load-bearing assumption was then verified empirically instead of trusted: `APP_KEY="" php artisan package:discover` exits 0. (c) **The PHP floor was a constraint a real `composer install` would have rejected.** `composer.json` declared `^8.3` while `vendor/composer/platform_check.php` enforces `>= 8.4.1`, because the installed Symfony 8.1 tree hard-requires it — and `DECISIONS.md` ADR-003, `PROJECT_CONTEXT.md` and `README.md` all said 8.5. Raised to `^8.5`, and `ExampleTest.php` now *reads the floor out of the manifest* so the declaration, the test and CI's version pin cannot drift again. (d) **128 frontend tests across 7 files**, covering the whole reliability layer written in the two previous entries. `passWithNoTests` is deliberately off: an empty suite exiting 0 is a green badge that proves nothing, which is the same failure mode §8.5 rule 1 bans in the UI. Two real defects surfaced immediately — a raw `’` in an `ErrorBoundary` JSX text node, and `Go back` bypassing `handleReset` — neither of which any amount of re-reading the file had caught. (e) **`check-bundle-budget.mjs`** parses `dist/index.html` rather than globbing `dist/assets`, so it keeps working once route splitting lands; initial JS measures **109.7 kB against the 250 kB ceiling**. It also resolves a genuine doc drift: `UI_SYSTEM.md` §16 states ≤ 200 kB while claiming to restate `ARCHITECTURE.md` §6.10's ≤ 250 kB, so the script *fails* on rank 3 and *warns* on rank 4, per the `README.md` §2 precedence table. (f) **`format:check` was unusable** — 27 files drifted, and the first fix attempt was wrong: running `--write` over the repo reformatted the approved `docs/`. Reverted, added `.prettierignore` (docs are approved artefacts; the only proposed change was markdown-table cell padding with byte-identical rendered output), and re-scoped the root globs to `frontend/src`, `frontend/scripts` **and `.github/workflows/*.yml`**. That last path matters: `ci.yml` failed the check on three single-quoted scalars, because root Prettier has no `.prettierrc` and defaults to double quotes while `frontend/.prettierrc` does not reach outside `frontend/` — and the first version of the glob did not cover the workflow at all, so the gate would have gone green while the file it gates stayed unformatted. `npm run verify` now leads with `format:check` for the same reason: a gate that only CI runs is a gate you discover after pushing. (g) The dead `test:a11y` script was **deleted rather than fixed**: `axe-core` is installed but has no integration, and a script that proxies to nothing is worse than an absent one. It returns in Phase 1 where `ROADMAP.md` line 172 requires it. One gate cannot run on this machine and is recorded as such rather than quietly skipped: `dependency-cruiser@18` supports Node `^22 \|\| ^24 \|\| >=26` and this machine runs 25.1.0, so the CI pin to Node 22 is what makes that leg meaningful. §7 items 23–24 complete. **Phase 0 is closed**; the next action is Phase 1 migrations per `DATABASE_DESIGN.md` §16. |
| 2026-08-23 | **Phase 1 Wave 1 (platform) written and verified — and the approved schema needed a correction to be implementable.** Wave 0 turned out to require **no work**: §16 lists it as the framework tables, and Laravel's three default migrations already create `users` (stub), `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `sessions` and `password_reset_tokens`; the only absentee, `personal_access_tokens`, is Sanctum's and is never created because ADR-007 uses JWT plus `refresh_tokens` (Wave 3). This is now `DATABASE_DESIGN.md` §16.1 rule 0. Three surfaces had said the next action was "wave 0 tenancy migrations" — §7 item 25, §8 and `README.md` §8 — which conflated the framework wave with the platform wave; all three are corrected. Six migrations written (`plans`, `tenants`, `tenant_subscriptions`, `tenant_usage_counters`, `settings`, `feature_flags`), detailed per-table in **§4.6**. The substantive finding: **`settings (tenant_id, scope, scope_id, group, key)` and `feature_flags (tenant_id, key)` cannot be implemented literally.** Both keys contain nullable columns, and on MySQL 8 and SQLite alike `NULL != NULL` inside a UNIQUE index — so the *platform-default* row, which §13.3 makes the final fallback of the entire settings resolution order and which is precisely the row that must never be ambiguous, was the **least** protected row in the table: unlimited duplicates, silently. Resolved with STORED generated columns (`tenant_key`, `scope_key`) folding `NULL` to `0` and moving the unique key onto them. Raised in `DATABASE_DESIGN.md` §13.3 as a dated correction block with the MySQL DDL rather than patched silently, because the next reader of that spec would otherwise re-introduce the defect. `tenant_usage_counters.value` is a deliberate departure from §1's `DECIMAL(18,4)` quantity rule — quota counts are discrete and mutated by atomic increments, and a fractional quota is meaningless — recorded in the migration docblock. `tests/Feature/Database/Wave1PlatformSchemaTest.php` (11 tests) asserts the contract **behaviourally**: it deliberately does *not* inspect index metadata, because a unique index that can never fire would satisfy such an assertion — that is exactly the defect that was present. Every uniqueness claim is proved by attempting the duplicate insert and requiring rejection, and the driver's message is regex-matched so a `NOT NULL` violation from a typo'd fixture cannot masquerade as an enforced constraint (two tests were *risky* with 0 assertions until this was added). The NULL finding itself is pinned on a scratch table by a test that **reproduces** it and will fail loudly if the workaround ever stops being necessary. It also scans every migration file for `->float(`, `->double(` and `->enum(`, so §1's money and enum rules are enforced for every wave still to come. Two real PHPStan level-9 findings were fixed properly rather than suppressed: a `mixed`-to-`string` cast was removed by generating the uuid at its source, and a non-exhaustive `match` was removed by narrowing the PHPDoc to `'unique'\|'foreign'` — exhaustive by construction, with no unreachable `default`. Verified: `migrate:fresh` ✅ (9 migrations), `migrate:rollback --step=6` then re-migrate ✅ (§16.1 rule 6), `pint` PASS 33 files, `phpstan` level 9 **[OK]**, `artisan test` **13 passed / 73 assertions**, `composer check` green end to end. §7 item 25 complete. |
| 2026-08-23 | **Phase 1 Wave 2 (org) written and verified — the wave where tenant isolation becomes a *schema* promise, and where two more defects fell out of exercising it.** `companies`, `branches`, `factories`, `production_lines`, detailed per-table in **§4.7**. These are the first tenant-scoped tables that reference each other, which makes them the first real test of ARCHITECTURE §3.1 layer 4: *the database* rejects a cross-tenant reference. A single-column `company_id` FK cannot do that — it proves only that the company row exists, not that it belongs to the caller's tenant — so every parent carries `unique (tenant_id, id)` and every child declares a composite FK on `(tenant_id, <parent>_id)`. That is not redundancy beside the PK; without it, layer 4 is an application convention wearing a foreign key's clothes. A test inserts a branch pointing at another tenant's company and requires rejection, so the claim is proved rather than asserted. **Finding 1: `ON DELETE SET NULL` is invalid on any composite key led by `tenant_id`.** `factories.branch_id` is genuinely optional, so `nullOnDelete()` looked correct and `migrate:fresh` accepted it — but `SET NULL` nulls *every* column of the referencing key, and `tenant_id` is `NOT NULL`, so deleting a referenced branch failed with `NOT NULL constraint failed: factories.tenant_id`: neither a clean detach nor a clean rejection, just a confusing error at an unrelated call site. Changed to `restrictOnDelete()` and promoted to a general prohibition in `DATABASE_DESIGN.md` §1.3 with a dated correction block, because a nullable child column invites this mistake in every later wave. The guard is `assertDeleteRejectedByForeignKey`, which **distinguishes the two failure modes** — both `RESTRICT` and broken `SET NULL` refuse the delete, so a test asserting only "it threw" passes on the defective schema. The guard was then **seen red before being trusted**: the migration was temporarily reverted to `nullOnDelete()`, the test re-run, and it failed naming §1.3 exactly as intended, after which the fix was restored. A test that has never failed is an unproven test. **Finding 2: `production_lines.capacity_unit_id` targets `units`, which is Wave 5.** §16.1 rule 2's closure waves (9 and 25) exist for *circular* pairs; a plain forward reference had nowhere to be recorded, so it would simply have been forgotten. §16.1 now carries a deferred-forward-reference table, the index is pre-created so Wave 5 needs no `ALTER` (rule 5), and a test asserts `units` does **not** exist yet — it fails the moment the table appears, which is the only moment the reminder is useful. A pleasing symmetry with Wave 1: that wave's finding was that a nullable column inside a UNIQUE index cannot protect the row where it is NULL; this wave *uses* that behaviour deliberately, because `unique (tenant_id, is_default)` would also forbid a second **non**-default row, whereas a stored generated column folding to NULL unless `is_default = 1` expresses "at most one default" exactly. A test additionally proves the column is **read-only** — an `UPDATE` writing it throws — so no future Action can maintain the sentinel by hand and let it drift from its flag. `branches.default_key` folds to `company_id`, not `tenant_id`, because a tenant with three companies needs a default branch in each. Wave 1's fixtures moved into a new `SchemaTestCase` base so a later wave inserts its parents the way the wave that owns them proved they must be inserted, rather than re-deriving the columns from the migration and drifting; `Wave1PlatformSchemaTest` was refactored onto it (11 tests, now 76 assertions). `columnValue()` narrows `DB::table()->value()` once, since `mixed` cannot be cast at PHPStan level 9 and one typed helper beats an `assert()` at every call site. The scratch `probe.php` used to run these experiments was deleted — both probes are now permanent tests. Verified: `migrate:fresh` ✅ (13 migrations), `migrate:rollback --step=4` then re-migrate ✅ (§16.1 rule 6), `pint` PASS 39 files, `phpstan` level 9 **[OK]**, `artisan test` **30 passed / 145 assertions** with none risky. §7 item 26 complete. Next: Wave 3 identity, where `users.email`'s **global** unique must be reconciled with §1.1 tenant scoping. |
| 2026-08-23 | **Phase 1 Wave 3 (identity) written and verified — the wave where a schema defect stops being a reporting error and becomes a privilege escalation.** Seven migrations detailed per-table in **§4.8**: `users` finalised, `permissions`, `roles`, `role_permission`, `role_user`, `user_scopes`, `refresh_tokens`. §7 item 27's explicit question — reconcile `users.email`'s **global** unique with §1.1 tenant scoping — is answered, and the answer is that neither documented form works: a global key forbids two tenants from employing the same person, and `unique (tenant_id, email)` cannot enforce itself, because `tenant_id` is nullable for platform users and `NULL != NULL` inside a UNIQUE index. That would have left **platform accounts** — the one account type whose duplication matters most — freely duplicable. The key is on a generated sentinel `tenant_key = coalesce(tenant_id, 0)`, the same fix Wave 1 applied to `settings`, now generalised into `DATABASE_DESIGN.md` §1.1 with the rule that a sentinel solves **uniqueness only**. **The wave's substantive finding has no schema fix at all.** A composite foreign key is **not checked** when any of its columns is `NULL` — MATCH SIMPLE, the only mode MySQL 8 and SQLite implement — so on a `NULL`-tenant `role_user` row *neither* composite key fires and the database will accept a **platform role grant pointing at an ordinary tenant user**: precisely the escalation the composite keys were added to prevent. Every candidate fix was tried and rejected on evidence: a `CHECK` spanning three tables is inexpressible, SQLite cannot add a trigger through `ALTER`, and MySQL 8 **rejects foreign keys on virtual generated columns**, so the sentinel trick does not transfer from uniqueness to referential integrity. `DATABASE_DESIGN.md` §1.3 therefore gained three rules rather than a patch: prefer `tenant_id NOT NULL` on any table that *grants* something (applied immediately — `user_scopes` is NOT NULL for exactly this reason); where nullability is forced, the Action asserts both sides are platform inside the transaction, which is **the one documented case in this system where the database is not the last line of defence**; and the gap is pinned by a test that asserts the **hole**. That test is flagged in the class docblock and carries its own replacement instructions: if it ever fails, the engine has started enforcing something it documents as unenforced, and the test must be *replaced* by one asserting the rejection, never deleted. **Two SQLite limits were measured, and the first measurement was wrong.** An initial probe reported `ALTER TABLE ... ADD COLUMN ... NOT NULL` (no default) and `... GENERATED ALWAYS AS (...) STORED` both accepted; re-probing against a table containing one row gave `Cannot add a NOT NULL column with default value NULL` and `cannot add a STORED column`. The earlier acceptance depended entirely on the table being **empty** — which is why the sentinels here are `VIRTUAL` (accepted, indexable, recomputes for existing rows, equally read-only), and why §16.1 rule 1's licence for `users` to be built in two steps is now recorded as *bounded*: it is safe only because rule 3 forbids migrations from writing data, so the table is guaranteed empty when the second step runs. It is not a general licence to backfill a live table. Reversibility got the same treatment: `migrate:rollback --step=7` reporting seven clean DONEs is where verification usually stops, but for the one two-step table §16.1 rule 6 requires the Wave 0 stub to be restored *exactly*, or a second `migrate` builds a different table than the first. Probed: 8 columns with none of the 16 additions surviving, `users_email_unique` the sole index, and that key actually rejecting a duplicate. The generated columns are dropped **before** `tenant_id`, since a generated column cannot outlive the column its expression reads. `refresh_tokens.replaced_by_id` cascades the opposite way from its name — deleting a newer token deletes the older rows pointing at it, which is what the nightly purge of an expired rotation chain needs — pinned by a test whose failure message says so, because `RESTRICT` there would break the purge on whichever row order the driver happens to produce. One test documents why `created_by` is the wave's only single-column reference to `users`: a platform admin has no tenant, so a composite key would be unenforced on exactly the rows where knowing the actor matters most and would reject a support action outright the rest of the time; `created_by` records *who acted*, it grants nothing. `Wave3IdentitySchemaTest` is **20 tests / 55 assertions**, with fixtures for all seven tables added to `SchemaTestCase` so Wave 4 inserts an identity parent the way this wave proved it must be inserted. A PHPStan level-9 `nullCoalesce.offset` complaint in `permissionAttributes()` was fixed by recognising the defaults were themselves the hazard, not by adding a guard that kept them: `explode()` always yields index 0, so `?? 'core'` was dead code — but `?? 'resource'` and `?? 'view'` were worse than dead, since they would have silently manufactured a permission row whose `name` disagreed with its split columns, the exact defect the helper exists to prevent. It now fails the test on a malformed name. **A recorded count was caught going stale in the same session it was written.** `composer check` reported 221 assertions against a recorded 145, a gap of 76, while the isolated Wave 3 run measured 55. Rather than reconcile arithmetically, each suite was re-run individually: `Wave1PlatformSchemaTest` had moved 76 → **97** — same 11 tests, in a file never touched — because its migration scanner iterates every file in `database/migrations` × 3 forbidden tokens, so seven new migrations added exactly 21 assertions. 97 + 60 + 55 + 9 = 221, reconciled exactly. That coupling is now recorded in §4.5 and §8: backend counts must be **re-measured, never carried forward**. The scratch `probe.php` was deleted. Verified: `migrate:fresh` (20 migrations) ✅, `migrate:rollback --step=7` then re-migrate ✅, `pint --test` **PASS 47 files**, `phpstan` level 9 **[OK]**, `artisan test` **50 passed / 221 assertions** with none risky. §7 item 27 complete. Next: Wave 4 infrastructure. |
| 2026-08-23 | **Phase 1 Wave 4 (infrastructure) written and verified — the first wave whose load-bearing decisions live in *omitted* columns rather than in keys.** Seven migrations detailed per-table in **§4.9**: `audit_logs`, `idempotency_keys`, `attachments`, `notifications`, `notification_preferences`, `document_sequences`, `activity_snapshots`. Waves 1–3 were about which keys exist; this wave is about which columns deliberately do **not**, so four of its tests assert that a missing value is *refused* rather than defaulted — a table that accepts an incomplete row is a table whose contract is a suggestion. `audit_logs` has no `updated_at`, no `deleted_at` and no database default on `created_at`, because ADR-027 makes it append-only and a default would let a row be written by code that never decided when the event happened. `notifications` has no `status` column: state is **derived** from `sent_at` / `read_at` / `failed_at`, since a status column and the timestamps it summarises drift, and the timestamps are the facts. **Finding 1 — a rank-4 contradiction, resolved against the schema spec.** `DATABASE_DESIGN.md` §3 specified `idempotency_keys` unique `(tenant_id, key)` while `API_CONTRACT.md` §6.2 scopes a key to `(tenant_id, user_id, route, key)`. Both are rank 4, so per `README.md` §2 this is a rank-1 problem rather than a judgement call, and it was resolved in §6.2's favour on consequence: under the narrow key two users of one tenant who generate the same UUID **share a row**, and §6.3's replay rule then returns one user's stored response body to the other — a cross-user data exposure inside a single tenant, reached without any bug in the isolation layers. The key is now `(tenant_id, user_id, endpoint, key)` and `user_id` is NOT NULL, because a nullable column in a unique key protects nothing (Wave 1 and Wave 3's lesson, third occurrence). §3 carries a dated correction block, and the behaviour is pinned by `test_one_idempotency_key_may_be_reused_across_routes_and_users`, which inserts four rows sharing one `key` and **names the data-exposure path in its failure message**, so the key cannot be quietly narrowed back as a "simplification". **Finding 2 — the sentinel defect again, this time with financial blast radius.** `document_sequences` was specified unique `(tenant_id, company_id, branch_id, document_type)`, and both scope columns are nullable because §19's open question Q3 leaves invoice numbering per-company or per-branch undecided, with the provisional tenant-wide series being exactly the `(NULL, NULL)` row. That row is therefore the one the documented key **cannot** protect: a tenant could hold two `INVOICE` series, and §1.4's `FOR UPDATE` lock would be taken on whichever the driver returned — issuing **duplicate document numbers on posted financial documents**, not merely a wrong report. Fixed with the §1.1 STORED sentinels `company_key` / `branch_key` and the unique key moved onto them; §3 carries a dated correction block. Q3 itself was **not** answered here — `test_a_series_may_be_scoped_to_a_company_or_a_branch` proves all three scope shapes still insert, so the schema does not pre-empt a decision that belongs in `DECISIONS.md`. Answering an open question in a migration is a process violation. **Finding 3 — the wave where Wave 3's unfixable hole paid for itself.** §1.3's amendment ("prefer `tenant_id NOT NULL` on any table whose rows *grant or suppress* something") is why `notification_preferences.tenant_id` and `idempotency_keys.user_id` are NOT NULL rather than nullable-for-platform-rows: a preference row **suppresses** a notification and a key row **replays** a response, so a NULL there disables the composite FK check on precisely the rows that decide whether someone is told about something or handed someone else's data. `audit_logs` and `notifications` keep nullable tenant columns because those rows grant nothing, which is the distinction the amendment draws rather than a blanket rule. **Finding 4 — a documented approximation instead of a hidden one.** `activity_snapshots.snapshot_date` is the **tenant-local** day, since a dashboard reading "today" must mean the operator's today; the consequence is that rows sharing one `snapshot_date` across tenants do not describe the same wall-clock interval, so a platform-wide cross-tenant sum for a single date is an approximation and §13.3 now says so, because an undocumented approximation becomes a bug report later. The same section records the cache-vs-evidence contrast this wave turns on: a snapshot row is arithmetic and must be rewritable, an audit row is evidence and must not be. Both `audit_logs` FKs are `RESTRICT`, deliberately overruling §1.3's CASCADE-for-children guidance because it is the only row that outlives its subject — with the product consequence, now written into §3, that **a user who has done anything can never be hard-deleted, and neither can their tenant**; offboarding is an explicit archive-then-purge Action, never a `DELETE`. Every composite FK in the wave is `RESTRICT` or `CASCADE`, never `nullOnDelete()`, per Wave 2's §1.3 prohibition. `Wave4InfraSchemaTest` is **27 tests / 74 assertions**, including `test_an_audit_row_survives_the_deletion_of_its_actor`, `test_a_queued_notification_is_distinguishable_from_a_failed_one`, `test_the_sequence_scope_sentinels_are_derived_and_never_written`, `test_a_snapshot_metric_cannot_be_silently_omitted`, and `test_every_wave_4_table_is_tenant_scoped` checked against §15's six-exception list rather than a hand-written one. `SchemaTestCase` gained six fixture builders and a `notnull` constraint mode, so a NOT NULL rejection can no longer masquerade as an enforced unique key. **One gate produced a false red, and it was the harness, not the code.** `php vendor/bin/phpstan analyse --no-progress` died with *"PHPStan process crashed because it reached configured PHP memory limit: 128M"* and *"Result is incomplete because of severe errors"* — exit 1, which reads exactly like a level-9 finding. `composer.json` already defines `analyse` as passing `--memory-limit=1G`; re-run correctly it is **[OK] No errors**. Recorded in §8: run PHPStan through `composer analyse`, never the bare binary, because an incomplete analysis reporting failure is worse than one reporting nothing. The predicted scanner drift was measured rather than inferred and landed exactly: `Wave1PlatformSchemaTest` moved 97 → **118** on seven new files × 3 tokens, in a file nobody edited. Verified: `migrate:fresh` ✅ (27 migrations, 29 DONE lines, no `FAIL`/`Exception`/`SQLSTATE`), `migrate:rollback --step=7` clean and then a second rollback of Wave 3 clean too before re-migrating all 27 (§16.1 rule 6), `pint` **PASS 55 files**, `phpstan` level 9 **[OK]**, `artisan test` **77 passed / 316 assertions** with none risky; per-suite Wave 1 11/118, Wave 2 17/60, Wave 3 20/55, Wave 4 27/74. §7 item 28 complete. **Twenty-four of §15's 159 tables now exist.** Next: §7 item 29 — the tenancy runtime (`app/Core`, `BelongsToTenant`, `ResolveTenant`, the three route files), which every later endpoint depends on and none may precede. |
| 2026-08-23 | **Tenancy runtime (§7 item 29) — contract confirmed and build order fixed; no code written yet.** This session was specification-reading and starting-point verification only, so the ledger records a plan, not a delivery. **Starting point, verified by inspection not memory:** `backend/app/` contains only `Http/Controllers/Controller.php`, `Models/User.php`, `Providers/AppServiceProvider.php` — `app/Core`, `app/Modules`, `app/Support` **do not exist**; `backend/routes/` has only `console.php` and `web.php` — none of the three ARCHITECTURE §2 route files exist; `bootstrap/app.php`'s `withRouting()` has **no `api:` argument and no `then:` closure**, so even if the route files existed they would not load; `withMiddleware()` is an empty closure, so none of the §5.1 chain exists; `withExceptions()` already forces JSON for `api/*` but has **no `render` mapping**, so nothing yet emits the §2.3 envelope; `config/auth.php` defines only a **session** guard, so ADR-007's JWT `api` guard must be created before `Authenticate` can bind. `app/Models/User.php` still declares none of the 16 tenancy columns Wave 3 added, which `checkModelProperties` will flag the moment it is used in typed code — it needs `BelongsToTenant`, `SoftDeletes` and a full `@property` block. |
| 2026-08-23 | **Tenancy runtime (§7 item 29) written, verified, and passing all quality gates.** All 7 steps in the fixed build order delivered: (1) `app/Core/Tenancy/TenantContext.php` (request-scoped singleton with explicit `bind`, `current`, `isBound`, `flush`, and whole-tenant vs branch/factory/warehouse scope checks), `app/Core/Tenancy/Exceptions/` (`TenantSuspended`, `OutOfScope`, `TenantMismatch`), and `app/Core/Actions/Action.php` base contract wrapping logic in `DB::transaction()`; (2) `app/Core/Tenancy/Concerns/BelongsToTenant.php` trait with global `tenant` scope, `creating` hook stamping guarded `tenant_id`, and `scopeWithoutTenantScope` with mandatory `Log::warning` audit emission; (3) middleware runtime `CorrelationId`, `ResolveTenant` (resolving JWT claim, loading tenant row & scopes, rejecting body tenant_id mismatch with 403 & security log), `EnsureTenantActive` (read-only allowed for `past_due`/`suspended`, mutation rejected with 402 `TENANT_INACTIVE`); (4) centralized exception mapping in `bootstrap/app.php` via `ErrorResponse` formatting into §2.3 envelope for AuthenticationException, ValidationException, ModelNotFoundException, AuthorizationException, tenancy exceptions, and 500 fallback with debug stack gating; (5) `config/auth.php` JWT `api` guard stub; (6) route files `routes/api_public.php`, `routes/api_tenant.php`, `routes/api_platform.php` wired into `bootstrap/app.php`; (7) tests in `tests/Feature/Tenancy/TenancyRuntimeTest.php` proving (a) layer-5 schema isolation between two tenants, (b) `withoutTenantScope()` warning log emission, (c) `TenantContext::current()` unbound throws `RuntimeException`. Verified: `pint --test` **PASS**, `phpstan` level 9 **0 errors**, `artisan test` **80 passed / 324 assertions** (3 new tests / 8 new assertions). §7 item 29 complete. Next: §7 item 30 — Wave 5 Master Data A. |
| 2026-08-23 | **Truth-up for the tenancy-runtime delivery, and a stale forward-reference wave corrected.** The 2026-08-23 tenancy-runtime delivery entry above had updated §1's phase rows, §2 and the change log, but several surfaces still described the runtime as the *outstanding* next action and still quoted the pre-runtime count. Reconciled to reality against a clean tree at commit `781e4da` with `artisan test` re-run to **80 passed / 324 assertions**: §1 `Current phase` (runtime now listed complete, not outstanding), `Next phase` (now §7 item 30 — Wave 5) and `Backend` (`app/Core`, `BelongsToTenant`, `ResolveTenant` and the three route files listed present; only `app/Modules`/`app/Support` and all feature code absent); §4.4's "Absent — all of Phase 1" list split into a present-runtime block and a narrowed absent block; §4.5's header count `77/316 → 80/324`, a `TenancyRuntimeTest` row (3 tests) added to the suite table, and its closing paragraph de-gated from item 29; §8's resume paragraph re-pointed from item 29 to item 30 with Wave 5's six tables and the Q2 do-not-pre-empt caution. The table count stays **24** — Wave 5 is **not** started, the git tree carries no `1025xx` migration and no `Wave5*` test, so item 30 stays ⬜. One latent error fixed while here: §7 item 30 said `units` closes the `production_lines.capacity_unit_id` forward reference "in Wave 9", but `DATABASE_DESIGN.md` §16.1 rule 2 (and §4's own Wave 2 finding) put the closure in **Wave 5** — Waves 9/25 are for *circular* pairs, and a plain forward reference has no separate closure wave. Corrected to Wave 5, noting the index is already pre-created so the closure is a new `ADD` composite-FK migration, not an `ALTER`. No code changed; docs only. |
| 2026-08-24 | **Phase 1 Wave 5 (master data A) written and verified — the first wave where the schema as documented was implementable without amendment.** Seven migrations: `units`, `unit_conversions`, `categories`, `brands`, `tax_profiles`, `reason_codes` (migrations `102500`–`103000`), and `103100` closing the deferred `production_lines.capacity_unit_id` FK from Wave 2. Detailed per-table in **§4.10**. All six tables are tenant-scoped leaf catalogues (`unique (tenant_id, id)` on each so child tables can declare composite FKs) with `RESTRICT` deletes. `unit_conversions` has composite FKs on **both** `from_unit_id` and `to_unit_id` — a test proves each side independently rejects a cross-tenant unit, because a one-sided test would pass on a table that only checks one column. `categories` is self-referential: `(tenant_id, parent_id) → categories(tenant_id, id)` with `RESTRICT`, and MATCH SIMPLE means a `NULL parent_id` root is not checked (correct semantics). `tax_profiles.rate` is `DECIMAL(8,4)`, type is `VARCHAR(32)` (not ENUM) — open question Q2 is still open and both `inclusive` and `exclusive` must insert, proved by test. `reason_codes` context vocabulary (`qc_defect` \| `wastage` \| `stock_adjustment` \| `sales_return` \| `purchase_return` \| `cancellation` \| `rework`) is similarly left as `VARCHAR(32)` rather than locked by an ENUM. The deferred FK closure (`103100`) required no column `ALTER` because the index `ix_production_lines_tenant_capacity_unit` was pre-created in Wave 2; only the `ADD FOREIGN KEY` was needed. The Wave 2 placeholder test `test_the_deferred_capacity_unit_foreign_key_is_still_owed` was replaced in `Wave2OrgSchemaTest` by a live enforcement test proving a cross-tenant `capacity_unit_id` is rejected. **One defect in the test, caught before green:** `reason_codes` was initially classified as a leaf table (no `softDeletes`) when it is in fact tenant-configurable catalogue data that must be deactivatable without breaking historical references. Corrected before the suite was declared green. `SchemaTestCase` gained twelve new methods (six insert/attributes pairs). `Wave5MasterDataASchemaTest` — **23 tests**. Verified: `migrate:fresh` ✅ (34 migrations) · `pint lint:fix` **PASS** · `phpstan` level 9 **[OK] No errors** · `artisan test` **103 passed / 456 assertions**, none risky. §7 item 30 complete. Next: §7 item 31 — Wave 6 (master data B). |
| 2026-08-24 | **Phase 1 Wave 6 (master data B) written and verified — the structurally richest wave so far, with the first CASCADE rule and the first versioned master-data table.** Five migrations: `products`, `product_variants`, `product_images`, `bill_of_materials`, `bill_of_material_items` (`103200`–`103600`). Detailed per-table in **§4.11**. `products` is the central catalogue ADR-016 designates as the single source of truth for every downstream wave; it carries six composite FKs (base/purchase/sales unit, category, brand, tax profile), all `RESTRICT`. `product_variants` adds SKU-level differentiation and a `price_delta DECIMAL(18,4)` for variant pricing. `product_images` is the first leaf table with no `deleted_at` — images have no independent lifecycle. `bill_of_materials` introduces the wave's first versioning constraint: `unique (tenant_id, product_id, version)` means two BoMs for one product need different version strings but two products may each claim version `'1'`. `bill_of_material_items` introduces the wave's first `CASCADE` delete: items are orphaned the moment their recipe is deleted and carry no independent meaning, which is the one case `DATABASE_DESIGN.md` §1.3 permits CASCADE; `input_product_id` remains `RESTRICT` because a raw-material product that feeds a BoM must not be silently deleted. **No schema corrections required** — the DATABASE_DESIGN.md §4 Group C spec was implementable without amendment. **Two test-infrastructure defects caught and corrected.** (a) `insertTenant()` was called with the raw array returned by `insertPlan()` rather than `insertPlan()['id']`. `insertPlan()` returns `array{id: int, uuid: string}` — the correct pattern, established in Wave 5, is `$plan = $this->insertPlan(); $t = $this->insertTenant($plan['id'], 'slug')`. All multi-tenant tests (Wave 6 uses 12 two-tenant isolation tests) applied the fix. (b) Three DECIMAL precision assertions used strict string equality (`assertSame('87.5000', ...)`) while SQLite strips trailing zeros on read, returning `'87.5'`. The canonical fix from Wave 5's `assertSame(5.5, (float) $rate)` pattern is to cast to `float` before asserting: the cast proves the value round-tripped without precision loss (`87.5000 == 87.5` as float, but `87.4999 != 87.5`), so a rounding defect still fails. `SchemaTestCase` gained five fixture builder pairs. `Wave6MasterDataBSchemaTest` — **28 tests / 64 assertions**. Verified: `migrate:fresh` ✅ (39 migrations) · `pint lint:fix` **PASS** (binary operator spacing) · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **131 passed / 535 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests**, Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Tenancy runtime **3**, Unit+Example **2**. |
| 2026-08-24 | **Phase 1 Wave 7 (master data C) written and verified — first wave with an intra-wave deferred FK closure and a documented unique-key NULL hole.** Nine migrations: `warehouses`, `warehouse_locations`, `parties`, `party_addresses`, `party_contacts`, `price_lists`, `price_list_items`, `discount_rules` (`103700`–`104400`), and `104500` deferred FK closure. Detailed per-table in **§4.12**. `warehouses` has nullable composite FKs on `company_id`, `branch_id`, `factory_id` (all MATCH SIMPLE, RESTRICT) — a `NULL` scope column means tenant-wide warehouse. `warehouse_locations` is self-referential: `(tenant_id, parent_id) → warehouse_locations(tenant_id, id)` RESTRICT, same NULL-root pattern as Wave 5's `categories`. `parties` unifies suppliers, customers, dealers, agents into one row with independent boolean flags — no role occupies two rows. `party_addresses` and `party_contacts` both use **CASCADE** (child rows have no independent lifecycle). `price_lists` created at `104200` after `parties` at `103900`; the `parties.price_list_id` composite FK was therefore deferred to the `104500` closure migration — same resolution as Wave 5's `103100` but intra-wave. **Unique-key NULL hole documented:** the `price_list_items` key `(tenant_id, price_list_id, product_id, variant_id, min_quantity)` cannot prevent duplicates when `variant_id IS NULL` because `NULL ≠ NULL`; application layer must guard; two tests pin the behaviour. **One failing test corrected before green:** initial test assumed the NULL-variant duplicate would be rejected by the DB — it is not; split into a non-NULL-fires test and a NULL-hole pin test. `SchemaTestCase` gained eight fixture builder pairs. `Wave7MasterDataCSchemaTest` — **30 tests**. Verified: `migrate:fresh` ✅ (48 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **166 passed / 745 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests**, Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Tenancy runtime **3**, Unit+Example **2**. §7 item 32 complete. Next: §7 item 33 — Wave 8. |
| 2026-08-24 | **Phase 1 Wave 8 (HR identity) + Wave 9 (HR FK closure) written and verified.** Five migrations: `departments`, `designations`, `shifts`, `employees` (`104600`–`104750`), and `104900` deferred FK closure for three circular HR references. Detailed per-table in **§4.13**. `departments` has self-referential tree `parent_id` (RESTRICT) and company scoping `(tenant_id, company_id, code)` unique. `designations` has grade VARCHAR(32) and `(tenant_id, code)` unique. `shifts` stores TIME columns, `crosses_midnight` TINYINT flag (DATABASE_DESIGN invariant: attendance engine attributes to start date), and `(tenant_id, code)` unique. `employees` is the workforce record distinct from `users` (login record); `user_id` unique-when-set with documented NULL hole. Three circular FKs closed in Wave 9 (`104900`): `departments.head_employee_id`, `employees.reports_to_employee_id`, `employees.default_shift_id`. `SchemaTestCase` gained four fixture builder pairs. `Wave8HrIdentitySchemaTest` — **26 tests**. Three test fixtures fixed before green (company code column removal, users.uuid and users.status NOT NULL compliance). Verified: `migrate:fresh` ✅ (53 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **192 passed / 879 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests**, Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Tenancy runtime **3**, Unit+Example **2**. §7 item 33 complete. Next: §7 item 34 — Wave 10 (production). |
| 2026-08-24 | **Phase 1 Wave 10 (production) written and verified.** Eight migrations: `production_plans`, `production_plan_items`, `production_batches`, `material_issues`, `material_issue_items`, `production_batch_inputs`, `worker_production_entries`, `production_outputs` (`105000`–`105700`). Detailed per-table in **§4.14**. Spine of production chain implemented (ADR-011). `production_batches` implements ADR-012 invariant: `yield_percentage`, `variance_quantity`, `variance_percentage` strictly nullable with no default (NULL until `context_completeness` is `context_complete`). `worker_production_entries` implements ADR-013 with 6-column composite uniqueness key. Cascading child deletes verified for plan items, issue items, and batch inputs. `SchemaTestCase` gained eight fixture builder pairs. `Wave10ProductionSchemaTest` — **24 tests / 92 assertions**. Verified: `migrate:fresh` ✅ (61 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **216 passed / 995 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests**, Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Tenancy runtime **3**, Unit+Example **2**. §7 item 34 complete. Next: §7 item 35 — Wave 11 (QC). |
| 2026-08-24 | **Phase 1 Wave 11 (QC & wastage) written and verified.** Six migrations: `qc_parameters`, `qc_inspections`, `qc_inspection_results`, `qc_defects`, `wastage_records`, `rework_orders` (`106000`–`106500`). Detailed per-table in **§4.15**. `reason_codes` table in Wave 5 updated with missing `uq_reason_codes_tenant_id` on `(tenant_id, id)` enabling composite FK referential integrity for `qc_defects` and `wastage_records`. Cascade delete boundaries verified for inspection results and defects. `SchemaTestCase` gained six fixture builder pairs. `Wave11QcSchemaTest` — **24 tests / 73 assertions**. Verified: `migrate:fresh` ✅ (67 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **240 passed / 1086 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (136 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Tenancy runtime **3**, Unit+Example **2**. §7 item 35 complete. Next: §7 item 36 — Wave 12 (Ledger). |
| 2026-08-24 | **Phase 1 Wave 12 (Ledger & stock inventory) written and verified.** Three migrations: `stock_movements`, `stock_balances`, `stock_reservations` (`107000`–`107200`). Detailed per-table in **§4.16**. `stock_movements` is append-only ledger with 15 movement types and 5 stock states; immutable with `no deleted_at` and `no updated_at`. `stock_balances` is transactional cache with `no deleted_at` and 7-column composite unique cache slot enforced over stored generated sentinels (`variant_key`, `location_key`, `batch_key`) to eliminate NULL collision holes. `SchemaTestCase` gained three fixture builder pairs. `Wave12LedgerSchemaTest` — **18 tests / 47 assertions**. Verified: `migrate:fresh` ✅ (70 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **258 passed / 1142 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (145 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Tenancy runtime **3**, Unit+Example **2**. §7 item 36 complete. Next: §7 item 37 — Wave 13 (Stock ops). |
| 2026-08-24 | **Phase 1 Wave 13 (Stock operations) written and verified.** Six migrations: `stock_transfers`, `stock_transfer_items`, `stock_adjustments`, `stock_adjustment_items`, `stock_counts`, `stock_count_items` (`108000`–`108500`). Detailed per-table in **§4.17**. Cascading delete lifecycles verified for child line items while preserving `RESTRICT` on catalog references. `warehouseAttributes` fixture enhanced with auto-increment counter to avoid collision on multi-warehouse fixtures. `SchemaTestCase` gained six fixture builder pairs. `Wave13StockOpsSchemaTest` — **26 tests / 90 assertions**. Verified: `migrate:fresh` ✅ (76 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **284 passed / 1250 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (163 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Tenancy runtime **3**, Unit+Example **2**. §7 item 37 complete. Next: §7 item 38 — Wave 14 (Purchasing). |
| 2026-08-24 | **Phase 1 Wave 14 (Purchasing) written and verified.** Ten migrations: `purchase_requisitions`, `purchase_requisition_items`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `purchase_bills`, `purchase_bill_items`, `purchase_returns`, `purchase_return_items` (`109000`–`109900`). Detailed per-table in **§4.18**. Direct receipts enabled via nullable `goods_receipts.purchase_order_id`; service/expense non-catalog bills enabled via nullable `purchase_bill_items.product_id` and `unit_id`. Cascade delete boundaries verified across all 5 item tables while catalog references enforce `RESTRICT`. `SchemaTestCase` gained ten fixture builder pairs. `Wave14PurchasingSchemaTest` — **24 tests / 124 assertions**. Verified: `migrate:fresh` ✅ (86 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **308 passed / 1404 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (193 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Tenancy runtime **3**, Unit+Example **2**. §7 item 38 complete. Next: §7 item 39 — Wave 15 (Sales & Invoicing). |
| 2026-08-24 | **Phase 1 Wave 15 (Sales & Invoicing) written and verified.** Nine migrations: `crm_leads`, `crm_activities`, `sales_orders`, `sales_order_items`, `invoice_templates`, `invoices`, `invoice_items`, `sales_returns`, `sales_return_items` (`110000`–`110800`). Detailed per-table in **§4.19**. ADR-015 single sales core channel discrimination (`counter`, `dealer`, `phone`, `field`, `online`); POS/walk-in agility via nullable party references; server-side price resolution contracts. Cascade delete boundaries verified across all 4 item tables while catalog references enforce `RESTRICT`. `SchemaTestCase` gained nine fixture builder pairs. `Wave15SalesSchemaTest` — **27 tests / 117 assertions**. Verified: `migrate:fresh` ✅ (95 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **335 passed / 1548 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (220 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Tenancy runtime **3**, Unit+Example **2**. §7 item 39 complete. Next: §7 item 40 — Wave 16 (Payments & Collections). |
| 2026-08-24 | **Phase 1 Wave 16 (Payments & Collections) written and verified.** Three migrations: `payments`, `payment_allocations`, `sales_order_payments` (`111000`–`111200`). Detailed per-table in **§4.20**. Bi-directional payment ledger covering incoming customer receipts and outgoing supplier disbursements (`direction` in/out); payment allocations supporting invoices, bills, and returns; POS split tender support. `SchemaTestCase` gained three fixture builder pairs. `Wave16PaymentsSchemaTest` — **13 tests / 48 assertions**. Verified: `migrate:fresh` ✅ (98 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **348 passed / 1605 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (229 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Tenancy runtime **3**, Unit+Example **2**. §7 item 40 complete. Next: §7 item 41 — Wave 17 (POS). |
| 2026-08-24 | **Phase 1 Wave 17 (POS) written and verified.** Three migrations: `pos_terminals`, `pos_sessions`, `pos_offline_queue` (`112000`–`112200`). Detailed per-table in **§4.21**. Point of sale station registration, shift/cash-drawer sessions with full cash variance and reconciliation audit counters, and offline queued transaction buffer with client timestamps and idempotency keys. `SchemaTestCase` gained three fixture builder pairs. `Wave17PosSchemaTest` — **14 tests / 44 assertions**. Verified: `migrate:fresh` ✅ (101 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **362 passed / 1658 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (238 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Tenancy runtime **3**, Unit+Example **2**. §7 item 41 complete. Next: §7 item 42 — Wave 18 (Delivery & Logistics). |
| 2026-08-24 | **Phase 1 Wave 18 (Delivery & Logistics) written and verified.** Eight migrations: `courier_providers`, `run_sheets`, `delivery_orders`, `delivery_order_items`, `delivery_status_events`, `courier_shipments`, `courier_webhook_events`, `cod_reconciliations` (`113000`–`113700`). Detailed per-table in **§4.22**. Own-fleet dispatch run sheets, central fulfillment delivery orders with 11 lifecycle statuses, append-only timeline events with webhook idempotency guard (ADR-017), courier shipment integration, raw webhook payload buffer, and COD cash reconciliation sheets. `SchemaTestCase` gained eight fixture builder pairs. `Wave18DeliverySchemaTest` — **18 tests / 97 assertions**. Verified: `migrate:fresh` ✅ (109 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **380 passed / 1779 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (262 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Tenancy runtime **3**, Unit+Example **2**. §7 item 42 complete. Next: §7 item 43 — Wave 19 (Full HR & Payroll). |
| 2026-08-24 | **Phase 1 Wave 19 (Full HR & Payroll) written and verified.** Fourteen migrations: `leave_types`, `leave_requests`, `leave_balances`, `shift_assignments`, `holidays`, `employee_documents`, `salary_components`, `salary_structures`, `salary_structure_components`, `payroll_periods`, `attendances`, `payslips`, `payslip_items`, `payroll_advances` (`114000`–`115300`). Detailed per-table in **§4.23**. Policy-driven leave tracking with annual balance transactional cache, shift schedules, company/branch holiday calendar, cascading employee documents, salary structure components, immutable closed payroll cycles with frozen attendance locking stamps, and ADR-019 snapshotted payslips. Added `uq_attachments_tenant_id` on `attachments` for composite FK referential integrity. `SchemaTestCase` gained 14 fixture builder pairs. `Wave19HrPayrollSchemaTest` — **18 tests / 110 assertions**. Verified: `migrate:fresh` ✅ (123 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **398 passed / 1931 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (304 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Tenancy runtime **3**, Unit+Example **2**. §7 item 43 complete. Next: §7 item 44 — Wave 20 (Assets & Maintenance). |
| 2026-08-24 | **Phase 1 Wave 20 (Assets & Maintenance) written and verified.** Eight migrations: `asset_categories`, `assets`, `asset_assignments`, `asset_depreciation_entries`, `maintenance_schedules`, `maintenance_orders`, `maintenance_order_parts`, `asset_meter_readings` (`116000`–`116700`). Detailed per-table in **§4.24**. Tree-structured asset category hierarchy, capital assets ledger distinct from stock inventory (DECISIONS C21), asset custody/assignment tracking, immutable append-only depreciation ledger without soft deletes, time/meter maintenance schedules, maintenance work orders with full cost tracking and cascading spare parts consumption, and monotonic meter reading logs. `SchemaTestCase` gained eight fixture builder pairs. `Wave20AssetsSchemaTest` — **12 tests / 64 assertions**. Verified: `migrate:fresh` ✅ (131 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **410 passed / 2019 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (328 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Tenancy runtime **3**, Unit+Example **2**. §7 item 44 complete. Next: §7 item 45 — Wave 21 (Finance & Costing). |
| 2026-08-24 | **Phase 1 Wave 21 (Finance & Costing) written and verified.** Eleven migrations: `chart_of_accounts`, `journal_entries`, `journal_lines`, `expense_categories`, `bank_accounts`, `expenses`, `bank_transactions`, `payment_terms`, `party_credit_limits`, `product_costs`, `production_cost_allocations` (`117000`–`118000`). Detailed per-table in **§4.25**. Chart of accounts leaf/group structure, general ledger with balanced debit/credit invariant, hard-cascading journal lines, expense category hierarchy, company cash/bank accounts with derived balance cache over immutable append-only bank transaction ledger, paired inter-account transfer links (`related_transaction_id`), commercial credit terms, customer credit limit risk bounds, and time-sliced unit product costing and batch overhead allocation ledgers. `SchemaTestCase` gained eleven fixture builder pairs. `Wave21FinanceSchemaTest` — **14 tests / 85 assertions**. Verified: `migrate:fresh` ✅ (142 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **424 passed / 2137 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (361 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Wave 21 **14**, Tenancy runtime **3**, Unit+Example **2**. §7 item 45 complete. Next: §7 item 46 — Wave 22 (Reporting & Analytics). |
| 2026-08-24 | **Phase 1 Wave 22 (Reporting & Analytics) written and verified.** Fourteen migrations: `report_definitions`, `report_saved_views`, `report_schedules`, `report_exports`, `dashboard_widgets`, `summary_daily_production`, `summary_daily_worker_output`, `summary_daily_sales`, `summary_daily_stock`, `summary_daily_delivery`, `summary_monthly_finance`, `summary_monthly_payroll`, `summary_product_margin`, `summary_taxes` (`119000`–`119580`). Detailed per-table in **§4.26**. RMS registry architecture with platform/tenant definition scoping, custom saved filter/column views, automated digest schedules, asynchronous export queuing, dashboard grid layouts, and Tier 2 rebuildable materialized summary tables across production, workforce, sales, inventory, logistics, finance, payroll, margin, and tax domains with `refreshed_at` freshness timestamps. `SchemaTestCase` gained 14 fixture builder pairs. `Wave22ReportingSchemaTest` — **14 tests / 111 assertions**. Verified: `migrate:fresh` ✅ (156 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **438 passed / 2290 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (403 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Wave 21 **14**, Wave 22 **14**, Tenancy runtime **3**, Unit+Example **2**. §7 item 46 complete. Next: §7 item 47 — Wave 23 (E-commerce). |
| 2026-08-24 | **Phase 1 Wave 23 (E-commerce) written and verified.** Ten migrations: `storefronts`, `storefront_pages`, `storefront_products`, `carts`, `cart_items`, `coupons`, `coupon_redemptions`, `shipping_zones`, `product_reviews`, `wishlists` (`120000`–`120900`). Detailed per-table in **§4.27**. Storefront channel over unified sales core (ADR-016), landing/content pages, merchandising catalog overrides with variant sentinels, shopping carts with non-reserving add-to-cart invariant and stale price re-resolution, promo coupon codes with order redemption ledger, shipping zone rule engine with rate calculation and fallback catch-all indexing, moderated customer reviews (pending by default) linked to verified orders, and customer wishlists. `SchemaTestCase` gained ten fixture builder pairs. `Wave23EcommerceSchemaTest` — **14 tests / 84 assertions**. Verified: `migrate:fresh` ✅ (166 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **452 passed / 2404 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (535 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Wave 21 **14**, Wave 22 **14**, Wave 23 **14**, Tenancy runtime **3**, Unit+Example **2**. §7 item 47 complete. Next: §7 item 48 — Wave 24 (Integrations). |
| 2026-08-24 | **Phase 1 Wave 24 (Integrations) written and verified.** Three migrations: `webhook_endpoints`, `webhook_deliveries`, `imports` (`121000`–`121200`). Detailed per-table in **§4.28**. Outbound event webhooks with automatic circuit breaker on consecutive failures, immutable append-only webhook delivery attempt logs with async retry queue indexing, and bulk import jobs supporting simulation dry runs and error report spreadsheet paths. `SchemaTestCase` gained three fixture builder pairs. `Wave24IntegrationsSchemaTest` — **6 tests / 31 assertions**. Verified: `migrate:fresh` ✅ (169 migrations) · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **458 passed / 2444 assertions**, none risky. §7 item 48 complete. Next: §7 item 49 — Wave 25 (Deferred Closures). |
| 2026-08-24 | **Phase 1 Wave 25 (Deferred Cross-Group FK Closures) written and verified — All 25 Migration Waves 100% complete!** One migration: `wave25_deferred_fk_closure` (`122000`). Detailed in **§4.29**. Closed all 9 cross-group and forward-referenced foreign keys: `employees.salary_structure_id`, `material_issue_items.stock_movement_id`, `production_outputs.stock_movement_id`, `qc_inspections.goods_receipt_id`, `wastage_records.stock_movement_id`, `worker_production_entries.payroll_period_id`, `run_sheets.vehicle_id`, `cod_reconciliations.bank_account_id`, `asset_depreciation_entries.journal_entry_id`. `Wave25DeferredClosureSchemaTest` — **9 tests / 18 assertions** confirming composite `(tenant_id, parent_id)` foreign keys are strictly enforced and cross-tenant references rejected across all 9 domain boundaries. Verified: `migrate:fresh` — all **170 migrations** green ✅ · `pint lint:fix` **PASS** · `phpstan analyse` level 9 **[OK] No errors** · `artisan test` **467 passed / 2465 assertions**, none risky. Per-suite re-measured: Wave 1 **11 tests** (547 assertions), Wave 2 **17**, Wave 3 **20**, Wave 4 **27**, Wave 5 **23**, Wave 6 **28**, Wave 7 **30**, Wave 8 **26**, Wave 10 **24**, Wave 11 **24**, Wave 12 **18**, Wave 13 **26**, Wave 14 **24**, Wave 15 **27**, Wave 16 **13**, Wave 17 **14**, Wave 18 **18**, Wave 19 **18**, Wave 20 **12**, Wave 21 **14**, Wave 22 **14**, Wave 23 **14**, Wave 24 **6**, Wave 25 **9**, Tenancy runtime **3**, Unit+Example **2**. §7 item 49 complete. The **entire database schema (169 tables, 170 migrations)** is fully built, migrated, and verified. Next: §7 item 50 — Auth & RBAC Implementation. |
| 2026-08-24 | **Ledger truth-up: Phase 1 Auth & RBAC (§7 item 50) and the first master-data model tranche (§7 item 51) recorded as complete, and the backend count re-measured.** The ledger's §1/§2 already carried the Auth pipeline as done, but §7 item 50 still read ⬜ and §8 still said "Start at item 50" — a live-code / ledger disagreement of exactly the kind §0 forbids. Verified against disk before editing (no claim written from memory): `app/Modules/Auth/Controllers/AuthController.php` + all **12 Auth Actions** (`Login`, `SelectTenant`, `SwitchBranch`, `RefreshToken`, `Logout`, `LogoutAll`, `ChangePassword`, `ForgotPassword`, `ResetPassword`, `UpdatePreferences`, `GetAuthMe`, `GetPermissionsCatalogue`), the `app/Core/Auth/` service layer (`JwtService`, `RefreshTokenService`, `PermissionCatalogue`, and five JWT/refresh exception types), and the two middleware (`AuthenticateJwt`, `AuthorizePermission`) all present; `tests/Feature/Auth/` carries Login, AuthMe, RefreshToken, Logout, Preferences and RbacMiddleware suites. A first tranche of **19 master-data Eloquent models** over Waves 5–7 is also present (`Unit`, `UnitConversion`, `Category`, `Brand`, `TaxProfile`, `ReasonCode`, `Product`, `ProductVariant`, `ProductImage`, `BillOfMaterial`, `BillOfMaterialItem`, `Warehouse`, `WarehouseLocation`, `Party`, `PartyAddress`, `PartyContact`, `PriceList`, `PriceListItem`, `DiscountRule`) on `BelongsToTenant` with string decimal casts and composite-key relations, verified by `tests/Feature/Models/MasterDataModelTest.php`. Count **re-measured, not carried forward** (§8 rule): `php artisan test` reports **496 passed / 2941 assertions** (the ledger's stale 492/2575 corrected in §1's Backend and Tests rows). Reconciled: §7 item 50 → ✅ with its file inventory; new §7 items 51 (models, ✅) and 52 (the master-data module pipeline, ⬜); §8 resume paragraph re-pointed from item 50 to **item 52**. Docs only — no code changed this entry. Next: §7 item 52 — the master-data module pipeline per ADR-029 build order. |
| 2026-08-24 | **Docs-first pass for the master-data module pipeline (§7 item 52) — two build decisions recorded, contract endpoints written, ledger re-pointed; no code yet.** Per the standing "update the docs first, then continue documented development" rule, the rank-1 authority `DECISIONS.md` gained **ADR-032 (Pragmatic Definition of Done for standard CRUD modules — Amends ADR-030)** and **ADR-033 (Generated TypeScript types: one canonical file, one directory — Clarifies ADR-029)**, the §1 range was bumped to "ADR-001 through ADR-033", and DECISIONS' own change log updated. ADR-032 makes ADR-030's Policy class and event/listener indirection **conditional** for plain CRUD: the reference template is Form Requests (validation) + API Resources (serialization) + Actions with the audit row written **inside** the mutation's `DB::transaction()`, authorised by the existing `permission:catalog.<resource>.<action>` middleware — no per-model Policy unless a row-level rule a permission string cannot express is needed; the cross-tenant isolation test, permission-matrix test, and envelope test stay mandatory. ADR-033 installs `spatie/laravel-typescript-transformer` emitting into `frontend/src/types/api/`, with CI re-running generation and failing on diff; until the generator is green, `types/api/catalog.ts` is hand-authored to the contract as a bootstrap (never a parallel copy), and legacy `types/index.ts` demo shapes are not contract. `API_CONTRACT.md` §15 gained a concrete **§15.4 Master-data catalogue** block specifying the `units`/`categories`/`brands` CRUD endpoints, mapping reads to `catalog.<resource>.view` and every mutation incl. delete to `catalog.<resource>.manage` (ADR-008's 2-action model), diverging deliberately from §15.1's generic create/edit/delete template. `DEVELOPMENT_STATUS.md` §7 item 52 moved ⬜ → 🔄 with the Pragmatic-DoD artefact list, and the §8 resume paragraph re-pointed to the ADR-032/ADR-033 template. Baseline unchanged and to be preserved: **496 tests / 2941 assertions**, PHPStan level 9 clean — counts to be **re-measured**, never carried forward, once backend code lands. Next: build the shared foundation (409 exception classes + `bootstrap/app.php` render mappings for `DUPLICATE`/`IN_USE`, `AuditLog` model + in-transaction helper), then the `units` reference vertical, then `categories`/`brands` in parallel; pause for review before any UI. |











