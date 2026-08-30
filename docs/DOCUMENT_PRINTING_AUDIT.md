# Centralized Document Template & Printing Audit
**Document Identifier:** `DOC-AUDIT-2026-001`  
**Date:** 2026-08-31  
**Status:** Completed  

---

## 1. Executive Summary

This audit evaluates the current state of document generation, template management, barcode generation, reporting, and printing across the SliceMart FMS application (frontend, backend, database schema, permissions, and styles).

Currently, the application has the foundations of an isolated print DOM subsystem (`#print-root` with `@page` CSS and React portal injection in `useDocumentPrint`), but lacks a unified, tenant-isolated document configuration domain. Multiple modules invoke raw `window.print()`, bypass document templates, or hardcode layout dimensions.

---

## 2. Frontend Printing & Document Audit

### 2.1 Print Subsystem (`src/components/print/` & `src/styles/print.css`)
- **`useDocumentPrint.ts`**:
  - Dynamically creates `#print-root` in `document.body`.
  - Mounts React elements into React 19 root (`createRoot`).
  - Sets `document.title` to filename for PDF export (`Save as PDF`).
  - Attaches `printing-active` class to body and listens to `window.addEventListener('afterprint')`.
  - **Finding**: Well designed low-level execution engine; should be retained as the underlying browser execution driver.
- **`PrintPreviewModal.tsx`**:
  - Modal with zoom in/out/reset controls (50%–200%).
  - Container classes: `document-preview-sheet-a4`, `document-preview-sheet-a4-landscape`, `document-preview-thermal-80`, `document-preview-label-35x25`, etc.
  - Buttons: "Save PDF" and "Print Document" both trigger `printDocument()`.
- **`src/styles/print.css`**:
  - Defines `@page` rules for `a4-portrait`, `a4-landscape`, `a3-landscape`, `letter-portrait`, `thermal-80`, `thermal-58`, `label-sheet-a4`, `label-roll-35x25`, `label-roll-50x35`.
  - Applies `@media print` rules: hides `#root`, modal backdrops, shows `#print-root`, forces `-webkit-print-color-adjust: exact`.

### 2.2 Existing Document Components (`src/components/print/documents/`)
The following structured document components exist:
1. `SalesInvoiceDocument.tsx` — A4 sales tax invoice with line items, tax breakdowns, amount in words, signatures, and terms.
2. `PurchaseOrderDocument.tsx` — A4 procurement order.
3. `DeliveryChallanDocument.tsx` — A4 delivery dispatch waybill.
4. `GoodsReceiptDocument.tsx` — A4 inbound inspection voucher.
5. `CreditNoteDocument.tsx` — A4 sales return/credit memo.
6. `PaymentReceiptDocument.tsx` — Money collection receipt.
7. `StockTransferDocument.tsx` — Inter-warehouse stock movement voucher.
8. `ThermalReceipt.tsx` — 80mm/58mm POS thermal slip.
9. `BarcodeLabel.tsx` & `LabelSheet.tsx` — 35×25mm and 50×35mm product barcode labels.
10. `ReportPrintDocument.tsx` — Tabular report print wrapper.

### 2.3 Direct `window.print()` Invocations (Anti-patterns Found)
Search identified 11 locations invoking raw `window.print()` directly without formatting or `#print-root` isolation:
1. `src/modules/pos/sections/PosSessionsSection.tsx:638`
2. `src/modules/pos/POSShell.tsx:575`
3. `src/modules/purchasing/sections/PurchaseBillsSection.tsx:889`
4. `src/modules/purchasing/sections/PurchaseReturnsSection.tsx:701`
5. `src/modules/qc/sections/QcInspectionsSection.tsx:580`
6. `src/modules/finance/FinanceWorkspace.tsx:736`
7. `src/modules/hr/HrWorkspace.tsx:999`
8. `src/modules/inventory/sections/StockCountsSection.tsx:718`
9. `src/modules/inventory/sections/StockAdjustmentsSection.tsx:715`
10. `src/modules/delivery/sections/RunSheetsSection.tsx:212`
11. `src/modules/catalogue/sections/ProductsSection.tsx:433`

**Issue**: In all 11 cases, the browser attempts to print the active application viewport/UI card, producing clipped tables, navigation sidebars, and dark-mode artifacts.

### 2.4 Barcode Generation Subsystem
- **Library**: `bwip-js` (`^4.11.4`).
- **Engine (`src/lib/barcode/engine.ts`)**:
  - `generateBarcodeSvg(options)` generates pure vector SVG barcodes and QR codes.
  - Supports `code128`, `ean13`, `ean8`, `qrcode`, `upca`, `code39`.
  - Sanitizes and validates check digits with fallback to `code128`.
- **Finding**: High quality, zero DOM-screenshot dependency, vector-crisp for 203 DPI and 300 DPI thermal barcode printers.

### 2.5 Hardcoded Settings & Business Config
- `src/lib/document/useBusinessConfig.ts`:
  - Contains fallback `DEFAULT_BUSINESS_CONFIG` with hardcoded `'SliceMart Foods & Bakery Ltd.'`.
  - Attempts `GET /settings/company`.
  - **Requirement**: Must be unified with tenant-aware document branding and template overrides.

---

## 3. Backend Architecture & Database Audit

### 3.1 Tenancy & Isolation
- Models use `App\Core\Tenancy\Concerns\BelongsToTenant`.
- Global query scope automatically adds `WHERE tenant_id = ?`.
- Write hook stamps `tenant_id` on model creation.
- Security requirement: All document templates, versions, paper sizes, print profiles, numbering sequences, and reprint logs must implement `BelongsToTenant`.

### 3.2 Existing Database Tables
1. **`document_sequences`** (`2026_08_23_102300_create_document_sequences_table.php`):
   - Comprehensive server-side sequence generation table.
   - Supports `document_type`, `prefix`, `suffix`, `padding`, `next_number`, `reset_period`, `last_reset_at`.
   - Stored generated columns `company_key` and `branch_key` handle nullable scoping in unique index.
   - Status: **Fully ready to be integrated into centralized document numbering service**.
2. **`invoice_templates`** (`2026_08_24_110400_create_invoice_templates_table.php`):
   - Primitive template table with `definition` JSON, `paper_size`, `orientation`, `is_default`, `version`.
   - Lacks template version history table (`document_template_versions`), paper size relational schema, print profiles, and reprint audit logging.
   - Status: **Must be upgraded / migrated to unified multi-document template architecture**.
3. **`invoices`** (`2026_08_24_110500_create_invoices_table.php`):
   - Contains `invoice_template_id` and `printed_count`.

### 3.3 Permissions & RBAC
`App\Core\Auth\PermissionCatalogue` defines canonical `module.resource.action` permissions.
Existing print permissions:
- `sales.invoice.print`
- `hr.payslip.print`
- `reports.report.export`

**Missing permissions required**:
- `documents.template.view`
- `documents.template.create`
- `documents.template.update`
- `documents.template.delete`
- `documents.template.manage`
- `documents.paper_size.manage`
- `documents.print_profile.manage`
- `documents.numbering.manage`
- `documents.document.print`
- `documents.document.reprint`
- `documents.history.view`

---

## 4. Gap Analysis & Architecture Directives

| Requirement | Current State | Target Architecture |
|---|---|---|
| **Central Document Hub** | Scattered in modules | `Settings → Documents & Printing` workspace |
| **Template Scoping** | Only basic invoice templates | Multi-type templates (Invoice, Challan, GRN, Receipt, Barcode, Report, etc.) |
| **Versioning** | Single integer on template | Immutable `document_template_versions` snapshot log |
| **Paper Sizes** | Hardcoded CSS strings | Database registry + standard built-ins + custom sizes |
| **Print Profiles** | Ad-hoc page classes | Reusable `PrintProfile` records (paper, margins, copies, scale, template) |
| **Reprint History** | Only `printed_count` integer on invoices | Append-only `document_print_histories` audit trail |
| **Module Rendering** | Modules call `window.print()` or render preview modals directly | Modules invoke `useDocumentEngine` passing `{ type, data }` |
| **Barcode Engine** | Only in catalogue modal | Reusable barcode engine with bulk roll & sheet layout profiles |

---

## 5. Audit Conclusion

The application has strong low-level building blocks (`bwip-js` barcode generation, `@page` CSS print stylesheets, and `document_sequences` table), but lacks the unified configuration, versioning, and template orchestration layers. 

Phase 1 architecture will establish a centralized `Document` domain.
