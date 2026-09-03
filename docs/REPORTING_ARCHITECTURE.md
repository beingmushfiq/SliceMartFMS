# REPORTING ARCHITECTURE — REPORT MANAGEMENT SYSTEM (RMS)

> **Status:** Canonical Business Intelligence & Reporting Specification  
> **Framework:** Report Management System (RMS)  
> **Registry:** 58 Canonical Enterprise Reports across 9 Operational Domains  

---

## 1. RMS Query Engine Architecture

Reports execute through discrete `ReportQueryInterface` implementations rather than ad-hoc controller queries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            RMS REPORT REQUEST PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Report Definition Lookup │ Checks code, tier, permission, available filters│
│ 2. Parameter Sanitization   │ Validates date ranges, warehouses, branches     │
│ 3. Query Execution          │ Streamed SQL aggregation with tenant isolation  │
│ 4. Result Transformation    │ Summary KPI rollups + paginated record rows     │
│ 5. Output Driver            │ JSON Data Grid / CSV Stream / PDF Print Engine  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 9 Canonical Report Domains

1. **Production Intelligence:** Batch Yield Rate, Scrap & Wastage Breakdown, Worker Piece-Rate Output, Production Capacity Utilization.
2. **Inventory & Valuation:** Stock Valuation (FIFO/AVCO), Slow-Moving & Dead Stock, Stock Movement Ledger, Reorder Shortage Forecast.
3. **Purchasing & Vendor Performance:** Supplier On-Time Delivery, PO vs GRN Price Variance, Accounts Payable Aging.
4. **Commercial & Sales Performance:** Sales by Customer Tier, Sales by Product Margin, Salesperson Target Achievement, Channel Breakdown (Wholesale, Retail, POS, Online).
5. **Point of Sale (POS):** Register Daily Z-Report, Cash Variance by Cashier, Hourly Store Footfall & Sales Velocity.
6. **Logistics & Courier Delivery:** 3PL Delivery Success Rate, Return-to-Origin (RTO) Analysis, Cash on Delivery (COD) Outstanding Aging.
7. **Human Resources & Payroll:** Monthly Payroll Register, Employee Attendance & Overtime, Piece-Rate vs Fixed Wage Distribution.
8. **General Ledger & Accounting:** Balance Sheet, Profit & Loss Statement, Cash Flow Summary, Trial Balance, Expense Breakdown.
9. **E-Commerce & Storefront Analytics:** Cart Abandonment Rate, Order Fraud Risk Distribution, WhatsApp Order Conversion Rate.

---

## 3. High-Volume Export Streaming

To prevent memory overflow on large multi-thousand-row data exports:
- CSV exports stream rows directly to output via Laravel's `StreamedResponse` and PHP generators (`yield`).
- Direct PDF reports render using print CSS rules with standardized headers, running totals, and footer timestamps.
