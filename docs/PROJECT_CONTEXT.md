# PROJECT CONTEXT

> **Status:** Canonical. Precedence rank 2 (see `DECISIONS.md` §0).
> Subordinate only to `docs/DECISIONS.md`.
>
> **Last updated:** 2026-08-22 · **Phase:** 0 (Architecture & Documentation)

This document answers *what we are building and why*. It does not describe
*how* — that belongs to `ARCHITECTURE.md`, `DATABASE_DESIGN.md`,
`API_CONTRACT.md` and `UI_SYSTEM.md`.

---

## 1. Product identity

**Name (internal):** FMS Platform
**Category:** Multi-tenant Manufacturing + Inventory + Sales + Workforce +
Delivery SaaS.

We are building **one product, sold many times**. It is an operating system for
small and mid-sized manufacturing businesses that:

1. **make** something from raw materials,
2. **store** it across multiple locations,
3. **sell** it through several channels,
4. **pay people** partly by what they produced,
5. **deliver** it themselves or through couriers.

**Slice Mart is tenant #1. Slice Mart is not the product.** (ADR-001)
Every requirement traced to Slice Mart must be generalised into a tenant-level
setting before it is implemented. (ADR-002)

### The one-sentence test

> If a competitor of Slice Mart signed up tomorrow, could they run their factory
> on this system without a single code change?

If the answer is no, the feature is not finished.

---

## 2. The problem we solve

Target businesses currently run on a patchwork of paper registers, WhatsApp
messages, and spreadsheets. The specific pains, in order of business cost:

| # | Pain | What breaks today |
|---|---|---|
| 1 | Production is untraceable | Nobody can prove how much raw material became how much finished product, or where it went wrong |
| 2 | Worker output is disputed | Piece-rate wages are calculated from memory or an unreliable notebook |
| 3 | Stock is a guess | Physical stock never matches the register; nobody knows which movement caused the gap |
| 4 | Wastage is invisible | Loss is discovered at month end, when it is too late to act |
| 5 | Sales channels are disconnected | Counter sales, phone orders, dealer orders and online orders live in separate books and oversell the same stock |
| 6 | Delivery is a black box | "Where is my order" cannot be answered without phoning the rider |
| 7 | Reporting is manual | Any question needs a person with a calculator and a weekend |
| 8 | Accountability is absent | No record of who changed a price, adjusted stock, or approved a return |

Every module in this platform exists to remove one of these eight pains. A
feature that does not map to one of them is scope creep.

---

## 3. Who uses it

Personas are **capability profiles**, not hardcoded roles. Roles and their
permission sets are tenant-configurable data. (ADR-008)

| Persona | Environment | Primary need | Design consequence |
|---|---|---|---|
| **Platform Owner** | Desk, our staff | Onboard tenants, plans, quotas, global health | Separate platform scope, never mixed with tenant data |
| **Tenant Owner / MD** | Phone + desk | Truth in one screen; profit, stock value, exceptions | Dashboard is a decision surface, not a KPI wall |
| **Manager / Admin** | Desk | Approvals, master data, exceptions, reports | Dense tables, bulk actions, keyboard-first |
| **Production Supervisor** | Factory floor, noisy, gloves, tablet | Log batches and worker output fast, with zero ambiguity | Large targets, few fields per step, offline tolerance |
| **QC Inspector** | Factory floor | Pass / fail / rework with a reason, evidence attached | Decision-first forms, mandatory reason codes |
| **Storekeeper** | Warehouse, barcode scanner | Receive, issue, transfer, count | Scan-driven flows, no mouse dependence |
| **Purchase Officer** | Desk | Requisition → PO → GRN → bill | Long forms with save-as-draft and unsaved-change guards |
| **Sales / POS Operator** | Counter, queue behind them | Complete a sale in seconds | Full-screen POS, keyboard shortcuts, printer-ready receipt |
| **Field Sales / Delivery Rider** | Outdoors, mobile, weak network | See the run sheet, mark delivered, collect cash | Mobile-first, offline-tolerant, optimistic-with-rollback |
| **Accountant** | Desk | Ledgers, receivables, payables, payroll | Immutable records, exportable, reconcilable |
| **HR Officer** | Desk | Attendance, leave, salary + production incentive | Payroll reads production output; must never be editable after lock |
| **Auditor (read-only)** | Desk | Who did what, when, and what changed | Every mutation has a before/after snapshot (ADR-027) |
| **Online Customer** | Public web, phone | Browse, order, track | Separate storefront scope; no back-office coupling |

### Design consequence that is easy to forget

Three of these personas (Supervisor, Storekeeper, Rider) work **standing up, on
a touch device, in poor light, possibly with unreliable network**. The interface
they use is not a shrunken desktop table. Their screens are designed first for
their context, and the desktop layout follows. (`UI_SYSTEM.md`)

---

## 4. Tenancy model

Seven levels. Each level exists because a real operational decision is made at
that level. (ADR-005)

```
Platform                        our business; owns tenants, plans, quotas
└── Tenant                      one paying customer; billing + branding boundary
    └── Company                 legal entity; own invoice series, tax identity
        └── Branch              commercial location; sales, POS, customers
            └── Factory         manufacturing site
                └── Production Line   where a batch physically runs
            └── Warehouse       stock-holding location (branch or factory)
```

Rules:

- **Tenant is the hard isolation boundary.** No query may ever cross it.
  (ADR-004)
- Company, Branch, Factory, Line and Warehouse are **scoping** boundaries, not
  security boundaries. A user may be granted access to a subset.
- The hierarchy is **not** required to be deep. A tenant with one company, one
  branch, one factory and one warehouse must never see hierarchy UI they do not
  need. Depth is progressive disclosure.
- Levels are **data, never enums**. A tenant may have 1 or 40 warehouses.
  Generation A's hardcoded "2 warehouses, 1 production line" is dead. (C4)

---

## 5. Functional scope

35 domains. Grouped by the pain they remove. Detailed dependencies, ownership
and phase mapping live in `MODULE_MAP.md`.

### 5.1 Platform & Foundation
1. Platform administration (tenants, plans, quotas, feature flags)
2. Tenant settings & branding (logo, colours, currency, locale, numbering)
3. Authentication & sessions
4. Users, roles & permissions (RBAC)
5. Organisation structure (company / branch / factory / line / warehouse)
6. Audit log & activity trail
7. Notifications
8. Attachments & document storage

### 5.2 Master Data
9. Product catalogue (raw, semi-finished, finished, packaging, consumable,
   service, asset-part)
10. Categories, brands, units & unit conversions
11. Bill of Materials / recipes
12. Warehouses, racks & bin locations
13. Parties (suppliers, customers, dealers, agents) — one party may be several
14. Price lists, discount rules & tax profiles

### 5.3 Production
15. Production planning
16. Production batches
17. Total input recording
18. Material issue & return
19. Worker production entry (piece / weight / unit output per worker)
20. Production output & yield
21. Quality control (pass / fail / rework / hold)
22. Wastage & scrap
23. Rework cycles

### 5.4 Procurement & Inventory
24. Purchase requisition → purchase order → goods receipt → purchase bill
25. Supplier returns & debit notes
26. Stock movements ledger (the single source of truth for quantity)
27. Transfers between warehouses
28. Stock adjustments with mandatory reason codes
29. Physical stock count & reconciliation

### 5.5 Sales & Revenue
30. CRM (leads, follow-ups, customer accounts, credit limits)
31. Sales orders, invoices, deliveries, returns & credit notes
32. Point of Sale (counter, offline-tolerant, shift & cash drawer)
33. Invoice template builder (drag-and-drop, tenant-branded, print-accurate)
34. Payments, receipts & receivables

### 5.6 Delivery
35. Delivery orders, run sheets & proof of delivery
36. Courier integrations via provider adapters (ADR-017)
37. Delivery tracking & status timeline
38. Cash on delivery reconciliation

### 5.7 Workforce
39. Employees & organisation chart
40. Attendance & shifts
41. Leave
42. Payroll, including production-linked incentives
43. Worker performance analytics

### 5.8 Assets & Maintenance
44. Asset register
45. Maintenance schedules & breakdown logs

### 5.9 Finance
46. Chart of accounts & journals
47. Expenses & petty cash
48. Bank & cash accounts
49. Costing (material + labour + overhead → product cost)

### 5.10 Intelligence
50. Reporting & Management System (RMS) — 58 reports, see
    `RMS_REPORT_MATRIX.md`
51. Dashboards per persona
52. Exports (CSV / XLSX / PDF)

### 5.11 E-commerce (Phase 9)
53. Storefront catalogue & cart
54. Online checkout & order intake
55. Customer account & order tracking

> The numbering above is a reading aid. `MODULE_MAP.md` holds the authoritative
> module registry, IDs and dependency graph.

---

## 6. Core business flows

### 6.1 Production chain (the heart of the product)

```
Production Plan
   │
   ▼
Production Batch  ──────────────┐
   │                            │
   ├── Total Input              │  what actually entered the line
   ├── Material Issue           │  what left the warehouse (ledger)
   └── Worker Production        │  what each worker produced
                                │
                                ▼
                       Production Output
                                │
                                ▼
                         Quality Control
                    ┌───────────┼───────────┬──────────┐
                    ▼           ▼           ▼          ▼
                  Pass        Rework       Scrap    Wastage
                    │           │            │         │
                    ▼           ▼            ▼         ▼
              Finished       Back to      Scrap     Loss
               Stock          batch       stock    recorded
```

Three non-negotiable properties of this chain:

1. **It is a chain, not a form.** There is no single "production entry" screen
   that pretends to capture all of it. (ADR-011, C11)
2. **Total Input and Worker Production are recorded independently, by different
   people, at different times.** They are reconciled later. (ADR-013)
3. **Variance is never shown until the batch has enough context to be judged.**
   A batch progresses `draft → collecting → context_complete → analysed →
   closed`. Showing "Mismatch" to a supervisor who has simply not finished
   entering data is a defect, not a feature. (ADR-012)

### 6.2 Inventory truth

Stock quantity is **derived from an append-only movement ledger**. A balance row
is a performance cache that can be rebuilt from the ledger at any time.
(ADR-014)

```
Any stock change  →  stock_movement row (immutable)  →  balance cache updated
                     (type, qty, from, to, reason,       in the same transaction
                      reference document, actor)
```

Consequences:

- Nothing edits a balance directly. Ever.
- Every discrepancy is explainable by replaying movements.
- Adjustments require a reason code and become part of the audit trail.
- Stock states (`available`, `reserved`, `in_transit`, `quarantine`, `damaged`)
  and movement types are enumerated in `DATABASE_DESIGN.md`.

### 6.3 Sales, POS and e-commerce share one core

A counter sale, a dealer order, a phone order and an online order are the **same
sales document** distinguished by a `channel` field. They share the same stock
reservation, pricing, tax, and receivables logic. (ADR-015, ADR-016)

POS is a **specialised UI over the shared core**, not a parallel system. If POS
needs its own stock table, the design is wrong.

### 6.4 Order to doorstep

```
Sales Order → Invoice → Delivery Order
                            ├── Own rider  → Run sheet → POD → Cash collected
                            └── Courier    → Adapter   → Webhook → Status timeline
```

Courier providers differ in capability. The platform declares a **capability
matrix** per provider and disables unsupported actions in the UI rather than
failing at runtime. (ADR-017)

### 6.5 Production feeds payroll

Worker production output is an input to payroll incentive calculation. This
means:

- Production data becomes **financially significant** the moment it is entered.
- Once a payroll period is locked, the production records it consumed become
  immutable references.
- The incentive formula is tenant-configurable and is currently an **open
  question (Q1)** blocking Phase 7.

---

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| **Tenant isolation** | A cross-tenant data leak is a P0 incident. Five enforcement layers (ADR-004) |
| **Correctness over speed** | Stock, production and money calculations are transactional and auditable (ADR-028) |
| **Auditability** | Every sensitive mutation stores actor, timestamp, before/after (ADR-027) |
| **Performance target** | List views under 300 ms server time at 100k rows per tenant; dashboards under 1 s |
| **Accessibility** | WCAG 2.2 AA is a merge requirement, not a backlog item (ADR-023) |
| **Localisation** | English + Bangla from Phase 1; no user-facing hardcoded string (ADR-018) |
| **Resilience** | No component failure may blank the application (ADR-025) |
| **Offline tolerance** | POS and delivery flows degrade gracefully and queue locally |
| **Observability** | Correlation ID on every request, surfaced in error UI for support |
| **Data retention** | Ledgers, audit logs and invoices are never hard-deleted |

---

## 8. UI/UX charter (non-negotiable)

Reproduced here because it governs product acceptance, not just styling. The
enforceable specification is `UI_SYSTEM.md`; the binding decisions are ADR-020
through ADR-026.

1. The interface is **distinctive, premium and human-designed** — not generic AI
   SaaS. Clear hierarchy, strong typography, data-rich layouts.
2. **Every screen** implements the applicable states: loading, skeleton, empty,
   success, validation, warning, error, API/network failure, 401, 403, session
   expiry, 404, 500, timeout/retry, duplicate, unsaved changes, offline.
   (ADR-024)
3. **Centralised** API handling, error handling, logging, retries, cancellation,
   notifications, confirmations and audit feedback. (ADR-025)
4. Components **fail gracefully**. A broken widget shows a recoverable error in
   its own boundary; the app stays usable. (ADR-022, ADR-025)
5. Light and dark mode are both **first-class and tested**. (ADR-026)
6. The product must be **visually attractive, polished and memorable** with a
   custom yet simple design — a deliberate point of view, not a default theme.
   "Looks like stock shadcn" is a valid rejection. (ADR-031)
7. Motion is **purposeful craft**: tasteful transitions, refined hover and
   scroll effects, meaningful feedback states, a lightweight custom brand
   loader, and delightful details **only where they improve the workflow**.
   Framer Motion owns component/state motion; GSAP owns orchestrated and
   scroll-linked motion. Every screen must remain fully readable and operable
   with motion disabled. (ADR-031)
8. **Absolutely forbidden:** hiding errors, exposing stack traces to users,
   faking success, buttons with no handler, random or placeholder data presented
   as real, animation used as filler, and motion that delays feedback or hides
   latency instead of reporting it.
9. Every action answers three questions: **what happened, what is happening
   now, and what to do next.**

---

## 9. Technology summary

Locked by ADR-006. Detail and rationale in `ARCHITECTURE.md`.

| Layer | Choice |
|---|---|
| Repository | Monorepo: `/frontend` + `/backend` (ADR-003) |
| Backend | Laravel 13 · PHP 8.5 · modular monolith |
| Database | MySQL 8.x production · SQLite local dev · Eloquent ORM |
| Auth | JWT access token (15 min, memory) + rotating refresh token (14 d, httpOnly cookie) (ADR-007) |
| Async | Laravel Queue (database driver dev, Redis prod) for couriers, exports, notifications |
| Frontend | React 19 · TypeScript (`strict`) · Vite |
| Styling | Tailwind CSS v4, CSS-first `@theme`. **No `tailwind.config.js`.** (ADR-020) |
| Server state | TanStack Query v5 — the only owner of server data (ADR-021) |
| UI state | Zustand — UI concerns only, never server data (ADR-021) |
| Forms | React Hook Form + Zod, schema shared with API contract |
| Tables | TanStack Table |
| Charts | Recharts |
| Motion | Framer Motion (component/state) + GSAP, lazy per route (orchestrated/scroll) — motion tokens, custom brand loader (ADR-031) |
| Icons | Lucide |
| Toasts | Sonner |
| i18n | i18next + react-i18next (`en`, `bn`) |
| API mocking | MSW, handlers generated from `API_CONTRACT.md` (ADR-029) |

---

## 10. Current state of the codebase

Honest baseline as of Phase 0. Full audit in `DEVELOPMENT_STATUS.md`.

**What exists:** a React prototype at the repository root — a strong design
system (`src/index.css`, ~143 semantic component classes), a working UI kit
(Button, Badge, Modal, KPICard, Tabs, Feedback, FormElements), a 390-line
`ErrorBoundary`, and a utility library.

**What does not exist:** a backend, an API layer, authentication, tenancy,
RBAC, i18n, dark mode, route guards, a 404 route, and TanStack Query — despite
it being listed as locked.

**What is actively wrong:** ~1,706 lines of placeholder pages, a 374-line
`mockData.ts`, a v3 `tailwind.config.js` that is never loaded and conflicts with
the live `@theme`, 57 eagerly imported routes, and a Zustand store holding 16
slices of server data.

**Disposition** (ADR-009):

| Verdict | Artefacts |
|---|---|
| **Keep** | `index.css` token layer, `components/ui/*`, `ErrorBoundary.tsx`, `lib/utils.ts` |
| **Refactor** | `QuickEntryModals.tsx`, `useAppStore.ts` (UI-only), `utils.ts` locale hardcoding |
| **Rebuild** | `router/index.tsx` (lazy + guarded + 404) |
| **Delete** | `PlaceholderPage.tsx`, `data/mockData.ts`, `tailwind.config.js` |

The prototype is a **visual reference and component source**, not an
architecture. It is not evidence that a module is done.

---

## 11. Assumptions

Stated so they can be challenged rather than silently inherited.

| # | Assumption | Risk if wrong |
|---|---|---|
| A1 | Tenants are small-to-mid manufacturers; shared-schema tenancy is sufficient | A large tenant may need schema or DB separation (ADR-004 has a documented exit path) |
| A2 | Bangladesh is the first market: BDT, Bangla, local couriers, VAT-style tax | Tax engine may need redesign for other jurisdictions |
| A3 | Production is discrete/batch, not continuous process | Continuous-flow tenants would need a different batch model |
| A4 | A single MySQL primary is adequate for the foreseeable tenant count | Sharding would be required later |
| A5 | Factory devices are tablets/phones on unreliable Wi-Fi | Native app pressure if PWA proves insufficient |
| A6 | Couriers expose usable HTTP APIs and webhooks | Manual CSV fallback needed per provider |

---

## 12. Explicitly out of scope

Not in the roadmap. Requesting them requires a new ADR.

- Full double-entry accounting software replacement (we keep ledgers and
  costing, not a general ledger product)
- Statutory tax filing / e-invoicing government integration
- Manufacturing Execution System / machine-level IoT telemetry
- Native iOS / Android applications (PWA only)
- Continuous-process manufacturing
- Multi-currency transactions (currency is a tenant setting; transactions are
  single-currency)
- White-label reselling of the platform by tenants

---

## 13. Open questions

Mirrored from `DECISIONS.md` §7. These block the phases named.

| # | Question | Blocks |
|---|---|---|
| Q1 | Production incentive formula — per unit, per kg, tiered, or tenant-scripted? | Phase 7 (Payroll) |
| Q2 | Tax model — single VAT rate, per-product rate, or tax profile per party? | Phase 5 (Sales) |
| Q3 | Invoice numbering scope — per tenant, per company, or per branch, and reset period? | Phase 5 |
| Q4 | Courier credentials — platform-level accounts or per-tenant accounts? | Phase 6 |
| Q5 | Is there existing Slice Mart data to migrate, and in what form? | Phase 2 |
| Q6 | Which documents require multi-step approval (PO, adjustment, return, payroll)? | Phase 4 |

---

## 14. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Created as the rank-2 canonical product context, superseding `_legacy/AI_PROJECT_CONTEXT.md` and the product sections of the archived `MASTER_*` prompts. |
| 2026-08-22 | Consistency pass: capability 50 (RMS) now says **58 reports**, matching `RMS_REPORT_MATRIX.md`. |
