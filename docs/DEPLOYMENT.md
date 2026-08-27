# AUTHORITATIVE DEPLOYMENT ARCHITECTURE & INFRASTRUCTURE GUIDE

> **Status:** Canonical Deployment & Operations Guide.
> **Target Environment:** Linux (Ubuntu 24.04 LTS / Debian 12) + Docker / Containerized.
> **Infrastructure Stack:** Nginx + PHP 8.5 FPM + MySQL 8.0 + Redis 7.x + Node 22 Build.
> **Last updated:** 2026-08-27

---

## 1. Production Infrastructure Topology

```text
                                Internet (HTTPS)
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │ Cloudflare / Edge CDN (WAF)   │
                       │ SSL Termination & Rate Limits │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │ Nginx Reverse Proxy / Ingress │
                       │ Port 80/443                   │
                       └───────┬───────────────┬───────┘
                               │               │
            /api/*, /up        │               │ Static SPA (/*)
                               ▼               ▼
┌─────────────────────────────────────────┐ ┌─────────────────────────────┐
│ PHP 8.5-FPM (Laravel Backend Pool)      │ │ Nginx Static File Server    │
│ OpCache, JIT enabled                    │ │ Brotli / Gzip Compressed    │
│ Handles APIs, Auth, Business Actions    │ │ React 19 SPA (dist/)        │
└────────────────────┬────────────────────┘ └─────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
┌─────────────┐ ┌─────────┐ ┌─────────────────────────────────────────────┐
│ MySQL 8.x   │ │ Redis 7 │ │ Background Queue Workers                    │
│ Primary DB  │ │ Cache & │ │ `php artisan queue:work --queue=default,    │
│ InnoDB      │ │ Session │ │  exports,couriers,notifications`           │
└─────────────┘ └─────────┘ └─────────────────────────────────────────────┘
```

---

## 2. Server Requirements & Prerequisites

* **Operating System:** Ubuntu 24.04 LTS (x86_64 or ARM64).
* **PHP Runtime:** PHP 8.5+ with extensions: `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `filter`, `hash`, `intl`, `json`, `mbstring`, `openssl`, `pcre`, `pdo_mysql`, `redis`, `session`, `tokenizer`, `xml`, `zlib`.
* **Database:** MySQL 8.0.30+ (configured with `character-set-server = utf8mb4`, `collation-server = utf8mb4_unicode_ci`, `innodb_buffer_pool_size` set to 70% of dedicated RAM).
* **Cache & Message Broker:** Redis 7.0+ (configured with `maxmemory-policy allkeys-lru`).
* **Web Server:** Nginx 1.24+ or Caddy 2.7+.

---

## 3. Environment Configuration (`.env.production`)

### Backend Environment Variables (`backend/.env`)
```ini
APP_NAME="SliceMart FMS"
APP_ENV=production
APP_KEY=base64:... # Generate via php artisan key:generate
APP_DEBUG=false
APP_URL=https://api.slicemart.com

LOG_CHANNEL=daily
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=slicemart_production
DB_USERNAME=slicemart_app
DB_PASSWORD=SecureProductionPassword123!

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=SecureRedisPassword123!

JWT_SECRET=CryptographicallySecureRandomSecretKeyForJwtSigningAtLeast64CharsLong
JWT_TTL=900 # 15 minutes (in seconds)
REFRESH_TOKEN_TTL=1209600 # 14 days (in seconds)

CORS_ALLOWED_ORIGINS=https://app.slicemart.com,https://pos.slicemart.com
```

### Frontend Build Environment Variables (`frontend/.env.production`)
```ini
VITE_API_BASE_URL=https://api.slicemart.com/api
VITE_APP_TITLE="SliceMart FMS"
VITE_ENABLE_MOCK=false
```

---

## 4. Production Deployment Sequence

```bash
#!/usr/bin/env bash
set -e

echo "=== 1. Pull Latest Release ==="
git checkout main
git pull origin main

echo "=== 2. Build Frontend Artifacts ==="
npm ci
npm run build --workspace frontend
npm run budget --workspace frontend

echo "=== 3. Backend Deployment ==="
cd backend
composer install --no-dev --optimize-autoloader --no-progress
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

echo "=== 4. Restart Background Workers & Services ==="
php artisan queue:restart
sudo systemctl restart php8.5-fpm
sudo systemctl reload nginx

echo "=== 5. Health Check Verification ==="
curl -f https://api.slicemart.com/up || exit 1

echo "Deployment Successful!"
```

---

## 5. Nginx Production Configuration

```nginx
# Frontend SPA Ingress
server {
    listen 443 ssl http2;
    server_name app.slicemart.com;

    root /var/www/slicemart-fms/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API Ingress
server {
    listen 443 ssl http2;
    server_name api.slicemart.com;

    root /var/www/slicemart-fms/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.5-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}
```
