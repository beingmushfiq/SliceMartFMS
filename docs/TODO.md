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
- [ ] **Master Data Seeders & Factories:**
  - [ ] Author demo tenant master data seeders (`UnitsTableSeeder`, `CategoriesTableSeeder`, `ProductsTableSeeder`, `BOMTableSeeder`, `WarehousesTableSeeder`, `PartiesTableSeeder`).

---

## 2. Phase 3 (Production Execution & QC) — Upcoming

- [ ] Implement `ProductionPlanController` and planning schedule actions.
- [ ] Implement `ProductionBatchController` with lifecycle state transitions (`draft → collecting → context_complete → analysed → closed`).
- [ ] Implement `MaterialIssueController` and stock ledger integration.
- [ ] Implement `WorkerProductionEntryController` for floor tablet logging.
- [ ] Implement `QCInspectionController` with pass / rework / scrap / wastage routing.
- [ ] Implement automatic yield calculation upon batch `context_complete`.
- [ ] Build Production floor touch UI screens.

---

## 3. Phase 4 (Procurement & Stock Operations) — Upcoming

- [ ] Implement `StockMovementController` and ledger inspection endpoints.
- [ ] Implement `StockTransferController` with multi-step `in_transit` tracking.
- [ ] Implement `StockAdjustmentController` with mandatory reason codes.
- [ ] Implement `StockCountController` with physical vs book reconciliation.
- [ ] Implement Procurement chain: `PurchaseRequisition` → `PurchaseOrder` → `GoodsReceipt` → `PurchaseBill` → `PurchaseReturn`.
- [ ] Build Storekeeper and Purchasing Officer desktop and tablet interfaces.

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
