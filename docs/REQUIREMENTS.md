# SYSTEM REQUIREMENTS & TRACEABILITY MATRIX

> **Status:** Canonical Traceable Requirements Registry.
> **Repository:** `SliceMartFMS` (`d:\SliceMartFMS`)
> **Last updated:** 2026-08-27

---

## 1. Traceability Standard

Every feature, capability, and constraint in the system is assigned a unique identifier `REQ-xxx`.

Each requirement is tracked across its full lifecycle:
$$\text{Requirement (REQ-xxx)} \longrightarrow \text{Implementation Module} \longrightarrow \text{Source Files} \longrightarrow \text{API / DB Schema} \longrightarrow \text{UI Component} \longrightarrow \text{Verification Test} \longrightarrow \text{Status}$$

---

## 2. Requirements Registry

### 2.1 Foundation & Tenancy

| Req ID | Title | Description | Priority |
|---|---|---|---|
| **REQ-001** | Multi-Tenancy Hard Isolation | All queries must strictly scope by `tenant_id`. Cross-tenant data leaks return 404 NOT_FOUND. | P0 |
| **REQ-002** | Organization Scoping | Support multi-company, multi-branch, multi-factory, multi-production-line, and multi-warehouse scoping within a tenant. | P0 |
| **REQ-003** | Dual-Token Authentication | Issue 15-min memory-resident JWT access tokens and 14-day httpOnly rotating refresh tokens. | P0 |
| **REQ-004** | Stolen Token Revocation | Detect reuse of invalidated refresh tokens and immediately revoke entire family session. | P0 |
| **REQ-005** | Fine-Grained RBAC | Restrict API and UI access via `<domain>.<resource>.<action>` permission strings. | P0 |
| **REQ-006** | Audit Trail & Snapshots | Record actor, timestamp, tenant, correlation ID, and before/after state on all sensitive mutations. | P1 |
| **REQ-007** | Idempotent Mutations | Enforce exactly-once execution on mutating requests carrying `Idempotency-Key` headers. | P0 |
| **REQ-008** | Monorepo & Zero-Warning CI | Enforce strict TypeScript, PHPStan Level 9, Pint, and ESLint without warnings. | P1 |

### 2.2 Master Data & Catalogue

| Req ID | Title | Description | Priority |
|---|---|---|---|
| **REQ-010** | Units & Unit Conversions | Support arbitrary measurement units and precise conversion multipliers per product/tenant. | P1 |
| **REQ-011** | Categories & Brand Taxonomy | Hierarchical product categories and brand classification. | P2 |
| **REQ-012** | Product Catalog & Types | Support Raw Material, Semi-Finished, Finished Goods, Packaging, Consumables, and Assets. | P0 |
| **REQ-013** | Product Variants & Attributes | Manage multi-variant products (size, color, weight) with unique SKUs and barcodes. | P1 |
| **REQ-014** | Versioned Bill of Materials | Multi-item manufacturing recipes with yield estimates, loss factors, and active versioning. | P0 |
| **REQ-015** | Multi-Tier Warehouse Locations | Multi-warehouse management with aisle/rack/shelf/bin hierarchies and deletion guards. | P0 |
| **REQ-016** | Parties Registry | Unified management of Suppliers, Customers, Dealers, and Agents with credit controls. | P0 |
| **REQ-017** | Price Lists & Discount Rules | Custom price lists, party-specific pricing, tiered quantity discounts, and tax profiles. | P1 |

### 2.3 Production & Quality Control

| Req ID | Title | Description | Priority |
|---|---|---|---|
| **REQ-020** | Production Planning | Schedule production plans against sales orders and forecasted inventory demands. | P1 |
| **REQ-021** | Production Batch Tracking | Discrete batch tracking with distinct states (`draft`, `collecting`, `context_complete`, `analysed`, `closed`). | P0 |
| **REQ-022** | Material Issue & Return | Track warehouse material issues to production lines with direct stock ledger integration. | P0 |
| **REQ-023** | Physical Input vs Output | Independently record total raw material entered vs worker production output. | P0 |
| **REQ-024** | Piece-Rate Worker Entry | Mobile/tablet-friendly logging of individual worker output by quantity and weight. | P0 |
| **REQ-025** | QC Inspection & Routing | Multi-parameter QC inspection with routing to Pass (Stock), Fail, Rework, or Scrap. | P0 |
| **REQ-026** | Wastage & Scrap Accounting | Account for material loss and route recyclable scrap into separate scrap inventory. | P1 |
| **REQ-027** | Context-Complete Variance | Suppress variance/yield calculations until all batch inputs and outputs are fully recorded. | P0 |

### 2.4 Procurement & Inventory

| Req ID | Title | Description | Priority |
|---|---|---|---|
| **REQ-030** | Append-Only Stock Ledger | Derive stock balances exclusively from immutable `stock_movements` transaction records. | P0 |
| **REQ-031** | Stock Balance Caching | Maintain high-speed rebuildable `stock_balances` cache updated in atomic transactions. | P0 |
| **REQ-032** | Warehouse Stock Transfers | Inter-warehouse inventory transfers with intermediate `in_transit` state handling. | P1 |
| **REQ-033** | Reason-Coded Stock Adjustments | Require mandatory reason codes for all stock write-offs, damages, and corrections. | P1 |
| **REQ-034** | Physical Stock Counts | Reconcile physical inventory counts against ledger balances with discrepancy reporting. | P1 |
| **REQ-035** | Purchasing Lifecycle | Requisition → Purchase Order → Goods Receipt Note (GRN) → Purchase Bill → Debit Notes. | P0 |

### 2.5 Sales, Point of Sale (POS) & Logistics

| Req ID | Title | Description | Priority |
|---|---|---|---|
| **REQ-040** | Omnichannel Sales Orders | Unified sales order processing for Counter, Dealer, Phone, Field, and Online channels. | P0 |
| **REQ-041** | Sales Invoicing & Returns | Issue tax-compliant invoices, track partial deliveries, credit notes, and customer returns. | P0 |
| **REQ-042** | High-Speed POS Shell | Keyboard-first, full-screen POS counter checkout with cash drawer and shift auditing. | P0 |
| **REQ-043** | Offline POS Tolerance | Queue transactions in IndexedDB / LocalStorage during network drops and auto-sync. | P1 |
| **REQ-044** | Delivery Orders & Fleet Runs | Group delivery orders into driver run sheets with digital Proof of Delivery (POD). | P1 |
| **REQ-045** | Third-Party Courier Adapters | Standardized adapters for courier APIs (Pathao, Steadfast, RedX) with webhook updates. | P1 |
| **REQ-046** | COD Reconciliation | Reconcile cash on delivery collections against courier settlements and bank deposits. | P1 |

### 2.6 Workforce, HR & Payroll

| Req ID | Title | Description | Priority |
|---|---|---|---|
| **REQ-050** | Employee Directory & Shifts | Manage employee profiles, designations, departments, shifts, and holiday calendars. | P1 |
| **REQ-051** | Attendance & Leave Tracking | Track daily biometric/manual attendance, shift assignments, and leave balances. | P1 |
| **REQ-052** | Production-Linked Payroll | Calculate wages combining fixed salary components with verified worker piece-rates. | P0 |
| **REQ-053** | Locked Payslip Immutability | Freeze payroll calculations and production source references upon monthly approval. | P0 |

### 2.7 Finance, Reporting & UI/UX

| Req ID | Title | Description | Priority |
|---|---|---|---|
| **REQ-060** | Single-Currency Chart of Accounts | Maintain double-entry ledgers, expense tracking, petty cash, and bank transactions. | P1 |
| **REQ-061** | Manufacturing Costing Engine | Aggregate Raw Material + Direct Labour + Overhead allocations to determine unit cost. | P1 |
| **REQ-062** | 58-Report RMS Catalog | Live and pre-aggregated reports covering production, sales, stock, and financial health. | P1 |
| **REQ-063** | 20-Row UI State Matrix | Implement all UI states (Loading, Skeleton, Empty, Error, 401, 403, Offline, Conflict, etc.). | P0 |
| **REQ-064** | WCAG 2.2 AA Accessibility | High-contrast semantic tokens, keyboard roving tabindex, ARIA roles, and screen reader labels. | P1 |
| **REQ-065** | Motion & Animation System | Tasteful Framer Motion & GSAP animations respecting `prefers-reduced-motion`. | P2 |

---

## 3. Requirements Traceability Matrix

| Req ID | Domain / Module | Key Implementation Files | API Endpoints / DB Tables | UI Component | Verification Test | Status |
|---|---|---|---|---|---|---|
| **REQ-001** | Core Tenancy | `backend/app/Core/Tenancy/TenantContext.php`, `BelongsToTenant.php`, `ResolveTenant.php` | `tenants`, `companies`, `branches` | Global Shell / Tenant Badge | `TenancyRuntimeTest.php`, `TenantIsolationTest.php` | ✅ Complete |
| **REQ-002** | Core Org | `backend/database/migrations/*_create_{companies,branches,factories,production_lines}_table.php` | `companies`, `branches`, `factories`, `production_lines` | Org Tree Selector | `Wave2OrgTest.php` | ✅ Complete |
| **REQ-003** | Core Auth | `backend/app/Core/Auth/JwtService.php`, `AuthenticateJwt.php` | `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` | `LoginForm.tsx` | `JwtServiceTest.php`, `AuthPipelineTest.php` | ✅ Complete |
| **REQ-004** | Core Auth | `backend/app/Core/Auth/RefreshTokenService.php` | `refresh_tokens`, `POST /api/v1/auth/refresh` | Session Expiry Modal | `RefreshTokenServiceTest.php` | ✅ Complete |
| **REQ-005** | Core RBAC | `backend/app/Core/Auth/PermissionCatalogue.php`, `AuthorizePermission.php` | `permissions`, `roles`, `role_permission`, `role_user` | `ProtectedAction.tsx` | `AuthorizePermissionTest.php` | ✅ Complete |
| **REQ-006** | Core Audit | `backend/app/Core/Audit/AuditLogger.php` | `audit_logs`, `activity_snapshots` | `LogInspector.tsx` | `AuditLogTest.php` | ✅ Complete |
| **REQ-007** | Core Infra | `backend/bootstrap/app.php`, `idempotency_keys` table | `idempotency_keys`, `Idempotency-Key` header | `AsyncButton.tsx` | `IdempotencyTest.php` | ✅ Complete |
| **REQ-008** | Monorepo/CI | `.github/workflows/ci.yml`, `phpstan.neon`, `pint.json` | N/A | Full Build / Storybook | CI Workflow 9 legs | ✅ Complete |
| **REQ-010** | Catalogue Units | `backend/app/Modules/Catalogue/Controllers/UnitController.php` | `units`, `unit_conversions`, `/api/v1/units` | `UnitTable.tsx` | `UnitControllerTest.php` | ✅ Complete |
| **REQ-011** | Catalogue Taxon | `backend/app/Modules/Catalogue/Controllers/{Category,Brand}Controller.php` | `categories`, `brands`, `/api/v1/{categories,brands}` | `CategorySelect.tsx` | `CategoryBrandTest.php` | ✅ Complete |
| **REQ-012** | Catalogue Prod | `backend/app/Modules/Catalogue/Controllers/ProductController.php` | `products`, `/api/v1/products` | `ProductForm.tsx` | `ProductControllerTest.php` | ✅ Complete |
| **REQ-013** | Catalogue Var | `backend/app/Modules/Catalogue/Controllers/ProductController.php` | `product_variants`, `product_images` | `VariantGrid.tsx` | `ProductVariantTest.php` | ✅ Complete |
| **REQ-014** | Catalogue BOM | `backend/app/Modules/Catalogue/Controllers/BillOfMaterialController.php` | `bill_of_materials`, `bill_of_material_items`, `/api/v1/bill-of-materials` | `BOMBuilder.tsx` | `BillOfMaterialTest.php` | ✅ Complete |
| **REQ-015** | Catalogue Loc | `backend/app/Modules/Catalogue/Controllers/{Warehouse,WarehouseLocation}Controller.php` | `warehouses`, `warehouse_locations`, `/api/v1/warehouses` | `WarehouseTree.tsx` | `WarehouseControllerTest.php` | ✅ Complete |
| **REQ-016** | Catalogue Party | `backend/app/Modules/Catalogue/Controllers/PartyController.php` | `parties`, `party_addresses`, `party_contacts`, `/api/v1/parties` | `PartyTable.tsx` | `PartyControllerTest.php` | 🔄 In Progress |
| **REQ-017** | Pricing | `backend/app/Modules/Pricing/Controllers/{PriceList,DiscountRule,TaxProfile}Controller.php` | `price_lists`, `discount_rules`, `tax_profiles`, `/api/v1/pricing/...` | `PriceListForm.tsx` | `PricingControllerTest.php` | 🔄 In Progress |
| **REQ-020** | Production Plan | `backend/app/Modules/Production/Actions/CreatePlanAction.php` | `production_plans`, `production_plan_items` | `ProductionGantt.tsx` | `ProductionPlanTest.php` | ⬜ Planned |
| **REQ-021** | Production Batch | `backend/app/Modules/Production/Actions/CreateBatchAction.php` | `production_batches`, `/api/v1/production/batches` | `BatchTimeline.tsx` | `ProductionBatchTest.php` | ⬜ Planned |
| **REQ-022** | Production Mat | `backend/app/Modules/Production/Actions/IssueMaterialAction.php` | `material_issues`, `material_issue_items`, `stock_movements` | `MaterialIssueModal.tsx` | `MaterialIssueTest.php` | ⬜ Planned |
| **REQ-023** | Production Input | `backend/app/Modules/Production/Actions/RecordInputAction.php` | `production_batch_inputs` | `BatchInputForm.tsx` | `BatchInputTest.php` | ⬜ Planned |
| **REQ-024** | Production Worker | `backend/app/Modules/Production/Actions/RecordWorkerOutputAction.php` | `worker_production_entries` | `WorkerLogPad.tsx` | `WorkerProductionTest.php` | ⬜ Planned |
| **REQ-025** | Production QC | `backend/app/Modules/Production/Actions/InspectBatchAction.php` | `qc_inspections`, `qc_defects`, `rework_orders` | `QCInspectionPad.tsx` | `QCInspectionTest.php` | ⬜ Planned |
| **REQ-026** | Production Scrap | `backend/app/Modules/Production/Actions/RecordWastageAction.php` | `wastage_records`, `stock_movements` | `WastageModal.tsx` | `WastageTest.php` | ⬜ Planned |
| **REQ-027** | Production Var | `backend/app/Modules/Production/Actions/CalculateYieldAction.php` | `production_outputs`, `context_completeness` | `YieldReportCard.tsx` | `YieldCalculationTest.php` | ⬜ Planned |
| **REQ-030** | Inventory Ledger | `backend/app/Modules/Inventory/Actions/PostStockMovementAction.php` | `stock_movements` | `StockLedgerTable.tsx` | `StockMovementTest.php` | ⬜ Planned |
| **REQ-031** | Inventory Balance | `backend/app/Modules/Inventory/Services/StockBalanceService.php` | `stock_balances` | `StockBalanceView.tsx` | `StockBalanceSyncTest.php` | ⬜ Planned |
| **REQ-032** | Inventory Transfer | `backend/app/Modules/Inventory/Actions/TransferStockAction.php` | `stock_transfers`, `stock_transfer_items` | `TransferForm.tsx` | `StockTransferTest.php` | ⬜ Planned |
| **REQ-033** | Inventory Adjust | `backend/app/Modules/Inventory/Actions/AdjustStockAction.php` | `stock_adjustments`, `reason_codes` | `StockAdjustmentModal.tsx` | `StockAdjustmentTest.php` | ⬜ Planned |
| **REQ-034** | Inventory Count | `backend/app/Modules/Inventory/Actions/ReconcileStockCountAction.php` | `stock_counts`, `stock_count_items` | `StockAuditSheet.tsx` | `StockCountTest.php` | ⬜ Planned |
| **REQ-035** | Purchasing | `backend/app/Modules/Procurement/Actions/CreatePOAction.php` | `purchase_requisitions`, `purchase_orders`, `goods_receipts`, `purchase_bills` | `PurchaseOrderFlow.tsx` | `ProcurementFlowTest.php` | ⬜ Planned |
| **REQ-040** | Sales Core | `backend/app/Modules/Sales/Actions/CreateSalesOrderAction.php` | `sales_orders`, `sales_order_items` | `SalesOrderForm.tsx` | `SalesOrderTest.php` | ⬜ Planned |
| **REQ-041** | Sales Invoicing | `backend/app/Modules/Sales/Actions/IssueInvoiceAction.php` | `invoices`, `invoice_items`, `sales_returns` | `InvoiceView.tsx` | `InvoiceIssuanceTest.php` | ⬜ Planned |
| **REQ-042** | POS Shell | `frontend/src/modules/pos/POSShell.tsx` | `pos_terminals`, `pos_sessions`, `/api/v1/pos/...` | `POSRegister.tsx` | `POSTerminalTest.php` | ⬜ Planned |
| **REQ-043** | POS Offline | `frontend/src/modules/pos/offlineQueue.ts` | `pos_offline_queue`, IndexedDB | `OfflineBanner.tsx` | `POSOfflineSyncTest.ts` | ⬜ Planned |
| **REQ-044** | Logistics Fleet | `backend/app/Modules/Logistics/Actions/CreateRunSheetAction.php` | `delivery_orders`, `run_sheets` | `RunSheetView.tsx` | `DeliveryFlowTest.php` | ⬜ Planned |
| **REQ-045** | Logistics Courier | `backend/app/Modules/Logistics/Adapters/CourierAdapter.php` | `courier_providers`, `courier_shipments`, `courier_webhook_events` | `CourierStatusTimeline.tsx` | `CourierAdapterTest.php` | ⬜ Planned |
| **REQ-046** | Logistics COD | `backend/app/Modules/Logistics/Actions/ReconcileCodAction.php` | `cod_reconciliations` | `CODReconcileTable.tsx` | `CODReconciliationTest.php` | ⬜ Planned |
| **REQ-050** | HR Org | `backend/app/Modules/HR/Actions/CreateEmployeeAction.php` | `employees`, `departments`, `designations`, `shifts` | `EmployeeDirectory.tsx` | `EmployeeModelTest.php` | ⬜ Planned |
| **REQ-051** | HR Attendance | `backend/app/Modules/HR/Actions/LogAttendanceAction.php` | `attendances`, `leave_requests`, `leave_balances` | `AttendanceCalendar.tsx` | `AttendanceTest.php` | ⬜ Planned |
| **REQ-052** | Payroll Engine | `backend/app/Modules/Payroll/Services/PayrollCalculator.php` | `payroll_periods`, `payslips`, `payslip_items` | `PayrollRunSheet.tsx` | `PayrollCalculationTest.php` | ⬜ Planned |
| **REQ-053** | Payroll Lock | `backend/app/Modules/Payroll/Actions/LockPayrollPeriodAction.php` | `payroll_periods`, `status = 'locked'` | `PayslipPrintView.tsx` | `PayrollLockTest.php` | ⬜ Planned |
| **REQ-060** | Finance Core | `backend/app/Modules/Finance/Actions/PostJournalEntryAction.php` | `chart_of_accounts`, `journal_entries`, `journal_lines` | `GeneralLedger.tsx` | `JournalEntryTest.php` | ⬜ Planned |
| **REQ-061** | Costing Engine | `backend/app/Modules/Finance/Services/ProductCostCalculator.php` | `product_costs`, `production_cost_allocations` | `CostingBreakdown.tsx` | `ProductCostingTest.php` | ⬜ Planned |
| **REQ-062** | RMS Reports | `backend/app/Modules/Reports/Services/ReportGenerator.php` | `report_definitions`, 58 report tables & views | `ReportViewer.tsx` | `ReportGeneratorTest.php` | ⬜ Planned |
| **REQ-063** | UI State Matrix | `frontend/src/components/patterns/StateView.tsx`, `QueryBoundary.tsx` | N/A | `StateView.tsx`, `QueryBoundary.tsx` | `QueryBoundary.test.tsx` | ✅ Complete |
| **REQ-064** | Accessibility | `frontend/src/styles/tokens.semantic.css`, `index.html` | WCAG 2.2 AA standards | All UI Primitives | `axe-core` tests | ✅ Complete |
| **REQ-065** | Motion System | `frontend/src/lib/motion/tokens.ts`, `useGsap.ts` | CSS Motion Tokens | `Modal.tsx`, `KPICard.tsx` | `tokens.test.ts` | ✅ Complete |
