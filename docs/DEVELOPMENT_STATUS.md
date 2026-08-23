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
| **Current phase** | Phase 0 — ✅ **closed**. Phase 1 is the next work, not yet begun. |
| **Phase 0 status** | ✅ Documentation complete (7 canonical + 5 supporting = 12 documents) · ✅ Monorepo restructure · ✅ Dependency reconciliation · ✅ Token cascade · ✅ UI primitive hardening · ✅ §8 state-matrix primitives · ✅ Tooling config files (frontend **and** backend) · ✅ Test suites · ✅ CI — **every gate verified green, see §3.4** |
| **Next phase** | Phase 1 — Auth, Tenancy, RBAC, Design System — **⬜ not started** |
| **Backend** | 🔄 Laravel 13.26.1 skeleton installed at `/backend`, PHP floor `^8.5`. Tooling now real: `phpstan.neon` (level 9, `checkModelProperties`) and `pint.json` exist and pass. Stock scaffold otherwise — no `app/Core`, no `app/Modules`, no tenancy, no migrations beyond the three Laravel defaults, no API routes. |
| **Frontend** | ✅ `/frontend`. Token cascade, boot loader, all 9 UI primitives rebuilt, tooling configured, §8 state-matrix primitives complete (errors, logger, StateView, QueryBoundary, AsyncButton, Toast, LogInspector, four-level ErrorBoundary), and the single transport seam wired (`lib/api/client.ts` + `lib/api/queryClient.ts` + `QueryClientProvider`). See §4. |
| **Database** | ⬜ Designed (159 tables) but **zero project migrations written**. |
| **Tests** | 🔄 Real, but foundation-only. Frontend **128 tests across 7 files**, all passing, covering the reliability layer (`ErrorBoundary`, `StateView`, `QueryBoundary`, `AsyncButton`, `logger`, `api/errors`, `api/queryClient`). Backend **2 tests / 9 assertions**. Nothing else is covered because nothing else exists — there is no feature code to test. |
| **CI** | ✅ `.github/workflows/ci.yml` — 3 jobs, 9 legs. Frontend matrix (lint · typecheck · test · depcruise · format:check) installing at the **repository root**, build + bundle budget with a `dist` artifact, and a backend matrix (lint · analyse · test) on PHP 8.5. Every leg has a locally reproducible equivalent. |

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
| Backend skeleton | ✅ Laravel **13.26.1** on PHP `^8.5` at `/backend`, with `larastan/larastan ^3.10`, `phpstan ^2.2`, `laravel/pint ^1.27`, `phpunit ^12.5`. Stock scaffold — **no** project code yet. The floor was `^8.3` until 2026-08-23; it was raised because the installed Symfony 8.1 tree hard-requires `>= 8.4.1` (`vendor/composer/platform_check.php`), so the declared constraint was one a real `composer install` would have rejected. |
| Dependency reconciliation | ✅ All 13 gaps in the former §5 closed. See §5 for the installed set. |
| Token cascade | ✅ Six CSS files under `src/styles/`: `tokens.primitive.css`, `tokens.semantic.css`, `tokens.semantic.dark.css`, `tokens.component.css`, `tokens.motion.css`, `base.css`, composed by `index.css` in that order. The former 717-line `index.css` is gone; `tailwind.config.js` is deleted. |
| Motion token mirror | ✅ `src/lib/motion/tokens.ts` mirrors `tokens.motion.css` into TypeScript, because Framer Motion v13 cannot resolve `var()` inside transition values. The two files carry a documented **drift rule**: they change in the same commit, and the CSS file is canonical. |
| `index.html` | ✅ Rebuilt: accessible viewport, pre-paint theme/density/reduced-motion resolver reading `localStorage` (never writing), and a tier-1 boot loader advanced only by real milestones via `window.__boot`, with honest escalation at 8 s and 20 s. |
| Boot seam | ✅ `src/app/boot.ts` — typed access to `window.__boot`; every export is a no-op when the loader is absent. |
| Prototype deletions | ✅ All rebuild-marked and delete-marked surface removed: `pages/**`, `data/mockData.ts`, `store/`, `router/`, `components/layout/`, `components/modals/`, `App.css`, Vite scaffold assets. |

### 3.3 Outstanding — Phase 0 is not closed until these are done

Nothing outstanding. All items below are verified complete; §3.4 records how.

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
| Format | `prettier --check` (root) | ✅ exit 0 — all matched files |
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

**Absent — all of Phase 1:** `app/Core`, `app/Modules`, `app/Support`,
`routes/api_platform.php`, `routes/api_tenant.php`, `routes/api_public.php`,
`BelongsToTenant`, `ResolveTenant`, and every project migration.

### 4.5 Test coverage

128 frontend tests over 7 files, 2 backend tests. Tests sit beside the code they
cover (`vitest.config.ts` `include: ['src/**/*.{test,spec}.{ts,tsx}']`).

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

What is **not** covered, and why: there is no feature code, no route, no store
and no MSW handler to test. Contract-level testing against `API_CONTRACT.md`
begins in Phase 1 with the first real endpoint.

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
| 18 | `lib/api/client.ts` — the single transport seam: envelope parsing, §8.4 401 refresh + single replay, silent cancellation, visible timeout, idempotency key, `If-Match`, correlation id | ✅ |
| 19 | `lib/api/queryClient.ts` — retry policy (GETs ≤ 3 with jittered backoff, mutations never), `staleTime` tiers, `placeholderData: previous` | ✅ |
| 20 | Wire `main.tsx`: `QueryClientProvider` inside, `GlobalBoundary` outermost (outside all providers) | ✅ |
| 21 | `patterns/QueryBoundary.tsx` rows 2 + 20 — `isFetching` → `RefetchBar` rail over **stale data**, 60% dim gated past 1s, rail applied to the empty surfaces too | ✅ |
| 22 | `ui/Toast.tsx` + `<Toaster />` in `main.tsx` — row 5's transient surface. Sonner wrapped, `unstyled`, token-only; `notify.error` never self-dismisses | ✅ |
| 23 | Tooling gate made real: `phpstan.neon` + `pint.json`, 128 frontend tests, `check-bundle-budget.mjs`, PHP floor `^8.5`, `.prettierignore`, `ci.yml` rewritten to 3 jobs / 9 legs | ✅ |
| 24 | **Phase 0 closed.** Every gate in §3.4 measured green. | ✅ |
| 25 | Phase 1 wave 0 — tenancy migrations | `ROADMAP.md` §3 Phase 1 |

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
| Root Prettier has **no** `.prettierrc`, so files outside `frontend/` are formatted with **double quotes**. `frontend/.prettierrc` (`singleQuote: true`) applies only inside `frontend/`. `docs/` is in `.prettierignore` — approved artefacts are never reformatted. | `format:check` fails on `ci.yml`, or an approved doc gets rewritten. |
| Every gate has a verified local command in **§3.4**, including the Windows-specific invocations. `depcruise` cannot run on Node 25 — CI pins Node 22. | Time lost re-discovering that the path's spaces and `&` break bare binary references. |

---

## 9. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Created. Replaces `_legacy/DEVELOPMENT_STATUS.md`, which claimed "pre-development" while a prototype application existed (contradiction C24). Records Phase 0 documentation complete, all 41 modules not started, and the five outstanding Phase 0 work items. |
| 2026-08-22 | Consistency pass: document count stated as 7 canonical + 5 supporting; §5 renumbered to Phase 0 item 5; the Phase 1 gate now requires items **1–5** (dependency reconciliation is a hard gate, since the Phase 1 exit criteria cannot be verified without the missing test, mock and Storybook tooling). |
| 2026-08-23 | **Truth-up.** The file had drifted: it still described the prototype as living at the repository root, the backend as non-existent, and thirteen dependencies as absent — all three untrue. Records the monorepo restructure, the Laravel 13.26.1 skeleton, the six-file token cascade, the rebuilt `index.html` and boot loader, the closed dependency reconciliation, and per-file state for all eight UI primitives. Former §3.2 (outstanding) split into §3.2 complete / §3.3 outstanding, renumbered 1–6. Added §4.2 (the twelve Modal defects) and §8 (a settled-constraints table so a new session resumes without re-deriving them). |
| 2026-08-23 | **Phase 0 code items closed.** §3.3 items 1–6 marked complete. All 9 `ui/` files rebuilt (Modal, Feedback, Navigation (new), Tabs, FormElements, KPICard, PWAInstallBanner, Button, Badge) — each token-only, lucide v1-correct, no dynamic classes, no primitive colours. Modal: all 12 defects resolved (useId, focus trap + restore, inert, m.* motion, token classes, isDirty, hideHeader for ConfirmDialog). Motion provider installed in `main.tsx` (`LazyMotion` + `MotionConfig` + `reducedMotion`). `useGsap.ts` created (lazy-loaded, `gsap.context()` + `ctx.revert()`). `ErrorBoundary.tsx` rewritten to four-level model, de-tenanted. `registerSW.ts` de-tenanted. `lib/utils.ts` delocalised to `cn()` only. New file: `Navigation.tsx` (Pagination extracted from Feedback). Tooling configs added: `eslint.config.js` (flat config — typescript-eslint + react-hooks + react-refresh + jsx-a11y; this entry originally named it `.eslintrc.js`, which never existed), `.dependency-cruiser.cjs`, `vitest.config.ts`, `.storybook/main.ts` + `preview.ts`, `.prettierrc`. TS strict flags added to `tsconfig.app.json`. CI skeleton: `.github/workflows/ci.yml` (lint, typecheck, test, build & bundle budget, depcruise). §7 items 1–8 complete. |
| 2026-08-23 | **§8 state-matrix primitives complete.** Seven new/modified files implementing the UI_SYSTEM.md §8 reliability layer. `lib/api/errors.ts` — `ApiError` branded object, `ErrorCode` closed union (42 server + 4 client codes), `normalizeError`, `isCancelled`/`isFixable`/`isSessionProblem`/`isPermissionProblem`/`isUserRetryable` predicates. `lib/observability/logger.ts` — ring buffer (50 entries) + localStorage mirror, `logBoundaryError`/`logApiError`/`logEvent`, `installGlobalErrorHandlers` (unhandledrejection + window.error), `useSyncExternalStore`-shaped subscribe/snapshot. `ui/Feedback.tsx` updated — `useDelayedFlag` (120ms skeleton gate), `Spinner` (icon-replacement, no layout reflow), `ProgressBar` (discriminated union, real values only), `RefetchBar` (2px top rail, CLS 0), `EmptyState` row 3+4 via `secondaryAction`. `patterns/StateView.tsx` — canonical state registry keyed by `ErrorCode`: icon, tone, heading, body copy, actions for rows 3,4,9,11,12,13,14,15; falls back to `INTERNAL_ERROR` for unregistered codes. `patterns/QueryBoundary.tsx` — declarative shell for TanStack Query lifecycle: pending (120ms-gated skeleton) → error (StateView) → empty (EmptyState/EmptyFilterState) → children; cancelled requests silently ignored. `ErrorBoundary.tsx` rebuilt — four levels (`GlobalBoundary`, `RouteBoundary`, `SectionBoundary`, `WidgetBoundary`), wired to `logBoundaryError` (correlation id, route, user/tenant id, component stack), stack traces gated on `import.meta.env.DEV`, `onReset` prop for custom recovery, safe copy only in production. `ui/AsyncButton.tsx` — managed async mutation button: idle → submitting (Tier 3 spinner) → success flash (1.5s, `CircleCheckBig`) → error (inline, `role="alert"`); controlled or uncontrolled. `patterns/LogInspector.tsx` — diagnostic log viewer on real `Modal` (focus trap, Escape), `useSyncExternalStore` over logger ring buffer, level filter, clear, scrollable list, dev-only stack traces. `main.tsx` wired: `installGlobalErrorHandlers()` before React mount. §7 items 9–17 complete. |
| 2026-08-23 | **Transport seam complete — the state primitives now have a producer.** The §8 primitives all consumed `ApiError`, but nothing produced one: `lib/api/client.ts` did not exist, so every designed state was unreachable. Two new files close that gap. `lib/api/client.ts` (ARCHITECTURE.md §6.3) — the only `fetch` in the codebase, per §10. Parses all three API_CONTRACT.md §2 envelopes and rejects a 2xx carrying `success: false` as a protocol violation rather than rendering it as an empty screen; a non-JSON body becomes `MALFORMED_RESPONSE` instead of leaking a parser message. §1.6/§1.7 headers, with the server's echoed `X-Correlation-Id` winning over the client's because that is the id in the server logs. §8.2/§8.4 401 protocol implemented literally: `TOKEN_EXPIRED` → single-flight refresh (`refreshInFlight` promise, so concurrent 401s queue behind one refresh) → replay **once** under an `isReplay` guard; any other 401 code → session-expiry immediately. Session expiry is announced through a listener set — the transport never navigates. Per-request deadline composed with `AbortSignal.any([callerSignal, timeout])`; the `didTimeout` flag is checked **before** the `AbortError` branch because both arrive as the same `DOMException` but row 15 must be visible and row 19 must be silent, and the cancellation throw bypasses `fail()` so it can never be logged. `newIdempotencyKey()` is exported rather than generated internally, because §6.2 scopes a key to a user *intent* and only the caller knows when an intent begins. Every throw is `throw fail(err)`, making "no unlogged failure" structural rather than a convention. `lib/api/queryClient.ts` (ADR-025, §16.6) — retry and freshness policy, deliberately separate from the transport so it can vary per query without the transport ever retrying silently: `STALE_TIME` tiers (5 min / 30 s / 60 s), `gcTime` 10 min, GETs ≤ 3 attempts with exponential backoff plus **full jitter** (six dashboard queries failing together on a fixed schedule would otherwise become eighteen synchronised retries against an already-struggling service), mutations `retry: false`, `placeholderData: previous` for rows 2 and 20, `throwOnError: false` on both because §8.4 gives boundaries render errors only. `main.tsx` re-ordered: `GlobalBoundary` hoisted **outside** `MotionConfig`/`LazyMotion`/`QueryClientProvider`, since §8.4 level ① and ARCHITECTURE.md §6.7 assign it provider/bootstrap failure — a job it cannot do from inside the providers it is meant to catch. Its fallback's import graph was verified to exclude `framer-motion` first. `QueryClientProvider` added with a module-scope client so a re-render cannot swap the cache out from under in-flight queries. Typecheck and `vite build` both clean. §7 items 18–20 complete. |
| 2026-08-23 | **The last two undelivered states: rows 2/20 and row 5's transient half.** Both were cases of the documentation being ahead of the code, which is the failure mode §8.5 rule 10 exists to catch. (a) `patterns/QueryBoundary.tsx` — its own header contract already promised "refetching with stale data → RefetchBar + dimmed children", but the component had no `isFetching` input and never rendered `RefetchBar`. Combined with `placeholderData: previous` landing in `queryClient.ts` the previous commit, a background refetch had become **completely invisible**: the data silently changed under the user with no signal at all. Added the `isFetching` prop, a `withRefetchRail` wrapper shared by the data path *and* both empty paths (a refetch over an empty list is precisely when a user is waiting for a row to appear), and gated §7.5's 60% dim behind `useDelayedFlag(isFetching && status === 'success', 1000)` — a 200 ms refetch that dims and undims reads as a flicker, which is worse than showing nothing, so below 1 s the 2 px rail carries the signal alone. The dim is opacity-only, never `display`/`visibility`, so stale rows stay readable and selectable while they refresh. (b) `ui/Toast.tsx` — Sonner was installed and the `--toast-*` component tokens existed, but no `Toaster` had ever been mounted, so row 5's transient variant had no surface whatsoever. Sonner is now wrapped so nothing else imports it: `unstyled` and `richColors={false}` are forced (rich colours are the single largest source of untokenised colour in a Sonner install), `theme="light"` prevents Sonner resolving a colour scheme through `matchMedia` when dark mode here is class-based token re-mapping, and per-type background classes are left empty on purpose — the icon carries the semantic, because a tinted panel per outcome makes the genuinely rare error toast indistinguishable from routine confirmations. `notify.error` is pinned to `duration: Infinity`: §8.5 rule 2 forbids hiding an error, and a self-dismissing error is a hidden error for anyone who looked away. Mounted as a **sibling** of `<App />` inside `QueryClientProvider`, so a route boundary tearing down cannot take an in-flight confirmation with it. One defect caught in post-write verification: `TOAST_CLASS` used `border-border`, which typechecks cleanly and emits **no CSS** — the utility is `border-default`. Because the token cascade enforces by omission, a mistyped semantic utility fails as silently as a forbidden primitive one, so the built stylesheet was grepped to confirm `width:var(--toast-width)`, `.border-default{` and `.animate-indeterminate{` all emit. Typecheck and `vite build` clean. §7 items 21–22 complete; the state matrix has no unimplemented rows left. |
| 2026-08-23 | **The tooling gate made real, and Phase 0 closed.** Every quality gate this file had been claiming was audited by running it. Seven of ten were broken, and the pattern was uniform: a dependency in `package.json` or a job name in `ci.yml` is a *claim*, not a capability. (a) **CI would have failed on the first push, four ways.** `npm ci` ran in `frontend/`, which has no lockfile — this is an npm workspaces monorepo and the only lockfile is at the root. The `test` leg invoked a suite that did not exist. There was no PHP job at all, so `phpstan.neon` and `pint.json` being absent was invisible. The "build & bundle budget" job contained a `# TODO` where the budget check should be, making the job name a lie. Rewritten to 3 jobs / 9 legs, each with a locally reproducible equivalent recorded in the new **§3.4**. (b) **A backend ordering hazard, found by reading the manifest rather than the workflow.** `config.optimize-autoloader` is true and `post-autoload-dump` runs `artisan package:discover`, which *boots the application* — but `cp .env.example .env` was gated behind `if: matrix.task == 'test'`, so `lint` and `analyse` would have booted with no `.env`. `.env` now precedes `composer install`, `--no-scripts` is gone (one install now produces both the optimized autoloader and the discovery cache), and `key:generate` runs on every leg because Larastan boots the container for `checkModelProperties`. The load-bearing assumption was then verified empirically instead of trusted: `APP_KEY="" php artisan package:discover` exits 0. (c) **The PHP floor was a constraint a real `composer install` would have rejected.** `composer.json` declared `^8.3` while `vendor/composer/platform_check.php` enforces `>= 8.4.1`, because the installed Symfony 8.1 tree hard-requires it — and `DECISIONS.md` ADR-003, `PROJECT_CONTEXT.md` and `README.md` all said 8.5. Raised to `^8.5`, and `ExampleTest.php` now *reads the floor out of the manifest* so the declaration, the test and CI's version pin cannot drift again. (d) **128 frontend tests across 7 files**, covering the whole reliability layer written in the two previous entries. `passWithNoTests` is deliberately off: an empty suite exiting 0 is a green badge that proves nothing, which is the same failure mode §8.5 rule 1 bans in the UI. Two real defects surfaced immediately — a raw `’` in an `ErrorBoundary` JSX text node, and `Go back` bypassing `handleReset` — neither of which any amount of re-reading the file had caught. (e) **`check-bundle-budget.mjs`** parses `dist/index.html` rather than globbing `dist/assets`, so it keeps working once route splitting lands; initial JS measures **109.7 kB against the 250 kB ceiling**. It also resolves a genuine doc drift: `UI_SYSTEM.md` §16 states ≤ 200 kB while claiming to restate `ARCHITECTURE.md` §6.10's ≤ 250 kB, so the script *fails* on rank 3 and *warns* on rank 4, per the `README.md` §2 precedence table. (f) **`format:check` was unusable** — 27 files drifted, and the first fix attempt was wrong: running `--write` over the repo reformatted the approved `docs/`. Reverted, added `.prettierignore` (docs are approved artefacts; the only proposed change was markdown-table cell padding with byte-identical rendered output), and re-scoped the root globs to `frontend/src` + `frontend/scripts`. `ci.yml` itself then failed the check on three single-quoted scalars, because root Prettier has no `.prettierrc` and defaults to double quotes — `frontend/.prettierrc` does not reach outside `frontend/`. (g) The dead `test:a11y` script was **deleted rather than fixed**: `axe-core` is installed but has no integration, and a script that proxies to nothing is worse than an absent one. It returns in Phase 1 where `ROADMAP.md` line 172 requires it. One gate cannot run on this machine and is recorded as such rather than quietly skipped: `dependency-cruiser@18` supports Node `^22 \|\| ^24 \|\| >=26` and this machine runs 25.1.0, so the CI pin to Node 22 is what makes that leg meaningful. §7 items 23–24 complete. **Phase 0 is closed**; the next action is Phase 1 wave 0 tenancy migrations. |
