# Multi-Tenant Provisioning & Lifecycle Guide

**Platform:** DevCenterPoint ProERP  
**Architecture:** Shared Database Multi-Tenancy  
**Service Layer:** `App\Modules\Platform\Services\TenantProvisioningService`  

---

## 1. Overview & Provisioning Flow

In DevCenterPoint ProERP, provisioning a tenant creates a complete, operational manufacturing and ERP ecosystem within a single atomic database transaction.

```
[ Super Administrator / Provisioning Request ]
                       │
                       ▼
         [ Input & Subdomain Validation ]
        - RFC-1123 DNS label regex validation
        - Reserved subdomain check (config/platform.php)
        - Unique slug verification
                       │
                       ▼
             [ Database Transaction ]
     ┌─────────────────┴─────────────────┐
     ▼                                   ▼
[ Core Entities ]               [ Operational Entities ]
- Tenant (slug, plan, status)   - Company (Legal Entity)
- Tenant Subscription           - Headquarters Branch
- Tenant Administrator User     - Primary Factory & Production Lines
- Initial Capability Set        - Main Raw Material & FG Warehouse
     │                                   │
     └─────────────────┬─────────────────┘
                       ▼
       [ Industry Blueprint & Modules ]
      - Enabled modules based on Plan
      - Production stage templates & QC
      - Document numbering sequences
                       │
                       ▼
              [ Tenant Ready ]
    Accessible at: https://{slug}.devcenterpoint.com
```

---

## 2. API Contract for Provisioning

**Endpoint:** `POST /api/v1/platform/tenants`  
**Authorization:** Platform Bearer Token (`is_platform_user: true`)  
**Middleware:** `auth.jwt`, `platform.admin`  

### Request Payload:
```json
{
  "name": "Apex Electronics Ltd.",
  "slug": "apexelectronics",
  "plan_id": 2,
  "is_trial": true,
  "trial_days": 14,
  "owner_name": "Rahim Chowdhury",
  "owner_email": "admin@apexelectronics.com",
  "password": "SecurePassword123!",
  "currency_code": "BDT",
  "timezone": "Asia/Dhaka",
  "date_format": "Y-m-d",
  "number_format": "2,.,,",
  "settings": {
    "allow_offline_pos": true,
    "enforce_qc_on_output": true,
    "enable_worker_piece_rate": true
  }
}
```

### Response (HTTP 201 Created):
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": 2,
      "uuid": "7f8b9a12-...",
      "name": "Apex Electronics Ltd.",
      "slug": "apexelectronics",
      "status": "trial",
      "trial_ends_at": "2026-09-27T12:00:00.000000Z"
    },
    "owner": {
      "id": 25,
      "name": "Rahim Chowdhury",
      "email": "admin@apexelectronics.com"
    }
  }
}
```

---

## 3. Subdomain & Reserved Names Guard

Subdomains are strictly validated by `TenantResolver::isValidSubdomain()` and cannot match platform reserved names:
- **Valid Format:** Lowercase alphanumeric characters and hyphens, 1–63 characters (`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`). No leading or trailing hyphens.
- **Reserved Subdomains:** `admin`, `api`, `app`, `auth`, `billing`, `cdn`, `control`, `cpanel`, `dashboard`, `dev`, `docs`, `ftp`, `mail`, `master`, `platform`, `proerp`, `root`, `sentry`, `smtp`, `staging`, `static`, `status`, `support`, `system`, `test`, `webmail`, `whm`, `www`.

---

## 4. Tenant Lifecycle Management

| Status | Behavior |
|---|---|
| `trial` | Full access enabled until `trial_ends_at`. Automated warning notices sent at 3 days and 1 day remaining. |
| `active` | Normal operational status under an active subscription. |
| `suspended` | `EnsureTenantActive` middleware returns HTTP 402 `TENANT_INACTIVE`. Login and API access blocked. Storefront returns HTTP 403 `TENANT_SUSPENDED`. |
| `archived` | Soft-deleted. Tenant data preserved for audit compliance. Subdomain retained to prevent squatting. |

Super Administrators can manage tenant status directly in the Platform Admin dashboard:
`POST /api/v1/platform/tenants/{id}/status` with `status: "suspended" | "active" | "archived"`.
