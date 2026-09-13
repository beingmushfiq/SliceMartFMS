# Master SaaS Module Registry & Feature Governance

This document specifies the business and platform modules managed by the **DevCenterPoint Master SaaS Control Panel**. It outlines the module registry architecture, capability flags, tiered plan gating, and dynamic feature toggle controls.

---

## 1. Architectural Philosophy

In this multi-tenant SaaS architecture:
- **Tenants do not own code or database schemas:** All tenants execute against shared, highly hardened application layers.
- **Module activation is declarative and data-driven:** A tenant's ability to access a given module or high-level capability depends on:
  1. The capabilities enabled in the tenant's subscribed plan tier (`plans.features` JSON).
  2. Granular tenant overrides (`feature_flags` table scoped to `tenant_id`).
  3. Platform-wide kill-switches (`feature_flags` table with `tenant_id = null`).
- **Strict Isolation:** Master SaaS Panel staff manage feature availability across all tenants without modifying tenant data or executing tenant-specific operational transactions.

---

## 2. Master Module Registry

The platform recognizes 13 distinct functional modules categorized by domain:

| Module Key | Display Name | Category | Core Module | Min Tier | Default Capabilities |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `core` | Core Framework & Security | Foundation | Yes | Starter | Authentication, Single Sign-On, User Profile, Session Security |
| `rbac` | Role-Based Access Control | Foundation | Yes | Starter | Custom Roles, Granular Permissions, Security Matrix |
| `inventory` | Multi-Warehouse Inventory | Operations | Yes | Starter | Stock Balances, Valuations, Warehouses, Stock Counts, Adjustments |
| `purchasing` | Supply Chain & Purchasing | Operations | Yes | Starter | Purchase Orders, Goods Receipt (GRN), Supplier Directories, AP Vouchers |
| `sales` | B2B Sales & Order Fulfillment | Commercial | Yes | Starter | Sales Orders, Invoicing, Dispatch Challans, Aging Receivables |
| `pos` | Point of Sale & Terminal Registers| Commercial | No | Growth | Barcode Scanning, Thermal Receipt Printing, Shift Cash Drawer |
| `ecommerce` | Headless Storefront & Catalog | Digital | No | Scale | Online Store, SEO Engine, Dynamic Pages, Customer Cart & Checkout |
| `production`| Industrial Manufacturing & MES | Factory | No | Growth | Production Batches, Work Orders, Bill of Materials (BOM), Worker Output |
| `qc` | Quality Control & Rework | Factory | No | Growth | AQL Inspections, Defect Logging, Rework Orders, Wastage Logs |
| `hr` | Human Resources & Workforce | Management | No | Growth | Employee Profiles, Shift Scheduling, Attendance, Piece-Rate Payroll |
| `finance` | Accounting Ledger & Treasury | Governance | No | Scale | Double-Entry Journals, Expense Tracking, AR/AP Ledgers, Bank Reconciliations |
| `reports` | Analytics & Intelligence Engine | Insights | Yes | Starter | Standard Operations Reports, Trend Analytics, CSV/Excel Exports |
| `seo` | Discoverability & Rich Metadata | Digital | No | Growth | Schema.org Structured Data, OpenGraph Previews, Canonical URL Management |

---

## 3. Plan Tier Capability Matrix

Platform pricing plans assign modules and limits based on business scale:

| Capability / Resource Limit | Starter Plan | Growth Plan | Scale Enterprise |
| :--- | :---: | :---: | :---: |
| **Max User Accounts** | 5 | 25 | Unlimited |
| **Max Warehouses** | 1 | 5 | Unlimited |
| **Industrial Production (MES)** | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **Quality Control & AQL** | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **Point of Sale (POS)** | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **Headless Storefront & CMS** | ❌ Disabled | ❌ Disabled | ✅ Enabled |
| **Piece-Rate Workforce Payroll** | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **Double-Entry Financial Journals**| ❌ Disabled | ❌ Disabled | ✅ Enabled |
| **API & Webhook Access** | ❌ Disabled | ❌ Disabled | ✅ Enabled |
| **Custom Domain Support** | ❌ Disabled | ❌ Disabled | ✅ Enabled |

---

## 4. Dynamic Feature Flagging Architecture

Feature flags allow platform administrators to rollout new features progressively or implement instant kill-switches without deploying code.

### Database Schema (`feature_flags`)
```sql
CREATE TABLE feature_flags (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL,
    key VARCHAR(128) NOT NULL,
    tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage NUMERIC(5,2) DEFAULT NULL,
    description VARCHAR(255) NOT NULL,
    conditions JSONB DEFAULT NULL,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Evaluation Hierarchy
When a tenant executes a feature-gated action:
1. **Global Kill-Switch Check:** If a global flag (`tenant_id = null`) is disabled (`enabled = false`), the feature is denied immediately across the platform.
2. **Tenant-Specific Override:** If an explicit tenant flag exists (`tenant_id = current_tenant`), its `enabled` value takes precedence over plan tier settings.
3. **Rollout Percentage:** If configured, deterministic hashing `crc32(tenant_id + flag_key) % 100 < rollout_percentage` determines gradual feature activation.
4. **Plan Feature Definition:** Defaults back to the tenant's current active subscription plan features.

---

## 5. Master Panel Operational Controls

From the **Platform Feature Flags & Modules Workspace** (`/platform/feature-flags`):
- **Catalog Inspection:** Platform administrators can browse all 13 modules, their capabilities, and dependency requirements.
- **Rollout Percentage Slider:** Adjust percentage rollouts for canary testing.
- **Instant Activation/Deactivation:** One-click toggles recorded in the universal platform audit log (`AuditAction::Updated`).
