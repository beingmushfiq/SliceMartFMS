# SLICE MART — AI PROJECT CONTEXT
Client: Slice Mart
Development: DevCenterPoint
System: Complete Factory Management System

## Business
Cooker & Stove manufacturing/assembly. 25–30 models, 200–250 units/day, 1 production line/section, 7–10 workers, 2 warehouses, 12–15 raw-material types. B2B + B2C sales.

## Locked Stack
Frontend: React + TypeScript + Vite + TailwindCSS
Backend: Laravel 13 + PHP 8.5+
Local DB: SQLite
Production DB: MySQL 8.x
Auth: JWT
API: REST /api/v1
Deployment: Cloud
Phase 1: Responsive web app
Mobile: optional add-on

## Core Modules
Auth/RBAC, Dashboard, Products, Materials, BOM, Warehouses, Inventory, Stock Ledger, Production, Employee Production, QC, Rework, Suppliers, Purchase, Customers, Leads/CRM, Sales, Invoices, Delivery, Payments, Sales Targets, Incentives, HR, Attendance, Due Collection, Assets, Asset Expenses, Basic Finance, Notifications, Reports/RMS, Audit Trail.

## Non-negotiable Rules
- MySQL is the production authority; SQLite is local convenience.
- Never introduce SQLite-specific business logic.
- Backend is authoritative for inventory, profit, target, incentive, due and permission calculations.
- Every stock change creates a traceable stock movement.
- Historical invoice cost/profit must not change when today's product cost changes.
- Lead conversion is transactional and preserves salesman attribution.
- QC is PASS/FAIL; failed items may enter rework and re-test.
- Sensitive mutations require audit trail.
- Do not invent business rules, endpoints or schema; inspect existing implementation/docs first.
- Do not change locked architecture without approval.
