# USER FLOWS — INDUSTRIAL OPERATIONAL WORKFLOWS

> **Status:** Canonical Business Process Specification  
> **Rule:** Every workflow connects multiple modules through defined transactions, status machines, and audit events.  

---

## 1. Flow 1: Lead-to-Cash (Commercial B2B & Wholesale)

```
[1. Lead Generated] ➔ [2. Qualification & Target] ➔ [3. Quotation (QT-)] ➔ [4. Sales Order (SO-)]
                                                                                  │
┌─────────────────────────────────────────────────────────────────────────────────┴────────────────────────┐
▼                                                                                                          ▼
[5. Delivery Order / Challan (DC-)]                                                               [6. Sales Invoice (INV-)]
│                                                                                                          │
▼                                                                                                          ▼
[7. Warehouse Dispatch & Stock Decrement]                                                         [8. Payment Received (REC-)]
│                                                                                                          │
└────────────────────────────────────────────┬─────────────────────────────────────────────────────────────┘
                                             ▼
                                  [9. General Ledger Post]
```

1. **Lead Generation:** Sales agent creates lead in `CRM / Leads`. Assigned to agent, monthly sales target tracked.
2. **Quotation to Order:** Converted to `SalesOrder`. Checks customer credit limit and payment terms.
3. **Approval:** Sales Manager approves order. Stock is reserved in target warehouse.
4. **Fulfillment:** Warehouse generates `DeliveryOrder` (Challan). Items scanned or marked dispatched. Stock ledger decrements.
5. **Billing:** Invoicing generates `Invoice`. Posts accounts receivable to General Ledger.
6. **Settlement:** Payment recorded via Cash, Bank, or Cheque. Generates `Payment` receipt, settles invoice, updates customer balance.

---

## 2. Flow 2: Procure-to-Pay (Supply Chain & 3-Way Match)

```
[1. Stock Low Alert / Reorder Breach] ➔ [2. Purchase Requisition (PR-)] ➔ [3. Purchase Order (PO-)]
                                                                                  │
┌─────────────────────────────────────────────────────────────────────────────────┘
▼
[4. Goods Receipt Note (GRN)] ➔ [5. QC Receipt Inspection] ➔ [6. Warehouse Stock Put-away]
                                                                     │
┌────────────────────────────────────────────────────────────────────┘
▼
[7. Supplier Bill (BILL-)] ➔ [8. 3-Way Matching Check] ➔ [9. Accounts Payable GL & Payment]
```

1. **Reorder Alert:** Stock reaches minimum reorder level; system generates draft `PurchaseRequisition`.
2. **Purchase Order:** Procurement reviews and issues `PurchaseOrder` to approved Supplier.
3. **Receiving (GRN):** Supplier delivers goods to warehouse loading bay. Storekeeper issues `GoodsReceipt`.
4. **QC Inspection:** QC inspector verifies sample. Passed items put away into stock; rejected items routed to Quarantine.
5. **3-Way Match:** Supplier sends Bill. System validates: **PO Quantities == GRN Quantities == Bill Quantities** within tolerance.
6. **Payment:** Finance approves bill and issues bank transfer or cash voucher, closing accounts payable.

---

## 3. Flow 3: Batch-to-Quarantine / Scrap (Manufacturing & QC)

```
[1. Production Plan] ➔ [2. Batch Launch (PB-)] ➔ [3. Auto-Issue BOM Raw Materials (FIFO)]
                                                         │
┌────────────────────────────────────────────────────────┘
▼
[4. Floor Worker Output Entry (Piece-rate)] ➔ [5. Batch Completion & Scrap Recording]
                                                         │
┌────────────────────────────────────────────────────────┘
▼
[6. Mandatory QC Inspection]
  ├── PASS ➔ [7a. Finished Goods Transfer to Main Warehouse (Stock Ledger +)]
  └── FAIL ➔ [7b. Auto-Transfer to Quarantine Warehouse & Generate Rework Work Order]
```

1. **Batch Creation:** Production supervisor schedules batch against Bill of Materials (BOM).
2. **Material Issue:** Auto-issues raw materials from warehouse, deducting stock according to FIFO/FEFO batches.
3. **Worker Logging:** Machine operators log piece-rate output entries against their employee ID.
4. **QC Gate:** Batch cannot enter sellable finished goods inventory without QC sign-off.
5. **Disposition:** Passed batch increments finished goods. Failed batch enters quarantine warehouse with rework cost analysis.

---

## 4. Flow 4: E-Commerce Storefront Order to Delivery

```
[1. Customer Web Checkout] ➔ [2. Stock Reservation Lock (15 min)] ➔ [3. Fraud Assessment Engine]
                                                                            │
┌────────────────────────────────────────┬──────────────────────────────────┴──────────────────────────────────┐
▼                                        ▼                                                                     ▼
[Score < 30: Green]              [Score 30-70: Amber]                                                  [Score > 70: Red]
Auto-Confirmed                   Staff Verification Queue                                              Auto-Held / High Risk
│                                        │                                                                     │
└────────────────────────────────────────┴───────────────────────────────────┬─────────────────────────────────┘
                                                                             ▼
                                                                  [4. Sales Order Confirmed]
                                                                             │
                                                                             ▼
                                                                  [5. Challan & Packing]
                                                                             │
                                                                             ▼
                                                                  [6. Courier API Waybill Creation]
                                                                      (Steadfast / Pathao / REDX)
                                                                             │
                                                                             ▼
                                                                  [7. Shipped & Token Tracking Live]
                                                                             │
                                                                             ▼
                                                                  [8. COD Remittance & Settlement]
```

---

## 5. Flow 5: POS Cashier Shift to General Ledger

```
[1. Open Session: Count Opening Float] ➔ [2. High-Speed Barcode / Touch Sales & Split Tenders]
                                                         │
┌────────────────────────────────────────────────────────┘
▼
[3. Close Session: Blind Cash Drawer Count] ➔ [4. Calculate Cash Difference / Variance]
                                                         │
┌────────────────────────────────────────────────────────┘
▼
[5. Auto-Post Journal Entry to General Ledger]:
  ├── Debit: Cash In Hand Account (Actual Counted Cash)
  ├── Credit: POS Sales Revenue Account
  └── Debit/Credit: Cash Over/Short Expense Account (Variance)
```
