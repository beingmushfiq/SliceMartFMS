# RMS REPORT MATRIX

> **Status:** Canonical (rank 5). The human-readable index of the
> `report_definitions` registry. Every report the platform will ever ship is
> listed here first.
>
> **Last updated:** 2026-08-22 · **Primary phase:** 8 · **Rows seeded from:** Phases 2–7

---

## 0. What this document is and is not

**RMS = Reporting & Management System.**

It is **not** sixty hand-written pages. It is a registry: one row in
`report_definitions` per report (`DATABASE_DESIGN.md` §13.1), rendered by a
generic report runner that reads the definition's filters, columns, permission
and tier. Adding a report is a data change plus a query class — not a new
controller, a new route and a new page.

This document exists so that:

1. **Report requirements constrain schema decisions early.** A report that needs
   `warehouse_id` on a movement row must be known while the ledger is being
   designed in Phase 4, not discovered in Phase 8. That is why this is a Phase 0
   deliverable.
2. **Nobody invents a number.** Every report below names its **source of
   truth**. A report that computes a figure the transactional tables cannot
   defend is a defect, however plausible the figure looks.
3. **Permissions are designed, not retrofitted.** Every report has a permission
   string reserved in the `reports.*` namespace (`MODULE_MAP.md` §7).

**The binding rule:** a report reconciles to the ledger, to the batch, or to the
document it summarises — exactly, to four decimal places. If it does not, the
report is wrong. Not "close enough for a dashboard".

---

## 1. How every report behaves (the shared contract)

These apply to all 58 reports. They are not repeated per row.

### 1.1 Endpoints

```
GET  /api/v1/reports                       the registry, permission-filtered
GET  /api/v1/reports/{code}/schema         filters, columns, tier, permission
GET  /api/v1/reports/{code}/data?…         paginated rows + totals
POST /api/v1/reports/{code}/export         202 → async job
```

Per `API_CONTRACT.md` §15.2. There is no per-report endpoint.

### 1.2 Universal controls

| Control | Rule |
|---|---|
| **Date range** | Required on every transactional report. Preset ranges plus custom. Interpreted in the **tenant's** timezone, never the server's. |
| **Scope filters** | Company, branch, factory, line, warehouse — offered **only** within the user's `user_scopes`. Out-of-scope values are rejected with `OUT_OF_SCOPE`, not silently ignored. |
| **Entity filters** | Per row below. Unknown filter keys are **rejected** (`API_CONTRACT.md` §5.6). |
| **Search** | Where the row set has a natural text key (document number, product, party). |
| **Sort** | Server-side, on whitelisted columns only. |
| **Pagination** | Server-side always. Never fetch-all-then-filter on the client. |
| **Columns** | User-selectable from `available_columns`; selection persists per user. |
| **Saved views** | `report_saved_views` — private or shared, one optional default per report. |
| **Schedule** | `report_schedules` — daily/weekly/monthly, PDF/XLSX/CSV, to users or e-mail. |
| **Export** | Always the async job contract. A 40-second synchronous table is forbidden. |
| **Drill-down** | **Every aggregate cell drills to its rows; every row drills to its source document.** |
| **Freshness** | `meta.freshness` with `as_of` and `tier`, displayed on screen and printed on exports. |
| **Totals** | Computed server-side with decimal arithmetic. Never summed in JavaScript. |

### 1.3 The drill-down rule

Stated separately because it is the one most often skipped:

> A KPI you cannot interrogate is decoration. (`UI_SYSTEM.md` §13)

Concretely, every report must answer "where did this number come from?" in at
most two clicks: **aggregate → constituent rows → source document.** A yield
percentage opens the batches; a batch opens its inputs, outputs, QC results and
wastage. A revenue total opens the orders; an order opens the invoice.

If a report cannot do this, its query is wrong — it aggregated away the keys.

### 1.4 Tier assignment

| Tier | Meaning | Assigned when |
|---|---|---|
| `live` | Computed at request time from transactional tables | Default for **every** report |
| `summary` | Read from a `summary_*` table refreshed by a queued job | Only after a **measured** p95 breach |

**Promotion to `summary` is a measurement result, never a design guess.**
Building a summary table speculatively is forbidden (`DATABASE_DESIGN.md` §13.1).
The `Tier` column below records the *expected* landing place; the report ships
`live` first regardless.

### 1.5 Permission naming

`reports.{snake_case_code}.view` and, where exporting is separately controlled,
`reports.{snake_case_code}.export`. Financial and payroll reports **always**
separate view from export, because "who can see it" and "who can take it out of
the building" are different questions.

---

## 2. The report registry

58 reports in nine groups. `Code` is the `report_definitions.code` value.

### 2.1 Executive (Phase 8)

| # | Code | Report | Source of truth | Key filters | Tier |
|---|---|---|---|---|---|
| 1 | `exec_overview` | Executive overview | `summary_daily_*` (all) | date range, company, branch | summary |
| 2 | `exec_kpi_trend` | KPI trend | `summary_daily_production`, `summary_daily_sales` | date range, metric, granularity | summary |

Both are dashboards rather than tables: per-widget query, per-widget error
boundary, per-widget freshness stamp, every tile drilling through to the report
that owns the number. Neither may compute anything the group reports below do
not already compute — an executive figure that disagrees with the operational
report it summarises destroys trust in both.

### 2.2 Production (Phase 3 data · Phase 8 reports)

| # | Code | Report | Source of truth | Key filters | Tier |
|---|---|---|---|---|---|
| 3 | `prod_daily` | Daily production | `production_batches`, `production_outputs` | date, factory, line, product, shift | live |
| 4 | `prod_summary` | Production summary | `production_batches` + outputs + inputs | date range, factory, line, product | summary |
| 5 | `prod_yield_variance` | Yield & variance | `production_batches` (`context_complete` only) | date range, factory, line, product, batch | live |
| 6 | `prod_target_vs_actual` | Target vs achievement | `production_plans` vs `production_outputs` | date range, factory, line, product | live |
| 7 | `prod_material_consumption` | Material consumption vs BOM | `material_issues` vs resolved `bom_lines` | date range, batch, product, material | live |
| 8 | `prod_wastage` | Wastage analysis | `wastage_records` | date range, factory, line, reason code | live |
| 9 | `prod_batch_traceability` | Batch traceability | `production_batches` + full movement chain | batch, product, date range | live |

**Binding invariants for this group:**

- Reports 4, 5 and 6 **exclude** batches whose `context_completeness` is `draft`
  or `collecting`, and say so on screen. Yield and variance are `NULL` until the
  context is complete (ADR-012) — a report must render `—`, never `0`, and never
  a provisional percentage that will change.
- Report 5 shows the four variance components separately (input variance, output
  variance, wastage, rework). A single blended "variance %" hides the cause,
  which is the only reason anyone opens the report.
- Report 9 is the compliance report: given a batch, show every input lot, every
  worker entry, every QC result and every finished-goods movement out. Given a
  finished SKU movement, walk it back to the batch.

### 2.3 Quality (Phase 3 data · Phase 8 reports)

| # | Code | Report | Source of truth | Key filters | Tier |
|---|---|---|---|---|---|
| 10 | `qc_pass_fail` | QC pass / fail | `qc_inspections`, `qc_results` | date range, product, inspector, line | live |
| 11 | `qc_rework` | Rework analysis | `qc_results` with rework disposition | date range, product, reason, line | live |
| 12 | `qc_defect_pareto` | Defect Pareto | `qc_results` grouped by defect code | date range, product, line | live |

Report 12 is deliberately a Pareto and not a pie chart: the question is "which
three defects cause most of the loss", and a ranked bar with a cumulative line
answers it. Donuts with more than five slices are forbidden (`UI_SYSTEM.md` §13).

### 2.4 Inventory (Phase 4 data · Phase 8 reports)

| # | Code | Report | Source of truth | Key filters | Tier |
|---|---|---|---|---|---|
| 13 | `inv_current_stock` | Current stock | `stock_balances` (cache) with a ledger reconciliation column | warehouse, product, category, stock state | live |
| 14 | `inv_stock_ledger` | Stock ledger | `stock_movements` | date range, warehouse, product, movement type, reference | live |
| 15 | `inv_stock_valuation` | Stock valuation | `stock_movements` + costing method | as-of date, warehouse, product, category | live |
| 16 | `inv_low_stock` | Low stock & reorder | `stock_balances` vs `reorder_levels` | warehouse, category, severity | live |
| 17 | `inv_ageing` | Stock ageing & expiry | `stock_lots` | warehouse, product, age bucket, expiry window | live |
| 18 | `inv_transfers` | Warehouse transfers | `stock_transfers` + movements | date range, from/to warehouse, status | live |
| 19 | `inv_adjustments` | Adjustments & counts | `stock_adjustments`, `stock_counts` | date range, warehouse, reason, approver | live |
| 20 | `inv_movement_summary` | Movement summary | `summary_daily_stock` | date range, warehouse, product | summary |

**Binding invariants:**

- Report 14 is the **audit spine of the whole system**. It is append-only,
  cursor-paginated (never offset — the table is unbounded), and shows
  running balance per row. Every other stock number in the platform must
  reconcile to it exactly.
- Report 13 reads the `stock_balances` cache but **must expose a reconciliation
  column** or a "verify against ledger" action. The cache is rebuildable by
  design; a report that cannot detect drift makes the cache dangerous.
- Report 15 states its costing method on screen. A valuation figure without a
  stated method is unusable.

### 2.5 Procurement (Phase 4 data · Phase 8 reports)

| # | Code | Report | Source of truth | Key filters | Tier |
|---|---|---|---|---|---|
| 21 | `pur_register` | Purchase register | `purchase_orders`, `purchase_receipts` | date range, supplier, status, product, branch | live |
| 22 | `pur_pending_receipts` | Pending & partial receipts | `purchase_order_lines` vs receipts | supplier, age bucket, warehouse | live |
| 23 | `pur_price_variance` | Purchase price variance | `purchase_order_lines` vs price history | date range, supplier, product | live |
| 24 | `pur_supplier_statement` | Supplier statement | `purchase_invoices`, `payments` | supplier, date range | live |
| 25 | `pur_payables_ageing` | Payables ageing | `purchase_invoices` outstanding | as-of date, supplier, age bucket | live |

### 2.6 Sales & CRM (Phase 5 data · Phase 8 reports)

| # | Code | Report | Source of truth | Key filters | Tier |
|---|---|---|---|---|---|
| 26 | `sales_register` | Sales register | `sales_orders`, `invoices` | date range, channel, branch, customer, salesman, status | live |
| 27 | `sales_by_channel` | Channel performance | `summary_daily_sales` | date range, channel, branch | summary |
| 28 | `sales_invoice_detail` | Invoice detail | `invoices`, `invoice_lines` | invoice, date range, customer | live |
| 29 | `sales_profitability` | Invoice & order profitability | `invoice_lines` + costing | date range, channel, customer, product | live |
| 30 | `sales_product_margin` | Product profitability | `summary_product_margin` | date range, product, category | summary |
| 31 | `sales_returns` | Returns & credit notes | `sales_returns`, `credit_notes` | date range, reason, channel, product | live |
| 32 | `crm_lead_funnel` | Lead funnel & conversion | `leads`, `lead_stages` | date range, source, owner, stage | live |
| 33 | `sales_target_vs_actual` | Salesman target vs actual | `sales_targets` vs `invoices` | period, salesman, branch | live |
| 34 | `sales_incentive` | Incentive calculation | `invoices` + the incentive rule engine | period, salesman | live |
| 35 | `ar_customer_statement` | Customer statement | `invoices`, `receipts` | customer, date range | live |
| 36 | `ar_ageing` | Receivables ageing & overdue | outstanding `invoices` | as-of date, customer, age bucket, branch | live |
| 37 | `pos_shift_summary` | POS shift & cash reconciliation | `pos_sessions`, `payments` | date range, branch, terminal, operator | live |

**Report 34 is blocked by open question Q1.** The slab boundaries, the base
(revenue versus gross profit) and whether returns claw incentive back are all
unstated. The rule engine is configurable (ADR-002) and **no default formula is
invented** — the report ships when the rule is confirmed. A guessed incentive
formula pays real people the wrong amount of real money.

**Report 37** must reconcile counted cash to expected cash per session and show
the variance with the operator named. It is the report that makes a POS
trustworthy.

### 2.7 Delivery (Phase 6 data · Phase 8 reports)

| # | Code | Report | Source of truth | Key filters | Tier |
|---|---|---|---|---|---|
| 38 | `del_status_summary` | Delivery status summary | `shipments`, `shipment_events` | date range, courier, branch, status | live |
| 39 | `del_cod_reconciliation` | COD reconciliation | `shipments` + `courier_settlements` | date range, courier, settlement batch | live |
| 40 | `del_courier_performance` | Courier performance & SLA | `summary_daily_delivery` | date range, courier, zone | summary |
| 41 | `del_failed_returns` | Failed deliveries & RTO | `shipments` with failure/return states | date range, courier, reason, zone | live |

**Report 39 is the one that finds real money.** It compares COD expected against
COD settled per courier per batch and lists the gaps by shipment. Courier events
arrive out of order and duplicated (ADR-017); this report must be correct anyway,
which is why it reads state, not the event stream.

### 2.8 Workforce (Phase 3 identity · Phase 7 data · Phase 8 reports)

| # | Code | Report | Source of truth | Key filters | Tier |
|---|---|---|---|---|---|
| 42 | `hr_attendance` | Attendance & absence | `attendance_records` | date range, employee, department, shift, status | live |
| 43 | `hr_worker_output` | Worker production performance | `summary_daily_worker_output` | date range, employee, product, line | summary |
| 44 | `hr_piece_rate_earnings` | Piece-rate earnings | `worker_production_entries` + rates | period, employee, product | live |
| 45 | `hr_payroll_register` | Payroll register | `payroll_runs`, `payslips` | period, company, department | live |
| 46 | `hr_overtime` | Overtime analysis | `attendance_records` + shift rules | date range, department, employee | live |

**Report 43 counts output for every worker but pays none of them.** Only
`employment_type = piece_rate` entries feed report 44 (`DATABASE_DESIGN.md`
Group H invariant). Conflating productivity reporting with payable output is how
a permanent employee accidentally gets a piece-rate top-up.

**Report 45** requires `reports.hr_payroll_register.view` and a **separate**
export permission. Payroll data leaves the building differently from how it is
viewed.

### 2.9 Assets, finance & compliance (Phase 7 data · Phase 8 reports)

| # | Code | Report | Source of truth | Key filters | Tier |
|---|---|---|---|---|---|
| 47 | `asset_register` | Asset register | `assets` | branch, category, status, custodian | live |
| 48 | `asset_maintenance_cost` | Maintenance & downtime cost | `maintenance_records`, `asset_expenses` | date range, asset, category, type | live |
| 49 | `asset_depreciation` | Depreciation schedule | `assets` + depreciation postings | period, company, category | live |
| 50 | `fin_income_expense` | Income & expense | `journal_entries`, `expenses` | date range, company, account, cost centre | live |
| 51 | `fin_account_statement` | Account statement | `journal_entries` per account | account, date range | live |
| 52 | `fin_cash_bank` | Cash & bank position | `cash_accounts`, transfers, payments | as-of date, company, account | live |
| 53 | `fin_payment_methods` | Payment method summary | `payments` | date range, channel, branch, method | live |
| 54 | `fin_product_costing` | Product costing | `production_batches` + material + labour + overhead | period, product, factory | live |
| 55 | `fin_tax_summary` | Tax summary | `summary_taxes` | period, company, tax profile | summary |
| 56 | `audit_trail` | Audit trail | `audit_logs` | date range, user, module, entity, action | live |
| 57 | `sys_login_activity` | Login & session activity | `refresh_tokens`, auth audit events | date range, user, IP, outcome | live |
| 58 | `sys_integration_health` | Integration & webhook health | `webhook_deliveries`, job failures | date range, provider, outcome | live |

**Report 56 is append-only and cursor-paginated** like the stock ledger, for the
same reason: it is unbounded and it must never be editable. It renders `total`
as "many" rather than counting an entire tenant's history (`UI_SYSTEM.md` §11.3).

**Report 54 depends on Phase 3 producing real output and Phase 5 producing real
prices.** It is the concrete reason costing is scheduled in Phase 7 and not
earlier (`ROADMAP.md` §2.1) — a cost model over fabricated production data is a
spreadsheet, not a system.

**Report 55 is blocked by open question Q2** (the tax model). Its schema is
reserved; its computation waits.

---

## 3. Reports deliberately not in v1

| Report | Why not | Revisit |
|---|---|---|
| Trial balance, P&L, balance sheet | v1 is not double-entry accounting (ADR-018). The light ledger exists so these become possible later without a migration. | Post-v1 |
| Budget vs actual | No budgeting module in v1 | Post-v1 |
| Demand forecast / MRP | Out of scope (`DECISIONS.md` §6) | Post-v1 |
| Cohort / RFM customer analytics | Needs online-order history that will not exist until well after Phase 9 | Post-v1 |
| Cross-tenant benchmarking | Would require reading other tenants' data. **Structurally forbidden** by ADR-002 — not a scheduling decision. | Never in this shape |

Listing these is not padding. Each one has been asked for in similar systems,
and each would be built badly if attempted on v1 data.

---

## 4. Implementation rules for the report runner

| # | Rule |
|---|---|
| 1 | One query class per report code, registered against the definition. No report logic in a controller. |
| 2 | Filters are validated against the definition's schema. An unknown key is a `422`, not a shrug. |
| 3 | Scope filters intersect with `user_scopes` **server-side**. A user cannot widen their own scope through a filter parameter. |
| 4 | Money and quantity are `DECIMAL(18,4)` throughout and serialise as **strings** (ADR-009). No aggregate is ever computed in floating point. |
| 5 | Totals row and grand totals come from the same query as the rows, in the same transaction — never from summing the returned page. |
| 6 | Every response carries `meta.freshness`. A `summary`-tier response also carries the source table's `refreshed_at`. |
| 7 | Above the interactive row cap the endpoint returns `202` with an export job. |
| 8 | Exports render the same numbers as the screen, from the same query. Divergence between screen and PDF is a defect (`UI_SYSTEM.md` §14). |
| 9 | Every report has a test asserting it reconciles to its source of truth, and a **cross-tenant isolation test**. |
| 10 | A report with no rows renders the empty state that distinguishes "no data in this period" from "your filters excluded everything" (`UI_SYSTEM.md` §8.1 rows 3–4). |

---

## 5. Phase mapping

| Phase | Report work |
|---|---|
| 0 | This document. Report requirements feed schema review. |
| 3 | Production and QC tables carry the keys reports 3–12 need. Verified by design review, not by building reports. |
| 4 | The stock ledger carries the keys reports 13–20 need. |
| 5 | Sales, POS and AR carry the keys reports 26–37 need. |
| 6 | Shipment and settlement tables carry the keys reports 38–41 need. |
| 7 | HR, asset and finance tables carry the keys reports 42–55 need. |
| **8** | **The report runner, the registry rows, saved views, schedules, exports and every report above.** |
| 10 | Report performance verified against the budget; `summary` promotions decided from measurements. |

Reports are **not** built incrementally alongside each module. A report over
half-real data teaches you nothing and has to be rewritten. Phase 8 exists so
that every report is built once, over data that is complete and trustworthy.

---

## 6. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Created. Replaces `_legacy/RMS_REPORT_MATRIX.md` (a bare list of 33 titles with no sources, filters, permissions or tiers). Expands to 58 numbered reports in nine groups, each with a named source of truth, filter set and tier; adds the shared report contract, the drill-down rule, the exclusion list, and the ten runner rules. Reports 34 and 55 recorded as blocked by open questions Q1 and Q2. |
