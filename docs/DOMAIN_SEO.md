# Domain SEO, Subdomain Routing & Canonical Strategy

## 1. Domain Architecture
The platform supports two tiers of storefront routing:

1. **Platform Subdomains**: `https://{subdomain}.slicemart.com` (e.g. `https://demo.slicemart.com`)
2. **Custom Verified Domains**: `https://{custom_domain}` (e.g. `https://slicemart.tech`)

---

## 2. Canonical URL Resolution Hierarchy
When generating canonical URLs in `<link rel="canonical">`, Schema.org graphs, and XML sitemaps:

```
                  ┌─────────────────────────────────────┐
                  │ Does tenant have a verified primary │
                  │     custom domain in DB?            │
                  └──────────────────┬──────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
                 [ YES ]                            [ NO ]
         ┌────────────────────────┐       ┌────────────────────────┐
         │ Use Custom Domain Root │       │ Use Platform Subdomain │
         │  https://customdomain  │       │  https://tenant.sub    │
         └────────────────────────┘       └────────────────────────┘
```

---

## 3. Apex vs. WWW Normalization
- The edge gateway normalizes all traffic to the primary domain without `www` (e.g. `slicemart.tech`).
- Any incoming `http://` or `www.` traffic is redirected via 301 Permanent Redirect to `https://{primary_domain}` before reaching the application layer.

---

## 4. Cross-Domain Migration Protocol
When a tenant transitions from a platform subdomain to their own custom domain:
1. The custom domain is verified via DNS TXT record in `tenant_domains`.
2. The platform automatically flips the canonical reference to the custom domain.
3. Subdomain traffic is automatically routed via 301 redirect to the identical path on the custom domain, preserving 100% of accumulated domain authority and search engine indexing equity.
