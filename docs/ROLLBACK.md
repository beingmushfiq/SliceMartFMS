# Production Rollback & Disaster Recovery Protocol

**Platform:** DevCenterPoint ProERP  
**Environment:** Websuru cPanel Shared/Reseller Hosting  
**Target RTO (Recovery Time Objective):** < 15 Minutes  
**Target RPO (Recovery Point Objective):** < 1 Hour  

---

## 1. Rollback Scenarios & Decision Matrix

| Scenario | Severity | Action |
|---|---|---|
| **Frontend UI Regression / Broken Route** | Medium | Swap `public_html/assets/` and `index.html` with previous stable build |
| **Backend API Fatal Error / Syntax Defect** | High | Revert `backend/` files to previous release tag; clear config cache |
| **Database Migration Failure** | Critical | Run `php artisan migrate:rollback` or restore MySQL database dump via cPanel |
| **Data Corruption / Security Incident** | Catastrophic | Put site into maintenance mode; restore full cPanel backup |

---

## 2. Immediate Triage & Maintenance Mode

If an unrecoverable failure occurs during a production deployment, immediately place the platform in maintenance mode:

```bash
cd /home/CPANEL_USER/backend

# Activate maintenance mode with custom message
php artisan down --secret="proerp-emergency-bypass-key" --render="errors::503"
```
*Note: Administrators can still access the application via `https://proerp.devcenterpoint.com/{secret}`.*

---

## 3. Step-by-Step Rollback Procedures

### 3.1 Frontend SPA Rollback (Duration: ~2 Minutes)
If a bug is confined to the frontend bundle:
1. Revert to the previous build directory on your build machine or backup folder:
   ```bash
   # On server:
   cp -r /home/CPANEL_USER/backups/frontend_previous/* /home/CPANEL_USER/public_html/
   ```
2. Verify that `index.html` points to the previous JS/CSS chunk hashes.
3. Purge Cloudflare / CDN cache if enabled.

---

### 3.2 Backend Code Rollback (Duration: ~5 Minutes)
If a backend deployment introduces regressions:
1. Restore previous release files into `/home/CPANEL_USER/backend/`:
   ```bash
   cd /home/CPANEL_USER/backend
   git checkout tags/<PREVIOUS_STABLE_TAG>
   # OR restore archive:
   # tar -xzf /home/CPANEL_USER/backups/backend_stable.tar.gz -C /home/CPANEL_USER/backend/
   ```
2. Re-install composer dependencies if packages changed:
   ```bash
   composer install --no-dev --optimize-autoloader
   ```
3. Clear all cached configurations:
   ```bash
   php artisan optimize:clear
   php artisan config:cache
   php artisan route:cache
   ```

---

### 3.3 Database Rollback (Duration: ~5–10 Minutes)

#### Option A: Rollback Recent Migration Batch
If the issue stems from the latest migration:
```bash
cd /home/CPANEL_USER/backend
php artisan migrate:rollback --step=1 --force
```

#### Option B: Restore Database via cPanel Backup Wizard
If migration caused schema/data damage:
1. Log into **Websuru cPanel**.
2. Navigate to **Backup Wizard → Restore → MySQL Databases**.
3. Choose the backup `.sql.gz` dump captured immediately prior to deployment.
4. Click **Upload**.
5. Once complete, run:
   ```bash
   php artisan optimize:clear
   ```

---

## 4. Post-Rollback Validation

1. Verify health endpoint: `curl -I https://proerp.devcenterpoint.com/up` (HTTP 200).
2. Deactivate maintenance mode:
   ```bash
   php artisan up
   ```
3. Verify Master Control Plane login at `https://proerp.devcenterpoint.com/platform/login`.
4. Run smoke test suite:
   ```bash
   php artisan test --filter=ProductionHardeningTest
   ```
