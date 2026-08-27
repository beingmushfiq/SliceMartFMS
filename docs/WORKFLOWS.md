# AUTHORITATIVE BUSINESS WORKFLOWS & OPERATIONAL FLOWS

> **Status:** Canonical Operational Workflows Reference.
> **Repository:** `SliceMartFMS` (`d:\SliceMartFMS`)
> **Last updated:** 2026-08-27

---

## 1. The Core Production Chain (Heart of the Platform)

The production chain transforms raw materials into finished, packaged goods through a multi-stage, auditable pipeline.

### 1.1 Architectural Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                    1. Production Plan                       │
│    Forecasts demand / aggregates unfulfilled sales orders   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    2. Production Batch                      │
│    Assigned to Factory, Line, Product, and Active BOM       │
│    Lifecycle: draft → collecting → context_complete         │
│               → analysed → closed                           │
└──────────────┬───────────────┬───────────────┬──────────────┘
               │               │               │
      ┌────────▼───────┐ ┌─────▼────────┐ ┌────▼─────────────┐
      │ Total Input    │ │Material Issue│ │Worker Production │
      │ Raw materials  │ │Stock movement│ │Individual worker │
      │ physically put │ │from warehouse│ │output & piece-   │
      │ into machines  │ │(Stock Ledger)│ │rate logs         │
      └────────┬───────┘ └─────┬────────┘ └────┬─────────────┘
               │               │               │
               └───────────────┼───────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   3. Production Output                      │
│           Reconciled Physical Output of the Batch           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 4. Quality Control (QC)                     │
│       Multi-parameter inspection against specifications     │
└──────────────┬───────────────┬───────────────┬──────────────┘
               │               │               │
        ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
        │  4a. Pass   │ │ 4b. Rework  │ │  4c. Scrap  │
        │ Finished    │ │ Sent to new │ │ Recyclable  │
        │ stock ledger│ │ rework batch│ │ scrap stock │
        └─────────────┘ └─────────────┘ └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │4d. Wastage  │
                                        │Unrecoverable│
                                        │loss recorded│
                                        └─────────────┘
```

### 1.2 Key Non-Negotiable Rules (ADR-011, ADR-012, ADR-013)
1. **Independent Entry:** Raw material issues from the warehouse, physical batch input on the factory floor, and individual worker output are logged independently by different personnel at different times.
2. **Context Completeness:** Yield and variance stay `NULL` while the batch is in `draft` or `collecting` status. They are only calculated when the batch transitions to `context_complete`.
3. **No Phantom Variance:** The system never shows premature "discrepancies" to factory workers while logging is actively in progress.

---

## 2. Inventory & Stock Movement Ledger

Stock quantity is derived exclusively from an **append-only immutable movement ledger**.

```text
Business Action
(Purchase GRN, Sales Delivery, Production Issue, Transfer, Adjustment)
                        │
                        ▼
            DB::transaction() Begin
                        │
                        ▼
         Write row to `stock_movements` (Immutable)
   (type, variant_id, warehouse_id, qty, reference_doc, actor)
                        │
                        ▼
      Update `stock_balances` Cache under lockForUpdate()
                        │
                        ▼
            DB::transaction() Commit
```

### Stock States Matrix:
* **`available`**: On-hand stock ready for sale, transfer, or production issue.
* **`reserved`**: Allocated against unfulfilled sales orders or scheduled batches.
* **`in_transit`**: Dispatched between warehouses; not yet received at target.
* **`quarantine`**: Awaiting QC inspection.
* **`damaged`**: Written off or awaiting salvage/scrap processing.

---

## 3. Procurement Chain

```text
[Purchase Requisition] ──► [Purchase Order (PO)] ──► [Goods Receipt Note (GRN)]
   (Department Need)       (Supplier Contract)          (Warehouse Receiving)
                                                              │
                                    ┌─────────────────────────┴────────────────────────┐
                                    ▼                                                  ▼
                       [Stock Movement: Inward]                              [Purchase Bill]
                       (Available Stock Increases)                         (Accounts Payable)
                                                                                       │
                                                                                       ▼
                                                                             [Supplier Payment]
```

* **Debit Notes & Supplier Returns:** Defective goods identified at GRN stage trigger a `purchase_returns` workflow, issuing debit notes that reduce supplier payable balances.

---

## 4. Omnichannel Sales & Point of Sale (POS)

All sales channels (Counter, Dealer, Phone, Field, Online Storefront) share the **same transactional core** and ledger rules, distinguished by the `channel` field.

```text
[Sales Order Created] ──► [Stock Reservation] ──► [Invoice Issuance] ──► [Delivery / Fulfillment]
                                                                                │
                                                                                ▼
                                                                     [Stock Movement: Deduct]
                                                                                │
                                                                                ▼
                                                                       [Payment Allocation]
```

### Dedicated POS Flow:
1. **Shift Management:** Cashier opens POS shift with opening drawer float (`pos_sessions`).
2. **High-Speed Checkout:** Keyboard-driven item search, barcode scanning, instant line discounts, and multiple payment methods (Cash, Card, MFS).
3. **Offline Tolerance:** If connectivity drops, transactions are stored in client IndexedDB and queued in `pos_offline_queue`. Background sync resumes automatically upon reconnection.
4. **Shift Close:** Blind count drawer reconciliation against expected cash with manager override on discrepancies.

---

## 5. Order-to-Doorstep Logistics & Fleet Management

```text
[Invoiced Sales Order]
          │
          ▼
[Delivery Order Created]
          │
          ├─────────────────────────────────────────┬────────────────────────────────────────┐
          ▼                                         ▼                                        ▼
   [Internal Fleet]                          [Third-Party Courier]                     [Store Pickup]
          │                                         │                                        │
          ▼                                         ▼                                        ▼
 [Add to Run Sheet]                       [Dispatch via Courier Adapter]              [Counter Handover]
          │                               (Pathao / Steadfast / RedX)                        │
          ▼                                         │                                        ▼
[Driver Delivery / POD]                             ▼                                   [Order Closed]
(Signature + Cash Collected)              [Webhook Status Updates]
          │                                         │
          └────────────────────┬────────────────────┘
                               │
                               ▼
                   [COD Cash Reconciliation]
              (Cash settled into Bank/Treasury)
```

---

## 6. Workforce Management & Production Payroll

```text
[Daily Attendance Logged] ────────────┐
(Biometric / Manual Clock-In)         │
                                      ▼
                        [Monthly Payroll Calculation]
[Worker Production Entries] ──►  - Base Fixed Salary
(Piece-rate verified output)     - Attendance Multiplier
                                 - Production-Linked Incentive
                                 - Statutory Deductions & Advances
                                      │
                                      ▼
                           [Manager Approval & Lock]
                                      │
                                      ▼
                           [Immutable Payslip Issued]
                         (Source records locked permanently)
```
