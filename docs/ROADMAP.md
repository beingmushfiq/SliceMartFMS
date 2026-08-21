# ROADMAP

> **Rank 6 canonical.** The delivery sequence. A phase may not begin until the
> previous phase's exit gate is signed off. Where this document and a wish to
> "just quickly add" something disagree, this document wins.

**Status:** Canonical · **Last updated:** 2026-08-22 · **Owner:** Architect

---

## 1. The rules of the roadmap

These are the rules that make a roadmap real instead of aspirational.

1. **Phases are gated, not overlapping.** Each phase has an explicit exit gate
   (§4). Work does not start on phase N+1 while phase N's gate is unmet.
2. **Vertical slices, not layers.** A phase delivers working
   database → API → types → UI for its modules. There is no "backend phase"
   followed six weeks later by a "frontend phase".
3. **The build order inside every module is fixed** (ADR-029):
   `migration → model → action → policy → contract entry → controller → resource → test → generated types → query hooks → UI`.
   Nothing is built against an endpoint that is not in `API_CONTRACT.md` first.
4. **No placeholders, ever.** A screen either works against a real endpoint or it
   does not exist. `PlaceholderPage`, mock data and dead buttons are forbidden
   (`UI_SYSTEM.md` §19).
5. **Every module ships with all thirteen Definition-of-Done artefacts**
   (`MODULE_MAP.md` §6). Twelve of thirteen is not done.
6. **Cross-tenant isolation is tested in every phase**, not audited once at the
   end. Every feature test suite includes an isolation case.
7. **Slice Mart is tenant #1.** No phase may introduce a hardcoded tenant name,
   currency, locale, timezone, warehouse, product or role.
8. **Documentation is part of the change.** A pull request that changes an
   endpoint and does not change `API_CONTRACT.md` in the same commit is rejected.
9. **A phase can be re-opened.** If phase 4 exposes a defect in phase 2's ledger
   design, phase 2 is re-opened and its gate re-signed. Progress is not measured
   by never going back.

### 1.1 What "done" means at the phase level

A phase is done when, for every module in it:

- the thirteen artefacts exist,
- the feature test suite is green including isolation, 401 and 403 cases,
- the UI implements the full applicable state matrix in both themes and both
  locales, keyboard-operable and axe-clean,
- the phase-specific exit gate in §4 demonstrably passes,
- `DEVELOPMENT_STATUS.md` is updated to reflect reality.

---

## 2. Sequence at a glance

```
Phase 0   Architecture & documentation                        ← current
   │      7 canonical docs + repo restructure
   ▼
Phase 1   Auth + Tenancy + RBAC + Design System
   │      the spine. everything else assumes it.
   ▼
Phase 2   Master Data + Products + Warehouses
   │      nothing can move stock that does not exist
   ▼
Phase 3   Production + Worker Production + QC
   │      the differentiator. built before purchase on purpose.
   ▼
Phase 4   Purchase + Inventory (complete)
   │      closes the ledger in both directions
   ▼
Phase 5   CRM + Sales + POS + Invoice Builder
   │      one stock pool, five channels
   ▼
Phase 6   Delivery + Courier Integrations
   │      the first real third-party boundary
   ▼
Phase 7   HR + Assets + Finance
   │      payroll consumes phase 3's output
   ▼
Phase 8   Reports / RMS + Notifications + Audit surfaces
   │      only meaningful once there is data to report on
   ▼
Phase 9   E-commerce (storefront + online orders)
   │      a channel on the phase 5 core, not a second system
   ▼
Phase 10  SaaS hardening + testing + deployment
          quotas, backups, restore drills, E2E, a11y, launch
```

### 2.1 Why this order and not another

| Question | Answer |
|---|---|
| Why is production before purchasing? | Production is the hardest and most differentiating domain, and it defines the inventory movement types that purchasing then reuses. Building purchasing first would mean designing the ledger twice. |
| Why is the design system in phase 1, not phase 0? | Phase 0 is documentation. The design system is code — tokens, primitives, the state components, the boot loader. It ships with auth because the login screen is the first thing that needs it. |
| Why is reporting so late? | A report over fabricated data proves nothing. Reporting lands after production, purchasing, sales and delivery exist, so every report is validated against real ledger rows. |
| Why is e-commerce phase 9? | It is a `channel` on the unified sales core. Building it before phase 5 would create a parallel order system — the exact duplication the architecture exists to prevent. |
| Why is HR split across phases 3 and 7? | Phase 3 needs the *identity* of a worker to attribute production output. Attendance, payroll and the rest are a phase 7 concern. |
| Why is finance last-but-three? | Costing needs production output, purchase prices and sales revenue to exist before it can be anything other than an empty ledger. |

---

## 3. The phases in detail

### Phase 0 — Architecture and documentation

**Deliverable:** the decision record and the repository shape. No features.

| Item | Output |
|---|---|
| Canonical documentation | `DECISIONS.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `MODULE_MAP.md`, `DATABASE_DESIGN.md`, `API_CONTRACT.md`, `UI_SYSTEM.md` |
| Supporting documentation | `ROADMAP.md`, `README.md` (index + precedence), `TASK_PROTOCOL.md`, `DEVELOPMENT_STATUS.md`, `RMS_REPORT_MATRIX.md` |
| Legacy handling | All prior documents archived to `docs/_legacy/` and marked non-authoritative |
| Repository restructure | Monorepo `/frontend` + `/backend`; prototype moved into `/frontend` and triaged per `UI_SYSTEM.md` §17 |
| Tooling baseline | ESLint (incl. `jsx-a11y`), Prettier, TypeScript `strict`, PHPStan/Larastan, Pint, dependency-cruiser boundaries, CI pipeline skeleton |

**Explicitly out of scope:** any migration, any endpoint, any screen.

---

### Phase 1 — Auth, Tenancy, RBAC and the Design System

The spine. Every later phase assumes all of this is unbreakable.

**Modules:** `platform`, `tenancy`, `auth`, `rbac`, `audit`, `files`,
`notifications` (delivery mechanism only), `design-system`.

**Backend:**

- Migration waves 0–3: `tenants`, `plans`, `subscriptions`, `companies`,
  `branches`, `factories`, `production_lines`, `warehouses` (shell),
  `users`, `roles`, `permissions`, `role_permission`, `user_role`, `user_scopes`,
  `refresh_tokens`, `audit_logs`, `attachments`, `document_sequences`,
  `idempotency_keys`, `settings`, `feature_flags`, `notifications`.
- `BelongsToTenant` trait + global scope; `ResolveTenant` middleware; all five
  enforcement layers from `ARCHITECTURE.md`.
- JWT access + rotating refresh family, `token_version`, `perm_version`.
- Permission resolution, `user_scopes` scope checks, `OUT_OF_SCOPE` vs
  `FORBIDDEN`.
- The full middleware pipeline, the exception→HTTP map, the envelope, correlation
  IDs, the idempotency middleware, the rate-limit buckets.
- Append-only `audit_logs` with the domain-event listener.
- Attachment upload with content-sniffed MIME and signed URLs.

**Frontend:**

- Token files (five, per `UI_SYSTEM.md` §2.1), the `@theme` bridge,
  `tailwind.config.js` deleted.
- Light/dark/system with the pre-paint script; density; `reduced_motion`.
- The boot brand loader (< 4KB, real milestones, 8s/20s escalation).
- `MotionConfig` + `useGsap()` + `tokens.motion.css`.
- The four-level error boundary tree.
- The API client: envelope parsing, `error.code` typing, the 401 protocol
  (refresh once, replay once), `AbortSignal`, correlation surfacing, GET retry /
  mutation no-retry.
- `QueryBoundary`, `StateView` + the error-code registry, `AsyncButton`,
  `ConfirmDialog`, `ConflictPanel`, `EmptyState`, `Skeleton`, toasts.
- The app shell: topbar, permission-filtered sidebar, breadcrumbs, command
  palette, offline banner, session-expiry modal.
- Login, forgot/reset, tenant selection, branch switch, profile and preferences.
- i18n scaffolding with `en` + `bn` and the 40%-inflation pseudo-locale.
- MSW handlers generated from `API_CONTRACT.md`; Storybook.

**Exit gate:**

1. A **second tenant** is created and proven isolated — a test asserts tenant B's
   record returns `404` (not `403`) to tenant A across every seeded table.
2. Every state in the matrix has a working component, demonstrable in Storybook,
   in both themes.
3. Login → refresh rotation → reuse detection → family revocation all pass.
4. A permission change propagates via `perm_version` without a logout.
5. Boot loader, skeletons and inline spinners behave per the three-tier model, and
   the whole app is verified with motion disabled.
6. Lighthouse and bundle budgets pass on the login and shell routes.

---

### Phase 2 — Master Data, Products and Warehouses

**Modules:** `catalogue`, `bom`, `warehouses`, `parties`, `pricing`.

- Units and unit conversions, categories, brands, products, variants, SKUs,
  barcodes, product attributes, packaging.
- Bill of materials with versioning and effective dates.
- Warehouse hierarchy, zones, bins, warehouse–branch mapping.
- Parties: customers, dealers, suppliers, contacts, addresses, credit terms.
- Price lists, tiers, dealer pricing, effective-dated prices, tax profiles.
- `GET /{resource}/options` for every entity a select box needs.
- The `DataTable` pattern completed: URL-driven state, server pagination/sort/
  filter/search, column persistence, selection bar, export via async job.
- Import with `dry_run`, per-row error reporting and a keyed commit.

**Exit gate:**

1. Full CRUD for every master entity with the complete state matrix — including
   distinct "no data" and "filtered to zero" empty states.
2. **Zero mock data remains** anywhere in `/frontend`; `mockData.ts` and
   `PlaceholderPage.tsx` are deleted.
3. Unique keys are tenant-scoped: two tenants can both own SKU `SKU-001`.
4. A BOM resolves to component quantities correctly across unit conversions.
5. A dry-run import of a malformed 500-row file writes no rows and reports every
   bad row with its line number.

---

### Phase 3 — Production, Worker Production and QC

The differentiator.

**Modules:** `production-planning`, `production`, `worker-production`, `qc`,
`wastage`, `hr` (worker identity slice only), `inventory` (production write path).

- Production plans → batches; batch state machine with explicit transitions.
- **Total input**, **material issue** (BOM-driven with substitution),
  **worker production** entry, **output** recording.
- QC inspection with sampling, pass / rework / scrap dispositions.
- Wastage recording with reason codes.
- The **`context_completeness` state machine** —
  `draft → collecting → context_complete → analysed → closed` — with yield and
  variance held `NULL` until `context_complete`, and
  `422 PRODUCTION_CONTEXT_INCOMPLETE` returned with the `missing` array until then.
- `stock_movements` write path for production consumption and production receipt;
  `stock_balances` cache maintained inside the same transaction.
- The `CloseProductionBatch` action with its documented transaction boundary.

**Exit gate:**

1. A batch runs plan → material issue → worker production → output → QC → stock,
   in one tenant, with correct ledger rows at every step.
2. Yield and variance are `NULL` until context is complete, and the UI states this
   honestly rather than showing `0`.
3. Rebuilding `stock_balances` from `stock_movements` reproduces the cache exactly.
4. Worker production entry is fully operable on a tablet, keyboard-only, with a
   44px minimum target size.
5. Closing a batch twice with the same idempotency key produces one close.
6. Worker output attribution reconciles to the batch total within tolerance, and
   a mismatch is surfaced as a warning, not swallowed.

---

### Phase 4 — Purchasing and Inventory (complete)

**Modules:** `inventory` (all 15 movement types, 5 stock states),
`purchasing`, `stock-ops`.

- Purchase requisition → purchase order → GRN → supplier bill.
- Partial receipt, over/short receipt tolerance, rejection on receipt.
- Transfers between warehouses with in-transit state.
- Stock adjustments with reason codes and approval.
- Stock counts / stock take: sheet generation, blind count, variance approval,
  posting.
- Reservations and allocations; expiry and batch/lot tracking; serial tracking
  where enabled.
- Reorder levels and low-stock warnings.

**Exit gate:**

1. Purchase → GRN → stock reconciles **exactly** against the ledger, to four
   decimal places.
2. All 15 movement types are exercised by tests; the ledger is append-only and no
   code path updates or deletes a movement.
3. A stock count posts variances as movements, never as a direct balance edit.
4. A transfer in flight is visible in neither source nor destination available
   stock, and is visible as in-transit.
5. `stock_balances` rebuild passes again after every phase-4 movement type.
6. Concurrent issue of the same stock from two sessions produces one success and
   one `INSUFFICIENT_STOCK`, never negative stock.

---

### Phase 5 — CRM, Sales, POS and the Invoice Builder

**Modules:** `crm`, `sales`, `pos`, `invoice-builder`, `payments`.

- The unified sales core discriminated by `channel`
  (`counter` `dealer` `phone` `field` `online`).
- Quotation → sales order → delivery → invoice → payment → return / credit note.
- Credit limit enforcement, dealer pricing resolution, discount authority levels.
- POS: keyboard-first console, barcode scanning, held sales, split payment, shift
  open/close and cash reconciliation, offline queue with visible count and replay.
- Invoice builder with bounded customisation and the shared `print-preview`
  template JSON for screen and PDF.
- Payments, partial payments, allocation to invoices, receipts.
- CRM: leads, follow-ups, activity timeline.

**Exit gate:**

1. One stock pool serves counter, dealer and phone sales — a counter sale and a
   dealer order compete for the same stock correctly.
2. POS completes a sale offline and replays it on reconnect with no duplication,
   proven by the intent-scoped idempotency key.
3. Invoice PDF and on-screen preview are byte-identical in content, driven by the
   same payload.
4. Credit limit breach returns `CREDIT_LIMIT_EXCEEDED` with real numbers and a
   remedy, and cannot be bypassed from the client.
5. POS is fully operable with zero mouse contact, and a shift closes with cash
   reconciled.
6. Document numbering under concurrent load produces no gaps and no duplicates.

---

### Phase 6 — Delivery and Courier Integrations

**Modules:** `delivery`, `couriers`.

- Delivery orders, challans, routes, riders, proof of delivery, COD collection
  and reconciliation.
- The `CourierProviderInterface` (8 methods) with **two** live adapters.
- The capability matrix: an unsupported operation returns
  `422 UNSUPPORTED_CAPABILITY` and the UI does not offer it.
- Inbound webhooks: signature verified before parsing, idempotent on
  `provider_event_id`, out-of-order protection, unknown types stored and
  acknowledged, replay endpoint.
- Outbound webhooks with signing, six-attempt backoff, endpoint auto-disable.
- Every delivery attempt visible in the UI.

**Exit gate:**

1. Two adapters create shipments, fetch labels and receive status updates.
2. The same webhook delivered five times produces one state change.
3. An out-of-order webhook does not regress a delivered shipment to in-transit.
4. A provider outage degrades gracefully — `UPSTREAM_FAILED` with a retry path,
   never a crash and never a lost order.
5. COD collected reconciles against payments to the paisa.

---

### Phase 7 — HR, Assets and Finance

**Modules:** `hr` (full), `attendance`, `payroll`, `assets`, `maintenance`,
`finance`, `costing`.

- Employees, contracts, departments, designations, shifts, leave.
- Attendance capture and approval; overtime.
- Payroll: salary structures, piece-rate consumption of **phase 3 worker
  production output**, deductions, advances, payslips, immutable period lock.
- Assets: register, assignment, depreciation, maintenance schedules, work orders.
- Finance: chart of accounts, journals, payables, receivables, expenses, cash and
  bank, period close.
- Costing: production cost roll-up from material, labour and overhead.

**Exit gate:**

1. Payroll consumes production output for piece-rate workers and matches a manual
   calculation exactly.
2. A locked payroll period is immutable — every write path returns
   `PERIOD_CLOSED`.
3. A closed accounting period rejects backdated entries.
4. Production cost per unit is traceable to its material, labour and overhead
   components, and the trace is visible in the UI.
5. Asset depreciation posts to finance without manual intervention.

---

### Phase 8 — Reports / RMS, Notifications and Audit surfaces

**Modules:** `reports`, `dashboards`.

- The report registry (`report_definitions`) and the two-tier model: live query
  vs pre-aggregated summary tables.
- All reports in the RMS matrix, each with the standard control set: parameters,
  scope, date range, grouping, comparison, drill-through, export.
- `meta.freshness { as_of, tier, stale }` on every aggregate, rendered on screen.
- Role dashboards with per-widget queries, per-widget boundaries and permission
  filtering at the API.
- Notification centre, preferences, digests.
- Audit log viewer with filtering and export.
- Async export for anything over the row cap.

**Exit gate:**

1. Every report in the matrix returns numbers that reconcile against the
   underlying ledger, verified by test.
2. No aggregate renders without a freshness stamp.
3. A failing widget on a dashboard leaves its neighbours working.
4. A 200,000-row export completes via the job contract with a real progress
   percentage and never blocks a request.
5. A user without a report's permission cannot see it, cannot fetch it, and it is
   not in the registry response.

---

### Phase 9 — E-commerce

**Modules:** `storefront`, `online-orders`.

- Public storefront resolved by domain, per tenant, catalogue-driven.
- Cart, checkout, guest and registered customers, online payment.
- Online order lands in the **phase 5 sales core** as `channel = online`.
- Customer account area: orders, tracking, returns.
- Storefront-specific motion budget: `ScrollTrigger` reveals permitted here and
  only here.
- SEO, sitemap, structured data, Open Graph.

**Exit gate:**

1. An online order is a row in the same `sales` tables and reserves the same
   stock as a counter sale.
2. Two tenants' storefronts are fully isolated by domain, with no cross-tenant
   data leakage in any response.
3. Storefront meets the same a11y bar and its own performance budget.
4. A payment failure leaves no orphaned order and no reserved stock.

---

### Phase 10 — SaaS hardening, testing and deployment

**Modules:** `subscription`, `ops`.

- Plans, quotas, usage metering, quota enforcement, upgrade/downgrade,
  trial and dunning.
- Platform admin console: tenants, plans, impersonation with audit, usage.
- Backups with **verified restore drills**, not just backup jobs.
- Observability: structured logs with correlation, error tracking, uptime,
  queue depth and job failure alerting.
- Security pass: headers, CORS, secrets, dependency audit, rate-limit review,
  penetration checklist.
- E2E suites for the critical journeys; full a11y audit; load test on POS,
  production entry and reporting.
- Deployment: zero-downtime releases, migration strategy, rollback plan, runbook.

**Exit gate:**

1. Quotas are enforced server-side and a plan downgrade behaves predictably.
2. A backup is **restored** into a clean environment and verified.
3. E2E green for: login, create product, run a production batch, receive a
   purchase, complete a POS sale, dispatch a delivery, run payroll, run a report.
4. Full a11y audit passes with zero critical or serious findings.
5. Load targets met on the three heaviest surfaces.
6. A rollback is executed successfully in staging.

---

## 4. Exit gate summary

One table, for the wall.

| Phase | Single sentence that must be true to exit |
|---|---|
| 0 | The seven canonical documents are approved and the repository matches them. |
| 1 | A second tenant exists, is provably isolated, and every UI state has a real component. |
| 2 | Every master entity has real CRUD with a full state matrix and no mock data survives. |
| 3 | A batch runs end to end and yield stays `NULL` until context is complete. |
| 4 | Purchase → GRN → stock reconciles exactly and `stock_balances` rebuilds from the ledger. |
| 5 | One stock pool serves every channel and POS survives going offline. |
| 6 | Two courier adapters are live and duplicate webhooks change state once. |
| 7 | Payroll consumes production output and a locked period is immutable. |
| 8 | Every report reconciles to the ledger and no aggregate lacks a freshness stamp. |
| 9 | An online order is an ordinary sale in the same tables against the same stock. |
| 10 | A backup restores, E2E is green, a11y is clean, and a rollback has been rehearsed. |

---

## 5. Cross-cutting work that is never a phase

These are done continuously, in every phase, and are never scheduled as their own
milestone. Scheduling them separately is how they get dropped.

| Concern | Applied in |
|---|---|
| Tenant isolation tests | Every module's test suite |
| Accessibility | Every screen, at merge time |
| Both themes | Every screen, at merge time |
| `en` + `bn` strings | Every screen, at merge time |
| The state matrix | Every screen, at merge time |
| Audit logging | Every mutation |
| Correlation IDs | Every request |
| Contract updates | Every endpoint change, same commit |
| Performance budgets | Every route, in CI |
| Motion-disabled verification | Every screen, at merge time |

---

## 6. Risk register

| Risk | Phase | Mitigation |
|---|---|---|
| Production domain complexity is underestimated | 3 | Deferred variance via `context_completeness` was designed precisely so partial data does not block entry or produce false numbers |
| Ledger drift between `stock_movements` and `stock_balances` | 3–4 | The cache is rebuildable and a rebuild-equality test runs in CI after every phase |
| POS offline sync duplication | 5 | Intent-scoped idempotency keys, and POS completion exempted from the write rate-limit bucket |
| Courier provider API instability | 6 | Adapter pattern + capability matrix + idempotent webhooks + visible delivery attempts |
| Report performance on large tenants | 8 | Two-tier model with pre-aggregation, mandatory freshness stamps, and async export over the cap |
| Scope creep into unplanned modules | all | `MODULE_MAP.md` is closed; a new module requires an ADR |
| Documentation drifting from code | all | Contract-first order (ADR-029) plus CI type-generation diff failing the build |
| Tenant branding breaking accessibility | 1–2 | Server-side contrast validation on save; only three whitelisted overrides |

---

## 7. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Initial canonical roadmap. Phases 0–10 with per-phase module lists, deliverables and binding exit gates, aligned to `MODULE_MAP.md` §5. Adds the cross-cutting list and the risk register. |

