# Document Template & Layout Customization Guide

**Document Identifier:** `DOC-GUIDE-2026-001`  
**Location in ERP:** `Settings → Documents & Printing`  

---

## 1. Introduction

The SliceMart FMS Centralized Document Engine decouples business data generation from physical output presentation.

### Supported Document Types

1. **Sales Tax Invoice (`sales_invoice`)**: Multi-item commercial tax invoices with VAT breakdown, amount in words, and authorized signature blocks.
2. **Delivery Challan (`delivery_challan`)**: Dispatch waybills containing vehicle number, driver details, packaging counts, and gate pass acknowledgements.
3. **Purchase Order (`purchase_order`)**: Vendor procurement orders with terms and delivery deadlines.
4. **Goods Receipt Note (`goods_receipt`)**: Warehouse inbound inspection vouchers with accepted and rejected quantities.
5. **Credit Note (`credit_note`)**: Sales return and credit adjustment vouchers.
6. **Payment Receipt (`payment_receipt`)**: Official money collection receipts with payment channel reference (EFTN, bKash, Cash).
7. **POS Thermal Receipt (`pos_receipt_80mm`, `pos_receipt_58mm`)**: Compact roll receipts for cash counter terminals with cashier names and barcode headers.
8. **Barcode & Price Labels (`barcode_label`)**: Thermal sticker rolls for 50×35mm and 35×25mm products.
9. **Stock Transfer Manifest (`stock_transfer`)**: Inter-warehouse inventory movement vouchers.
10. **Analytical Reports (`report`)**: Multi-page tabular audit reports with custom columns and summary totals.

---

## 2. Split-Panel Template Builder

Navigate to **Settings → Documents & Printing → Document Templates** and click **Customize** on any template.

### Builder Features

- **Left Panel (Parameters)**:
  - **Setup**: Template title, associated document type, physical paper size, and default profile.
  - **Fields & Layout**: Toggle logo, SKU, batch numbers, discount breakdown, VAT amount, and QR verification codes.
  - **Signatures**: Configure custom titles for *Prepared By*, *Checked By*, *Authorized Representative*, and *Customer Acknowledgement*.
  - **Terms & Notes**: Set custom legal declarations, warranties, and footer greetings.
- **Right Panel (Live Proportional Preview)**:
  - Displays instant live visual rendering adhering to the chosen paper aspect ratio and dimensions (A4, A5, A3, Letter, 80mm Roll, 50×35mm Label).

---

## 3. Versioning & Immutability

1. Every save against an existing template creates a new immutable **`document_template_versions`** entry (`v1`, `v2`, `v3`, etc.).
2. Documents issued previously remain locked to their issued version and data snapshot.
3. Administrators can inspect the **Version History** and click **Restore Version** at any time to reactivate an earlier layout.
