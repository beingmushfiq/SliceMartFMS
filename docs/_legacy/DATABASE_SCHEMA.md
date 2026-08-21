# SLICE MART — DATABASE BLUEPRINT

## Principles
MySQL 8.x production compatibility; SQLite local compatibility; relational core entities; foreign keys; indexes; DECIMAL for money; traceable transactions; historical snapshots.

## Identity
users, roles, permissions, role_user, permission_role, audit_logs, notifications

## HR
employees, departments, designations, shifts, attendance, employee_documents, employee_history

## Catalog
categories, units, products, product_prices, raw_materials, material_categories, boms, bom_items

## Warehouse
warehouses, inventory_balances, stock_movements, stock_transfers, stock_transfer_items, stock_adjustments

## Production
production_orders, production_order_items, material_issues, material_issue_items, production_outputs, employee_production_entries, qc_inspections, rework_orders, rework_items

## Purchase
suppliers, purchase_orders, purchase_items, purchase_receipts, purchase_receipt_items, supplier_payments

## CRM/Sales
customers, leads, lead_activities, sales_orders, sales_order_items, invoices, invoice_items, deliveries, payments, payment_allocations

## Targets/Incentives
sales_targets, incentive_rules, incentive_rule_products, sales_incentives

## Finance
accounts, payment_methods, income_categories, expense_categories, expenses, account_transactions

## Assets
assets, asset_categories, asset_assignments, asset_expenses, asset_disposals

## Reporting
saved_reports and report_filters are optional.

## Critical Relationships
products→boms→bom_items→raw_materials
warehouses→stock_movements
production_orders→material_issues→stock_movements
production_outputs→inventory
production_outputs→employee_production_entries
production_outputs→qc_inspections→rework_orders
suppliers→purchases
customers→leads→invoices
employees/salesmen→leads→sales/invoices
invoices→invoice_items→payments/payment_allocations
sales_targets→sales
incentive_rules→sales_incentives
assets→asset_expenses
accounts→account_transactions

## Money
Use DECIMAL(15,2) or project-wide equivalent. Invoice items preserve unit_cost_snapshot, line_profit and margin. Never recalculate historical profit from current product cost.
