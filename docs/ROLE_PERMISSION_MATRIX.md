# ROLE & PERMISSION MATRIX — DYNAMIC RBAC SPECIFICATION

> **Status:** Canonical Security & Authorization Specification  
> **Rule:** Permissions are dynamic, tenant-scoped strings in format `{module}.{resource}.{action}`. Zero hardcoded role string checks in frontend code.  

---

## 1. Permission Structure & Conventions

Every permission token follows the canonical syntax:
```
{module}.{resource}.{action}
```
- **Wildcards:**
  - `*` — Unrestricted super-access (Platform Admin & Tenant Owner).
  - `{module}.*` — Unrestricted access to all resources and actions in a specific module (e.g. `sales.*`).
  - `{module}.{resource}.*` — All actions on a resource (e.g. `inventory.stock.*`).

---

## 2. Standard Action Verbs

| Action | Meaning |
|---|---|
| `view` | Read-only access to list and detail views. |
| `create` | Ability to submit new records. |
| `update` / `edit` | Ability to modify existing records. |
| `delete` | Soft or hard deletion of unposted records. |
| `approve` | Authority to approve draft orders, batches, bills, or requisitions. |
| `void` / `cancel` | Authority to cancel posted documents with audit justification. |
| `export` | Ability to download CSV, Excel, or bulk data. |
| `print` | Ability to trigger physical document print routines. |
| `manage` | Full administrative configuration of module settings and parameters. |

---

## 3. Comprehensive Permission Registry

### 3.1 Platform Governance
- `platform.tenant.view`, `platform.tenant.create`, `platform.tenant.manage`, `platform.tenant.impersonate`
- `platform.plan.view`, `platform.plan.manage`
- `platform.audit.view`, `platform.error.view`

### 3.2 Catalogue & Master Data
- `catalog.unit.view`, `catalog.unit.manage`
- `catalog.category.view`, `catalog.category.manage`
- `catalog.brand.view`, `catalog.brand.manage`
- `catalog.product.view`, `catalog.product.create`, `catalog.product.edit`, `catalog.product.delete`, `catalog.product.export`
- `catalog.bom.view`, `catalog.bom.create`, `catalog.bom.edit`, `catalog.bom.delete`
- `catalog.party.view`, `catalog.party.create`, `catalog.party.edit`, `catalog.party.delete`

### 3.3 Production & Manufacturing
- `production.plan.view`, `production.plan.create`, `production.plan.edit`, `production.plan.approve`
- `production.batch.view`, `production.batch.create`, `production.batch.release`, `production.batch.complete`
- `production.worker_entry.view`, `production.worker_entry.create`, `production.worker_entry.verify`

### 3.4 Quality Control (QC)
- `qc.inspection.view`, `qc.inspection.create`, `qc.inspection.approve`
- `qc.parameter.view`, `qc.parameter.manage`
- `qc.wastage.view`, `qc.wastage.create`
- `qc.rework.view`, `qc.rework.create`, `qc.rework.manage`

### 3.5 Inventory & Warehousing
- `inventory.stock.view`, `inventory.stock.adjust`, `inventory.stock.count`
- `inventory.movement.view`, `inventory.movement.export`
- `inventory.transfer.view`, `inventory.transfer.create`, `inventory.transfer.dispatch`, `inventory.transfer.receive`
- `inventory.warehouse.view`, `inventory.warehouse.manage`

### 3.6 Purchasing & Procurement
- `purchasing.requisition.view`, `purchasing.requisition.create`, `purchasing.requisition.approve`
- `purchasing.order.view`, `purchasing.order.create`, `purchasing.order.edit`, `purchasing.order.approve`
- `purchasing.receipt.view`, `purchasing.receipt.create`
- `purchasing.bill.view`, `purchasing.bill.create`, `purchasing.bill.approve`
- `purchasing.return.view`, `purchasing.return.create`

### 3.7 Sales, CRM & POS
- `sales.lead.view`, `sales.lead.create`, `sales.lead.edit`, `sales.lead.convert`
- `sales.target.view`, `sales.target.manage`
- `sales.order.view`, `sales.order.create`, `sales.order.edit`, `sales.order.approve`, `sales.order.cancel`
- `sales.invoice.view`, `sales.invoice.create`, `sales.invoice.approve`, `sales.invoice.void`, `sales.invoice.print`
- `sales.payment.view`, `sales.payment.create`, `sales.payment.refund`
- `sales.delivery.view`, `sales.delivery.create`, `sales.delivery.dispatch`
- `sales.return.view`, `sales.return.create`, `sales.return.approve`
- `pos.terminal.view`, `pos.terminal.manage`
- `pos.session.view`, `pos.session.open`, `pos.session.close`
- `pos.sale.create`

### 3.8 Logistics & Courier Dispatch
- `logistics.shipment.view`, `logistics.shipment.create`, `logistics.shipment.track`
- `logistics.run_sheet.view`, `logistics.run_sheet.create`, `logistics.run_sheet.dispatch`
- `logistics.courier.manage`
- `logistics.cod.view`, `logistics.cod.reconcile`

### 3.9 Human Resources & Payroll
- `hr.employee.view`, `hr.employee.create`, `hr.employee.edit`, `hr.employee.delete`
- `hr.attendance.view`, `hr.attendance.record`
- `hr.leave.view`, `hr.leave.request`, `hr.leave.approve`
- `hr.payroll.view`, `hr.payroll.process`, `hr.payroll.approve`
- `hr.payslip.view`, `hr.payslip.print`

### 3.10 Finance & General Ledger
- `finance.account.view`, `finance.account.create`, `finance.account.edit`
- `finance.journal.view`, `finance.journal.create`, `finance.journal.post`
- `finance.expense.view`, `finance.expense.create`, `finance.expense.approve`
- `finance.bank.view`, `finance.bank.manage`
- `finance.costing.view`, `finance.costing.rollup`

### 3.11 Storefront CMS & E-Commerce
- `ecommerce.storefront.view`, `ecommerce.storefront.manage`
- `ecommerce.page.view`, `ecommerce.page.create`, `ecommerce.page.edit`, `ecommerce.page.publish`
- `ecommerce.fraud.view`, `ecommerce.fraud.verify`, `ecommerce.fraud.reject`

### 3.12 Reports & Analytics
- `reports.report.view`, `reports.report.export`, `reports.report.print`
- `reports.analytics.view`

### 3.13 Governance & Core Settings
- `core.role.view`, `core.role.manage`
- `core.audit_log.view`, `core.audit_log.export`
- `core.setting.view`, `core.setting.manage`
- `documents.template.view`, `documents.template.create`, `documents.template.manage`
