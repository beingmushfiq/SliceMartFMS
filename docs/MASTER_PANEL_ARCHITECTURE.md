# MASTER SAAS CONTROL PANEL ARCHITECTURE

> **Platform Owner:** DevCenterPoint  
> **Classification:** Platform Control Plane  
> **Route Prefix:** `/platform/*` (Frontend) · `/api/v1/platform/*` (Backend API)  
> **Target Audience:** DevCenterPoint Platform Administrators, SREs, Billing Engineers, and Support Operators.

---

## 1. System Mission & Architectural Boundary

The **Master SaaS Control Panel** serves as the root operations and governance plane for the entire multi-tenant enterprise ecosystem operated by **DevCenterPoint**.

It is strictly decoupled from any tenant's operational business software:

```
┌──────────────────────────────────────────────────────────────────┐
│             DEVCENTERPOINT PLATFORM CONTROL PLANE                │
│    Root SaaS Master Panel (/platform/*, /api/v1/platform/*)      │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Directs, Provisions & Monitors
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│              MULTI-TENANT BUSINESS APPLICATIONS                  │
│    Tenant #1 (Slice Mart)  •  Tenant #2  •  Tenant #3...         │
│    Each strictly partitioned by tenant_id                        │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ Exposes Headless Stores
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│              PUBLIC TENANT STOREFRONTS                           │
│    {subdomain}.devcenterpoint.com / Custom CNAME                 │
└──────────────────────────────────────────────────────────────────┘
```

### Core Tenet
The Master SaaS Panel does **not** process sales orders, manage warehouse racks, record factory production recipes, or process point-of-sale register scans. It governs the **tenants** that own those business domains. Slice Mart is treated purely as Tenant #1—never privileged, hardcoded, or architectural baseline for other tenants.

---

## 2. Platform Architecture & Stack

- **Frontend:** React 19 / TypeScript / Vite Single Page Application.
  - Route Base: `/platform/*`
  - Guard: `PlatformProtectedRoute` (validates `is_platform_user: true` and absence of `tenant_id`).
  - Shell: `PlatformShell` with persistent grouped navigation `PlatformSidebar`.
  - Design Tokens: Harmonized dark/light palette with slate darks, subtle amber accents, high contrast typography, and accessible status indicators.
- **Backend API:** Laravel 13.26 REST Core.
  - Route File: `backend/routes/api_platform.php`
  - Base URL: `/api/v1/platform`
  - Middlewares: `auth.platform`, `platform.super_admin`, `throttle:platform-api`
  - Architecture: Action-Domain-Responder (ADR) and dedicated Platform Controllers.
- **Database Scope:** Shared primary PostgreSQL database.
  - Platform tables (`tenants`, `platform_plans`, `tenant_subscriptions`, `platform_subscription_payments`, `platform_roles`, `platform_role_user`, `platform_announcements`, `platform_error_logs`, `platform_support_tickets`, `platform_support_ticket_notes`, `feature_flags`, `platform_settings`) reside in the root schema without `tenant_id` scoping constraints.

---

## 3. Workspaces & Functional Matrix

| Workspace | Route | Purpose | Key Actions |
|---|---|---|---|
| **Overview & KPIs** | `/platform` | Live executive metrics and health | MRR, ARR, active tenant gauge, health pulse, churn, upcoming expirations |
| **Tenant Directory** | `/platform/tenants` | Master inventory of all tenants | Search, filter by status/tier, fast status toggle, deep link to detail |
| **Provision Tenant** | `/platform/tenants/new` | Multi-step tenant onboarding wizard | Organization setup, owner credentials, subdomain reservation, plan selection |
| **Tenant Detail** | `/platform/tenants/:id` | 360-degree tenant command hub | Manage subscription term/grace period, plan switches, module overrides, owner password reset, direct billing ledger, diagnostic impersonation |
| **Subscription Plans** | `/platform/plans` | Tier catalog & monetization limits | Tier pricing (monthly/annual), user limits, warehouse quotas, storage GB, feature flags |
| **SaaS Payments** | `/platform/payments` | Cross-tenant billing ledger | Filter by tenant/status/method, payment recording, invoice tracking, multi-currency receipts (BDT default) |
| **Feature Flags & Modules** | `/platform/feature-flags` | Feature gating & Module catalog | Global/tenant flag rollout (0-100%), activation toggle, enterprise module discovery |
| **Announcements** | `/platform/announcements` | Cross-tenant broadcast system | Maintenance alerts, severity tiers (info/warning/critical), targeting (all/specific tenant) |
| **Support Desk** | `/platform/support` | Incident response & triage | Ticket lifecycle (open, in-progress, waiting, resolved), staff notes thread, internal vs public notes |
| **Audit Trail** | `/platform/audit-logs` | Immutable audit ledger | Filter by entity/action, JSON before/after state inspection, actor IP tracking |
| **Error Monitoring** | `/platform/errors` | Centralized exception telemetry | Ingested error deduplication by fingerprint, triage status, trace view, resolution workflow |
| **Platform Admins** | `/platform/admins` | DevCenterPoint staff RBAC | Admin provisioning, role delegation, password reset, account suspension |
| **Platform Settings** | `/platform/settings` | Universal system configuration | General branding, trial/grace period policies, lockout throttling, maintenance mode gateway with IP whitelist |

---

## 4. Security & Isolation Controls

1. **Token Segregation:**
   - Platform admin tokens carry `is_platform_user: true` and `tenant_id: null`.
   - Tenant access tokens carry a valid `tenant_id` integer and `is_platform_user: false`.
   - Any attempt by a tenant user (even an `owner`) to access `/api/v1/platform/*` results in immediate HTTP 403 Forbidden.
2. **Diagnostic Impersonation:**
   - Super admins can trigger a short-lived diagnostic session into a tenant via `/api/v1/platform/tenants/:id/impersonate`.
   - Generates a scoped token tagged with `impersonated_by_platform_user_id`.
   - Tenant UI displays an active fixed diagnostic banner with an instant exit button.
   - All actions executed under impersonation write to `platform_audit_logs`.
3. **Tenant Lifecycle Enforcement:**
   - Suspended or expired tenants are intercepted at the API gateway with HTTP 402/423.
   - Storefront routes display polite maintenance messages when the parent tenant is inactive.
