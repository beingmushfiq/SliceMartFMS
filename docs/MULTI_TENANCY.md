# MULTI-TENANCY ARCHITECTURE — 5-LAYER TENANT ISOLATION

> **Status:** Canonical Tenancy Specification  
> **Model:** Shared-Database, Shared-Schema, Partitioned by `tenant_id`  
> **Mandate:** Absolute cross-tenant isolation. Zero data contamination. Slice Mart is Tenant #1, not the only tenant.  

---

## 1. The 5 Layers of Tenant Isolation

Data isolation is guaranteed through five consecutive defensive rings:

```
[Ring 1: Ingress Layer] ──▶ Domain / Subdomain / Header Resolution
          │
[Ring 2: Middleware Layer] ──▶ TenantContext Initialization & Status Verification
          │
[Ring 3: Query Layer] ──▶ Global Eloquent Query Scopes & Builder Hooks
          │
[Ring 4: Storage Layer] ──▶ Tenant-Partitioned File Storage Paths (`/tenants/{id}/...`)
          │
[Ring 5: Audit & Telemetry] ──▶ Every log entry tagged with tenant_id
```

### Layer 1: Ingress Resolution
Tenant identification is resolved via:
1. **Custom Domain:** Look up active verified host in `tenant_domains` (e.g. `shop.slicemart.com`).
2. **Platform Subdomain:** Look up subdomain prefix from host (e.g. `slicemart.devcenterpoint.com`).
3. **HTTP Header (Internal / POS):** `X-Tenant-ID` or `X-Tenant-UUID` for trusted API clients.
4. **JWT Claim:** Encoded `tenant_id` within verified Bearer tokens.

### Layer 2: Middleware Pipeline
- `ResolveTenant`: Resolves tenant model and binds it into `TenantContext::setCurrent($tenant)`.
- `EnsureTenantActive`: Rejects disabled, suspended, or archived tenants.

### Layer 3: Query & Database Isolation
- Every tenant model applies `App\Core\Tenancy\Traits\BelongsToTenant`.
- Automatically appends `WHERE tenant_id = ?` to all query builder instances.
- Automatically injects `tenant_id` on model creation.
- **Rule for Public Storefront:**
  Even guest or public queries (e.g., Party lookup by phone) MUST explicitly filter by `$storefront->tenant_id`.

### Layer 4: Media & File Storage
- Uploaded assets (product images, logos, documents, exports) are stored in tenant-isolated directories:
  ```
  storage/app/tenants/{tenant_uuid}/media/
  storage/app/tenants/{tenant_uuid}/documents/
  ```
- Public URLs use signed tokens or tenant CDN prefixes to prevent unauthorized enumeration.

### Layer 5: Automated Isolation Testing
- Every module feature test suite contains an explicit cross-tenant test case asserting that User of Tenant A receives a `404 Not Found` when requesting Tenant B's entity UUID.
