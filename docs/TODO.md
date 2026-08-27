# GENUINE OUTSTANDING WORK LEDGER (TODO)

> **Status:** Live Outstanding Task Ledger.
> **Repository:** `SliceMartFMS` (`d:\SliceMartFMS`)
> **Last updated:** 2026-08-27

---

## 1. Active Phase 2 (Master Data & Catalogue) — Current Progress

- [x] **Parties Vertical (Backend):**
  - [x] Implement `PartyController` with `index`, `options`, `store`, `show`, `update`, `destroy` endpoints.
  - [x] Create `StorePartyRequest` and `UpdatePartyRequest` with composite uniqueness checks `(tenant_id, code)`.
  - [x] Implement `CreatePartyAction`, `UpdatePartyAction`, `DeletePartyAction` (with reference deletion guard).
  - [x] Create `PartyResource` formatting nested addresses and contacts.
  - [x] Wire party routes into `backend/routes/api_tenant.php`.
  - [x] Author `PartyTest.php` with cross-tenant isolation assertions (100% green).
- [x] **Pricing Vertical Routes & Tests (Backend):**
  - [x] Wire `PriceListController`, `DiscountRuleController`, `TaxProfileController` into `backend/routes/api_tenant.php`.
  - [x] Author `PricingTest.php` covering Price Lists, Discount Rules, and Tax Profiles (100% green).
- [x] **Phase 1 & Phase 2 Authenticated Frontend Application Shell:**
  - [x] Implement authenticated layout shell (`AppHeader`, `Sidebar`, `TenantBadge`, `UserMenu`).
  - [x] Implement login view (`LoginPage.tsx`) with RHF + Zod validation.
  - [x] Implement route guards (public, authenticated, permission-checked, 404 catch-all).
  - [x] Build Catalogue management workspace (`CatalogueWorkspace.tsx`) with 7 domain views:
    - [x] `ProductsSection.tsx` (Table, type filtering, Create Product modal).
    - [x] `UnitsSection.tsx` (Base units, conversions, precision, Create Unit modal).
    - [x] `CategoriesSection.tsx` and `BrandsSection.tsx`.
    - [x] `BillOfMaterialsSection.tsx` (Recipe manager, output quantity, Create BOM modal).
    - [x] `WarehousesSection.tsx` (Warehouse cards, location bin manager, Create Warehouse modal).
    - [x] `PartiesSection.tsx` (Suppliers, Customers, Dealers, Agents, Credit limits, Addresses, Contacts).
- [x] **Master Data Seeders & Factories:**
  - [x] Author demo tenant master data seeders (`PlansAndTenantsSeeder`, `RolesAndPermissionsSeeder`, `UnitsTableSeeder`, `CategoriesTableSeeder`, `BrandsTableSeeder`, `TaxProfilesTableSeeder`, `ReasonCodesTableSeeder`, `WarehousesTableSeeder`, `ProductsTableSeeder`, `BOMTableSeeder`, `PartiesTableSeeder`, `PricingTableSeeder`).
  - [x] Verify `php artisan migrate:fresh --seed` runs cleanly with 100% relational integrity.

---

### Phase 3 — Production & Operations Execution (100% Complete)
- [x] **Production Planning Vertical:**
  - [x] Eloquent models `ProductionPlan` & `ProductionPlanItem` with tenancy and string decimal casting.
  - [x] Form Requests `StoreProductionPlanRequest` & `UpdateProductionPlanRequest`.
  - [x] API Resources `ProductionPlanResource` & `ProductionPlanItemResource`.
  - [x] Transactional Actions `CreateProductionPlanAction`, `UpdateProductionPlanAction`, `ApproveProductionPlanAction`, `DeleteProductionPlanAction`.
  - [x] Controller `ProductionPlanController` with `index`, `store`, `show`, `update`, `approve`, `destroy`.
  - [x] Route registration in `routes/api_tenant.php`.
  - [x] Feature test suite `ProductionPlanTest` (8 tests / 40 assertions, 100% green).
- [x] **Production Batch & State Machine Vertical:**
  - [x] Eloquent models `ProductionBatch`, `ProductionBatchInput`, and `ProductionOutput` on `BelongsToTenant`.
  - [x] Lifecycle state transitions (`draft → collecting → context_complete → analysed → closed` and `draft → scheduled → in_progress → completed → closed`).
  - [x] Atomic material input and output recording with real-time total quantities rollup.
  - [x] Automated yield and variance calculations per ADR-012 with process loss computation.
  - [x] Transactional Actions (`CreateProductionBatchAction`, `UpdateProductionBatchAction`, `StartProductionBatchAction`, `RecordBatchInputAction`, `RecordBatchOutputAction`, `AnalyzeBatchYieldAction`, `CompleteProductionBatchAction`, `CloseProductionBatchAction`, `DeleteProductionBatchAction`).
  - [x] Form Requests and API Resources (`ProductionBatchResource`, `ProductionBatchInputResource`, `ProductionOutputResource`).
  - [x] Controller `ProductionBatchController` with 9 endpoints registered in `routes/api_tenant.php`.
  - [x] Feature test suite `ProductionBatchTest` (8 tests / 51 assertions, 100% green).
- [x] **Worker Production Output Vertical:**
  - [x] Eloquent models `Employee` and `WorkerProductionEntry` on `BelongsToTenant`.
  - [x] ADR-013 workforce logging (many-to-many worker/batch/product/shift).
  - [x] Piece-rate, hourly, rework, and rejected quantity tracking.
  - [x] Supervisor verification lifecycle (`draft → verified`), locking, and summary aggregation stats.
  - [x] Transactional Actions (`CreateWorkerProductionEntryAction`, `UpdateWorkerProductionEntryAction`, `VerifyWorkerProductionEntryAction`, `DeleteWorkerProductionEntryAction`).
  - [x] Form Requests & API Resources (`StoreWorkerProductionEntryRequest`, `UpdateWorkerProductionEntryRequest`, `WorkerProductionEntryResource`, `EmployeeResource`).
  - [x] Controller `WorkerProductionEntryController` with 6 endpoints registered in `routes/api_tenant.php`.
  - [x] Feature test suite `WorkerProductionEntryTest` (8 tests / 40 assertions, 100% green).
- [x] **Quality Control (QC) & Wastage Module:**
  - [x] Eloquent models `QcParameter`, `QcInspection`, `QcInspectionResult`, `QcDefect`, `WastageRecord`.
  - [x] Form Requests & API Resources (`StoreQcParameterRequest`, `StoreQcInspectionRequest`, `StoreWastageRecordRequest`, `QcParameterResource`, `QcInspectionResource`, `WastageRecordResource`).
  - [x] Transactional Actions (`CreateQcParameterAction`, `CreateQcInspectionAction`, `ApproveQcInspectionAction`, `CreateWastageRecordAction`, etc.).
  - [x] Controllers (`QcParameterController`, `QcInspectionController`, `WastageRecordController`) registered in `routes/api_tenant.php`.
  - [x] Feature test suites `QcInspectionTest` and `WastageRecordTest` (100% green).
- [x] **Phase 3 Frontend Workspaces & Touch Interfaces:**
  - [x] `ProductionWorkspace.tsx` with `ProductionPlansSection.tsx`, `ProductionBatchesSection.tsx`, and `WorkerProductionSection.tsx` (touch/tablet fast entry).
  - [x] `QcWorkspace.tsx` with `QcParametersSection.tsx`, `QcInspectionsSection.tsx`, and `WastageRecordsSection.tsx`.
  - [x] Route registration for `/production` and `/qc` in `frontend/src/routes/index.tsx` and sidebar navigation with permission gating.
  - [x] Complete TypeScript API types (`production.ts`, `qc.ts`).

---

### Phase 4 — Procurement & Stock Operations (100% Complete)

- [x] **Inventory & Stock Operations Vertical (Backend):**
  - [x] Implement `StockMovementController` and immutable ledger inspection endpoints.
  - [x] Implement `StockTransferController` with multi-step `in_transit` dispatch/receive tracking.
  - [x] Implement `StockAdjustmentController` with mandatory reason codes and type classification.
  - [x] Implement `StockCountController` with physical vs book snapshot reconciliation.
  - [x] Author feature tests `StockMovementTest`, `StockTransferTest`, `StockAdjustmentTest`, `StockCountTest` (100% green).
- [x] **Procurement Chain Vertical (Backend):**
  - [x] Implement `PurchaseRequisitionController` with approval workflow.
  - [x] Implement `PurchaseOrderController` with vendor commitments, multi-currency terms, and approvals.
  - [x] Implement `GoodsReceiptController` (GRN) with 3-way match, lot assignment, and automated stock movement posting.
  - [x] Implement `PurchaseBillController` with accounts payable matching and payment terms.
  - [x] Implement `PurchaseReturnController` with return reasons, vendor credit notes, and stock deduction.
  - [x] Author feature tests `PurchaseRequisitionTest`, `PurchaseOrderTest`, `GoodsReceiptTest`, `PurchaseBillTest`, `PurchaseReturnTest` (100% green).
- [x] **Phase 4 Frontend Workspaces & Fast Entry (Frontend):**
  - [x] `InventoryWorkspace.tsx` with `StockLedgerSection.tsx`, `StockTransfersSection.tsx`, `StockAdjustmentsSection.tsx`, `StockCountsSection.tsx`.
  - [x] `PurchasingWorkspace.tsx` with `PurchaseOrdersSection.tsx`, `GoodsReceiptsSection.tsx`, `PurchaseRequisitionsSection.tsx`, `PurchaseBillsSection.tsx`, `PurchaseReturnsSection.tsx`.
  - [x] Route registration and sidebar navigation with permission gating.
  - [x] Complete TypeScript API types (`inventory.ts`, `purchasing.ts`).

---

## 4. Phase 5 (CRM, Sales, POS & Invoice Builder) — Upcoming

- [ ] Implement `SalesOrderController` across Counter, Dealer, Phone, Field, and Online channels.
- [ ] Implement `InvoiceController` and payment receipt allocation engine.
- [ ] Implement dedicated full-screen `POSShell.tsx` with cash drawer shift management.
- [ ] Implement POS offline queue sync with IndexedDB.
- [ ] Implement drag-and-drop `InvoiceTemplateBuilder.tsx` with printable PDF renderer.

---

## 5. Phase 6 (Logistics & Couriers) — Upcoming

- [ ] Implement `DeliveryOrderController` and driver `RunSheetController`.
- [ ] Implement Courier adapter engine (Pathao, Steadfast, RedX, eCourier, Paperfly).
- [ ] Implement Courier inbound webhook handlers and shipment tracking status timeline.
- [ ] Implement Cash-on-Delivery (COD) reconciliation engine.

---

## 6. Phase 7 (Workforce & Production Payroll) — Upcoming

- [ ] Implement `EmployeeController`, `DepartmentController`, `DesignationController`, `ShiftController`.
- [ ] Implement daily attendance and leave tracking.
- [ ] Implement Production-linked incentive payroll calculation engine.
- [ ] Implement monthly payroll locking and immutable payslip generation.
- [ ] Implement Asset and preventative maintenance work order management.

---

## 7. Phase 8 (Reporting & RMS) — Upcoming

- [ ] Implement 58 standard reports registered in `docs/RMS_REPORT_MATRIX.md`.
- [ ] Implement persona-specific executive dashboards.
- [ ] Implement high-throughput asynchronous PDF/XLSX export queue jobs.

---

## 8. Phase 9 (Storefront & E-Commerce) — Upcoming

- [ ] Implement public Storefront catalog API.
- [ ] Implement online cart, shipping zone calculator, and coupon discount engine.
- [ ] Implement customer checkout and order intake pipeline.

---

## 9. Phase 10 (SaaS Hardening & Deployment) — Upcoming

- [ ] Implement Platform Admin tenant onboarding, subscription plans, and quota enforcement.
- [ ] Run full automated test suites, WCAG 2.2 AA accessibility scans, and penetration tests.
- [ ] Deploy production Docker container stack with Nginx, MySQL 8, Redis, and queue workers.
