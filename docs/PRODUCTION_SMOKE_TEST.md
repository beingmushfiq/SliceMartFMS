# Production Smoke Test Protocol

**Platform:** DevCenterPoint ProERP  
**Environment:** Websuru cPanel Shared Hosting  
**Master Domain:** `https://proerp.devcenterpoint.com`  
**Base Domain:** `devcenterpoint.com`  

---

## 1. Automated Health & Ping Check

Execute from any terminal or automated monitor:

```bash
# 1. Health Probe
curl -I https://proerp.devcenterpoint.com/up
# Expected Response: HTTP/1.1 200 OK
```

---

## 2. Platform Admin Authentication & Telemetry

### Step 2.1: Login to Platform Control Plane
```bash
curl -X POST https://proerp.devcenterpoint.com/api/v1/platform/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@devcenterpoint.com","password":"<YOUR_SUPER_ADMIN_PASSWORD>"}'
```
**Expected Response:**
- HTTP 200 OK
- Returns JSON envelope containing `data.access_token` and `data.user` (`is_platform_user: true`).

### Step 2.2: Verify System Telemetry
```bash
curl https://proerp.devcenterpoint.com/api/v1/platform/system-health \
  -H "Authorization: Bearer <PLATFORM_TOKEN>"
```
**Expected Response:**
- HTTP 200 OK
- `status: "healthy"`
- `checks.database: true`
- `checks.storage: true`
- `checks.queue: true`

---

## 3. Tenant Provisioning Smoke Test

### Step 3.1: Provision a Test Tenant
```bash
curl -X POST https://proerp.devcenterpoint.com/api/v1/platform/tenants \
  -H "Authorization: Bearer <PLATFORM_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Live Test Manufacturing",
    "slug": "livetest",
    "plan_id": 1,
    "owner_name": "QA Tester",
    "owner_email": "tester@livetest.com",
    "password": "StrongPassword123!",
    "currency_code": "USD",
    "timezone": "UTC"
  }'
```
**Expected Response:**
- HTTP 201 Created
- Tenant record returned with `slug: "livetest"` and default operational structures (company, branch, admin user).

---

## 4. Multi-Tenant Subdomain Resolution & Login

### Step 4.1: Access Tenant Instance via Wildcard Subdomain
Open in browser:
`https://livetest.devcenterpoint.com/login`

1. Enter `tester@livetest.com` / `StrongPassword123!`.
2. Verify redirect to `/dashboard`.
3. Inspect Network tab:
   - Call to `/api/v1/auth/me` returns `tenant_id` corresponding to `livetest`.
   - Cookie `__Secure-session` or JWT Authorization header present.

### Step 4.2: Access Storefront
Open in browser:
`https://livetest.devcenterpoint.com/store`

1. Verify Storefront header, theme colors, and product catalog render without JavaScript console errors.
2. Confirm correlation ID header (`X-Correlation-Id`) present on all responses.

---

## 5. Security & Isolation Invariant Tests

### Test 5.1: Cross-Context Token Rejection
Send the tenant JWT from Step 4.1 to a platform-only endpoint:
```bash
curl https://proerp.devcenterpoint.com/api/v1/platform/tenants \
  -H "Authorization: Bearer <TENANT_TOKEN>"
```
**Expected Response:**
- HTTP 403 Forbidden (`code: "PLATFORM_ONLY"`)

### Test 5.2: Master Domain Tenancy Protection
Access:
```bash
curl -I https://proerp.devcenterpoint.com/store
```
**Expected Response:**
- Does NOT resolve as a tenant storefront; redirects to `/platform` control plane.

---

## 6. Background Queue Execution Test

1. Queue a test export from the tenant workspace (**Reports → Export CSV**).
2. Run the queue runner via cPanel Terminal:
   ```bash
   php artisan queue:work database --stop-when-empty
   ```
3. Verify that the job processes with status `PROCESSED` and the download file appears in `storage/app/tenants/{tenant_id}/reports/`.
