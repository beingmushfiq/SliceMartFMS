# TENANCY STRATEGY

> **Status:** Canonical. Precedence rank 3 (see `DECISIONS.md` §0).
> **Last updated:** 2026-08-28 · **Phase:** Multi-Tenant SaaS Foundation

This document details the tenancy strategy and technical isolation model of the DevCenterPoint platform.

---

## 1. Selected Strategy: Shared Database with `tenant_id` Discriminator

The platform uses a **Single Database, Shared Schema with Logical Tenant Isolation (`tenant_id`)** as selected in ADR-004.

### Trade-Off Analysis

| Metric | Separate DB per Tenant | Shared Schema + Discriminator (Selected) |
|---|---|---|
| **Resource Efficiency** | Low (hundreds of connection pools) | **Very High** (single connection pool, minimal memory footprint) |
| **Schema Migrations** | Complex (run 100+ migrations in parallel) | **Simple & Instant** (`php artisan migrate` once) |
| **Cost at Scale** | Expensive (DB provisioning costs) | **Extremely Cost-Effective** (handles 1,000+ tenants easily) |
| **Cross-Tenant Platform Analytics** | Hard (federated queries) | **Direct & Fast** (aggregated reporting for Master Admin) |
| **Data Isolation** | Physical | **Logical + Database Constraints** (enforced by middleware, ORM scopes & composite foreign keys) |

---

## 2. Row-Level Tenant Scoping Mechanics

### 1. Request Lifecycle Binding
Every request executes:
1. `AuthenticateJwt` extracts JWT claims.
2. `ResolveTenant` verifies `tenant_id` from token claims and calls `TenantContext::bind($tenant, $scopes)`.
3. If no tenant context is bound for a tenant route, execution halts immediately with a 401 unauthenticated response.

### 2. Model Layer Scoping (`BelongsToTenant`)
All tenant-owned models apply global tenant scoping:
```php
static::addGlobalScope('tenant', static function (Builder $builder): void {
    if (TenantContext::isBound()) {
        $builder->where($builder->getModel()->getTable().'.tenant_id', TenantContext::current()->tenantId());
    }
});
```

### 3. Model Creation Hook
```php
static::creating(static function (Model $model): void {
    if (TenantContext::isBound() && empty($model->tenant_id)) {
        $model->tenant_id = TenantContext::current()->tenantId();
    }
});
```

---

## 3. Database Constraints & Uniqueness

Composite uniqueness guarantees prevent cross-tenant collisions while allowing per-tenant natural keys:

- `products`: `UNIQUE (tenant_id, sku)`
- `categories`: `UNIQUE (tenant_id, code)`
- `warehouses`: `UNIQUE (tenant_id, code)`
- `document_sequences`: `UNIQUE (tenant_id, document_type, year)`
- `chart_of_accounts`: `UNIQUE (tenant_id, code)`

---

## 4. Tenant Provisioning Transaction Contract

When Master Admin provisions a tenant, the following operations occur in a single atomic database transaction:

```
1. Insert `tenants` record (UUID, slug, name, currency, timezone, status='active'|'trial')
2. Insert `tenant_subscriptions` record (link to plan_id, set trial_ends_at / renewal_date)
3. Insert `tenant_usage_counters` record (initialize user, storage, and transaction counts)
4. Insert `users` record (Tenant Owner admin account, hash password)
5. Assign default `Tenant Admin` role to owner
6. Seed default `document_sequences` (INV-, SO-, PO-, BATCH-, QC-, GRN-)
7. Seed default `chart_of_accounts` standard templates
8. Seed default `reason_codes` for adjustments, wastage, and rework
9. Log immutable event to `audit_logs`
```

If any step fails, the entire transaction rolls back cleanly.
