# MODULE MAP

> **Status:** Canonical. Precedence rank 5 (see `DECISIONS.md` §0).
>
> **Last updated:** 2026-08-22 · **Phase:** 0 (Architecture & Documentation)

The authoritative registry of every module: its ID, its owner phase, its
dependencies, and the boundary it must respect. Nothing may be built for a
module that is not listed here.

---

## 1. How to read this

| Column | Meaning |
|---|---|
| **ID** | Stable module identifier. Used for folder names, permission prefixes, query keys, and translation namespaces. Never renamed. |
| **Module** | Human name |
| **Phase** | The phase that delivers it (`ROADMAP.md`). A module may be extended later but is *owned* by one phase. |
| **Depends on** | Modules that must exist first. A module may not be started before every dependency is complete. |
| **Scope** | `platform` (our staff), `tenant` (back-office), `public` (storefront/webhooks) |

Folder convention (both stacks):

```
backend/app/Modules/<PascalCase>/       e.g. Modules/Production
frontend/src/modules/<kebab-case>/      e.g. modules/production
permissions                             <id>.<resource>.<action>
translation namespace                   <id>
query key root                          ['<id>', '<resource>', ...]
```

---

## 2. Module registry

### 2.1 Core (Phase 1 — the foundation everything else assumes)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `platform` | Platform administration — tenants, plans, quotas, feature flags, impersonation | 1 | — | platform |
| `tenancy` | Tenant record, hierarchy (company/branch/factory/line), settings, branding | 1 | `platform` | tenant |
| `auth` | Login, refresh, logout, password reset, sessions, device list | 1 | `tenancy` | tenant |
| `rbac` | Users, roles, permissions, scope assignment | 1 | `auth` | tenant |
| `audit` | Append-only audit log, activity trail, viewer | 1 | `auth` | tenant |
| `files` | Attachments, signed URLs, checksums | 1 | `auth` | tenant |
| `notifications` | Channel-abstracted notifications, preferences, in-app inbox | 1 | `auth` | tenant |
| `design-system` | Tokens, primitives, layout shells, state components | 1 | — | — |

> `design-system` is frontend-only and has no backend counterpart. It is listed
> because no feature UI may be built before it exists (ADR-020).

### 2.2 Master data (Phase 2)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `catalogue` | Products, variants, SKUs, categories, brands, units + conversions, product types | 2 | `rbac` | tenant |
| `bom` | Bill of materials / recipes, versioned | 2 | `catalogue` | tenant |
| `warehouses` | Warehouses, zones, racks, bins, warehouse↔branch/factory binding | 2 | `tenancy` | tenant |
| `parties` | Suppliers, customers, dealers, agents; one party may hold several roles | 2 | `rbac` | tenant |
| `pricing` | Price lists, discount rules, tax profiles | 2 | `catalogue`, `parties` | tenant |

### 2.3 Production (Phase 3)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `production-planning` | Plans, demand source, line/date scheduling | 3 | `catalogue`, `bom`, `tenancy` | tenant |
| `production` | Batches, total input, output, yield, batch state machine, variance analysis | 3 | `production-planning`, `warehouses` | tenant |
| `worker-production` | Per-worker output entry (piece/weight/unit), many-to-many with batch and product | 3 | `production`, `hr` (employee identity) | tenant |
| `qc` | Inspections, pass/fail/rework/hold, reason codes, evidence | 3 | `production` | tenant |
| `wastage` | Wastage, scrap and rework cycles with cause classification | 3 | `production`, `qc` | tenant |

> **Dependency note:** `worker-production` needs employee identity only. Phase 3
> therefore delivers a minimal `hr.employees` slice (identity + factory
> assignment); full HR lands in Phase 7. This is recorded so Phase 3 is not
> blocked and Phase 7 does not rebuild it.

### 2.4 Procurement & inventory (Phase 4)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `inventory` | Stock movement ledger, balances cache, stock states, valuation | 4 | `catalogue`, `warehouses` | tenant |
| `purchasing` | Requisition → PO → GRN → purchase bill, supplier returns, debit notes | 4 | `inventory`, `parties`, `pricing` | tenant |
| `stock-ops` | Transfers, adjustments with reason codes, physical count & reconciliation | 4 | `inventory` | tenant |

> **Sequencing note:** the ledger is *designed* in Phase 3 (production output
> must post somewhere) and *completed* in Phase 4. Phase 3 delivers the ledger
> write path for production only; Phase 4 delivers the full movement set,
> valuation and reconciliation. Documented so the two phases do not conflict.

### 2.5 Sales & revenue (Phase 5)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `crm` | Leads, follow-ups, customer accounts, credit limits | 5 | `parties` | tenant |
| `sales` | Sales orders, invoices, returns, credit notes; `channel` discriminates counter/dealer/phone/online | 5 | `inventory`, `pricing`, `crm` | tenant |
| `pos` | Counter UI, shift open/close, cash drawer, offline queue, receipt printing | 5 | `sales` | tenant |
| `invoice-builder` | Drag-and-drop template designer, element library, print-accurate render | 5 | `sales`, `tenancy` (branding) | tenant |
| `payments` | Receipts, payment allocation, receivables ageing | 5 | `sales`, `parties` | tenant |

### 2.6 Delivery (Phase 6)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `delivery` | Delivery orders, run sheets, own-rider assignment, proof of delivery, COD reconciliation | 6 | `sales`, `inventory` | tenant |
| `couriers` | Provider adapters, capability matrix, label/AWB, webhooks, status timeline | 6 | `delivery` | tenant + public (webhooks) |

### 2.7 Workforce, assets, finance (Phase 7)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `hr` | Employees, org chart, contracts, documents | 7 (identity slice in 3) | `rbac`, `tenancy` | tenant |
| `attendance` | Shifts, attendance, leave | 7 | `hr` | tenant |
| `payroll` | Salary structures, production-linked incentives, payslips, period lock | 7 | `attendance`, `worker-production` | tenant |
| `assets` | Asset register, assignment, depreciation basis | 7 | `tenancy` | tenant |
| `maintenance` | Maintenance schedules, breakdown logs, downtime linkage to production | 7 | `assets`, `production` | tenant |
| `finance` | Chart of accounts, journals, expenses, petty cash, bank/cash accounts | 7 | `payments`, `purchasing`, `payroll` | tenant |
| `costing` | Material + labour + overhead → product/batch cost | 7 | `production`, `inventory`, `payroll`, `finance` | tenant |

### 2.8 Intelligence (Phase 8)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `reports` | RMS — 33 reports, standard control set, exports, saved views | 8 | every data-owning module | tenant |
| `dashboards` | Per-persona dashboards over materialised summaries | 8 | `reports` | tenant |

### 2.9 E-commerce (Phase 9)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `storefront` | Public catalogue, cart, SEO, tenant theming | 9 | `catalogue`, `pricing`, `inventory` | public |
| `online-orders` | Checkout, order intake into `sales` with `channel=online`, customer account, order tracking | 9 | `storefront`, `sales`, `delivery` | public |

### 2.10 Hardening (Phase 10)

| ID | Module | Phase | Depends on | Scope |
|---|---|---|---|---|
| `subscription` | Plans, quotas enforcement, usage metering, billing state | 10 | `platform` | platform + tenant |
| `ops` | Health checks, backup verification, job monitoring, data export/erase | 10 | all | platform |

**Total: 39 modules.** The "35 domains" of the archived prompts are preserved;
the count differs because responsibilities were split where a single name hid two
boundaries (e.g. `sales` vs `payments`, `delivery` vs `couriers`).

---

## 3. Dependency graph

```
                          ┌──────────┐
                          │ platform │
                          └────┬─────┘
                               ▼
                          ┌──────────┐        ┌───────────────┐
                          │ tenancy  │        │ design-system │
                          └────┬─────┘        └───────────────┘
                               ▼
                          ┌──────────┐
                          │   auth   │
                          └────┬─────┘
              ┌────────────────┼────────────────┬─────────────┐
              ▼                ▼                ▼             ▼
          ┌──────┐        ┌────────┐       ┌───────┐   ┌──────────────┐
          │ rbac │        │ audit  │       │ files │   │notifications │
          └───┬──┘        └────────┘       └───────┘   └──────────────┘
              │
   ┌──────────┼───────────┬─────────────┐
   ▼          ▼           ▼             ▼
┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐
│catalogue│ │warehouses│ │ parties │ │   hr    │ (identity slice)
└────┬────┘ └────┬─────┘ └────┬────┘ └────┬────┘
     │           │            │           │
     ▼           │            ▼           │
  ┌─────┐        │        ┌────────┐      │
  │ bom │        │        │pricing │      │
  └──┬──┘        │        └───┬────┘      │
     │           │            │           │
     ▼           ▼            │           │
┌──────────────────┐          │           │
│production-planning│         │           │
└─────────┬────────┘          │           │
          ▼                   │           │
    ┌────────────┐            │           │
    │ production │◀───────────┼───────────┘
    └──┬───┬───┬─┘            │
       │   │   └──────────────┼──▶ ┌──────────────────┐
       │   │                  │    │ worker-production│
       ▼   ▼                  │    └─────────┬────────┘
   ┌────┐ ┌─────────┐         │              │
   │ qc │ │ wastage │         │              │
   └──┬─┘ └─────────┘         │              │
      │                       │              │
      ▼                       │              │
┌───────────┐                 │              │
│ inventory │◀────────────────┘              │
└──┬────┬───┘                                │
   │    └──────────┬──────────┐              │
   ▼               ▼          ▼              │
┌──────────┐  ┌──────────┐ ┌─────┐           │
│purchasing│  │stock-ops │ │sales│◀── crm    │
└────┬─────┘  └──────────┘ └──┬──┘           │
     │                        │              │
     │        ┌───────────────┼──────┬───────┴──────┐
     │        ▼               ▼      ▼              │
     │    ┌───────┐    ┌──────────┐ ┌────────┐      │
     │    │  pos  │    │ payments │ │invoice-│      │
     │    └───────┘    └────┬─────┘ │builder │      │
     │                      │       └────────┘      │
     │                      │                       │
     │                 ┌────▼─────┐                 │
     │                 │ delivery │                 │
     │                 └────┬─────┘                 │
     │                      ▼                       │
     │                 ┌──────────┐                 │
     │                 │ couriers │                 │
     │                 └──────────┘                 │
     │                                              │
     │   ┌──────────┐   ┌─────────┐   ┌─────────┐  │
     │   │attendance│──▶│ payroll │◀──┴─────────┘  │
     │   └──────────┘   └────┬────┘                 │
     │                       │                      │
     ▼                       ▼                      │
┌─────────┐            ┌──────────┐                 │
│ finance │◀───────────┤ costing  │◀────────────────┘
└─────────┘            └──────────┘
      ▲                      ▲
      │   ┌────────┐  ┌─────────────┐
      └───┤ assets │─▶│ maintenance │
          └────────┘  └─────────────┘

                 ┌─────────┐        ┌────────────┐
   all modules ─▶│ reports │───────▶│ dashboards │
                 └─────────┘        └────────────┘

  catalogue + pricing + inventory ─▶ storefront ─▶ online-orders ─▶ sales
```

---

## 4. Cross-module contracts

Where two modules meet, the seam is explicit. A module calls the **public
service** of another; it never touches its Eloquent models or tables directly.

| Consumer | Provider | Contract | Never |
|---|---|---|---|
| `production` | `inventory` | `StockLedger::post(movement)` — output in, material out | Never writes `stock_balances` |
| `worker-production` | `hr` | `EmployeeDirectory::find(id)` | Never joins `employees` in a query |
| `payroll` | `worker-production` | `WorkerOutputSummary::forPeriod()` — frozen at lock | Never recalculates after lock |
| `sales` | `inventory` | `StockReservation::reserve/release` | Never decrements stock directly |
| `sales` | `pricing` | `PriceResolver::resolve(product, party, qty, date)` | Never trusts a client price |
| `pos` | `sales` | `CompleteSale` action | Never has its own order table |
| `online-orders` | `sales` | `CreateOrder(channel: online)` | Never has its own order table |
| `delivery` | `sales` | `Invoice` reference | Never edits an invoice |
| `couriers` | `delivery` | `CourierProviderInterface` + capability matrix | Never assumes a capability |
| `invoice-builder` | `tenancy` | branding tokens + template store | Never hardcodes a logo |
| `costing` | `production`, `inventory`, `payroll` | read-only period queries | Never mutates source data |
| `reports` | all | read-only query classes | Never writes anything |
| everything | `audit` | domain events | Never writes audit rows inline |

### 4.1 `CourierProviderInterface` (ADR-017)

Eight methods every adapter implements, plus a declared capability set:

```
createShipment(DeliveryOrder): ShipmentResult
cancelShipment(string awb): CancelResult
getStatus(string awb): ShipmentStatus
getLabel(string awb): LabelFile
calculateRate(RateRequest): RateQuote
schedulePickup(PickupRequest): PickupResult
handleWebhook(payload, signature): NormalisedEvent
supports(Capability): bool
```

Unsupported capabilities are **disabled in the UI with an explanation**, never
called and allowed to fail. (ADR-024)

---

## 5. Phase → module delivery table

| Phase | Modules delivered | Gate to exit |
|---|---|---|
| **0** | — (documentation only) | 7 canonical docs approved; repo restructured |
| **1** | `platform`, `tenancy`, `auth`, `rbac`, `audit`, `files`, `notifications`, `design-system` | A second tenant can be created and proven isolated; every state component exists |
| **2** | `catalogue`, `bom`, `warehouses`, `parties`, `pricing` | Master data CRUD with full state matrix, no mock data left |
| **3** | `production-planning`, `production`, `worker-production`, `qc`, `wastage`, `hr` (identity slice), `inventory` (production write path) | A batch runs plan→output→QC→stock with deferred variance |
| **4** | `inventory` (complete), `purchasing`, `stock-ops` | Purchase→GRN→stock→count reconciles exactly against the ledger |
| **5** | `crm`, `sales`, `pos`, `invoice-builder`, `payments` | One stock pool serves counter, dealer and phone sales; POS works offline |
| **6** | `delivery`, `couriers` | Two adapters live; webhooks idempotent; capability matrix enforced |
| **7** | `hr` (full), `attendance`, `payroll`, `assets`, `maintenance`, `finance`, `costing` | Payroll consumes production output and locks immutably |
| **8** | `reports`, `dashboards` | All 33 reports with the standard control set and async export |
| **9** | `storefront`, `online-orders` | Online order lands in `sales` and reserves the same stock |
| **10** | `subscription`, `ops` | Quotas enforced, backups restore-verified, E2E + a11y green |

---

## 6. Module Definition of Done (ADR-030)

A module is not done until **all thirteen** artefacts exist.

| # | Artefact |
|---|---|
| 1 | Migrations with `tenant_id`, indexes, and tenant-scoped unique keys |
| 2 | Models with `BelongsToTenant`, relationships, casts, guarded `tenant_id` |
| 3 | Enums / state machine with explicit allowed transitions |
| 4 | Actions/Services holding all business rules, with transaction boundaries |
| 5 | Form Requests (validation) + Policies (authorisation) |
| 6 | Controllers + API Resources conforming to `API_CONTRACT.md` |
| 7 | Routes registered in the correct scope file with middleware |
| 8 | Domain events + audit listener |
| 9 | Factories + seeders (demo tenant only, never a hardcoded tenant name) |
| 10 | Feature tests: happy path, validation, 401, 403, **cross-tenant isolation**, one unhappy path |
| 11 | Generated TS types + TanStack Query hooks + Zod schemas |
| 12 | UI implementing the **full applicable state matrix**, both themes, `en` + `bn`, keyboard operable, axe-clean |
| 13 | `API_CONTRACT.md` and `DEVELOPMENT_STATUS.md` updated in the same change |

---

## 7. Permission namespace registry

Reserved `module` segments for `module.resource.action` (ADR-008). One per
module ID above, plus these cross-cutting prefixes:

```
platform.*     tenant/plan/quota administration (platform scope only)
settings.*     tenant settings and branding
reports.*      one resource per report ID (see RMS_REPORT_MATRIX.md)
audit.*        audit log viewing and export
```

No other top-level segment may be invented without adding the module here first.

---

## 8. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Created. Consolidates the module lists from `_legacy/MASTER_BACKEND_DEVELOPMENT_PROMPT.md` (35 domains), `_legacy/MASTER_FRONTEND_DEVELOPMENT_PROMPT.md` (14-item sidebar) and `_legacy/AI_PROJECT_CONTEXT.md` (17–32 modules) into one registry of 39 modules with an explicit dependency graph. |
