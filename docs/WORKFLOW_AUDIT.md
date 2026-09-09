# WORKFLOW AUDIT — End-to-End Operational Lifecycle Audit (Phase 0)

> **Execution Protocol:** Master Development & System Hardening Protocol — Phase 0  
> **Evaluation Standards:** Multi-step transactional verification across all interconnected subsystems.  
> **Lifecycles Audited:** 5 Core Enterprise Lifecycles + Retail POS Checkout + Social Headless Storefront Flow.  
> **Audit Date:** 2026-09-10  

---

## 1. Lifecycle 1: Lead → Customer → Quotation → Sale

```
Lead Entry (CRM / Social)
       │
       ▼
Lead Qualification & Verification
       │
       ▼
Convert to Customer Profile (B2B / B2C)
       │
       ▼
Generate Sales Quotation (Prices & Discounts locked)
       │
       ▼
Customer Acceptance ──► 1-Click Convert to Sales Order (SO)
       │
       ▼
Reserve Inventory Stock & Generate Invoice
```

- **Entry Point:** `/sales?tab=leads` (`CrmLeadController@store`).
- **Required Data:** Contact name, phone, email, company, estimated deal value, source channel.
- **Status Progression:** `new → contacted → qualified → quoted → converted | lost`.
- **Dependencies:** Customer account creation creates entry in `customers` table with credit limit.
- **Validation Rules:** Phone number uniqueness check, valid email format, credit limit verification on SO conversion.
- **Reversal Rules:** Lost leads can be reopened; rejected quotations remain archived with reason notes.
- **Audit Logging:** Emits `LeadConvertedEvent` and logs old/new status in `audit_logs`.

---

## 2. Lifecycle 2: Purchase → Supplier → Receive (GRN) → Stock → Payment

```
Purchase Requisition (Department Material Request)
       │
       ▼
Purchase Order (PO Created & Sent to Supplier)
       │
       ▼
Goods Arrival at Factory Dock
       │
       ▼
Goods Receipt Note (GRN) Inspection & Lot Tagging
       │
       ▼
Stock Inward to Raw Materials Warehouse (Stock Ledger Movement)
       │
       ▼
3-Way Match: PO vs GRN vs Supplier Bill
       │
       ▼
Accounts Payable (AP) Posting & Payment Voucher Issuance
```

- **Entry Point:** `/purchasing?tab=requisitions` or directly at `/purchasing?tab=orders`.
- **Required Data:** Supplier ID, warehouse ID, currency, line items (product ID, variant ID, quantity, purchase unit cost, VAT rate).
- **Status Progression:**
  - PO: `draft → sent → confirmed → partially_received → received → closed | cancelled`.
  - GRN: `draft → inspecting → accepted → rejected`.
  - Bill: `unpaid → partially_paid → paid`.
- **Dependencies:** Active supplier record, active raw material product variants, designated warehouse bin.
- **Validation Rules:**
  - GRN cannot exceed remaining ordered quantity on PO without explicit manager override flag.
  - 3-way matching validates quantity and price within ±0.01 tolerance before approving bill.
- **Reversal Rules:** Purchase Return initiates Debit Note to supplier and outputs stock reversal transaction in `stock_movements`.
- **Audit Logging:** Every stage change logs actor, IP, timestamp, and linked documents in `audit_logs`.

---

## 3. Lifecycle 3: Production → Material Requisition → Worker Logging → QC → Finished Goods

```
BOM Definition (Standard Raw Material Recipe)
       │
       ▼
Create Production Batch Order (Target Qty & Schedule)
       │
       ▼
Material Requisition (Transfer Raw Materials from Warehouse to Factory Floor)
       │
       ▼
Factory Floor Processing (Cutting, Stitching, Finishing)
       │
       ▼
Worker Piece-Rate Logging (Independent Daily Worker Tallies)
       │
       ▼
Batch QC Inspection (Pass / Defect / Quarantine)
       │
       ▼
Batch Reconciliation & Finished Goods Stock Inward
```

- **Entry Point:** `/production?tab=batches` (`ProductionBatchController@store`).
- **Required Data:** Target product ID, BOM ID, planned quantity, source raw materials warehouse, destination finished goods warehouse, planned start/end dates.
- **Status Progression:** `draft → scheduled → in_progress → qc_pending → completed | cancelled`.
- **Business Rule Verification:**
  - *Worker Independence Rule:* Worker piece-rate logging is captured independently via `WorkerProductionController@store`. Discrepancies between total worker claims and batch output are surfaced exclusively during batch completion reconciliation, avoiding premature worker penalties.
- **QC Routing:**
  - `Passed`: Converted directly into finished goods stock in destination warehouse.
  - `Quarantine / Rework`: Diverted to secondary rework batch.
  - `Scrap / Wastage`: Logged to `wastage_records` with scrap salvage value.
- **Reversal Rules:** Completed batches cannot be deleted; adjustments require formal physical stock audit or rework order.

---

## 4. Lifecycle 4: Storefront Order → Fraud Check → Invoice → Delivery → Courier → Settlement

```
Public Storefront Checkout (Customer Order Placed)
       │
       ▼
Automated Fraud Risk Evaluation (Phone History, Return Rate, Address Check)
       │
       ├─► High Risk: Flagged for Manual Phone Call Verification
       │
       ▼
Order Confirmation ──► Conversion to Sales Order & Invoicing
       │
       ▼
Warehouse Packing & Packaging Slip Generation
       │
       ▼
Courier Assignment (Steadfast / Pathao / REDX API Consignment Push)
       │
       ▼
Courier Handover & Tracking Number Active
       │
       ▼
Live Delivery Tracking (Confirmed → Packed → In-Transit → Delivered | Returned)
       │
       ▼
Cash on Delivery (COD) Collection & Financial Settlement Reconciliation
```

- **Entry Point:** Public Storefront Checkout `/store/:subdomain/checkout`.
- **Required Data:** Customer name, phone, delivery address, city, zone, payment mode (COD, bKash, Card), cart line items.
- **Status Progression:**
  - Storefront Order: `pending → verifying → confirmed → processing → dispatched → delivered | returned | cancelled`.
  - Consignment: `created → picked_up → in_transit → out_for_delivery → delivered → return_in_transit → returned`.
- **Fraud Engine Standard:** Analyzes customer past return rate, phone order velocity, and blacklisted address databases to generate a risk score (0–100). Scores > 75 require mandatory one-time verification.
- **Reversal Rules:** Returned parcels generate an automated Stock Return to Quarantine for inspection and reverse courier charge deduction.

---

## 5. Lifecycle 5: Omnichannel Sales → Invoicing → Payment → Stock Deduction → Profit Lock

```
Order Placement (POS Terminal / Sales Rep Order / Storefront)
       │
       ▼
Historical COGS Capture & Lock
       │
       ▼
Stock Allocation & Immediate Deduction from Warehouse Ledger
       │
       ▼
Invoice Generation (National Tax / VAT Compliant)
       │
       ▼
Payment Capture (Cash / Card / MFS bKash / Customer Credit)
       │
       ▼
Automatic Double-Entry Journal Posting to General Ledger
       │
       ▼
Real-Time Gross Profit & Margin Lock
```

- **Entry Point:** `/sales?tab=orders` or `/pos`.
- **Required Data:** Customer ID, warehouse ID, line items, payment tender breakdown, sales rep ID.
- **Profitability Standard:** Historical Cost of Goods Sold (COGS) is locked at the precise moment of invoice creation based on the inventory valuation layer (FIFO). Subsequent changes to raw material supplier prices never retroactively modify the gross profit recorded on past invoices.
- **Ledger Entries Generated Automatically:**
  - Debit: `Cash / Bank / Accounts Receivable`
  - Credit: `Sales Revenue`
  - Credit: `VAT / Sales Tax Payable`
  - Debit: `Cost of Goods Sold (COGS)`
  - Credit: `Inventory Asset Account`
- **Reversal Rules:** Invoices can only be cancelled via formal Credit Note, which generates an exact inverse double-entry journal entry and optional warehouse restock.
