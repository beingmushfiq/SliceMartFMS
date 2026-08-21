# ARCHITECTURE

> **Status:** Canonical. Precedence rank 3 (see `DECISIONS.md` §0).
> Subordinate to `DECISIONS.md` and `PROJECT_CONTEXT.md`.
>
> **Last updated:** 2026-08-22 · **Phase:** 0 (Architecture & Documentation)

This document defines *how* the system is built. Module ownership is in
`MODULE_MAP.md`; tables in `DATABASE_DESIGN.md`; wire format in
`API_CONTRACT.md`; visual and interaction rules in `UI_SYSTEM.md`.

---

## 1. Architectural style

**Modular monolith, API-first, with a separate SPA client.**

```
┌──────────────────────────────────────────────────────────────────┐
│  Clients                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐    │
│  │ Back-office SPA│  │ POS (same SPA, │  │ Storefront       │    │
│  │ React 19 + TS  │  │ dedicated shell│  │ (Phase 9)        │    │
│  └───────┬────────┘  └───────┬────────┘  └────────┬─────────┘    │
└──────────┼───────────────────┼────────────────────┼──────────────┘
           │  HTTPS / JSON     │                    │
           ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  API layer (Laravel routes → middleware → controllers)            │
│  ResolveTenant · Authenticate · Authorize · Idempotency · Log      │
├──────────────────────────────────────────────────────────────────┤
│  Application layer (Actions / Services / DTOs / Events)            │
│  business rules · transaction boundaries · orchestration           │
├──────────────────────────────────────────────────────────────────┤
│  Domain layer (Eloquent models, value objects, state machines)     │
│  BelongsToTenant global scope · invariants                         │
├──────────────────────────────────────────────────────────────────┤
│  Infrastructure (MySQL · Redis · Queue · Storage · Mail · Courier) │
└──────────────────────────────────────────────────────────────────┘
```

**Why a modular monolith and not microservices:** the domain is highly
transactional and cross-cutting — a single sale touches stock, pricing, tax,
receivables and delivery in one atomic unit. Distributed transactions would be
the dominant engineering cost for no operational benefit at our scale.
Modules are separated by **boundary discipline**, not by network hops, so
extraction remains possible later.

### Layer rules (enforced in review)

| Rule | Rationale |
|---|---|
| Controllers contain no business logic — they validate, delegate, and format | Keeps rules testable and reusable from queue jobs and console commands |
| Business logic lives in Actions/Services, never in models or controllers | One place to find a rule |
| Models own invariants and relationships only | Prevents "fat model" god objects |
| A module may call another module's **public service**, never its Eloquent models directly | Enforces the seam that allows extraction |
| No raw SQL outside repository/reporting classes | Tenancy scope must not be bypassed |
| Queue jobs and console commands reuse the same Actions as HTTP | Single implementation of every rule |

---

## 2. Repository layout

Monorepo, two deployable artefacts. (ADR-003)

```
slicemart-fms/
├── docs/                       canonical documentation (this folder)
│   └── _legacy/                archived, non-authoritative
├── backend/                    Laravel 13 API
│   ├── app/
│   │   ├── Core/               tenancy, auth, RBAC, audit, errors, idempotency
│   │   ├── Modules/            one folder per module (see MODULE_MAP.md)
│   │   │   └── Production/
│   │   │       ├── Actions/
│   │   │       ├── Models/
│   │   │       ├── Http/       Controllers, Requests, Resources
│   │   │       ├── Services/
│   │   │       ├── Events/
│   │   │       ├── Listeners/
│   │   │       ├── Policies/
│   │   │       └── Enums/
│   │   └── Support/            shared helpers, no business logic
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/            platform seeds + demo tenant seeds (separate)
│   │   └── factories/
│   ├── routes/
│   │   ├── api_platform.php    platform-scope routes
│   │   ├── api_tenant.php      tenant-scope routes
│   │   └── api_public.php      storefront / webhooks
│   └── tests/                  Feature (HTTP) + Unit (rules)
└── frontend/                   React 19 SPA
    ├── src/
    │   ├── app/                bootstrap, providers, router, error boundaries
    │   ├── design-system/      tokens (@theme), primitives, layout shells
    │   ├── lib/                api client, query client, auth, i18n, utils
    │   ├── modules/            one folder per module, mirrors backend
    │   │   └── production/
    │   │       ├── api/        query/mutation hooks (TanStack Query)
    │   │       ├── components/
    │   │       ├── pages/
    │   │       ├── schemas/    Zod
    │   │       └── types/      generated from backend
    │   ├── mocks/              MSW handlers derived from API_CONTRACT.md
    │   └── locales/            en/*.json, bn/*.json
    └── tests/
```

**Module mirroring is deliberate.** `backend/app/Modules/Production` and
`frontend/src/modules/production` use the same name so a change can be traced
across the stack without searching.

---

## 3. Multi-tenancy

Shared schema, `tenant_id` column, defence in depth. (ADR-004)

### 3.1 Five enforcement layers

| # | Layer | Mechanism | Fails how |
|---|---|---|---|
| 1 | Request | `ResolveTenant` middleware resolves tenant from the authenticated token (never from a client-supplied header or body field) and binds it to the container | Unresolvable tenant → 401 |
| 2 | Query | `BelongsToTenant` trait adds a global Eloquent scope `where tenant_id = current()` | Silent: rows are invisible |
| 3 | Write | Model `creating` hook stamps `tenant_id`; it is **guarded** and never fillable from input | Mass-assignment attempt is ignored |
| 4 | Schema | Composite unique keys and foreign keys always include `tenant_id`; codes are unique *per tenant* | DB rejects cross-tenant reference |
| 5 | Test | Every module's feature suite includes a cross-tenant isolation test that must fail closed | CI blocks merge |

### 3.2 Tenant resolution

```
Request → Authenticate (JWT) → claims contain tenant_id, user_id, scopes
        → ResolveTenant: load tenant, assert status = active
        → bind TenantContext (tenant, company, branch scope set)
        → downstream code reads context; never reads a request field
```

Rules:

- **Platform-scope routes** (`api_platform.php`) run without a tenant scope and
  require a platform role. They are the only place `withoutTenantScope()` is
  permitted, and each use is logged.
- **Queue jobs** serialise the tenant id and re-establish the context on
  execution. A job without tenant context throws immediately — it never runs
  unscoped.
- **Console commands** that operate across tenants iterate tenants explicitly,
  entering the context per tenant.
- Suspended or past-due tenants get **read-only** access, not a blank screen.

### 3.3 Sub-tenant scoping

Company / branch / factory / warehouse access is a **user-level scope set**
carried in the token. Requests that target a resource outside the user's scope
return 403 with the specific missing scope named, never a 404 or an empty list.

### 3.4 Exit path (documented, not implemented)

If a tenant outgrows shared schema, the migration path is: dedicated database
connection per tenant, resolved in `ResolveTenant`. This works because no query
bypasses the scope layer and no ID is assumed globally unique across tenants.

---

## 4. Authentication & authorisation

### 4.1 Tokens (ADR-007)

| Token | Lifetime | Storage | Contents |
|---|---|---|---|
| Access | 15 min | **memory only** (never localStorage) | `sub`, `tenant_id`, `scopes`, `perm_version`, `jti` |
| Refresh | 14 days | httpOnly · Secure · SameSite=Strict cookie | opaque, server-side family record |

- Refresh tokens **rotate** on every use. The old token is revoked.
- Reuse of a revoked refresh token invalidates the **entire family** and forces
  re-login — this is the stolen-token detection mechanism.
- `perm_version` in the access token increments when a user's roles change, so
  permission changes take effect within one token lifetime without a global
  session flush.
- Logout revokes the refresh family and clears the cookie.

### 4.2 Session expiry UX

Session expiry is a **first-class UI state**, not a redirect that loses work.
On 401 the client:

1. attempts a single silent refresh;
2. if refresh fails, shows a re-authentication modal **over the current screen**;
3. preserves unsaved form state;
4. on success, replays the failed request.

Only an explicit logout or refresh-family compromise clears application state.
(ADR-024, ADR-025)

### 4.3 RBAC (ADR-008)

Permissions are three-segment strings: **`module.resource.action`**.

```
production.batch.create        inventory.adjustment.approve
sales.invoice.void             hr.payroll.lock
reports.stock_ledger.export    platform.tenant.suspend
```

- The legacy two-segment `module.action` format is rejected — it cannot express
  "may create a batch but may not approve an adjustment". (C8)
- `action` vocabulary is closed: `view`, `create`, `update`, `delete`,
  `approve`, `void`, `export`, `lock`, `assign`, `import`.
- Roles are **tenant data**. Seeded role templates (Owner, Manager, Supervisor,
  Storekeeper, Sales, Accountant, HR, Auditor) are starting points a tenant may
  edit.
- Authorisation is enforced by **Laravel Policies** on the server. The client
  uses the same permission list only to hide or disable controls — never as the
  security boundary.
- Field-level and row-level restrictions (e.g. a supervisor sees only their
  factory) are expressed as scope filters in the query layer, not by filtering
  in the client.

### 4.4 Never trusted from the client

`tenant_id`, `user_id`, prices when a price list applies, computed totals,
permission flags, `created_by`, timestamps, and any `status` that a state
machine owns.

---

## 5. Backend design

### 5.1 Request lifecycle

```
Route
 → EnsureHttps
 → CorrelationId            attach/propagate X-Correlation-Id
 → Authenticate             JWT → identity
 → ResolveTenant            bind TenantContext
 → EnsureTenantActive       active | read-only | blocked
 → Authorize (Policy)       module.resource.action
 → RateLimit                per tenant + per user
 → Idempotency              replay-safe POST (ADR-028)
 → FormRequest validation   field rules + business preconditions
 → Controller               delegate
 → Action / Service         DB::transaction { domain work; events }
 → API Resource             envelope (API_CONTRACT.md)
 → AuditLog listener        async, from domain events
```

### 5.2 Actions as the unit of business logic

One Action = one business operation with one transaction boundary.

```php
final class CloseProductionBatch
{
    public function __construct(
        private StockLedger $ledger,
        private BatchVarianceAnalyser $variance,
    ) {}

    public function execute(ProductionBatch $batch, User $actor): ProductionBatch
    {
        $this->assertContextComplete($batch);   // ADR-012 gate

        return DB::transaction(function () use ($batch, $actor) {
            $batch->analysis = $this->variance->analyse($batch);
            $batch->transitionTo(BatchState::Closed, $actor);
            $this->ledger->postBatchOutputs($batch);   // same transaction
            event(new ProductionBatchClosed($batch, $actor));
            return $batch;
        });
    }
}
```

Properties: constructor-injected dependencies, explicit actor, one transaction,
domain events emitted **inside** the transaction and handled **after** commit.

### 5.3 State machines

Documents with lifecycle (`ProductionBatch`, `PurchaseOrder`, `SalesOrder`,
`DeliveryOrder`, `QcInspection`, `PayrollPeriod`) declare allowed transitions in
code. Illegal transitions throw a domain exception mapped to HTTP 409 with the
current and attempted state named. Status is **never** a free-form client field.

The batch `context_completeness` machine (ADR-012):

```
draft ──▶ collecting ──▶ context_complete ──▶ analysed ──▶ closed
                  ▲              │
                  └──────────────┘   reopened while data is still arriving
```

Variance is computed only at `context_complete` or later. Before that the UI
shows "Awaiting data", never "Mismatch".

### 5.4 Events and asynchrony

- **Synchronous listeners:** only for work that must be atomic with the write.
- **Queued listeners:** audit persistence, notifications, courier calls,
  exports, report materialisation, webhook dispatch.
- Queue: database driver in development, **Redis in production**, with named
  queues `default`, `couriers`, `exports`, `notifications`.
- Every job is **idempotent** and declares `tries`, `backoff` and
  `retryUntil`. Failed jobs land in `failed_jobs` and raise a platform alert.
- Courier webhooks are **idempotent by provider event id** — duplicate
  deliveries are acknowledged without reprocessing. (ADR-017)

### 5.5 Reporting

Reports never join across modules ad hoc in controllers. Each report is a class
implementing `Report` with:

- a typed filter DTO (validated like any request),
- a query builder that is tenant-scoped by construction,
- pagination and a hard row cap for interactive use,
- an async export path (queued job → stored file → notification) above the cap.

Heavy dashboards read from **materialised daily summary tables** rebuilt by a
scheduled job and invalidated by domain events, never by scanning ledgers live.
See `RMS_REPORT_MATRIX.md`.

### 5.6 File storage

- Local disk in development, S3-compatible object storage in production.
- Paths are namespaced `tenants/{tenant_id}/{module}/{yyyy}/{mm}/{uuid}.{ext}`.
- Uploads are validated by MIME sniffing and size, stored with a generated name,
  and served through **signed, expiring URLs** — never a public bucket.
- An `attachments` table records tenant, module, owner document, actor and
  checksum.

### 5.7 Error handling (server side)

A single exception handler maps everything to the contract envelope:

| Exception class | HTTP | Code |
|---|---|---|
| `ValidationException` | 422 | `VALIDATION_FAILED` |
| `AuthenticationException` | 401 | `UNAUTHENTICATED` |
| `AuthorizationException` | 403 | `FORBIDDEN` |
| `ModelNotFoundException` | 404 | `NOT_FOUND` |
| `IllegalStateTransition` | 409 | `INVALID_STATE` |
| `DuplicateRequest` | 409 | `DUPLICATE` |
| `InsufficientStock` | 422 | `INSUFFICIENT_STOCK` |
| `TenantSuspended` | 402 | `TENANT_INACTIVE` |
| `ThrottleRequestsException` | 429 | `RATE_LIMITED` |
| `ProviderUnavailable` | 502 | `UPSTREAM_FAILED` |
| anything else | 500 | `INTERNAL_ERROR` |

Rules: stack traces are **never** returned in production; every response
carries the correlation id; 500 responses log the full trace server-side with
the correlation id so support can match a user report to a log entry.
(ADR-025)

---

## 6. Frontend design

### 6.1 Provider tree

Order matters — each layer depends on the one above it.

```
<RootErrorBoundary>              last resort; full-page recoverable error
  <I18nProvider>                 locale must exist before any text renders
    <ThemeProvider>              light | dark | system, applied pre-paint
      <QueryClientProvider>      TanStack Query, single client
        <AuthProvider>           token in memory, refresh orchestration
          <TenantProvider>       tenant + branding + feature flags
            <OfflineProvider>    connectivity, queued mutations
              <RouterProvider>   lazy routes, guards, layouts
                <RouteErrorBoundary>
                  <Suspense fallback={<RouteSkeleton />}>
                    <PageErrorBoundary>
                      <Page />   <WidgetErrorBoundary> per widget
                <Toaster />      Sonner, single instance
```

### 6.2 State ownership (ADR-021)

| State kind | Owner | Example | Never |
|---|---|---|---|
| Server data | **TanStack Query** | products, batches, stock, invoices | Never copied into Zustand |
| Form state | **React Hook Form** | the batch entry form | Never in a global store |
| URL state | **Router** | filters, page, sort, tab | Never duplicated in a store |
| UI state | **Zustand** | sidebar collapsed, active modal, theme, POS layout | Never holds server data |
| Session | **AuthProvider** | access token, identity, permissions | Token never in localStorage |

The current prototype store holds 16 slices of server data. That pattern is
retired: the store keeps only the 6 UI flags. Any "refresh the store after
save" logic disappears in favour of query invalidation.

### 6.3 API client

One client. No component calls `fetch` directly.

```
lib/api/client.ts
  ├── base URL from env, credentials: 'include' (refresh cookie)
  ├── attaches Authorization: Bearer <in-memory access token>
  ├── attaches X-Correlation-Id (generated per request) and Accept-Language
  ├── attaches Idempotency-Key on every POST that creates money/stock
  ├── AbortSignal on every request → cancelled on unmount / query key change
  ├── 401 → single silent refresh → replay once → else session-expiry state
  ├── parses the contract envelope into typed data | ApiError
  └── never throws a raw fetch error to a component
```

`ApiError` is a discriminated union mirroring the server error codes, so a
component can branch on `error.code === 'INSUFFICIENT_STOCK'` with type safety.

**Retries:** GET requests retry network and 5xx failures with exponential
backoff (max 3). Mutations **never** auto-retry — the user retries explicitly
via the error UI, protected by the idempotency key. (ADR-025)

**Types:** request/response types are **generated from the backend** and
committed. Hand-written duplicates are a review rejection. (ADR-029)

### 6.4 Query conventions

```
Query keys:      ['production','batches',{ filters }]   module → resource → params
staleTime:       master data 5 min · transactional lists 30 s · dashboards 60 s
Invalidation:    mutations invalidate by module+resource prefix, not globally
Optimistic:      only where rollback is safe and visible (POS line items,
                 delivery status toggle); never for stock-affecting writes
Pagination:      server-driven cursor/page from API_CONTRACT.md
Prefetch:        on row hover / nav intent for detail views
```

### 6.5 Routing (ADR-022)

- **Single route registry** — routes are data, so the sidebar, breadcrumbs,
  permission map and 404 all derive from one source.
- Every route is `React.lazy` + `Suspense`. The prototype's 57 eager imports are
  replaced.
- Guards compose: `requireAuth` → `requireTenantActive` → `requirePermission`
  → `requireScope`.
- Real terminal routes exist: `/403`, `/404` (catch-all), `/500`,
  `/offline`, `/session-expired`. A missing route renders a designed 404, not a
  redirect to the dashboard.
- Route-level `errorElement` catches loader/render failures without unmounting
  the shell.

### 6.6 Design system (ADR-020, ADR-026)

- Tokens are **Tailwind v4 CSS-first `@theme`** in
  `design-system/tokens.css`. `tailwind.config.js` is deleted.
- Three layers: **primitive** (raw scale) → **semantic** (`--color-surface`,
  `--color-text-muted`, `--color-danger`) → **component**
  (`--btn-primary-bg`).
- Components consume **semantic or component tokens only**. A raw hex or a
  primitive token inside a component is a review rejection.
- Dark mode is a **`class` on `<html>`** that remaps semantic tokens. No
  component contains a `dark:` conditional colour value.
- Tenant branding overrides a **whitelisted subset** of semantic tokens at
  runtime via CSS custom properties injected from tenant settings — it cannot
  break contrast-critical tokens.

Full specification, including the state matrix and a11y rules, is
`UI_SYSTEM.md`.

### 6.7 Error boundaries (ADR-022, ADR-025)

Four nested levels, each with a different recovery affordance:

| Level | Catches | Recovery offered |
|---|---|---|
| Root | Provider/bootstrap failure | Reload · report with correlation id |
| Route | Route module load / render failure | Retry route · go back · go home |
| Page | Page-level render failure | Retry page · navigate away |
| Widget | One card, chart or table failing | Retry that widget only; rest of page live |

The existing 390-line `ErrorBoundary.tsx` is kept and extended: it gains
correlation-id capture, a level prop, a reset key, and server-side reporting
alongside its current `slicemart_error_logs` local buffer.

### 6.8 Offline and unreliable networks

- Connectivity is observed centrally; a persistent banner states the state and
  what still works.
- **Reads:** the query cache is persisted for master data so screens open with
  stale-but-labelled data rather than a spinner.
- **Writes:** POS sales and delivery status updates queue locally with an
  idempotency key and flush on reconnect. Queue depth is visible to the user.
- Unqueueable writes are **refused clearly**, never silently dropped and never
  shown as success. (ADR-024)

### 6.9 Internationalisation (ADR-018)

- `i18next` + `react-i18next`, namespaces per module, `en` and `bn` from
  Phase 1.
- **No user-facing literal string in a component.** Enforced by lint.
- Numbers, currency, dates and relative times go through formatter helpers that
  read the tenant locale — `lib/utils.ts`'s hardcoded `'en-BD'` is removed.
- Bangla numerals and BDT formatting are locale-driven, not string surgery.
- Server messages are returned as **codes plus params**; the client owns the
  translated text. Server text is a fallback only.

### 6.10 Performance budget

| Budget | Target |
|---|---|
| Initial JS (gzipped) | ≤ 250 kB |
| Route chunk | ≤ 120 kB |
| First contentful paint (mid-range Android, 4G) | ≤ 1.8 s |
| Interaction to next paint | ≤ 200 ms |
| Table render | virtualised beyond 100 rows |

Charts, PDF/print rendering, the invoice builder and the storefront are all
separately code-split.

---

## 7. Cross-cutting concerns

### 7.1 Transactions and idempotency (ADR-028)

Eleven operations are atomic transaction boundaries:

1. Production batch close (output + ledger + variance)
2. Material issue to a batch
3. Goods receipt (GRN → stock + supplier balance)
4. Purchase bill posting
5. Sale confirmation (stock reservation + receivable)
6. POS sale completion (stock + payment + shift totals)
7. Stock transfer (out + in, or nothing)
8. Stock adjustment with reason
9. Sales/purchase return with restock
10. Payroll period lock (attendance + production incentive + payslips)
11. Delivery completion with COD collection

Every POST that creates money or stock accepts an **`Idempotency-Key`**. The
server stores key → response for 24 h and replays the stored response on
repeat, so a double-tap, a retry, or a reconnect flush can never create a
duplicate document.

### 7.2 Audit trail (ADR-027)

Append-only `audit_logs`: tenant, actor, action, auditable type/id, before/after
JSON snapshot, IP, user agent, correlation id, timestamp. Written from domain
events on a queue. Never updated, never deleted. Sensitive fields are redacted
by an explicit allow-list, not by hoping nobody logs them.

### 7.3 Observability

- **Structured JSON logs** with tenant id, user id, correlation id, module.
- Correlation id flows client → server → queue job → outbound provider call, and
  is displayed in user-facing error UI for support.
- Slow query log, failed job alerts, courier failure rate and 5xx rate are
  platform-monitored.
- No PII in logs beyond identifiers.

### 7.4 Configuration

Everything environment-specific is an env var; everything tenant-specific is a
row in tenant settings. There is no third category. A constant in code that
could differ per tenant is a bug. (ADR-002)

### 7.5 Security baseline

HTTPS only · httpOnly+Secure+SameSite cookies · CSRF protection on cookie-based
routes · per-tenant and per-user rate limits · bcrypt/argon2 password hashing ·
signed URLs for files · strict CORS allow-list · validated webhook signatures ·
no secrets in the repository · dependency audit in CI.

---

## 8. Testing strategy (ADR-030)

| Layer | Tool | Must cover |
|---|---|---|
| Backend unit | PHPUnit | business rules, state machines, calculators |
| Backend feature | PHPUnit + HTTP | every endpoint: happy path, validation, 401, 403, **cross-tenant isolation** |
| Contract | shared fixtures | response shape matches `API_CONTRACT.md`; MSW handlers stay in sync |
| Frontend unit | Vitest | hooks, formatters, Zod schemas, guards |
| Frontend component | Vitest + Testing Library | loading, empty, error and success states of each screen |
| E2E | Playwright | login, production batch chain, POS sale, purchase→stock, delivery |
| A11y | axe in CI | zero critical violations on every route |

**Non-negotiable gates:** a module cannot be marked done without a cross-tenant
isolation test, an unhappy-path test, and a rendered error/empty state test.

---

## 9. Environments and deployment

| Environment | Purpose | Data |
|---|---|---|
| Local | development | SQLite or MySQL, seeded demo tenant, MSW optional |
| Staging | acceptance | MySQL, anonymised or synthetic tenants |
| Production | live | MySQL 8.x, Redis, object storage, queue workers, scheduler |

Deployment: build frontend to static assets served by the same origin as the
API (no CORS in production); backend deployed with `migrate --force`, cache
warm, and a rolling queue-worker restart. Migrations are **additive first** —
destructive changes ship as a separate, reviewed step. Database backups are
verified by restore, not assumed.

---

## 10. What this architecture forbids

- A query that can return another tenant's row
- Business logic in a controller, a model, or a React component
- Server data in Zustand, or a second copy of server state anywhere
- A raw `fetch` outside `lib/api`
- A colour value that is not a semantic or component token
- A screen without loading, empty and error states
- A mutation that is not inside a transaction when it touches stock or money
- A user-facing string that is not translatable
- A frontend feature built against an endpoint that does not exist in
  `API_CONTRACT.md`

---

## 11. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Rewritten as the rank-3 canonical architecture, superseding `_legacy/ARCHITECTURE.md`, `_legacy/ARCHITECTURE_LOCK.md` and the architecture sections of the archived `MASTER_*` prompts. |

