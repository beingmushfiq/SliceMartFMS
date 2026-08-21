# DEVELOPMENT STATUS

> **Status:** Live ledger (rank 6). This file records what is **actually true**
> in the repository — not what is planned. Update it in the same change as the
> code.
>
> **Last updated:** 2026-08-22

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
| **Phase 0 status** | ✅ Documentation complete (7 canonical + 5 supporting = 12 documents) · 🔄 Repository restructure and tooling outstanding |
| **Next phase** | Phase 1 — Auth, Tenancy, RBAC, Design System — **⬜ not started, awaiting approval** |
| **Backend** | ⬜ Does not exist. No Laravel application, no migrations, no endpoints. |
| **Frontend** | 🔄 A prototype exists at the repository root. **Non-authoritative.** See §4. |
| **Database** | ⬜ Designed (159 tables) but **zero migrations written**. |
| **Tests** | ⬜ None. No test runner configured in either stack. |
| **CI** | ⬜ None. |

**The most important thing to know:** despite a working-looking prototype UI,
this project has **no production code**. The prototype is a visual reference and
a source of a handful of keepable components. Everything else is documentation.
Any statement that a feature "already works" refers to the prototype rendering
mock data.

---

## 2. Phase status at a glance

| Phase | Scope | Status |
|---|---|---|
| **0** | Architecture & documentation | 🔄 See §3 |
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

### 3.1 Complete

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

### 3.2 Outstanding — Phase 0 is not closed until these are done

| # | Item | Detail |
|---|---|---|
| 1 | Monorepo restructure | Root prototype → `/frontend`. Create `/backend` (Laravel 13 skeleton, no modules). Root `package.json` becomes workspace-level only. |
| 2 | Prototype triage | Execute the 10-row keep/refactor/delete table in `UI_SYSTEM.md` §17. |
| 3 | Tooling baseline | ESLint + `jsx-a11y` (replacing/complementing the current `oxlint`-only setup), Prettier, TS `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`, Vitest, PHPStan/Larastan, Pint, dependency-cruiser layer rules. |
| 4 | CI skeleton | Lint · typecheck · test · contract-type-generation diff · bundle budget · axe · token-contrast test. Jobs may be stubs, but the pipeline exists. |
| 5 | Dependency reconciliation | See §5 — several installed versions conflict with the documented stack. |

**No Phase 1 code may begin until items 1–5 are complete.** Item 5 is not
optional: the Phase 1 exit gate cannot be verified without the missing test,
mock and documentation tooling (§5).

---

## 4. What exists in the repository today

### 4.1 Frontend prototype (root — moves to `/frontend`)

| Path | Lines | Disposition per `UI_SYSTEM.md` §17 |
|---|---|---|
| `src/index.css` | 717 | **Keep + refactor** — split into the five token files; it is the only real design asset |
| `src/components/ui/*` (8 files) | — | **Keep + harden** — see the three named defects below |
| `src/components/ErrorBoundary.tsx` | 390 | **Keep + extend** to the four-level tree |
| `src/components/layout/*` | — | **Rebuild** — shell must be permission-filtered |
| `src/lib/utils.ts` | — | **Keep + fix** — remove the hardcoded `'en-BD'` locale |
| `src/pages/PlaceholderPage.tsx` | ~1,706 | **Delete** (Phase 2 gate) |
| `src/data/mockData.ts` | 374 | **Delete** (Phase 2 gate) — replaced by MSW handlers from the contract |
| `src/pages/**` (10 feature pages) | — | **Rebuild** against real APIs — they contain fabricated figures, `Math.random()` trends, a hardcoded "today" of `2026-08-17`, and a hardcoded author name |
| `src/store/useAppStore.ts` | — | **Retire the pattern** — server state moves to TanStack Query; Zustand keeps UI-only state |
| `src/components/modals/QuickEntryModals.tsx` | 1,101 | **Refactor** — reuse `ui/Modal.tsx` and RHF + Zod instead of hand-rolled overlays and `useState` |
| `tailwind.config.js` | — | **Delete** — dead under Tailwind v4 and contradicts the live `@theme` |
| `src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg` | — | **Delete** — Vite scaffold residue |
| `src/router/index.tsx` | — | **Rebuild** — lazy, guarded, permission-aware |

### 4.2 Known defects to fix during migration, not copy forward

Recorded so they are not reproduced (`UI_SYSTEM.md` §9.2):

1. `ui/Modal.tsx` — no focus trap; `aria-labelledby` points at a hardcoded
   `id="modal-title"`, so two modals collide.
2. `ui/Tabs.tsx` — no arrow-key navigation; fails the WAI-ARIA tabs pattern.
3. `SkeletonLine` — builds `` `h-${height}` `` dynamically. Tailwind never
   compiles it, so the height **silently never applies**. Generalised rule: no
   dynamically constructed utility class names, anywhere.

### 4.3 Backend

Nothing. No `/backend` directory, no `composer.json`, no Laravel installation.

---

## 5. Dependency reconciliation required (Phase 0 item 5)

Installed in the root `package.json` versus the documented stack:

| Package | Installed | Documented / required | Action |
|---|---|---|---|
| `@tanstack/react-query` | **absent** | Required — the entire server-state layer (ADR-021) | **Add** |
| `@tanstack/react-table` | `^9.1.2` | `DataTable` per `UI_SYSTEM.md` §11 | Verify API against v8 assumptions in the docs; record the version actually used |
| `@tanstack/react-virtual` | **absent** | Required above 200 rendered rows | **Add** |
| `gsap` | **absent** | Required by ADR-031 (`ScrollTrigger`, `Flip`) | **Add**, lazy-imported only |
| `framer-motion` | `^13.1.0` | Required — component/state motion | Keep |
| `i18next` / `react-i18next` | **absent** | `en` + `bn` from Phase 1 | **Add** |
| `msw` | **absent** | Required by ADR-029 | **Add** |
| `vitest`, `@testing-library/react`, `vitest-axe`, `@axe-core/react` | **absent** | Required by `UI_SYSTEM.md` §9.4 | **Add** |
| Storybook | **absent** | Required — the state matrix must be demonstrable | **Add** |
| `eslint` + `eslint-plugin-jsx-a11y` | **absent** (only `oxlint`) | `jsx-a11y` at error is a merge gate | **Add** |
| `dependency-cruiser` | **absent** | Enforces `ui/` never importing `features/` | **Add** |
| `zod` | `^3.25.76` | Contract-derived schemas | Confirm v3 vs v4 intent and record it |
| `tailwindcss` v4 (via `@tailwindcss/postcss`) | `^4.3.3` | Correct — CSS-first `@theme` | Keep; delete `tailwind.config.js` |
| `typescript` | `~6.0.2` | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` — **none currently enabled** | **Enable in all tsconfigs** |

This table is a Phase 0 work item, not a suggestion. Starting Phase 1 without
TanStack Query, MSW, Vitest and Storybook would make its exit gate unverifiable.

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

| # | Action | Gate |
|---|---|---|
| 1 | Approve Phase 0 documentation | User decision |
| 2 | Restructure to `/frontend` + `/backend`; move the prototype; install Laravel 13 skeleton | Phase 0 item 1 |
| 3 | Execute prototype triage — deletions and the token-file split | Phase 0 item 2 |
| 4 | Tooling baseline + dependency reconciliation + CI skeleton | Phase 0 items 3–5 |
| 5 | **Close Phase 0.** Then Phase 1 wave 0 migrations. | `ROADMAP.md` §3 Phase 1 |

---

## 8. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Created. Replaces `_legacy/DEVELOPMENT_STATUS.md`, which claimed "pre-development" while a prototype application existed (contradiction C24). Records Phase 0 documentation complete, all 41 modules not started, and the five outstanding Phase 0 work items. |
| 2026-08-22 | Consistency pass: document count stated as 7 canonical + 5 supporting; §5 renumbered to Phase 0 item 5; the Phase 1 gate now requires items **1–5** (dependency reconciliation is a hard gate, since the Phase 1 exit criteria cannot be verified without the missing test, mock and Storybook tooling). |
