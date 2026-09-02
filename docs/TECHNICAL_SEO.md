# Technical SEO & Discoverability Engine

## 1. Dynamic Metadata Formatting Engine
The platform uses [`SeoMetadataService.php`](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/backend/app/Modules/Ecommerce/Services/Seo/SeoMetadataService.php) to generate sanitized, high-converting metadata based on customizable templates.

### Dynamic Tokens Supported
- `{title}` or `{product_name}`: Item or page title.
- `{brand}`: Brand entity name or tenant company name.
- `{category}`: Classification name.
- `{sku}`: Factory stock keeping unit code.

### Character Length Constraints
- **Title Tag**: Optimal range **50–60 characters**. Warning issued if `< 30` or `> 65`.
- **Meta Description**: Optimal range **120–160 characters**. Warning issued if `< 70` or `> 165`.

---

## 2. Canonical URL Resolution Algorithm
1. **Custom Domain Priority**: If the tenant has a verified primary domain in `tenant_domains` (e.g. `https://slicemart.tech`), canonical URLs are generated using that custom domain.
2. **Subdomain Fallback**: If no custom domain is verified, canonical URLs default to `https://{subdomain}.{platform_domain}`.
3. **Parameter Stripping**: Tracking parameters (`utm_*`, `fbclid`, `gclid`, `session_id`, `ref`) are automatically stripped from canonical URLs to eliminate duplicate content penalties.
4. **Facet Self-Canonicalization**: Filtered catalog views (e.g. `?sort=price-asc`) point canonical reference to the clean root category path.

---

## 3. Dynamic XML Sitemaps
The platform dynamically partitions and chunks sitemaps at `StorefrontSitemapController.php`:

| Endpoint | Content | Frequency & Priority | Image Extension |
| :--- | :--- | :--- | :--- |
| `/sitemap.xml` | Master Sitemap Index | Hourly (0.9–1.0) | Indexes sub-sitemaps |
| `/sitemap-products.xml` | Active Online Products | Daily (0.8) | `<image:image>` with title & caption |
| `/sitemap-categories.xml` | Public Collections | Weekly (0.7) | Category banner images |
| `/sitemap-pages.xml` | Custom CMS & Legal Pages | Monthly (0.5) | Standard XML |

---

## 4. Robots.txt and AI Crawler Access
The `/robots.txt` endpoint dynamically serves crawler directives based on tenant SEO settings:

```txt
User-agent: *
Disallow: /checkout
Disallow: /track
Disallow: /account
Disallow: /admin
Disallow: /platform
Disallow: /settings
Disallow: /api/
Disallow: /cart

# AI Search & Answer Engine Crawlers
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://slicemart.tech/sitemap.xml
```

---

## 5. IndexNow Real-Time Discovery Protocol
The platform integrates the IndexNow protocol ([`IndexNowNotificationService.php`](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/backend/app/Modules/Ecommerce/Services/Seo/IndexNowNotificationService.php)) to submit updated or newly published URLs directly to Microsoft Bing, Yandex, Seznam, and participating AI search nodes:

- **Instant Ping**: Triggers automatically on product creation, price update, or catalog publishing.
- **Batch Submission**: Supports broadcasting up to 10,000 URLs per API payload.
- **Verification Key**: Hosted automatically at `/{indexnow_api_key}.txt`.

---

## 6. 301/302 URL Redirects & 404 Resolution Engine
1. **Middleware Interception**: [`HandleTenantRedirects.php`](file:///d:/Production%20ERP%20with%20Storefront/slicemart-fms/backend/app/Core/Http/Middleware/HandleTenantRedirects.php) matches incoming requests against `tenant_redirects` within microseconds.
2. **Loop Prevention**: Circular redirect check prevents infinite loops.
3. **Hit Counter**: Tracks total redirects executed and timestamp of last crawler hit.
4. **404 Logging & Auto-Fix**: Broken URL attempts are logged into `tenant_not_found_logs`. The tenant can convert any logged 404 into a permanent 301 redirect with a single click.
