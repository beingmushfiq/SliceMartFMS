# MASTER SAAS ROLE-BASED ACCESS CONTROL (RBAC)

> **Owner:** DevCenterPoint Platform Architecture  
> **Scope:** Platform-Level Administration Access Control  
> **Storage:** `platform_roles` and `platform_role_user` tables

---

## 1. Role Hierarchy & Purpose

DevCenterPoint platform staff require differentiated privilege tiers to adhere to the principle of least privilege. The platform ships with seven pre-seeded system roles:

| Role Name | Slug | Primary Responsibilities |
|---|---|---|
| **Super Administrator** | `super-admin` | Unrestricted root control across all tenants, platform settings, database maintenance, and staff accounts. |
| **Platform Administrator** | `platform-admin` | General operations: tenant onboarding, status changes, module overrides, and feature flag management. |
| **Billing Manager** | `billing-manager` | Plan creation/pricing, subscription extensions, SaaS payment recording, and MRR auditing. |
| **Support Lead** | `support-lead` | Ticket triage, diagnostic impersonation, priority assignment, and tenant communication notes. |
| **Support Agent** | `support-agent` | Ticket response and basic tenant status viewing (read-only tenant settings). |
| **Security Auditor** | `security-auditor` | Immutable platform audit log review, error monitoring telemetry, and security policy verification. |
| **Infrastructure / SRE** | `infra-engineer` | System health diagnostics, failed job retries, database latency monitoring, and maintenance mode controls. |

---

## 2. Platform Permission Catalog

The platform defines granular permissions grouped by functional area:

### Tenant Governance
- `tenants.view` — View tenant list, profiles, and basic statistics.
- `tenants.create` — Provision new tenant accounts.
- `tenants.update` — Edit tenant name, domain, and general settings.
- `tenants.status` — Suspend, reactivate, or archive tenants.
- `tenants.delete` — Deprovision and soft-delete tenants.
- `tenants.impersonate` — Launch diagnostic super-admin session into tenant app.

### Subscriptions & Billing
- `subscriptions.view` — View subscription tiers, lifecycle status, and history.
- `subscriptions.manage` — Extend subscription terms, change plan tier, adjust grace periods.
- `billing.view` — View SaaS payment ledger, invoices, and MRR/ARR analytics.
- `billing.record` — Record offline payments, bank transfers, and generate receipts.
- `plans.manage` — Create, update, or deactivate SaaS plan tiers and quotas.

### Platform Control & Features
- `features.view` — View feature flags and module catalog.
- `features.manage` — Create, toggle, and adjust rollout percentages for feature flags.
- `modules.override` — Enable/disable specific enterprise modules per tenant.
- `announcements.manage` — Broadcast system maintenance alerts and warnings.
- `support.manage` — Manage support tickets, respond to inquiries, and triage incidents.

### Observability & Security
- `audit.view` — Read platform-wide immutable audit trail.
- `errors.view` — Monitor platform error telemetry and stack traces.
- `errors.manage` — Triage, assign, and resolve error clusters.
- `health.view` — View live database latency, cache, storage, and queue metrics.
- `jobs.manage` — Retry failed asynchronous background jobs and workers.
- `admins.manage` — Create platform staff accounts and assign roles.
- `settings.manage` — Configure universal platform settings, security lockout, and maintenance mode.

---

## 3. Implementation Details

- Eloquent Models: `PlatformRole` (`app/Models/PlatformRole.php`), linked via `belongsToMany` on `User` (`app/Models/User.php`).
- Permission Checks: `User::hasPlatformPermission($permission)` verifies whether any of the user's assigned active platform roles contains the permission or has `*` (superuser).
- Seeders: `PlatformRbacService::seedDefaultRoles()` automatically populates the default roles and permissions catalog during platform initialization.
