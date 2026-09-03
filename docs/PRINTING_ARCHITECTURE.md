# PRINTING ARCHITECTURE — DIRECT PHYSICAL PRINTING INFRASTRUCTURE

> **Status:** Canonical Document Printing Specification  
> **Rule:** Never print browser screenshots. All physical outputs must render via dedicated print stylesheets (`print.css`), true physical millimeter dimensions, and high-DPI vector rendering.  

---

## 1. Supported Physical Document Profiles

| Document Type | Target Media | Dimensions | Key Components |
|---|---|---|---|
| **Commercial Sales Invoice** | Standard Paper (A4 / Letter) | 210mm × 297mm | Full header, customer billing/shipping address, line item table with tax breakdown, payment QR, signature block. |
| **Delivery Challan** | Standard Paper (A4) | 210mm × 297mm | Dispatch warehouse, driver name, vehicle number, carton counts, recipient signature. |
| **POS Thermal Cash Receipt** | Thermal Roll (80mm) | 72mm printable width | Compact monospace typography, item list, cash tendered, change, cashier ID, return policy barcode. |
| **Compact POS Thermal** | Thermal Roll (58mm) | 48mm printable width | Ultra-dense layout, condensed item names, subtotal, VAT registration number. |
| **Product & Pallet Barcode** | Thermal Adhesive Label | 35mm × 25mm / 50mm × 35mm | High-DPI Code128 / GS1-128 barcode, SKU, Product Title, MRP price, Batch number. |

---

## 2. Template Resolution Pipeline

When a print action is triggered (e.g. `window.print()` or backend PDF render):
1. System resolves active document template via `DocumentResolveController`.
2. Replaces dynamic tokens:
   - `{{company.name}}`, `{{company.tin}}`, `{{company.logo}}`
   - `{{customer.name}}`, `{{customer.phone}}`, `{{customer.address}}`
   - `{{document.number}}`, `{{document.date}}`, `{{document.due_date}}`
   - `{{items.table}}`, `{{total.subtotal}}`, `{{total.tax}}`, `{{total.grand_total}}`
3. Applies selected `paper_sizes` CSS `@page { size: A4; margin: 10mm; }` rule.
4. Logs an entry to `document_print_histories` recording user ID, reprint count, and timestamp.
