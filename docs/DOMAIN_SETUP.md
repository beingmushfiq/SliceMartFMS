# Domain Architecture & DNS Setup Guide

**Platform:** DevCenterPoint ProERP  
**Base Domain:** `devcenterpoint.com`  
**Master Control Plane:** `proerp.devcenterpoint.com`  
**Tenant Pattern:** `{slug}.devcenterpoint.com`  
**Custom Domains:** Verified CNAME mapping  

---

## 1. Domain Topology Overview

DevCenterPoint ProERP utilizes a three-tier routing topology:

```
[ Visitor / Client ]
        │
        ├─► proerp.devcenterpoint.com ─────────► [ Platform Master Admin Workspace ]
        │
        ├─► {tenant-slug}.devcenterpoint.com ──► [ Tenant SaaS ERP Dashboard & POS ]
        │                                         (or Storefront if accessing /store)
        │
        └─► custombrand.com (CNAME) ───────────► [ Tenant Headless Storefront Root ]
```

---

## 2. DNS Record Configuration

Configure the following DNS records in your domain registrar / DNS provider (Cloudflare, Namecheap, cPanel Zone Editor, etc.):

| Type | Host / Name | Target / Value | TTL | Purpose |
|---|---|---|---|---|
| **A** | `proerp` | `<SERVER_PUBLIC_IP>` | Auto / 300 | Master SaaS Control Plane |
| **A** or **CNAME** | `*` (Wildcard) | `<SERVER_PUBLIC_IP>` or `proerp.devcenterpoint.com` | Auto / 300 | Wildcard for all tenant subdomains |
| **A** | `@` (Root) | `<SERVER_PUBLIC_IP>` | Auto / 300 | Root domain landing page |
| **CNAME** | `www` | `devcenterpoint.com` | Auto / 300 | Canonical WWW redirect |

---

## 3. cPanel Subdomain Setup

In your Websuru cPanel management console:

1. Navigate to **Domains → Domains** (or **Subdomains** in older cPanel themes).
2. Click **Create A New Domain**.
3. **Master Domain:**
   - Domain: `proerp.devcenterpoint.com`
   - Document Root: `/home/CPANEL_USER/public_html` (Uncheck "Share document root")
4. **Wildcard Tenant Subdomain:**
   - Domain: `*.devcenterpoint.com`
   - Document Root: `/home/CPANEL_USER/public_html`
5. Ensure both domains point to the **exact same `public_html` directory** where the frontend SPA and Laravel `index.php` reside.

---

## 4. SSL / TLS Certificate Automation

1. Navigate to **cPanel → SSL/TLS Status**.
2. Locate:
   - `devcenterpoint.com`
   - `proerp.devcenterpoint.com`
   - `*.devcenterpoint.com`
3. Click **Run AutoSSL**.
4. AutoSSL will automatically issue and install domain validation certificates via Let's Encrypt or Sectigo. Wildcard certificates (`*.devcenterpoint.com`) renew automatically every 90 days.

---

## 5. Custom Domain Verification Flow

Tenants on the `PROFESSIONAL` or `ENTERPRISE` plans can connect custom domains (e.g. `store.acme-cookers.com` or `acmestore.com`) to their public storefront.

### 5.1 Verification Mechanism
1. The tenant enters their desired custom domain in the ERP (**Settings → Domain & Storefront**).
2. The platform generates a unique DNS verification record:
   - **Type:** `TXT`
   - **Host:** `_proerp-challenge.{domain}`
   - **Value:** `proerp-verification-{tenant_uuid}-{random_token}`
3. The tenant adds:
   - A `CNAME` record pointing their domain/subdomain to `proerp.devcenterpoint.com`.
   - The `TXT` record above.
4. The tenant clicks **Verify Domain**:
   - `app/Modules/Platform/Controllers/PlatformDomainController.php` triggers `dns_get_record()` to query the TXT value.
   - Upon successful verification, `tenant_domains.verification_status` is updated to `'verified'`.
5. The `TenantResolver` now accepts and routes traffic arriving with `Host: custombrand.com` directly to the tenant's storefront.
