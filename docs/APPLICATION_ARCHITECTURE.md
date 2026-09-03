# APPLICATION ARCHITECTURE — THE 3-APPLICATION ECOSYSTEM

> **Status:** Canonical Architecture Specification  
> **Audience:** Principal Architects, Full-Stack Engineers, System Integrators  
> **Governing Rule:** Keep the three applications separate, uncoupled, but synchronously integrated.  

---

## 1. Architectural Topology

The software ecosystem comprises three applications operating over a shared, highly optimized runtime and database:

```
                                  DNS & REVERSE PROXY
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            │                             │                             │
    app.devcenterpoint.com     tenant.devcenterpoint.com         storefront.com
            │                   (or custom domain)            (or tenant.shop)
            ▼                             ▼                             ▼
┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────┐
│     APPLICATION 1     │   │       APPLICATION 2       │   │     APPLICATION 3     │
│  MASTER SAAS PLATFORM │   │ TENANT MANAGEMENT FMS/ERP │   │   PUBLIC STOREFRONT   │
│  DevCenterPoint Admin │   │ Slice Mart / Tenant Ops   │   │ Headless E-Commerce   │
└───────────┬───────────┘   └─────────────┬─────────────┘   └───────────┬───────────┘
            │                             │                             │
            ▼                             ▼                             ▼
    /api/v1/platform/*             /api/v1/* (Tenant)            /api/v1/storefront/*
            │                             │                             │
            └─────────────────────────────┼─────────────────────────────┘
                                          ▼
                         LARAVEL CORE RUNTIME PIPELINE
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
    TENANCY ENGINE (TenantContext)                             DATABASE (173 Tables)
```

---

## 2. Application Profiles & Boundaries

| Dimension | Application 1: Master SaaS Platform | Application 2: Tenant Management Software | Application 3: Public Storefront |
|---|---|---|---|
| **Primary Domain** | `platform.devcenterpoint.com` | `{tenant}.devcenterpoint.com` or custom CNAME | `{tenant}.shop` or custom apex domain |
| **Primary User** | DevCenterPoint Super Admins & Support | Factory Owners, Operations, Cashiers, Workers | Retail & B2B Consumers |
| **UI Aesthetics** | Dark-slate high-density dashboard | Enterprise Industrial Light/Dark operational GUI | Polished, editorial, visual-first online store |
| **Routing Prefix** | `/platform/*` | `/` (Dashboard, Catalogue, POS, Inventory, etc.) | `/store/:subdomain/*` |
| **Auth Mechanism** | Platform Session / Admin JWT (`platform_users`) | Tenant JWT (`users` scoped by `tenant_id`) | Guest Session / Customer JWT (`storefront_customers`) |
| **API Endpoints** | `routes/api_platform.php` | `routes/api_tenant.php` | `routes/api_storefront.php` & `api_public.php` |
| **Data Scope** | Cross-tenant global metrics & subscriptions | Strictly isolated single-tenant partition | Public catalog & customer cart/orders for 1 tenant |

---

## 3. The 5 Distinct Commercial Entities

A core failure of generic ERP systems is collapsing commercial transactions into a single record. SliceMart enforces strict separation across five business lifecycle entities:

```
[1. E-Commerce Order] ──(Approval / Fraud Pass)──▶ [2. Sales Order]
                                                          │
                    ┌─────────────────────────────────────┴─────────────────────────────────────┐
                    ▼                                                                           ▼
           [3. Sales Invoice]                                                           [4. Delivery Challan]
                    │                                                                           │
        (Payment Gateway / Cash)                                                        (Courier Dispatch)
                    ▼                                                                           ▼
          [5. Payment Receipt]                                                         [Customer Delivery]
```

1. **E-Commerce Order (`orders` / `sales_orders` channel='online'):**
   - Represents customer intent from the web store.
   - May be held for fraud review, cancelled by user, or amended prior to confirmation.
   - Does **not** legally record revenue.
2. **Sales Order (`sales_orders`):**
   - The agreed commercial contract between customer and tenant.
   - Allocates or reserves inventory stock.
3. **Sales Invoice (`invoices`):**
   - The binding legal and financial document that posts accounts receivable and VAT/tax liabilities to the General Ledger.
4. **Delivery Challan (`delivery_orders`):**
   - The physical warehouse stock dispatch note authorizing goods to leave the loading dock. Triggers the actual inventory stock ledger decrement.
5. **Payment Receipt (`payments`):**
   - The financial settlement transaction recording liquid cash, bank deposit, or mobile wallet balance against one or more invoices.

---

## 4. Cross-Cutting Transaction Boundaries

All state transitions that impact money, inventory, or physical output execute within strict database transaction boundaries:

1. **POS Checkout:**
   - Single atomic transaction: `SalesOrder (status='completed')` + `Invoice (status='paid')` + `Payment (status='received')` + `StockMovement (type='pos_sale')` + `PosSession (running totals updated)`.
2. **Production Batch Completion:**
   - Atomic transaction: `ProductionBatch (status='completed')` + `StockMovement (Raw Materials consumed)` + `StockMovement (Finished Goods added)` + `QCInspection (status='pending')`.
3. **Goods Receipt Note (GRN):**
   - Atomic transaction: `GoodsReceipt (status='received')` + `StockMovement (type='purchase_receipt')` + `PurchaseOrder (received_quantity incremented)`.
4. **Courier Dispatch Settlement:**
   - Atomic transaction: `CourierShipment (status='delivered')` + `CodReconciliation (amount verified)` + `Invoice (payment applied)` + `JournalEntry (Bank debited, AR credited)`.
