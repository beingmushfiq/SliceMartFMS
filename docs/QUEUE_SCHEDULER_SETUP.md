# cPanel Queue & Task Scheduler Architecture

**Platform:** DevCenterPoint ProERP  
**Environment:** Websuru cPanel Shared/Reseller Hosting  
**Queue Driver:** `database`  
**Cache Driver:** `database`  
**Session Driver:** `database`  

---

## 1. The Challenge of Background Workers on Shared Hosting

In typical containerized environments (AWS ECS, Docker, Kubernetes), developers use **Supervisor** or **systemd** to run `php artisan queue:work` as an infinite daemon process.

On cPanel shared/reseller hosting:
1. Long-running daemons are forbidden or killed after 60–120 seconds by CloudLinux / LVE process resource limiters.
2. Redis servers are either unavailable or require dedicated infrastructure.

---

## 2. The Native cPanel Solution

DevCenterPoint ProERP resolves this using two lightweight cron jobs that run within standard shared-hosting memory and execution time limits.

### 2.1 Queue Processing (`--stop-when-empty`)
Instead of running an infinite daemon, cPanel triggers a worker every minute that:
1. Picks up pending jobs from MySQL `jobs` table.
2. Processes them sequentially.
3. Automatically shuts down when the queue is empty, OR when it hits the 50-second safety timeout (`--max-time=50`).
4. Never overlaps dangerously with the next minute's cron execution.

---

## 3. Exact cPanel Cron Commands

Log into your **Websuru cPanel** and navigate to **Advanced → Cron Jobs**.

### Cron Job 1: Laravel Task Scheduler
- **Timing:** Every minute (`* * * * *`)
- **Command:**
  ```bash
  /usr/local/bin/php /home/CPANEL_USER/backend/artisan schedule:run >> /dev/null 2>&1
  ```
- **Tasks Handled by Scheduler:**
  - Daily inventory snapshot and reorder level alerts
  - Subscription expiry checks and overdue notices
  - Automated courier tracking status polling
  - Inactive session cleanups

---

### Cron Job 2: Asynchronous Queue Worker
- **Timing:** Every minute (`* * * * *`)
- **Command:**
  ```bash
  /usr/local/bin/php /home/CPANEL_USER/backend/artisan queue:work database --stop-when-empty --max-time=50 --memory=128 --tries=3 >> /dev/null 2>&1
  ```
- **Parameters Explained:**
  - `database`: Uses MySQL `jobs` table as storage.
  - `--stop-when-empty`: Exits immediately when no jobs remain, freeing system memory.
  - `--max-time=50`: If jobs take longer than 50 seconds, terminates gracefully before the next minute's cron triggers.
  - `--memory=128`: Enforces 128 MB RAM limit per worker invocation.
  - `--tries=3`: Retries failed jobs up to 3 times before moving to `failed_jobs`.

---

## 4. Monitoring Queues via Platform Admin

Super Administrators can inspect active queue status, pending counts, and failed jobs directly in the platform UI without needing SSH:

- **Endpoint:** `GET /api/v1/platform/jobs`
- **Controller:** `app/Modules/Platform/Controllers/PlatformJobsController.php`
- **UI Workspace:** Platform Admin → Background Jobs & Queue Telemetry

### CLI Queue Commands (SSH / Terminal):
```bash
# View failed jobs
php artisan queue:failed

# Retry all failed jobs
php artisan queue:retry all

# Purge failed jobs older than 7 days
php artisan queue:prune-failed --hours=168
```
