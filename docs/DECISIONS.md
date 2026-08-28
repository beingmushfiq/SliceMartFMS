# ARCHITECTURE DECISION RECORD (ADR)

> **Status:** Canonical. This file is the permanent record of every binding
> architectural decision. Nothing in this repository may contradict it.
>
> **Last updated:** 2026-08-21 · **Phase:** 0 (Architecture & Documentation)

---

## 0. How to use this document

- Every decision has a stable ID (`ADR-000`). **Never reuse or renumber IDs.**
- A decision is `Accepted`, `Superseded by ADR-xxx`, or `Proposed`.
- To change an accepted decision: add a **new** ADR that supersedes it. Never
  edit an accepted decision in place.
- If a task request conflicts with an accepted ADR: **STOP**, state the
  conflict, and request an explicit override. Do not silently deviate.

### Document precedence (binding)

When two documents disagree, the higher entry wins:

| Rank | Source |
|---|---|
| 1 | `docs/DECISIONS.md` (this file) |
| 2 | `docs/PROJECT_CONTEXT.md` |
| 3 | `docs/ARCHITECTURE.md` |
| 4 | `docs/DATABASE_DESIGN.md` · `docs/API_CONTRACT.md` · `docs/UI_SYSTEM.md` |
| 5 | `docs/MODULE_MAP.md` · `docs/ROADMAP.md` · `docs/RMS_REPORT_MATRIX.md` |
| 6 | `docs/TASK_PROTOCOL.md` · `docs/DEVELOPMENT_STATUS.md` |
| 7 | Source code |
| — | `docs/_legacy/**` — **non-authoritative. Historical reference only.** |

---

## 1. Context: why this ADR exists

A pre-existing `/docs` folder contained **two mutually incompatible
documentation generations** and **30 identified contradictions**:

- **Generation A** (~259 lines): a *single-client* "Slice Mart Factory
  Management System". Hardcoded 2 warehouses / 1 production line. 17–32
  modules. ~74 tables. No POS, no e-commerce, no courier, no i18n, no tenancy.
- **Generation B** (~3,675 lines, the `MASTER_*` prompts): a *multi-tenant
  SaaS*. 35 domains. Tenant→Company→Branch→Factory→Line→Warehouse. POS,
  e-commerce, courier adapters, invoice template engine, Bangla i18n, tenant
  branding.

Six of the seven documents mandated by the initialization prompt were never
created, so no precedence rule, module map, API contract, UI token spec, or ADR
existed. The implemented code diverged from both generations.

**All 14 legacy files are now archived under `docs/_legacy/` and are
non-authoritative.** ADR-001 through ADR-033 below resolve every contradiction.

---

## 2. Foundation decisions

### ADR-001 — The product is a multi-tenant SaaS platform
**Status:** Accepted · **Resolves:** C1

Generation B wins. The product is a **multi-tenant SaaS** for
manufacturing-centric businesses. Slice Mart is **tenant #1**, not the product.

**Consequences**
- No `Slice Mart` string may appear in any reusable component, model, service,
  migration, seeder, or config default. It exists only in tenant seed data.
- Every tenant-owned table carries `tenant_id` (ADR-004).
- Branding, currency, tax, numbering, workflow and terminology are tenant
  settings, never constants.

**Rejected:** single-client build (Generation A) — would require a rewrite to
onboard tenant #2.

---

### ADR-002 — Nothing that can vary between tenants is hardcoded
**Status:** Accepted · **Resolves:** C2

Counts and business-specific values are **tenant configuration**, never
application assumptions. Slice Mart's current shape (25–30 models, ~200–250
units/day, 1 production line, 7–10 workers, 12–15 material types, 2 warehouses)
is **seed data only**.

**Never hardcode:** tenant name · factory/warehouse/line/product/worker/
salesperson counts · currency · tax rates · invoice format · courier provider ·
payment methods · production workflow or stages · QC parameters · incentive
rules · target rules · roles · permissions · lead statuses · units · categories.

**Enforcement:** any literal count, currency symbol or provider name in
`backend/app/**` or `frontend/src/**` outside a seeder or a tenant-settings
default is a review blocker.

---

### ADR-003 — Monorepo: `/frontend` + `/backend`
**Status:** Accepted · **Resolves:** repo layout

```
slicemart-fms/
  frontend/    React 19 + TypeScript + Vite + Tailwind v4
  backend/     Laravel 13 + PHP 8.5
  docs/        canonical documentation (this folder)
  docs/_legacy/ archived, non-authoritative
```

The existing root-level React app (`src/`, `package.json`, `vite.config.ts`,
`tsconfig*.json`, `postcss.config.js`, `index.html`, `public/`) moves into
`frontend/` in Phase 0. One git history; `/docs` shared at root.

**Rejected:** frontend-at-root (messy, ambiguous ownership); split repos
(doubles CI, invites API-contract drift).

---

### ADR-004 — Tenancy: shared schema with `tenant_id`
**Status:** Accepted · **Resolves:** C3

Single database. Every tenant-owned table has a non-nullable
`tenant_id` foreign key, indexed as the **leading column** of composite indexes.

**Enforcement layers (all required, defence in depth):**
1. `ResolveTenant` middleware derives tenant from the **authenticated JWT
   claim**, never from a request body/query/header.
2. A `BelongsToTenant` Eloquent trait applies a **global scope** on read and
   auto-fills `tenant_id` on write.
3. Policies re-verify tenant ownership on every `find`-by-id path.
4. A base `TenantAwareModel` makes `tenant_id` guarded — never mass-assignable.
5. Every module ships a test proving tenant A cannot read/write tenant B's rows.

**Consequences**
- Identical behaviour on SQLite and MySQL; local dev needs no connection
  switching.
- Platform-level (cross-tenant) reporting is possible for the platform-admin
  role via an explicit `withoutTenantScope()` escape hatch that is **audited**.
- Tenant deletion is a soft-delete + async purge job, never a raw `DELETE`.

**Rejected:** database-per-tenant (heavy ops, N× migrations, poor SQLite dev
story). **Deferred:** the connection-resolver abstraction for moving a large
tenant to a dedicated DB — revisit only when a real tenant demands it.

---

### ADR-005 — Tenancy hierarchy
**Status:** Accepted

```
Platform
└── Tenant
    └── Company
        └── Branch
            ├── Factory
            │   └── Production Line
            └── Warehouse
```

- `Company`, `Branch`, `Factory`, `Production Line`, `Warehouse` are all
  **tenant-scoped tables with zero hardcoded cardinality**.
- A tenant with one company / one branch / one factory / one line is the
  **default seeded shape**, not a special case. UI must not force users through
  hierarchy levels they have only one of (progressive disclosure).
- Users belong to a tenant and are granted access to a **set** of
  companies/branches/factories/warehouses.

---

### ADR-006 — Technology stack (locked)
**Status:** Accepted · **Resolves:** C25

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | React 19 + TypeScript | already installed |
| Build | Vite | already installed |
| Styling | Tailwind CSS **v4** (CSS-first `@theme`) | ADR-020 |
| Routing | React Router v7 (declarative + lazy) | ADR-022 |
| **Server state** | **TanStack Query v5** | must be added; ADR-021 |
| **Client/UI state** | **Zustand** (UI-only, no server data) | ADR-021 |
| Forms | React Hook Form + Zod | already installed, currently unused |
| Tables | TanStack Table v8+ | already installed, currently unused |
| Charts | Recharts | already installed |
| Animation | **Framer Motion** (component/state motion) + **GSAP** (orchestrated/scroll motion) | ADR-024, ADR-031 |
| Icons | Lucide | already installed |
| Toasts | Sonner | already installed, currently unused |
| i18n | i18next + react-i18next | must be added; ADR-018 |
| Backend | Laravel 13 · PHP 8.5+ | |
| DB (production) | MySQL 8.x — **authoritative** | |
| DB (development) | SQLite | must stay migration-compatible |
| ORM | Eloquent | |
| Auth | JWT (access + refresh) | ADR-007 |
| API | REST, prefix `/api/v1` | ADR-012 |
| Architecture | Modular monolith, queue-ready, event-driven | |

The legacy lock file named TanStack Query while the code shipped only Zustand.
**Resolution:** both are used, with a hard boundary — TanStack Query owns all
server state; Zustand owns only ephemeral UI state (sidebar, modals, POS cart
draft, filter panel). Server entities never live in Zustand.

Changing any row above requires a superseding ADR.

---

### ADR-007 — Authentication: JWT access + refresh, refresh in httpOnly cookie
**Status:** Accepted

- Short-lived **access token** (15 min) sent as `Authorization: Bearer`.
- Long-lived **refresh token** (14 days) in an `httpOnly`, `Secure`,
  `SameSite=Strict` cookie. Rotated on every use; reuse of a rotated token
  revokes the whole family.
- Access token claims: `sub`, `tenant_id`, `token_version`, `exp`, `jti`.
  Permissions are **not** embedded in the token — they are fetched from
  `/api/v1/auth/me` and cached by TanStack Query, so a permission change takes
  effect without forcing re-login.
- `token_version` on the user row allows instant server-side invalidation.
- Access token is held **in memory only** on the frontend. Never
  `localStorage`, never `sessionStorage`.
- Session expiry UX is mandatory: silent refresh → on failure, a modal
  re-authentication prompt that **preserves unsaved form state** (ADR-026).

---

### ADR-008 — RBAC permission format: `module.resource.action`
**Status:** Accepted · **Resolves:** C11 (the frontend/backend mismatch)

**Canonical format is three-segment `module.resource.action`.** The legacy
frontend prompt's two-segment `module.action` is **rejected** — it cannot express
`inventory.stock.adjust` vs `inventory.transfer.create`.

- Actions: `view` · `create` · `edit` · `delete` · `approve` · `export` ·
  `print` · `manage` · `configure`.
- Examples: `production.batch.approve` · `inventory.stock.adjust` ·
  `sales.invoice.create` · `delivery.shipment.cancel` · `hr.payroll.view`.
- The permission catalogue is **generated from a single source of truth** in the
  backend and exposed via `/api/v1/auth/permissions`. A shared TypeScript union
  type is generated from it so the frontend cannot reference a permission string
  that does not exist.
- Roles are **tenant-owned and fully editable**. No role name is hardcoded in
  logic — the only reserved identity is the platform `super_admin`, which lives
  outside tenant scope.
- **Frontend permission checks are UX only. Backend policies are
  authoritative.** Every endpoint authorizes independently.

---

### ADR-009 — Existing prototype: keep the design system, rebuild the data layer
**Status:** Accepted · **Resolves:** C24

The current app is a **mock-only prototype**: no API layer, no auth, no i18n,
no dark mode, 57 routes of which 45 are backed by a single ~1,700-line
placeholder file.

**Keep and migrate into `frontend/src`:**
- `src/index.css` — 717 lines of tokens and ~143 semantic component classes
  (becomes the base of ADR-020, extended for dark mode).
- `src/components/ui/*` — Button, Badge, Modal, KPICard, Tabs, Feedback,
  FormElements, PWAInstallBanner.
- `src/lib/utils.ts` — formatters and helpers (currency/locale become
  tenant-driven per ADR-002).
- `src/components/ErrorBoundary.tsx` — extended per ADR-025.
- `src/components/dashboard/OperationalAlerts.tsx` — already fully props-driven.
- PWA assets: `public/sw.js`, `public/manifest.json`, `src/registerSW.ts`.

**Delete:**
- `src/pages/PlaceholderPage.tsx` — 45 fake routes, 11 pure aliases, 3 empty
  stubs, fabricated P&L and CCTV screens.
- `src/data/mockData.ts` — replaced by API + MSW fixtures (ADR-029).
- `tailwind.config.js` — dead under Tailwind v4 and contradicts the live
  `@theme` (`navy-800` `#122d5e` vs `#1E293B`).
- `src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg` — Vite scaffold
  residue.

**Rebuild per module, against real APIs:** all 10 feature pages. Existing pages
carry blocking defects — hardcoded `'2026-08-17'` as "today", fabricated figures
(`Math.sin`/`Math.random` trends regenerated each render, ID-derived performance
scores, invented P&L totals), five files bypassing the store to import mocks
directly, and hardcoded `createdBy: 'Mushfiqur Rahman'`.

**Refactor:** `QuickEntryModals.tsx` (1,101 lines) must reuse `ui/Modal.tsx`
instead of hand-rolling overlays, and RHF+Zod instead of manual `useState`.

---

### ADR-010 — TypeScript `strict` is mandatory
**Status:** Accepted

`strict: true` is enabled in all tsconfigs, plus
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

`strict` was absent from all three legacy tsconfigs, which is precisely why the
type layer drifted into competing optional field names (`poNo?`/`orderNo?`,
`itemId?`/`materialId?`, `subtotal?`/`total?`) and `as any` casts that silently
compiled.

**Consequences**
- `frontend/src/types/**` is **generated from the backend API contract**, not
  hand-maintained. Duplicate/competing field names are eliminated at the source.
- Path alias `@/*` → `frontend/src/*` is configured in both `tsconfig` and
  `vite.config.ts`. No more `../../data/mockData` imports.
- `as any` is forbidden outside typed test doubles.

---

## 3. Domain decisions

### ADR-011 — Production is a plan → batch chain, never one "production entry"
**Status:** Accepted · **Resolves:** C9

The legacy schema modelled production as `production_orders` +
`production_order_items` + `production_outputs`. **Rejected.** The canonical
chain is:

```
Production Plan
      ↓
Production Batch  (product, line, shift, date, stage)
      ↓
 ┌────────────────┬────────────────┐
 ▼                ▼                ▼
TOTAL INPUT   WORKER PRODUCTION  MATERIAL ISSUE
 └────────────────┴────────────────┘
                  ↓
         PRODUCTION OUTPUT
                  ↓
                 QC
          ┌───────┴───────┐
          ▼               ▼
        PASS            FAIL
          ▼               ▼
      FG STOCK      REWORK / SCRAP / WASTAGE
```

New tables required: `production_plans`, `production_plan_items`,
`production_batches`, `production_stages`, `production_total_inputs`,
`worker_production_entries`, `production_outputs`, `qc_inspections`,
`qc_defects`, `rework_orders`, `rework_items`, `wastage_records`,
`scrap_records`.

Production stages are **tenant-configurable rows**, not an enum.

---

### ADR-012 — Total Input and Worker Production are independent; variance is deferred
**Status:** Accepted

`production_total_inputs` and `worker_production_entries` are **separate
records with no enforced equality**.

**Hard rule:** the system must **never** display "Mismatch", "Discrepancy",
"Error", or a red variance indicator while a batch is incomplete.

A batch carries an explicit `context_completeness` state:
`draft` → `collecting` → `context_complete` → `analysed` → `closed`.

Variance, yield, efficiency, worker contribution and process loss are computed
**only** once the batch reaches `context_complete` — meaning batch, product,
stage, date, shift, line, total input, material input, worker participation,
output (good + defective), rework, wastage, scrap and QC are all present.

Before that state the UI shows a neutral, informative
`"Awaiting complete production context"` — never an error tone. This is a
`ProductionAnalysisService` responsibility, never inline controller logic.

---

### ADR-013 — Worker production is many-to-many with everything
**Status:** Accepted

A worker may work on multiple products, batches and stages, with multiple
entries per day. **Never assume one worker = one product = one day.**

Each `worker_production_entry` independently records worker, batch, product,
stage, quantity, unit, shift, date, start/end time, and notes.

The legacy `ProductionEntry.tsx` collected a required `employeeId` and then
never persisted it — that class of silent data loss is a review blocker.

---

### ADR-014 — Inventory is a ledger; balances are a derived cache
**Status:** Accepted · **Resolves:** C20

`stock_movements` is the **immutable audit source of truth**.
`inventory_balances` is a performance cache that is **only ever mutated inside
the same DB transaction as the movement that caused it**.

- Stock quantity is **never** a directly editable number. Corrections go through
  an `adjustment` movement with a mandatory reason code and audit entry.
- **15 movement types:** `purchase_receipt` · `production_input` ·
  `production_output` · `sale` · `sale_return` · `purchase_return` ·
  `transfer_out` · `transfer_in` · `adjustment` · `damage` · `wastage` ·
  `scrap` · `rework` · `reservation` · `release`.
- **5 stock states** modelled as a dimension on the balance, not a flag:
  `available` · `reserved` · `damaged` · `qc_pending` · `in_transit`.
- **Inventory types (tenant-extensible):** raw material · semi-finished ·
  finished good · consumable · packaging · spare part · other. The legacy
  two-type model (raw + finished only) is **rejected**.
- Every movement records: tenant, item, warehouse, type, quantity, qty_before,
  qty_after, unit cost, source document type + id, user, timestamp.
- Costing method is a **tenant setting** (default weighted average).

---

### ADR-015 — POS shares the sales and inventory core
**Status:** Accepted · **Resolves:** C5

POS is a **fast UI surface over the same `sales_orders` / `invoices` /
`payments` / `stock_movements` tables**, distinguished by a `channel` field
(`pos` · `b2b` · `b2c` · `wholesale` · `retail` · `ecommerce`).

**Forbidden:** a separate POS sales table, a separate POS product table, or a
POS-only stock path.

POS requirements: product search by name/SKU/barcode, category browse, cart,
quantity, line + order discount, tax, customer or walk-in, multiple payment
methods, partial payment, hold/resume sale (persisted draft, survives reload),
complete, print, return. Full keyboard operability is mandatory (ADR-023).

---

### ADR-016 — E-commerce uses the central product catalogue
**Status:** Accepted · **Resolves:** C6

One `products` table serves manufacturing, inventory, POS, sales and
e-commerce. **A separate e-commerce product database is forbidden.**

Product model supports: SKU, slug, category, brand, images, variants,
attributes, price, sale price, per-warehouse stock, SEO fields, per-channel
visibility. Channel visibility is a flag set, not a duplicate record.

---

### ADR-017 — Courier integration is a provider adapter pattern with a capability matrix
**Status:** Accepted · **Resolves:** C6

A `CourierProviderInterface` defines: `createShipment` · `cancelShipment` ·
`trackShipment` · `getRates` · `checkCoverage` · `getStatus` · `generateLabel` ·
`getBalance`.

- Adapters: Steadfast, Pathao, REDX, Paperfly, eCourier, Sundarban, Custom.
  **No provider name may appear in domain logic** — only inside its own adapter
  and its registry entry.
- Not every provider supports every capability. A **capability matrix** is
  declared per adapter; the UI hides or disables unsupported actions with an
  explanation, never a silent failure.
- Multiple courier accounts per tenant. **Credentials are encrypted at rest and
  never returned by any API response.**
- All outbound courier calls run on a **queue** with retry + backoff. Webhooks
  are `validate signature → normalize → apply status`, and are **idempotent**.
- Courier selection rules (area, weight, cost, COD, availability, speed,
  preference) are **configurable data**, not code.

---

### ADR-018 — i18n from day one: English + Bangla
**Status:** Accepted · **Resolves:** C7

i18next + react-i18next, wired in **Phase 1** — not retrofitted.

- **No hardcoded UI string.** Every user-visible string comes from a
  translation key. A lint rule blocks bare string literals in JSX text.
- Namespaces mirror modules (`common`, `production`, `inventory`, `sales`, …).
- Locale, currency, date format and number format are **tenant + user settings**.
  The legacy `'en-BD'` hardcoded in `lib/utils.ts` is removed — formatters take
  locale from context.
- LTR now; the token and layout system must not block RTL later (logical
  properties preferred over `left`/`right`).
- Backend validation messages and notification templates are also translatable.

---

### ADR-019 — Notifications: channel-abstracted, in-app first
**Status:** Accepted · **Resolves:** C13

The **abstraction** (channel driver interface + templates + user preferences +
queue) is built in Phase 8. Only the **in-app / web-push driver is implemented
now**; Email, SMS and WhatsApp drivers are stubs behind the same interface.

This resolves the conflict between "SMS/WhatsApp/email not in base scope" and
the five-channel list: the *interface* is in scope, the *drivers* are not.

Every notification is a persisted row (not just a transient toast) so it can be
listed, marked read, and audited.

---

## 4. UI / UX decisions (non-negotiable)

### ADR-020 — Single token system: Tailwind v4 `@theme`, semantic tokens only
**Status:** Accepted · **Resolves:** C22

`frontend/src/styles/` is the **only** source of design tokens.
`tailwind.config.js` is **deleted** — under Tailwind v4 it was never loaded and
it actively contradicted the live `@theme` (`navy-800` `#122d5e` vs `#1E293B`),
misleading anyone treating it as the palette reference.

**Three-layer token architecture:**
1. **Primitive** — raw scales (`--navy-50..950`, `--blue-50..950`, `--green-*`,
   `--amber-*`, `--red-*`, `--slate-*`), spacing, radii, type ramp, shadows.
2. **Semantic** — the only layer components may reference:
   `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-border`,
   `--color-border-strong`, `--color-text`, `--color-text-muted`,
   `--color-text-subtle`, `--color-primary`, `--color-primary-hover`,
   `--color-primary-fg`, `--color-accent`, `--color-success`, `--color-warning`,
   `--color-danger`, `--color-info`, plus `-subtle`/`-fg` pairs for each status.
3. **Component** — `--btn-*`, `--table-*`, `--input-*`, `--card-*`, derived from
   semantic tokens.

**Hard rules**
- **No raw hex in any component.** The legacy `index.css` hardcodes `#2563EB`,
  `#16A34A` etc. inside `@layer components` — all of it is refactored to
  reference semantic tokens, otherwise dark mode and tenant branding are
  impossible.
- Token naming uses `danger` (not `error`) for the semantic layer, matching the
  frontend spec; the primitive scale keeps `--red-*`.
- Tenant branding overrides **only** `--color-primary`, `--color-accent` and the
  logo, injected as inline CSS variables on `:root` at runtime. Contrast is
  validated server-side on save; a failing brand colour is rejected with a
  reason, never silently accepted.

---

### ADR-021 — State boundary: TanStack Query for server, Zustand for UI only
**Status:** Accepted

| Concern | Owner |
|---|---|
| Any data that originates from the API | **TanStack Query** |
| Sidebar collapsed, mobile drawer, active modal, filter panel open | **Zustand** |
| Form field values, validation, dirty state | **React Hook Form** |
| URL-shareable state: page, filters, sort, search, tab | **URL search params** |

The legacy 389-line monolithic store mixed 16 server-shaped data slices with 6
UI flags and seeded everything from mock arrays. **That pattern is retired.**

- No server entity may be stored in Zustand.
- Filters/pagination/sort live in the URL so views are shareable and
  back-button-correct.
- Query keys are centralised in a typed `queryKeys` factory — no ad-hoc string
  arrays.
- Mutations declare their invalidations explicitly. Optimistic updates are
  permitted **only** for reversible, non-financial actions (never for stock,
  payments, invoices, or approvals).
- No top-level DOM side effects in store files (the legacy store ran
  `document.documentElement.classList.remove('dark')` on import).

---

### ADR-022 — Routing: lazy, guarded, with real error boundaries
**Status:** Accepted

- **Every route is `lazy()`-loaded.** The legacy router eagerly imported all 57
  route elements including the ~1,700-line placeholder file.
- **Route guards are mandatory:** `RequireAuth` → `RequireTenant` →
  `RequirePermission(permission)`. A user without permission gets an explicit
  **403 view explaining what is missing and who to contact** — never a blank
  screen and never a silent redirect.
- Every route defines an `errorElement`. React Router's data APIs are used, not
  bare client-side switching.
- **A real 404 page exists.** The legacy catch-all redirected unknown URLs to
  the dashboard, hiding broken links.
- Navigation is **generated from a single permission-aware route registry**.
  Sidebar, contextual nav, breadcrumbs and mobile nav all derive from it. The
  legacy pattern required editing four files (`Sidebar`, `Header`, `BottomNav`,
  `router`) to add one route.

---

### ADR-023 — Accessibility and keyboard operability are acceptance criteria
**Status:** Accepted

WCAG 2.2 AA is a **merge requirement**, not a nice-to-have.

- Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI boundaries, **verified in both light
  and dark mode**.
- Every interactive element is keyboard reachable with a visible
  `:focus-visible` ring. Modals and drawers implement a **real focus trap** and
  restore focus on close (the legacy `Modal.tsx` had no focus trap and used a
  hardcoded `id="modal-title"` that breaks with two instances mounted).
- Tabs implement arrow-key navigation per WAI-ARIA (the legacy `Tabs.tsx` did
  not).
- Form errors are linked with `aria-describedby` and announced via a live region
  (the legacy `FormGroup` rendered an error paragraph with no association).
- Tables support keyboard navigation, sortable-column semantics, and row actions
  reachable without a mouse.
- POS and production-entry screens are **fully operable without a mouse** —
  factory-floor and counter staff work at speed.
- `prefers-reduced-motion` disables all non-essential animation.
- No dynamically constructed utility class names — the legacy
  `` `h-${height}` `` in `SkeletonLine` silently never applied because
  Tailwind's static extractor cannot see it.

---

### ADR-024 — Every screen implements the full state matrix
**Status:** Accepted

No screen is complete until every applicable state below is designed and
implemented. **Blank screens are forbidden.**

| State | Requirement |
|---|---|
| Loading | Skeleton matching final layout — never a bare spinner for content |
| Skeleton | Preserves layout dimensions; no content shift on resolve |
| Empty (no data yet) | Explains what this is + primary create action |
| Empty (filtered to zero) | Distinct from above; offers "clear filters" |
| Success | Explicit confirmation naming what was created/changed |
| Validation error | Inline, field-level, first error focused |
| Warning | Non-blocking, actionable |
| API / network failure | Cause + **retry** action; preserves user input |
| 401 session expiry | Re-auth modal; unsaved work preserved (ADR-007) |
| 403 permission denied | States the missing permission and who can grant it |
| 404 not found | Distinguishes "never existed" from "no access" |
| 500 server error | Safe message + correlation ID for support (ADR-025) |
| Timeout | Explicit timeout message + retry, not an infinite spinner |
| Duplicate submission | Blocked client-side and server-side (ADR-028) |
| Unsaved changes | Navigation/close guard with save / discard / cancel |
| Offline | Persistent indicator; queued or blocked writes clearly labelled |
| Partial failure | Bulk actions report per-row outcomes, never "all or nothing" silence |
| Stale data | Background refetch indicator; never silently outdated numbers |

**Absolutely forbidden**
- Fake success (the legacy admin-settings Save toggled a flag for 2s and
  persisted nothing).
- Buttons with no handler (legacy: "Submit for Re-QC", and four Export/Refresh
  buttons).
- Fabricated data presented as real (legacy: `Math.random()` trends,
  ID-derived performance scores, invented P&L totals, fake CCTV IPs).
- Misleading copy about side effects that do not occur (legacy
  `ProductionEntry` claimed inventory, performance and QC would update; none
  did).
- Hiding errors, exposing stack traces to users, or animation without purpose.

---

### ADR-025 — Centralised error handling, logging and graceful degradation
**Status:** Accepted

**Frontend**
- **Layered error boundaries:** app root → layout → route → widget. A failed
  chart or KPI card degrades to an inline error card; it must **never** take
  down the page. The existing `ErrorBoundary.tsx` (with its
  `slicemart_error_logs` inspector) is kept and extended to this layering.
- **One API client.** All requests go through typed service modules. `fetch`/
  Axios calls scattered in components are forbidden. The client centrally
  handles: auth header injection, refresh-on-401, tenant context, request
  cancellation via `AbortSignal`, timeouts, retry with backoff for idempotent
  reads only, error normalisation, and correlation-ID capture.
- **Error taxonomy** mapped to UX: `network` · `timeout` · `validation` ·
  `auth` · `permission` · `not_found` · `conflict` · `rate_limit` · `server` ·
  `unknown`. Each maps to a specific, human-readable, non-technical message.
- Users see a **safe message plus a correlation ID**. Stack traces and raw
  server output are never rendered.

**Backend**
- Structured JSON logging with `correlation_id`, `tenant_id`, `user_id`, route,
  duration. Correlation ID is returned in the `X-Correlation-Id` response header
  on every request, including errors.
- A single exception handler produces the canonical error envelope
  (`API_CONTRACT.md`). Internal messages never leak to clients.
- Destructive or financial actions require explicit confirmation and write an
  audit entry (ADR-027).

**Principle:** every action must communicate *what happened*, *what is
happening*, and *what to do next*.

---

### ADR-026 — Dark mode is first-class, `class`-based, and tested
**Status:** Accepted · **Resolves:** C26

The current code has **zero** `dark:` usage despite dark mode being mandated.

- Strategy: `class="dark"` on `<html>`, toggled by a theme provider with three
  modes: `light` · `dark` · `system`. Preference persists per user (server-side)
  with a local fallback, and is applied **before first paint** to avoid flash.
- Dark mode is achieved by **re-mapping semantic tokens**, not by adding `dark:`
  variants throughout components. A component authored against semantic tokens
  is automatically correct in both modes.
- Dark mode is **not inverted light mode**: elevation uses lighter surfaces,
  status colours are re-tuned for contrast on dark backgrounds, charts get their
  own palette, and borders gain opacity rather than switching hue.
- Every module's completion checklist includes explicit dark-mode verification
  including tables, charts, badges, modals, print preview and empty/error states.

---

### ADR-031 — Motion, craft and the two-library motion stack
**Status:** Accepted · **Supersedes:** the "restrained Framer Motion" line in
ADR-024 · **Owner:** stakeholder mandate, 2026-08-22

**Mandate (verbatim intent):** the platform must be *visually attractive,
polished and memorable with a custom yet simple design*, using *tasteful
motion, GSAP, micro-interactions, smooth transitions and animations wherever
they genuinely improve the workflow — not as decoration*, including a
*lightweight, beautiful custom loader*, *refined hover/scroll effects*,
*meaningful feedback states* and *delightful details*, while remaining
*fast, accessible and easy to use*.

This ADR converts that mandate into binding engineering rules. It does **not**
relax ADR-023 (accessibility), ADR-024 (state matrix) or ADR-025 (error
handling) — motion is subordinate to all three.

#### 1. Two libraries, one boundary

| Library | Owns | Examples |
|---|---|---|
| **Framer Motion** | React component lifecycle motion — anything tied to mount/unmount, layout or state | modal/drawer enter-exit, `AnimatePresence` on lists and toasts, `layoutId` shared transitions, tab indicator, accordion, drag-reorder |
| **GSAP** (+ `ScrollTrigger`, `Flip`) | Imperative, timeline-orchestrated and scroll-linked motion that React cannot express declaratively | the app loader timeline, KPI number count-ups, staggered dashboard reveal, scroll-linked storefront sections, print-preview page turn, sequenced success choreography |

**Rule:** never animate the same property on the same element with both
libraries. A component declares its owner in a comment at the top of its
motion block. Contested ownership is a defect.

**Rule:** GSAP is used through a `useGsap()` hook that creates a
`gsap.context()` scoped to a ref and **reverts on unmount**. A bare
`gsap.to()` in a component body leaks animations across route changes and is
a defect.

**Rule:** GSAP is imported **per-plugin**, lazily, in the route chunk that
needs it. It must never enter the initial bundle. `ScrollTrigger` is only
loaded by routes that scroll-animate (storefront, landing, long reports).

#### 2. The motion token system

Durations and easings are **tokens**, not magic numbers. Both libraries read
the same values, so Framer and GSAP motion feel identical.

```
--motion-duration-instant : 80ms    state echo (press, checkbox)
--motion-duration-fast    : 150ms   hover, focus, tooltip, small fades
--motion-duration-base    : 240ms   dropdown, tab, inline expand
--motion-duration-slow    : 380ms   modal, drawer, page transition
--motion-duration-deliberate: 600ms celebratory / count-up / loader beat

--motion-ease-standard : cubic-bezier(0.2, 0, 0, 1)      most transitions
--motion-ease-entrance : cubic-bezier(0.05, 0.7, 0.1, 1) things arriving
--motion-ease-exit     : cubic-bezier(0.3, 0, 0.8, 0.15) things leaving
--motion-ease-emphasis : cubic-bezier(0.3, 0, 0, 1)      spatial/shared element
```

**Rule:** entrances are slower than exits. A UI that leaves as slowly as it
arrives feels sluggish.

**Rule:** a hard ceiling of **400 ms** applies to any animation that stands
between the user and their next action. Only non-blocking motion (loader
beats, count-ups, celebratory flourishes) may use `deliberate`.

#### 3. Where motion is required, permitted and forbidden

**Required** — the interaction is incomplete without it:

| Surface | Motion | Purpose |
|---|---|---|
| App loader | Custom brand loader (§4) | Covers boot, communicates progress |
| Route change | 150 ms cross-fade + top progress bar | Confirms navigation started |
| Skeleton → content | 150 ms fade, **no layout shift** | Avoids content snapping in |
| Modal / drawer | Scale-fade / slide with focus trap | Establishes spatial origin |
| Toast | Slide-in, auto-dismiss, hover-to-hold | Feedback that does not steal focus |
| Optimistic → confirmed | Subtle settle on the changed row | Distinguishes "pending" from "saved" |
| Validation error | 200 ms shake **plus** text + icon + colour | Draws the eye; never the only signal |
| Table row mutation | Highlight-fade on the affected row | Answers "what just changed?" |
| Number updates (KPI) | GSAP count-up from previous value | Makes deltas legible |
| Stepper / wizard | Directional slide matching travel | Reinforces where you are |
| Offline → online | Banner slide + queued-items settle | Explains recovery, per ADR-025 |

**Permitted** — craft, kept cheap:

- Hover: `translateY(-1px)` + shadow step on cards; underline grow on links;
  icon nudge on buttons with directional meaning.
- Focus: animated ring that **never** replaces the static visible ring.
- Scroll: sticky header shrink-on-scroll, staggered first-paint reveal of
  dashboard widgets (max 60 ms stagger, max 6 items), scroll-linked
  storefront sections.
- Delight: a single restrained flourish on genuinely significant completions
  — batch closed, payroll approved, day-end reconciled. **One** per flow, and
  it never delays the next action.
- Charts: 400 ms draw-in on first render only, never on refetch.

**Forbidden:**

- Motion on data the user is trying to read — no animated table rows during
  scroll, no moving text, no continuous looping in a data region.
- Any animation on `top/left/width/height/margin` in a hot path. Only
  `transform`, `opacity`, `filter` and `clip-path` are animated.
- Staggered reveal on operational tables and lists that operators use dozens
  of times a day. A POS grid appears; it does not perform.
- Motion that delays feedback. If the server has answered, the UI says so
  immediately; the animation decorates the answer, it does not gate it.
- Parallax, springy overshoot on business controls, spinning logos, confetti
  on routine saves, "AI shimmer" gradients on everything.
- Scroll-jacking or scroll-hijacked storytelling in the operational app.
  Scroll-linked motion is confined to the public storefront.
- Motion used to hide latency instead of reporting it. If an operation is
  slow, show progress and elapsed intent — do not distract.

#### 4. The custom loader

There are **three** loading presentations, and they are not
interchangeable:

| Level | Presentation | Used when |
|---|---|---|
| Boot | **Custom brand loader** — GSAP timeline, inline critical CSS, visible before the React bundle parses | First paint of the app shell only |
| Route / section | **Skeletons** shaped like the real content | Any navigation or data fetch with known layout |
| Inline | **Button spinner / progress** on the triggering control | Mutations, exports, sync |

Loader rules:

1. It is **lightweight**: inline SVG + CSS/GSAP only. No Lottie, no image
   sequence, no external font dependency. Budget: **< 4 KB** inline, no
   network request of its own.
2. It shows **tenant branding** when known (logo from the whitelisted branding
   tokens, ADR-023), and a neutral mark otherwise.
3. It is **honest**: after 8 s it adds "This is taking longer than usual",
   after 20 s it offers Retry, and on failure it hands off to the error
   boundary. A loader that spins forever is a defect (ADR-025).
4. A spinner is **never** the answer where a skeleton is possible. Full-screen
   spinners are banned everywhere except boot.
5. It respects `prefers-reduced-motion` by rendering a static mark with a
   determinate progress bar.

#### 5. Accessibility, performance and correctness

- **`prefers-reduced-motion: reduce` is honoured globally**, once, at the
  provider level — not per component. Under reduce: transforms become opacity
  changes or nothing, GSAP timelines are created with
  `gsap.globalTimeline.timeScale()` neutralised via the reduced-motion
  context, count-ups snap to their final value, `ScrollTrigger`-driven reveals
  render in their final state, and every `duration` token collapses toward 0.
  **No information is lost in reduced-motion mode** — if a state is conveyed
  by motion, it is also conveyed by text, icon or colour (ADR-023).
- Motion never moves focus, never traps focus outside a dialog, and never
  animates an element out from under a keyboard user mid-interaction.
- Every animated interactive element remains fully operable while animating.
- Budget: **60 fps on mid-range Android**. Any animation that drops frames on
  the reference device is deleted, not optimised twice.
- Motion adds **zero** to the critical bundle beyond the loader. Framer Motion
  is already a dependency; GSAP is lazy per route.
- Motion is **not** a substitute for the state matrix. Every state in ADR-024
  must be readable with animation entirely disabled. Reviewers verify screens
  with motion off.

#### 6. Consequences

- `UI_SYSTEM.md` gains a motion chapter specifying the tokens, the loader, the
  library boundary, the per-surface motion table and the reduced-motion
  contract. It is the implementation reference for this ADR.
- `gsap` joins the dependency list. It is the only animation library added.
- Every module's Definition of Done (ADR-030) gains two checks: *motion
  reviewed against ADR-031* and *screen verified with motion disabled*.
- **Design ambition is explicitly in scope.** "Looks like default shadcn with
  no point of view" is a valid review rejection, and so is "animated for the
  sake of animation". Both fail this ADR.

---

## 5. Engineering quality decisions

### ADR-027 — Audit trail on every sensitive mutation
**Status:** Accepted

`audit_logs` records: tenant, user, action, entity type, entity id, **before**
snapshot, **after** snapshot, IP, user agent, correlation ID, timestamp, and a
source reference.

Mandatory for: stock adjustments and transfers · invoice create/modify/void ·
payment create/modify/reverse · production and worker-production modification ·
QC result changes · role/permission changes · user create/disable · customer and
supplier changes · employee changes · courier credential changes · tenant
setting changes · any `withoutTenantScope()` use.

- Audit writes happen **inside** the same transaction as the mutation.
- Audit rows are **append-only** — no update, no delete, ever.
- **Completed financial transactions are never directly editable.** Corrections
  use Correction · Reversal · Return · Adjustment · Void · Approval — each of
  which is itself an audited record.
- Historical invoice cost, profit and margin snapshots are **immutable** and are
  never recalculated from current cost.

---

### ADR-028 — Transaction boundaries and idempotency
**Status:** Accepted · **Resolves:** C17

**Atomic transaction boundaries (11):**
1. Lead → customer conversion (preserves salesman, source, lead history, date)
2. Invoice posting (+ stock movement + ledger)
3. Payment allocation across invoices
4. Purchase receipt (+ stock movement + cost revaluation)
5. Warehouse transfer (`transfer_out` + `transfer_in`)
6. Production material issue
7. Production completion / output posting
8. QC result → stock state transition
9. Rework order creation and closure
10. Incentive finalisation for a period
11. Courier booking (local state atomic; remote call queued)

**Idempotency required for:** payments · courier booking · webhook ingestion ·
order creation · invoice posting · POS sale completion · bulk imports.

Mechanism: client sends an `Idempotency-Key` header; the server stores the key
with its response and replays it on retry. Duplicate submission is therefore
impossible even with double-clicks, retries or flaky networks.

---

### ADR-029 — Frontend is never built against imaginary APIs
**Status:** Accepted · **Resolves:** C21

For each module the order is fixed: **contract → backend → generated types →
frontend**.

- `API_CONTRACT.md` defines the envelope before any endpoint is written.
- Backend types are **generated** into `frontend/src/types/api/**`. Hand-written
  duplicates are forbidden.
- Local development and tests use **MSW handlers derived from the real contract**
  — not a mock data module that drifts. `mockData.ts` is deleted.
- Any endpoint the frontend needs but the contract lacks is a **documentation
  task first**, not an invented call.

---

### ADR-030 — Definition of Done (per module)
**Status:** Accepted

A module is not done until **all** of the following exist:

**Backend** — migration (SQLite + MySQL verified) · model with `tenant_id`
scope · relations · Form Request validation · Policy · Service/Action ·
controller · API Resource · route registration · audit hooks ·
notification hooks · report integration · feature tests including a
**cross-tenant isolation test** · permission catalogue entries.

**Frontend** — typed service module · query keys · route (lazy + guarded) ·
permission-aware navigation entry · list view with URL-driven
filter/sort/paginate · detail view · create/edit form (RHF + Zod) ·
**the complete ADR-024 state matrix** · optimistic-update policy honoured ·
translations for `en` + `bn` · dark-mode verified · responsive verified
(desktop/laptop/tablet/mobile) · keyboard + a11y verified · empty/error/offline
verified.

**Docs** — `DEVELOPMENT_STATUS.md` updated · any contract change reflected in
`API_CONTRACT.md` / `DATABASE_DESIGN.md` · any new decision recorded here.

**"A feature is not complete when only its UI exists."**

---

### ADR-032 — Pragmatic Definition of Done for standard CRUD modules
**Status:** Accepted · **Amends:** ADR-030 · **Owner:** 2026-08-24

**Context.** ADR-030 lists a per-model **Policy** class and domain
**event/listener audit hooks** among the thirteen Definition-of-Done artefacts.
The only module shipped so far — Auth (§7 item 50 of `DEVELOPMENT_STATUS.md`) —
uses **neither**: authorisation is enforced by the `permission:` route
middleware (`AuthorizePermission`, ADR-008) and there is no event/listener
indirection. Instantiating ~40 CRUD modules each with a Policy class that only
re-checks the same permission string, plus an event + listener whose sole job is
to write one audit row, is ceremony that duplicates guarantees the middleware
and the transaction already give.

**Decision.** For a **standard CRUD module** — one that follows the
`API_CONTRACT.md` §15.1 shape, i.e. the master-data catalogue (`units`,
`categories`, `brands`, and the resources that mirror them) — the Definition of
Done is read as:

- **Form Request** classes for validation — **kept**. Real value, testable,
  PHPStan-typed request shapes.
- **API Resource** classes for serialisation — **kept**. The envelope's `data`
  shape is defined in exactly one place per resource.
- **Action** class for every mutation — **kept**, and each wraps its work in
  `DB::transaction()` and writes the audit row **inside the same transaction**
  (ADR-027 append-only, ADR-028 boundaries). No event/listener indirection.
- **Authorisation** stays on the route as
  `permission:catalog.<resource>.<action>` middleware. **No per-model Policy
  class** is created unless a resource needs a row-level rule a permission
  string cannot express (e.g. "only the record's owner may edit"); a Policy is
  added *only* when that need is real, never pre-emptively.
- The **cross-tenant isolation test**, the **permission matrix test**
  (authorised **and** forbidden) and the **envelope test** remain **mandatory
  and unchanged**.

**Consequence.** ADR-030's artefact list stands, but **Policy** and
**event/listener** become **conditional** rather than unconditional for CRUD
modules. Audit is not weakened — moving it from a listener into the transaction
is strictly safer, because the audit row and the mutation now commit or roll
back together (ADR-028). This is the reference template every catalogue module
copies; a deviation from it is a documented exception, not a default.

---

### ADR-033 — Generated TypeScript types: one canonical file, one directory
**Status:** Accepted · **Clarifies:** ADR-029 · **Owner:** 2026-08-24

**Context.** ADR-029 requires request/response types to be **generated** from
the backend into `frontend/src/types/api/**` and forbids hand-written
duplicates. No generator is installed yet, and ADR-029 also gates the frontend
build behind those types existing. `frontend/src/types/index.ts` is a legacy
demo file whose shapes are UI mocks, **not** contract types.

**Decision.** Adopt **both**, aimed at the **same** directory so there is
exactly one source per type:

1. Install **`spatie/laravel-typescript-transformer`** and configure it to emit
   into `frontend/src/types/api/`. Backend DTO / API-Resource shapes are
   annotated so the generator owns them going forward; CI re-runs generation and
   a diff **fails the build** (`API_CONTRACT.md` §17 "Generated types").
2. Until the generator is wired and green, the canonical
   `frontend/src/types/api/catalog.ts` is **authored to the contract by hand**
   and is the single source of truth for the catalogue module. When the
   generator emits into that same path, its output **replaces** the hand-authored
   file — the hand file is a **bootstrap, not a parallel copy**.
3. The legacy `types/index.ts` demo shapes are **not** the contract and are
   **not** imported by new module code. Contract types live only under
   `types/api/**`.

**Consequence.** The frontend is never blocked waiting for the generator, and
ADR-029's "no hand-written duplicates" holds because the hand-authored file and
the generated file occupy the **same path** — one strictly supersedes the other.

---

## 6. Scope resolutions (contradiction ledger)

Every contradiction found in the legacy documentation, and where it is resolved:

| # | Contradiction | Resolution |
|---|---|---|
| C1 | Single-client vs multi-tenant SaaS | ADR-001 → SaaS |
| C2 | "2 warehouses / 1 line" hardcoded vs forbidden | ADR-002 → tenant config |
| C3 | Schema had no tenancy tables | ADR-004, ADR-005 |
| C4 | Four incompatible module lists (32 / 17 / 14 / 35) | `MODULE_MAP.md` — 41 modules canonical |
| C5 | POS specified vs entirely absent | ADR-015 → in scope, Phase 5 |
| C6 | E-commerce + courier specified vs absent | ADR-016, ADR-017 → Phases 6, 9 |
| C7 | i18n mandated vs absent | ADR-018 → Phase 1 |
| C8 | Wastage/scrap first-class vs missing | ADR-011, ADR-014 → tables + movement types + report |
| C9 | `production_orders` vs plan→batch chain | ADR-011 → plan→batch |
| C10 | Invoice template engine vs no tables | `DATABASE_DESIGN.md` → template tables, Phase 5 |
| C11 | `module.resource.action` vs `module.action` | ADR-008 → three-segment |
| C12 | Lead statuses fixed vs configurable | Configurable rows; the 7 legacy statuses are **seed defaults** |
| C13 | Notification channels in/out of scope | ADR-019 → interface now, drivers later |
| C14 | Protocol files disagreed on architecture doc | Single `TASK_PROTOCOL.md`; both legacy files archived |
| C15 | Three competing reading lists, 6 docs missing | This file's precedence table; all 7 docs now created |
| C16 | Filename vs mandated name mismatches | Canonical names adopted exactly |
| C17 | 9 vs 10 transaction boundaries | ADR-028 → 11, enumerated |
| C18 | 33 vs ~36 reports, no superset | `RMS_REPORT_MATRIX.md` → single superset catalogue |
| C19 | Two disagreeing "core table" lists | `DATABASE_DESIGN.md` is the only table authority |
| C20 | 2 inventory types vs 7 types + 5 states | ADR-014 |
| C21 | No API contract existed | ADR-029 + `API_CONTRACT.md` |
| C22 | Tokens name-only; dead `tailwind.config.js` | ADR-020 + `UI_SYSTEM.md` |
| C23 | No module map, no ADR | This file + `MODULE_MAP.md` |
| C24 | Status said "pre-development"; app exists | ADR-009 + `DEVELOPMENT_STATUS.md` reset |
| C25 | TanStack Query locked, Zustand shipped | ADR-021 → both, hard boundary |
| C26 | Dark mode mandated, zero `dark:` in code | ADR-026 |
| C27 | Mobile "optional" vs 9 required workflows | Responsive web is required for all listed workflows; a **native app** remains out of scope (`PROJECT_CONTEXT.md`) |
| C28 | Incentive formula unconfirmed but scheduled | Rule engine is configurable (ADR-002); **no default formula is invented** — see Open Questions |
| C29 | Fourth UI-UX brief at repo root | Archived to `docs/_legacy/LEGACY_UIUX_FRONTEND_PROMPT.md` |
| C30 | Extensionless filename | Archived; all canonical docs are `.md` |

### Explicitly out of scope (Phase 0–10)

Full double-entry accounting · payroll processing · native mobile apps ·
manufacturing MRP/capacity scheduling optimisation · CCTV/NVR hardware
integration (legacy `BUSINESS_RULES.md` raised it; **no requirements exist** —
the fake CCTV screen in the prototype is deleted) · marketplace/multi-vendor ·
warehouse robotics or barcode-printer firmware.

The Finance module stays **structurally compatible** with future double-entry
accounting (accounts, transactions, allocations) without implementing it.

---

## 7. Open questions (blocking the phase noted)
---

### ADR-028 — Transaction boundaries and idempotency
**Status:** Accepted · **Resolves:** C17

**Atomic transaction boundaries (11):**
1. Lead → customer conversion (preserves salesman, source, lead history, date)
2. Invoice posting (+ stock movement + ledger)
3. Payment allocation across invoices
4. Purchase receipt (+ stock movement + cost revaluation)
5. Warehouse transfer (`transfer_out` + `transfer_in`)
6. Production material issue
7. Production completion / output posting
8. QC result → stock state transition
9. Rework order creation and closure
10. Incentive finalisation for a period
11. Courier booking (local state atomic; remote call queued)

**Idempotency required for:** payments · courier booking · webhook ingestion ·
order creation · invoice posting · POS sale completion · bulk imports.

Mechanism: client sends an `Idempotency-Key` header; the server stores the key
with its response and replays it on retry. Duplicate submission is therefore
impossible even with double-clicks, retries or flaky networks.

---

### ADR-029 — Frontend is never built against imaginary APIs
**Status:** Accepted · **Resolves:** C21

For each module the order is fixed: **contract → backend → generated types →
frontend**.

- `API_CONTRACT.md` defines the envelope before any endpoint is written.
- Backend types are **generated** into `frontend/src/types/api/**`. Hand-written
  duplicates are forbidden.
- Local development and tests use **MSW handlers derived from the real contract**
  — not a mock data module that drifts. `mockData.ts` is deleted.
- Any endpoint the frontend needs but the contract lacks is a **documentation
  task first**, not an invented call.

---

### ADR-030 — Definition of Done (per module)
**Status:** Accepted

A module is not done until **all** of the following exist:

**Backend** — migration (SQLite + MySQL verified) · model with `tenant_id`
scope · relations · Form Request validation · Policy · Service/Action ·
controller · API Resource · route registration · audit hooks ·
notification hooks · report integration · feature tests including a
**cross-tenant isolation test** · permission catalogue entries.

**Frontend** — typed service module · query keys · route (lazy + guarded) ·
permission-aware navigation entry · list view with URL-driven
filter/sort/paginate · detail view · create/edit form (RHF + Zod) ·
**the complete ADR-024 state matrix** · optimistic-update policy honoured ·
translations for `en` + `bn` · dark-mode verified · responsive verified
(desktop/laptop/tablet/mobile) · keyboard + a11y verified · empty/error/offline
verified.

**Docs** — `DEVELOPMENT_STATUS.md` updated · any contract change reflected in
`API_CONTRACT.md` / `DATABASE_DESIGN.md` · any new decision recorded here.

**"A feature is not complete when only its UI exists."**

---

### ADR-032 — Pragmatic Definition of Done for standard CRUD modules
**Status:** Accepted · **Amends:** ADR-030 · **Owner:** 2026-08-24

**Context.** ADR-030 lists a per-model **Policy** class and domain
**event/listener audit hooks** among the thirteen Definition-of-Done artefacts.
The only module shipped so far — Auth (§7 item 50 of `DEVELOPMENT_STATUS.md`) —
uses **neither**: authorisation is enforced by the `permission:` route
middleware (`AuthorizePermission`, ADR-008) and there is no event/listener
indirection. Instantiating ~40 CRUD modules each with a Policy class that only
re-checks the same permission string, plus an event + listener whose sole job is
to write one audit row, is ceremony that duplicates guarantees the middleware
and the transaction already give.

**Decision.** For a **standard CRUD module** — one that follows the
`API_CONTRACT.md` §15.1 shape, i.e. the master-data catalogue (`units`,
`categories`, `brands`, and the resources that mirror them) — the Definition of
Done is read as:

- **Form Request** classes for validation — **kept**. Real value, testable,
  PHPStan-typed request shapes.
- **API Resource** classes for serialisation — **kept**. The envelope's `data`
  shape is defined in exactly one place per resource.
- **Action** class for every mutation — **kept**, and each wraps its work in
  `DB::transaction()` and writes the audit row **inside the same transaction**
  (ADR-027 append-only, ADR-028 boundaries). No event/listener indirection.
- **Authorisation** stays on the route as
  `permission:catalog.<resource>.<action>` middleware. **No per-model Policy
  class** is created unless a resource needs a row-level rule a permission
  string cannot express (e.g. "only the record's owner may edit"); a Policy is
  added *only* when that need is real, never pre-emptively.
- The **cross-tenant isolation test**, the **permission matrix test**
  (authorised **and** forbidden) and the **envelope test** remain **mandatory
  and unchanged**.

**Consequence.** ADR-030's artefact list stands, but **Policy** and
**event/listener** become **conditional** rather than unconditional for CRUD
modules. Audit is not weakened — moving it from a listener into the transaction
is strictly safer, because the audit row and the mutation now commit or roll
back together (ADR-028). This is the reference template every catalogue module
copies; a deviation from it is a documented exception, not a default.

---

### ADR-033 — Generated TypeScript types: one canonical file, one directory
**Status:** Accepted · **Clarifies:** ADR-029 · **Owner:** 2026-08-24

**Context.** ADR-029 requires request/response types to be **generated** from
the backend into `frontend/src/types/api/**` and forbids hand-written
duplicates. No generator is installed yet, and ADR-029 also gates the frontend
build behind those types existing. `frontend/src/types/index.ts` is a legacy
demo file whose shapes are UI mocks, **not** contract types.

**Decision.** Adopt **both**, aimed at the **same** directory so there is
exactly one source per type:

1. Install **`spatie/laravel-typescript-transformer`** and configure it to emit
   into `frontend/src/types/api/`. Backend DTO / API-Resource shapes are
   annotated so the generator owns them going forward; CI re-runs generation and
   a diff **fails the build** (`API_CONTRACT.md` §17 "Generated types").
2. Until the generator is wired and green, the canonical
   `frontend/src/types/api/catalog.ts` is **authored to the contract by hand**
   and is the single source of truth for the catalogue module. When the
   generator emits into that same path, its output **replaces** the hand-authored
   file — the hand file is a **bootstrap, not a parallel copy**.
3. The legacy `types/index.ts` demo shapes are **not** the contract and are
   **not** imported by new module code. Contract types live only under
   `types/api/**`.

**Consequence.** The frontend is never blocked waiting for the generator, and
ADR-029's "no hand-written duplicates" holds because the hand-authored file and
the generated file occupy the **same path** — one strictly supersedes the other.

---

### ADR-034 — Three-Layer Experience Separation
**Status:** Accepted · **Amends:** ADR-029

**Context.** The system now requires distinct visual and logic separations
between the Super Admin Platform, Tenant-facing Dashboards, and Public-facing
Storefronts.

**Decision.**
1. **Master Admin (`/platform/*`)**: Full system management for Super Admins.
2. **Tenant App (`/*`)**: The core SaaS product for registered tenants.
3. **Headless Storefront (`/store/:subdomain` & `{subdomain}.devcenterpoint.com`)**:
   Public-facing storefronts with separate CMS settings, theme previews, and
   drag-and-drop page builders.
4. **Impersonation**: Super Admins may impersonate tenants via a secure,
   immutable audit-logged session.
5. **CMS & Integration**: Support for sandboxed custom HTML/CSS blocks and
   standardised Courier Integration Hub (Steadfast, Pathao, REDX) with
   webhook-based status synchronization.

---

## 6. Scope resolutions (contradiction ledger)

Every contradiction found in the legacy documentation, and where it is resolved:

| # | Contradiction | Resolution |
|---|---|---|
| C1 | Single-client vs multi-tenant SaaS | ADR-001 → SaaS |
| C2 | "2 warehouses / 1 line" hardcoded vs forbidden | ADR-002 → tenant config |
| C3 | Schema had no tenancy tables | ADR-004, ADR-005 |
| C4 | Four incompatible module lists (32 / 17 / 14 / 35) | `MODULE_MAP.md` — 41 modules canonical |
| C5 | POS specified vs entirely absent | ADR-015 → in scope, Phase 5 |
| C6 | E-commerce + courier specified vs absent | ADR-016, ADR-017 → Phases 6, 9 |
| C7 | i18n mandated vs absent | ADR-018 → Phase 1 |
| C8 | Wastage/scrap first-class vs missing | ADR-011, ADR-014 → tables + movement types + report |
| C9 | `production_orders` vs plan→batch chain | ADR-011 → plan→batch |
| C10 | Invoice template engine vs no tables | `DATABASE_DESIGN.md` → template tables, Phase 5 |
| C11 | `module.resource.action` vs `module.action` | ADR-008 → three-segment |
| C12 | Lead statuses fixed vs configurable | Configurable rows; the 7 legacy statuses are **seed defaults** |
| C13 | Notification channels in/out of scope | ADR-019 → interface now, drivers later |
| C14 | Protocol files disagreed on architecture doc | Single `TASK_PROTOCOL.md`; both legacy files archived |
| C15 | Three competing reading lists, 6 docs missing | This file's precedence table; all 7 docs now created |
| C16 | Filename vs mandated name mismatches | Canonical names adopted exactly |
| C17 | 9 vs 10 transaction boundaries | ADR-028 → 11, enumerated |
| C18 | 33 vs ~36 reports, no superset | `RMS_REPORT_MATRIX.md` → single superset catalogue |
| C19 | Two disagreeing "core table" lists | `DATABASE_DESIGN.md` is the only table authority |
| C20 | 2 inventory types vs 7 types + 5 states | ADR-014 |
| C21 | No API contract existed | ADR-029 + `API_CONTRACT.md` |
| C22 | Tokens name-only; dead `tailwind.config.js` | ADR-020 + `UI_SYSTEM.md` |
| C23 | No module map, no ADR | This file + `MODULE_MAP.md` |
| C24 | Status said "pre-development"; app exists | ADR-009 + `DEVELOPMENT_STATUS.md` reset |
| C25 | TanStack Query locked, Zustand shipped | ADR-021 → both, hard boundary |
| C26 | Dark mode mandated, zero `dark:` in code | ADR-026 |
| C27 | Mobile "optional" vs 9 required workflows | Responsive web is required for all listed workflows; a **native app** remains out of scope (`PROJECT_CONTEXT.md`) |
| C28 | Incentive formula unconfirmed but scheduled | Rule engine is configurable (ADR-002); **no default formula is invented** — see Open Questions |
| C29 | Fourth UI-UX brief at repo root | Archived to `docs/_legacy/LEGACY_UIUX_FRONTEND_PROMPT.md` |
| C30 | Extensionless filename | Archived; all canonical docs are `.md` |

### Explicitly out of scope (Phase 0–10)

Full double-entry accounting · payroll processing · native mobile apps ·
manufacturing MRP/capacity scheduling optimisation · CCTV/NVR hardware
integration (legacy `BUSINESS_RULES.md` raised it; **no requirements exist** —
the fake CCTV screen in the prototype is deleted) · marketplace/multi-vendor ·
warehouse robotics or barcode-printer firmware.

The Finance module stays **structurally compatible** with future double-entry
accounting (accounts, transactions, allocations) without implementing it.

---

## 7. Open questions (blocking the phase noted)

| # | Question | Blocks | Owner |
|---|---|---|---|
| Q1 | **Incentive calculation formula** — legacy docs state it "must be confirmed before implementation" and no file records it. Slab boundaries, base (revenue vs gross profit), and whether returns claw back incentive are all unknown. | Phase 5 (incentive finalisation) | Client |
| Q2 | Tax model — single VAT rate, per-product rates, or inclusive/exclusive per channel? | Phase 5 (invoice totals) | Client |
| Q3 | Invoice numbering rules per tenant — prefix, reset period (never/yearly/monthly), padding, and whether POS uses a separate series. | Phase 5 | Client |
| Q4 | Courier accounts — which providers does Slice Mart actually hold credentials for, and are they COD-enabled? | Phase 6 | Client |
| Q5 | Opening data migration — the existing Excel files' structure, and the cut-over date for opening stock balances. | Phase 10 | Client |
| Q6 | Approval chains — which actions require a second-person approval (stock adjustment above a threshold? invoice discount above X%?). | Phase 2 (permission design) | Client |

**Rule:** an open question is never resolved by inventing a default. If a phase
reaches a blocked item, implementation stops at the configurable boundary and
the question is escalated.

---

## 8. Change log

| Date | Change |
|---|---|
| 2026-08-21 | ADR-001 … ADR-030 accepted. Legacy docs archived to `docs/_legacy/`. Canonical documentation set created. |
| 2026-08-22 | **ADR-031 accepted** — motion, craft and the two-library motion stack (Framer Motion + GSAP), motion tokens, the three-tier loading model with a custom brand loader, and the required/permitted/forbidden motion matrix. Supersedes the "restrained Framer Motion" line in ADR-024 and updates the frontend stack table in §2. |
| 2026-08-22 | Consistency pass (no decision changed): §1 now reads "ADR-001 through ADR-031"; the C4 resolution now names the actual outcome — **41 modules** in `MODULE_MAP.md`, not "35 domains". |
| 2026-08-24 | **ADR-032 and ADR-033 accepted.** ADR-032 makes ADR-030's per-model **Policy** and **event/listener** artefacts *conditional* for standard CRUD modules: validation via Form Requests, serialisation via API Resources, mutations via Actions that write the audit row **inside** the transaction (ADR-027/028), and authorisation via the existing `permission:` middleware (ADR-008) — a Policy is added only for a row-level rule a permission string cannot express. ADR-033 resolves the generated-types bootstrap: install `spatie/laravel-typescript-transformer` emitting into `frontend/src/types/api/`, while the canonical `types/api/catalog.ts` is hand-authored to the contract until the generator is green, then replaced by generated output — one path, never a duplicate (ADR-029 upheld). §1 updated to "ADR-001 through ADR-033". No prior decision reversed. |
| 2026-08-28 | **ADR-034 accepted** — Three-Layer Experience Separation (Master Admin `/platform/*`, Tenant App `/*`, Headless Storefront `/store/:subdomain` & `{subdomain}.devcenterpoint.com`), Super Admin Tenant Impersonation with immutable audit logging, Storefront CMS Settings with live theme preview, Drag-and-Drop section builder, Sandboxed Custom HTML/CSS Blocks, and Courier Integration Hub (Steadfast, Pathao, REDX) with webhook synchronization. |
