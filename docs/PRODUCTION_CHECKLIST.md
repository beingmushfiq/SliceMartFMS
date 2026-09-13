# Production Deployment & Go-Live Checklist

**Platform:** DevCenterPoint ProERP  
**Target Environment:** Websuru cPanel Shared/Reseller Hosting  
**Document Status:** Production Ready  

---

## 1. Pre-Deployment Configuration Verification

- [ ] **Target Domain DNS Configured:**
  - `proerp.devcenterpoint.com` A record points to server IP.
  - `*.devcenterpoint.com` Wildcard A/CNAME record points to server IP.
  - TTL set to 300 seconds for fast propagation.
- [ ] **cPanel Subdomains Created:**
  - `proerp.devcenterpoint.com` Document Root: `/home/CPANEL_USER/public_html`
  - `*.devcenterpoint.com` Document Root: `/home/CPANEL_USER/public_html`
- [ ] **AutoSSL Active:**
  - Valid SSL certificates issued for `devcenterpoint.com`, `proerp.devcenterpoint.com`, and `*.devcenterpoint.com`.
- [ ] **MySQL Database & User Created:**
  - Database created via cPanel MySQL Wizard with `utf8mb4` encoding.
  - Database user assigned **ALL PRIVILEGES**.
  - Strong 32+ character password generated.
- [ ] **Environment File Configured (`backend/.env`):**
  - `APP_ENV=production`
  - `APP_DEBUG=false`
  - `APP_KEY` generated via `php artisan key:generate`.
  - `JWT_SECRET` generated (64-character cryptographically secure string).
  - `DB_CONNECTION=mysql`, `DB_HOST=localhost`, `DB_PORT=3306`.
  - `QUEUE_CONNECTION=database`
  - `CACHE_STORE=database`
  - `SESSION_DRIVER=database`
  - `SESSION_SECURE_COOKIE=true`
  - `MAIL_*` credentials populated.

---

## 2. Server Deployment & File Permissions

- [ ] **Backend Files Uploaded Outside Webroot:**
  - Files placed in `/home/CPANEL_USER/backend/`.
  - Sensitive files (`.env`, `artisan`, `composer.json`, `app/`, `config/`) are NOT accessible via web URL.
- [ ] **Directory Permissions Set:**
  ```bash
  chmod -R 775 /home/CPANEL_USER/backend/storage
  chmod -R 775 /home/CPANEL_USER/backend/bootstrap/cache
  ```
- [ ] **Composer Production Dependencies Installed:**
  ```bash
  cd /home/CPANEL_USER/backend
  composer install --no-dev --optimize-autoloader
  ```

---

## 3. Database Migration & Structural Seeding

- [ ] **Run Database Migrations:**
  ```bash
  php artisan migrate --force
  ```
- [ ] **Run Structural Production Seeder (DO NOT RUN DevelopmentSeeder):**
  ```bash
  php artisan db:seed --class=ProductionSeeder --force
  ```
  *Verify that: Platform Roles, System Permissions, Business Types, Industry Profiles, and Subscription Plans are seeded without any demo tenants or fake orders.*
- [ ] **Cache Configuration & Routes:**
  ```bash
  php artisan config:cache
  php artisan route:cache
  ```

---

## 4. Cron Jobs Activation

In **cPanel → Cron Jobs**, verify that the two required crons are active:
- [ ] **Scheduler (`* * * * *`):**
  ```bash
  /usr/local/bin/php /home/CPANEL_USER/backend/artisan schedule:run >> /dev/null 2>&1
  ```
- [ ] **Queue Worker (`* * * * *`):**
  ```bash
  /usr/local/bin/php /home/CPANEL_USER/backend/artisan queue:work database --stop-when-empty --max-time=50 --memory=128 --tries=3 >> /dev/null 2>&1
  ```

---

## 5. Frontend SPA Deployment

- [ ] **Frontend Built with Production Variables:**
  - `VITE_ENABLE_MOCK=false`
  - `VITE_API_BASE_URL=/api`
  - `VITE_MASTER_DOMAIN=proerp.devcenterpoint.com`
  - `VITE_TENANT_BASE_DOMAIN=devcenterpoint.com`
  - Built with `npm run build`.
- [ ] **Build Assets Uploaded to `public_html`:**
  - `index.html` placed in `/home/CPANEL_USER/public_html/index.html`.
  - `assets/` placed in `/home/CPANEL_USER/public_html/assets/`.
  - `index.php` deployed to `/home/CPANEL_USER/public_html/index.php` pointing to `../backend`.
  - `.htaccess` configured with SPA fallback and security headers.

---

## 6. Post-Deployment Verification & Smoke Tests

- [ ] Health check endpoint responds: `curl -I https://proerp.devcenterpoint.com/up` (returns HTTP 200).
- [ ] Platform Control Plane loads: Open `https://proerp.devcenterpoint.com/platform/login`.
- [ ] Platform Super Admin authentication succeeds.
- [ ] System Health screen confirms Database and Storage are connected: `GET /api/v1/platform/system-health`.
- [ ] Tenant Provisioning wizard creates a new live tenant with subdomain.
- [ ] New tenant instance resolves at `https://{new-slug}.devcenterpoint.com/login`.
- [ ] Public storefront renders at `https://{new-slug}.devcenterpoint.com/store`.
- [ ] Cross-origin and security headers are present:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
