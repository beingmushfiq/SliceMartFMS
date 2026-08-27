# AUTHORITATIVE SECURITY ARCHITECTURE & THREAT MODEL

> **Status:** Canonical Security Architecture.
> **Compliance & Standards:** OWASP Top 10, Multi-Tenant Defense-in-Depth.
> **Last updated:** 2026-08-27

---

## 1. Multi-Tenant Threat Model & Defense-in-Depth

The core security principle of the platform is **hard multi-tenant data isolation**. A data leak between tenants is classified as a Severity 0 (P0) critical incident.

### 1.1 Five Layers of Tenancy Enforcement (ADR-004)

```text
Layer 1: Request Pipeline
┌─────────────────────────────────────────────────────────────┐
│ `ResolveTenant` extracts `tenant_id` from cryptographically │
│ verified JWT claims. Never trusts URL or body `tenant_id`.  │
└──────────────────────────────┬──────────────────────────────┘
                               │
Layer 2: ORM Query Scope       ▼
┌─────────────────────────────────────────────────────────────┐
│ `BelongsToTenant` trait injects global Eloquent scope:      │
│ `WHERE tenant_id = TenantContext::getTenantId()`            │
└──────────────────────────────┬──────────────────────────────┘
                               │
Layer 3: Model Mutator Guard   ▼
┌─────────────────────────────────────────────────────────────┐
│ `creating` model hook automatically stamps `tenant_id`.     │
│ `tenant_id` is excluded from `$fillable` mass-assignment.   │
└──────────────────────────────┬──────────────────────────────┘
                               │
Layer 4: Physical DB Schema    ▼
┌─────────────────────────────────────────────────────────────┐
│ Composite UNIQUE and FOREIGN KEY constraints:               │
│ `UNIQUE (tenant_id, code)` / `FOREIGN KEY (tenant_id, fk)` │
└──────────────────────────────┬──────────────────────────────┘
                               │
Layer 5: Automated Test Gates  ▼
┌─────────────────────────────────────────────────────────────┐
│ Every Feature test verifies cross-tenant access returns     │
│ `404 NOT_FOUND` (never `403` to prevent ID enumeration).    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Session Security (ADR-007)

### 2.1 Dual-Token Architecture

* **Access Token (JWT):**
  * **Lifespan:** 15 minutes.
  * **Storage:** In-memory client state (React context / memory variable). *Never* stored in `localStorage` or `sessionStorage` to eliminate persistent XSS token theft.
  * **Signing Algorithm:** Asymmetric RS256 / EdDSA (or HS256 with cryptographically random secrets).
  * **Payload:** Subject user ID, tenant ID, active company/branch IDs, and granted permission hash.
* **Refresh Token:**
  * **Lifespan:** 14 days.
  * **Storage:** Issued as an `httpOnly`, `Secure`, `SameSite=Lax` cookie. Inaccessible to JavaScript execution.
  * **Rotation:** Every call to `/api/v1/auth/refresh` consumes the current refresh token, marks it rotated, and issues a new refresh token.

### 2.2 Stolen Token Family Revocation

```text
Legitimate Client           Attacker (Stolen Token)           Server
      │                                │                        │
      ├───── /auth/refresh ───────────┼───────────────────────►│ (Token 1 Valid)
      │◄──── Issues Token 2 ──────────┼────────────────────────┤ (Token 1 Marked Rotated)
      │                                │                        │
      │                                ├───── /auth/refresh ───►│ (Presents Token 1 AGAIN!)
      │                                │                        │ 💥 BREACH DETECTED!
      │                                │◄──── REFRESH_REUSED ──┤ (Token Family Invalidated)
      │                                │                        │
      ▼                                ▼                        ▼
[Emergency Forced Logout: All sessions for this user/tenant revoked immediately]
```

---

## 3. Role-Based Access Control (RBAC) & Scope Enforcement

1. **Permission Syntax:** `<domain>.<resource>.<action>` (e.g. `inventory.stock.transfer`, `production.batch.close`, `sales.invoice.issue`).
2. **Facility Scope Check (`user_scopes`):**
   * Users can be restricted to specific branches, factories, or warehouses.
   * If a user holds global `inventory.warehouse.manage` but attempts to modify a warehouse outside their assigned `user_scopes`, the server rejects the action with `403 OUT_OF_SCOPE`.

---

## 4. Application Hardening & Vulnerability Mitigation

| Threat Vector | Mitigation Architecture |
|---|---|
| **SQL Injection (SQLi)** | 100% parameter-bound queries via Eloquent ORM. Raw SQL is strictly forbidden outside encapsulated reporting repositories. |
| **Cross-Site Scripting (XSS)** | React automatic JSX context escaping; access tokens in memory; Content-Security-Policy (CSP) headers; DOMPurify on rich text. |
| **Cross-Site Request Forgery (CSRF)** | `SameSite=Lax` refresh cookies; state-changing API requests require custom `Authorization: Bearer` and `X-Correlation-Id` headers. |
| **Rate Limiting & Brute Force** | Laravel RateLimiter on authentication endpoints (5 login attempts / min per IP) and public APIs (60 req / min). |
| **Mass Assignment** | Model `$fillable` arrays explicitly declare permissible attributes; sensitive columns (`id`, `tenant_id`, `created_at`) are excluded. |
| **Optimistic Lock Hijacking** | Concurrency conflicts guarded via `If-Match` headers and record version hashing. |

---

## 5. Audit Logging & System Observability (ADR-027)

All state-mutating actions (create, update, delete, status transition, permission assignment) generate an immutable record in `audit_logs`:

```json
{
  "tenant_id": 1,
  "user_id": 42,
  "action": "production.batch.close",
  "auditable_type": "App\\Models\\ProductionBatch",
  "auditable_id": 108,
  "old_values": {
    "status": "analysed",
    "calculated_yield": "94.5000"
  },
  "new_values": {
    "status": "closed",
    "calculated_yield": "94.5000"
  },
  "ip_address": "192.168.1.100",
  "correlation_id": "req_01j7mno456",
  "created_at": "2026-08-27T10:30:00Z"
}
```
