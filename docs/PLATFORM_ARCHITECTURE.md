# PLATFORM ARCHITECTURE — MASTER SAAS PLATFORM

> **Platform Owner:** DevCenterPoint  
> **Classification:** Application 1 — Master SaaS Platform (Super Admin Control Plane)  
> **Status:** Canonical Architecture Specification  
> **Scope:** Multi-Tenant Control Plane, Global Governance, Ingress & Tenant Lifecycle  

---

## 1. System Mission & Identity

The **Master SaaS Platform** is the supreme administrative and operational control plane of the entire SaaS ecosystem, owned and operated exclusively by **DevCenterPoint**. 

It governs the provisioning, lifecycle, configuration, telemetry, and monetization of all tenant instances (such as Tenant #1: Slice Mart, Tenant #2: Artisan Bakery, Tenant #3: Apex Electronics, etc.). 

### Critical Isolation Boundary:
```
┌───────────────────────────────────────────────────────────────────┐
│              MASTER SAAS PLATFORM (DevCenterPoint)                │
│   Super Admin Control Plane (/platform/*)                         │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ Directs & Enforces
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│              TENANT MANAGEMENT APPLICATIONS                       │
│   Tenant Operational Portals (tenant.devcenterpoint.com)          │
└───────────────────────────────────────────────────────────────────┘
```
The Master SaaS Platform must **never** become the tenant's operational software. It does not contain factory batches, warehouse pick lists, sales orders, or POS registers. It governs the organizations that own those resources.

---

## 2. Core Responsibilities

The Master SaaS Platform controls:
1. **Tenant Lifecycle Management:** Self-service registration, manual onboarding, trial activation, suspension, reactivation, and soft/hard offboarding.
2. **Tenant Provisioning Pipeline:** Automated creation of database records, initial admin credentials, default settings, default charts of accounts, default warehouse/storefront records, and vanity subdomains.
3. **Subscription & Plan Engine:** Tier definition (Free, Starter, Professional, Enterprise), plan limits (storage, users, factories, branches, API calls), billing intervals (monthly/annual), and feature flags.
4. **Platform-Level User Administration:** Super Admin, Support Engineer, Billing Auditor, and Security Officer role definitions with MFA enforcement.
5. **Module Registry & Dynamic Feature Flags:** Global registry of all available modules (`production`, `inventory`, `qc`, `purchasing`, `sales`, `pos`, `delivery`, `hr`, `finance`, `reports`, `ecommerce`, `assets`, `documents`) with tenant-specific toggles.
6. **Domain & SSL Ingress Management:** Platform subdomain provisioning (`*.devcenterpoint.com`), custom domain mapping, DNS verification (CNAME/TXT), automated Let's Encrypt SSL termination, and reverse proxy routing.
7. **System & Security Telemetry:** Error tracking, slow query alerting, rate limit breaches, API usage tracking, and platform-wide audit log monitoring.
8. **Platform Support & Global Maintenance:** Tenant impersonation with audit trails, global broadcast announcements, and scheduled maintenance windows.

---

## 3. Architecture & Tech Stack

- **Frontend Ingress:** React 19 / Vite SPA hosted under the `/platform/*` path, protected by `PlatformProtectedRoute`.
- **Backend API:** Laravel 13.26 REST API under `routes/api_platform.php`, prefixed by `/api/v1/platform/*`, guarded by `auth.platform` and `platform.super_admin` middlewares.
- **Database Scope:** Platform tables (`platform_users`, `tenants`, `platform_plans`, `platform_subscriptions`, `tenant_domains`, `platform_audit_logs`, `platform_error_logs`) reside in the primary shared database, completely distinct from tenant-partitioned business tables.

---

## 4. Tenant Provisioning Workflow

When a new tenant is created (via `/platform/tenants/new` or self-serve API):

```
1. Input Validation (Company, Owner Email, Subdomain, Plan)
               │
               ▼
2. Platform DB Transaction:
   ├── Create `tenants` record (UUID, slug, status='active')
   ├── Create `tenant_subscriptions` record (plan_id, limits)
   ├── Create `tenant_domains` record (subdomain.devcenterpoint.com, is_primary=true)
   └── Create default `users` record (Tenant Owner, role='owner', permissions=['*'])
               │
               ▼
3. Business Seed Automation (TenantContext scoped to new tenant_id):
   ├── Initialize `settings` from master 16-domain dictionary
   ├── Seed default Chart of Accounts (`chart_of_accounts`)
   ├── Seed default Stocking Units (pcs, kg, m, ltr, box)
   ├── Seed default Central Warehouse & Main Factory Branch
   ├── Initialize Document Numbering Sequences (INV-, PO-, PB-, DC-)
   └── Provision Default E-Commerce Storefront (`storefronts` + default pages)
               │
               ▼
4. Dispatch Welcome Email & Provisioning Audit Log Entry
```

---

## 5. Security & Isolation Controls

1. **Strict Middleware Isolation:**
   - Platform routes are completely uncoupled from tenant routes. A tenant user token (even an `owner`) cannot access `/api/v1/platform/*`.
   - Only users with `is_platform_admin = true` in `platform_users` can authenticate to the Master Platform.
2. **Audited Impersonation Engine:**
   - Super Admins can generate a short-lived (15-minute) tenant impersonation token via `PlatformImpersonationController`.
   - Impersonated sessions display a prominent red fixed banner in the Tenant UI: *"Impersonation Active by Admin [Name] — All actions logged"*.
   - All mutations during impersonation record both `tenant_id` and `impersonated_by_platform_user_id`.
3. **Tenant Suspension Enforcement:**
   - If a tenant's subscription expires or is suspended for non-payment, `EnsureTenantActive` middleware halts all API requests from tenant users with HTTP `402 Payment Required` or `423 Locked`, while the Storefront displays a polite tenant maintenance landing page.
