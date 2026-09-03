# SECURITY ARCHITECTURE — MULTI-LAYER DEFENSE SPECIFICATION

> **Status:** Canonical Security Specification  
> **Standard:** OWASP Top 10 Compliance & Zero-Trust Multi-Tenant Isolation  

---

## 1. Authentication & Token Lifecycle

- **Access Token:** Short-lived JWT (15-minute expiration) containing `sub` (User ID), `tenant_id`, and initial permission scope.
- **Refresh Token:** Cryptographically random 64-character token stored in `personal_access_tokens` / database with 30-day expiration, rotated on each refresh.
- **Revocation:** Logging out invalidates the refresh token. Password reset immediately revokes all active refresh tokens for the user account.

---

## 2. Authorization Defense (No Client-Side Trust)

1. **Frontend Role Checks Are Purely Visual:**
   - Hiding a button on the frontend is a convenience, not security.
   - Every single backend mutation and query executes through Laravel's `Authorize` middleware or Policy gate (e.g. `$this->authorize('create', SalesOrder::class)`).
2. **Strict Multi-Tenant Query Scoping:**
   - Handled automatically by Eloquent global query scopes.
   - Raw DB queries (`DB::select`) are prohibited unless explicitly appended with `WHERE tenant_id = ?`.

---

## 3. Rate Limiting & Denial-of-Service Defense

- **Public Storefront Endpoints:** 60 requests/minute per IP address.
- **Authentication Endpoints (`/api/v1/auth/login`):** 5 failed attempts per 5 minutes per IP before temporary lockout.
- **Tenant API Endpoints:** 300 requests/minute per tenant user.
- **IndexNow / Webhook Endpoints:** Cryptographic signature verification with timestamp window (±5 minutes) to defeat replay attacks.

---

## 4. Sensitive Data Protection & Audit Trails

- **Passwords:** Hashed with Argon2id or Bcrypt with minimum cost factor 12.
- **API Secrets:** Stored with AES-256-GCM encryption in `tenant_settings`.
- **Immutable Audit Logging:** All state changes on financial, stock, and access-control entities record `user_id`, `tenant_id`, `ip_address`, `user_agent`, `action`, `old_values`, and `new_values` in `audit_logs`.
