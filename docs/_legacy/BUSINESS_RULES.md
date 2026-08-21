# SLICE MART — BUSINESS RULES

## Production
Dynamic targets; employee-wise output; approved production workflow updates finished stock.

## QC
PASS/FAIL. FAIL→Rework (if applicable)→Re-test→PASS/FAIL. Preserve history.

## Inventory
Two warehouses. Raw materials and finished goods tracked separately. Minimum/reorder thresholds trigger in-app notifications.

## Sales
B2B and B2C. Finished products and approved raw materials may be sold. Invoice stores historical cost/profit snapshot.

## Leads
Salesman creates leads. Statuses: New, Contacted, Follow-up, Qualified, Converted, Lost, Fake. Conversion must link customer and sale without duplicate customer creation and preserve salesman/lead reference.

## Sales Target
Monthly salesman target. Track target, achieved, remaining and percentage.

## Incentive
Configurable product/policy rules. Exact formula must be confirmed before implementation. Backend is authoritative.

## Collection
Invoice total, paid, due, due_date, overdue status. Payments allocate to invoices.

## HR
Employee master, attendance, shifts and performance. Employee identity must be reusable across production and sales.

## Assets
Fixed and disposable/consumable assets, assignments, expenses and lifecycle history.

## Finance
Basic finance: multiple accounts, payment methods, income/expense, purchase/sales payments. Full accounting is extensible.

## Notifications
Base: in-app push. SMS/WhatsApp/email not assumed in base scope.

## CCTV
Assess existing CCTV/NVR for feasibility. Custom hardware integration may be separate.
