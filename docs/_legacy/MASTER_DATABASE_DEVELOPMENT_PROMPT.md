# SLICE MART — MASTER DATABASE PROMPT

Design and implement the production-grade relational database.

## Environment
Local: SQLite
Production: MySQL 8.x
MySQL is authoritative.

## Required Areas
Factory production; raw materials; finished goods; two warehouses; BOM; QC/rework; purchase; B2B/B2C sales; CRM/leads; salesman targets; incentives; employee production; HR/attendance; due collection; assets; expenses; multiple accounts/payment methods; RMS; audit.

## Modeling
Relational core entities; foreign keys; indexes; DECIMAL money; DECIMAL quantities where needed; unique business identifiers; timestamps; appropriate soft deletes; immutable/traceable transaction history.

## Core Tables
Identity: users, roles, permissions, audit_logs, notifications
HR: employees, departments, designations, shifts, attendance
Catalog: categories, units, products, product_prices, raw_materials, boms, bom_items
Warehouse: warehouses, inventory_balances, stock_movements, stock_transfers, stock_transfer_items, stock_adjustments
Production: production_orders, production_order_items, material_issues, material_issue_items, production_outputs, employee_production_entries, qc_inspections, rework_orders, rework_items
Purchase: suppliers, purchase_orders, purchase_items, purchase_receipts, purchase_receipt_items, supplier_payments
CRM/Sales: customers, leads, lead_activities, sales_orders, sales_order_items, invoices, invoice_items, deliveries, payments, payment_allocations
Targets/Incentives: sales_targets, incentive_rules, incentive_rule_products, sales_incentives
Finance: accounts, payment_methods, income_categories, expense_categories, expenses, account_transactions
Assets: assets, asset_categories, asset_assignments, asset_expenses, asset_disposals

## Inventory
Stock ledger is audit source. Every movement records item, warehouse, type, quantity, source, user and timestamp.

## Historical Finance
Invoice item stores unit_cost_snapshot, line_profit and margin. Never recalculate historical profit from current cost.

## Migrations
Use Laravel migrations. Fresh migrate must work on SQLite and MySQL. Do not manually modify production schema outside migrations. Seed only safe development master/demo data.

## Verification
Run fresh SQLite migration + tests; fresh MySQL migration + tests; verify constraints, indexes, transaction behavior and report totals. Document unavoidable DB differences.
