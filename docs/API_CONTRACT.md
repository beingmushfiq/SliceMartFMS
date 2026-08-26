# API CONTRACT

> **Status:** Canonical. Precedence rank 4 (see `DECISIONS.md` §0).
>
> **Last updated:** 2026-08-22 · **Phase:** 0 (Architecture & Documentation)

This document defines the **wire contract** between `/backend` and every client
(`/frontend`, storefront, mobile, integrations). It is written **before**
endpoints exist, because ADR-029 fixes the order:

```
contract  →  backend  →  generated types  →  frontend
```

Any endpoint the frontend needs but this document does not define is a
**documentation task first**, never an invented call.

---

## 1. Conventions

### 1.1 Base URL and versioning

| Aspect | Rule |
|---|---|
| Base path | `/api/v1` — the version is in the **path**, never a header |
| Version bump | A new major version is added **only** for a breaking change; `v1` keeps working until formally sunset |
| Additive change | New optional fields, new endpoints and new enum values are **not** breaking and ship inside `v1` |
| Breaking change | Removing/renaming a field, tightening validation, changing a type, or changing an error code → requires `v2` |
| Deprecation | A deprecated endpoint returns `Deprecation: true` and `Sunset: <RFC 9110 date>` headers for at least one full release cycle before removal |
| Trailing slash | Not accepted. `/api/v1/products` only |

### 1.2 Resource naming

- Plural, lowercase, kebab-case nouns: `/products`, `/production-batches`,
  `/stock-movements`, `/sales-orders`.
- Nesting is **one level deep maximum**, and only when the child cannot exist
  without the parent:
  `/production-batches/{batch}/worker-entries` ✅
  `/factories/{f}/lines/{l}/batches/{b}/entries` ❌
- Everything else is expressed as a filter:
  `/production-batches?factory_id=…&line_id=…`.
- Actions that are not CRUD are **sub-resources with a verb**, POST only:
  `POST /production-batches/{batch}/close`,
  `POST /sales-invoices/{invoice}/post`,
  `POST /stock-transfers/{transfer}/receive`.
  Never `POST /products/doAction?type=…`.

### 1.3 Identifiers in URLs

**Every public identifier is the row's `uuid`.** Auto-increment `id` values are
never exposed in a URL, a payload, or an error message. (DATABASE_DESIGN §1)

```
GET /api/v1/products/9f1c2b4e-7a10-4d3f-9c58-2a7e6b0d4f11   ✅
GET /api/v1/products/4217                                    ❌
```

Foreign keys in request and response bodies are also uuids, named
`<relation>_id`:

```json
{ "warehouse_id": "3a7e…", "product_id": "9f1c…" }
```

### 1.4 HTTP methods

| Method | Use | Idempotent | Body |
|---|---|---|---|
| `GET` | read | yes | no |
| `POST` | create · non-CRUD action · search-with-large-filter | no (see §6) | yes |
| `PATCH` | partial update — **the only update verb** | no | yes, partial |
| `DELETE` | soft delete of master data · cancel of a document | yes | no |

`PUT` is **not used**. Full-replacement semantics invite accidental field wipes
in a system with 159 tables and heavy tenant configuration.

### 1.5 Content types

- Requests and responses: `application/json; charset=utf-8`.
- File upload: `multipart/form-data` (§12).
- File/report download: the real MIME type of the artefact, plus
  `Content-Disposition: attachment`.
- Dates: **ISO 8601 UTC with offset** — `2026-08-22T09:41:07+00:00`. Calendar-only
  fields use `YYYY-MM-DD`. The server never returns a locale-formatted date;
  formatting is a presentation concern (ADR-018).
- Money and quantity: **JSON string** carrying the exact decimal —
  `"1234.5000"`. Never a float, because `DECIMAL(18,4)` does not survive IEEE-754
  round-tripping. The generated TypeScript type is a branded
  `Decimal = string & { readonly __decimal: unique symbol }`.
- Booleans: real JSON `true`/`false`, never `1`/`0`.
- Absent vs null: a field omitted from a `PATCH` body means **"do not change"**;
  `null` means **"clear it"**. These are never treated as equivalent.

### 1.6 Request headers

| Header | Required | Meaning |
|---|---|---|
| `Authorization: Bearer <jwt>` | all except §8.1–§8.3 and public storefront | Access token, in-memory only (ADR-007) |
| `Accept: application/json` | yes | Non-JSON `Accept` on an API route returns `406` |
| `Accept-Language: en \| bn` | recommended | Drives translated messages (ADR-018); defaults to the user's stored locale |
| `X-Correlation-Id` | recommended | Client-generated UUID v4; echoed on every response and written to every log line (§7) |
| `Idempotency-Key` | required on money/stock POSTs | See §6 |
| `X-Tenant` | only for platform super-admin impersonation | Ignored for normal users — tenant comes from the token (§9) |
| `X-Branch-Id` | optional | Selects the active branch when the user's scope allows several (§9.3) |
| `If-Match: <version>` | required on documents guarded by optimistic locking | See §11 |

Any client-supplied `tenant_id` in a **body** is ignored and, if it disagrees
with the token, logged as a security event. (ADR-004)

### 1.7 Response headers

| Header | Always | Meaning |
|---|---|---|
| `X-Correlation-Id` | yes | Echo of the request id, or a server-generated one |
| `X-Request-Duration-Ms` | non-production | Server processing time, for performance work |
| `ETag` | on versioned single resources | Current version for `If-Match` (§11) |
| `Retry-After` | on `429` and `503` | Seconds until a retry is permitted |
| `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` | on throttled routes | See §10 |

---

## 2. The response envelope

**Every** JSON response — success or failure — uses one of the three shapes
below. There is no fourth shape. A raw array is never returned at the top level.

### 2.1 Single resource

```json
{
  "success": true,
  "data": {
    "id": "9f1c2b4e-7a10-4d3f-9c58-2a7e6b0d4f11",
    "sku": "FG-BRD-400",
    "name": "Sandwich Bread 400g",
    "product_type": "finished_good",
    "created_at": "2026-08-22T09:41:07+00:00"
  },
  "meta": { "correlation_id": "6c1e…" }
}
```

`meta` is always present and always an object. It carries `correlation_id` and,
where relevant, `warnings`, `freshness` (§15.2) or `deprecation`.

### 2.2 Collection

```json
{
  "success": true,
  "data": [ { "id": "…" }, { "id": "…" } ],
  "meta": {
    "correlation_id": "6c1e…",
    "pagination": {
      "page": 2,
      "per_page": 25,
      "total": 1043,
      "total_pages": 42,
      "has_more": true
    },
    "applied": {
      "filters": { "status": "active", "warehouse_id": "3a7e…" },
      "sort": "-created_at",
      "search": "bread"
    }
  }
}
```

`meta.applied` echoes exactly what the server understood. This is how the UI can
honestly show "3 filters applied" and how a support engineer can tell an ignored
filter from an applied one. **Unknown filter keys are rejected (§5.6), never
silently dropped.**

### 2.3 Error

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Not enough stock in Central Warehouse to issue this material.",
    "details": {
      "product_id": "9f1c…",
      "warehouse_id": "3a7e…",
      "requested": "150.0000",
      "available": "92.5000"
    },
    "fields": null,
    "retryable": false,
    "correlation_id": "6c1e…"
  }
}
```

| Field | Type | Contract |
|---|---|---|
| `code` | `string` | **Stable, machine-readable, SCREAMING_SNAKE_CASE.** Clients branch on this, never on `message`. Codes are append-only within a version |
| `message` | `string` | Human-readable, **safe**, translated per `Accept-Language`. Written for the operator on the floor, not for a developer. Never contains a stack trace, SQL, class name, file path, internal id or third-party raw payload (ADR-025) |
| `details` | `object \| null` | Structured, code-specific context the UI can render — the shape is fixed per code and documented in §3 |
| `fields` | `object \| null` | Only for `VALIDATION_FAILED`: `{ "field.path": ["message", …] }` (§4) |
| `retryable` | `boolean` | `true` means the *same request* may be retried unchanged (network, timeout, 5xx, upstream, throttle). Drives whether the UI shows **Retry** or **Fix and resubmit** |
| `correlation_id` | `string` | Shown to the user in the error UI as a **Reference** so support can find the log line |

**Forbidden:** returning `200` with `success: false`; returning an error body
without `code`; inventing a code not listed in §3 without adding it to §3 in the
same pull request.

---

## 3. Error taxonomy

Complete catalogue: **42 server codes** (§§3.1–3.7) plus **4 client-only
pseudo-codes** (§3.8). The exception→code mapping is implemented once, in the
single exception handler (`ARCHITECTURE.md` §5.7). Adding a code to the backend
without adding a row here is a review rejection.

### 3.1 Authentication and session — `401`, `402`

| Code | HTTP | `retryable` | When | Frontend state (ADR-024) |
|---|---|---|---|---|
| `UNAUTHENTICATED` | 401 | false | No token, malformed token, bad signature | Redirect to login |
| `TOKEN_EXPIRED` | 401 | true | Access token past `exp` | **Silent refresh → replay once** (§8.4) |
| `TOKEN_REVOKED` | 401 | false | `token_version` mismatch, logout-all, forced reset | Session-expiry modal, preserve unsaved form state |
| `REFRESH_REUSED` | 401 | false | A rotated refresh token was replayed — the family is revoked | Full re-login + security notice |
| `MFA_REQUIRED` | 401 | false | Credentials valid, second factor pending | MFA challenge screen |
| `ACCOUNT_LOCKED` | 401 | false | Too many failed attempts | Locked screen with unlock guidance |
| `ACCOUNT_INACTIVE` | 401 | false | User disabled by an admin | "Contact your administrator" |
| `TENANT_INACTIVE` | 402 | false | Tenant suspended / trial expired / read-only | Tenant-blocked screen; billing CTA for owners only |

### 3.2 Authorization — `403`

| Code | HTTP | `retryable` | When | Frontend state |
|---|---|---|---|---|
| `FORBIDDEN` | 403 | false | Missing `module.resource.action` (ADR-008) | 403 panel in place of content — **never a blank page** |
| `OUT_OF_SCOPE` | 403 | false | Permission held, but the target row is outside the user's `user_scopes` (branch/warehouse/factory) | "You don't have access to this branch" + scope switcher |
| `TENANT_MISMATCH` | 403 | false | Requested resource belongs to another tenant | Generic 403 to the user; **logged as a security event** with full context |
| `PLATFORM_ONLY` | 403 | false | Platform-admin surface reached by a tenant user | 403 panel |

`OUT_OF_SCOPE` is deliberately distinct from `FORBIDDEN`: the first is fixable
by switching scope, the second is not. Collapsing them produces the classic
"why can't I see my own order" support ticket.

### 3.3 Not found and gone — `404`, `410`

| Code | HTTP | `retryable` | When | Frontend state |
|---|---|---|---|---|
| `NOT_FOUND` | 404 | false | No row with that uuid **inside the tenant scope** | Not-found panel with a link back to the list |
| `ROUTE_NOT_FOUND` | 404 | false | Unknown endpoint | Developer-facing; surfaces as an internal error to users |
| `RESOURCE_GONE` | 410 | false | Soft-deleted / archived and not restorable through this endpoint | "This record was deleted on … by …" |

A row in another tenant returns `NOT_FOUND`, **not** `403` — existence is not
leaked across tenants. (ADR-004)

### 3.4 Validation and business rules — `422`

| Code | HTTP | `retryable` | `details` payload | When |
|---|---|---|---|---|
| `VALIDATION_FAILED` | 422 | false | — (uses `fields`) | Field-level rule broken (§4) |
| `BUSINESS_RULE_VIOLATED` | 422 | false | `{ rule, explanation }` | A domain invariant with no single owning field |
| `INSUFFICIENT_STOCK` | 422 | false | `{ product_id, warehouse_id, requested, available, stock_state }` | Ledger cannot satisfy the issue/sale/transfer (ADR-014) |
| `PRODUCTION_CONTEXT_INCOMPLETE` | 422 | false | `{ batch_id, context_completeness, missing: ["total_input","worker_production","material_issue"] }` | Yield/variance/cost requested before the batch reached `context_complete` (ADR-012) |
| `QC_REQUIRED` | 422 | false | `{ batch_id, output_id }` | Output cannot be sold/transferred before QC disposition |
| `CREDIT_LIMIT_EXCEEDED` | 422 | false | `{ party_id, limit, outstanding, order_total, shortfall }` | Order/invoice breaches `party_credit_limits` |
| `PRICE_STALE` | 422 | false | `{ items: [{ product_id, quoted, current }] }` | Cart/quote price changed before confirmation — requires explicit re-confirmation |
| `PERIOD_CLOSED` | 422 | false | `{ period, closed_at }` | Write into a closed payroll/finance period |
| `SEQUENCE_EXHAUSTED` | 422 | false | `{ sequence_code }` | `document_sequences` cannot allocate |
| `UNSUPPORTED_CAPABILITY` | 422 | false | `{ provider, capability }` | Courier lacks the requested capability (ADR-017) |
| `INVALID_FILE` | 422 | false | `{ reason, allowed_types, max_size_bytes }` | Upload failed MIME sniffing or size check |
| `IMPORT_FAILED` | 422 | false | `{ import_id, error_count, sample_errors: [...] }` | Bulk import validation failed (§13) |

### 3.5 Conflict and concurrency — `409`

| Code | HTTP | `retryable` | `details` payload | When |
|---|---|---|---|---|
| `INVALID_STATE` | 409 | false | `{ current_state, attempted_transition, allowed: [...] }` | Illegal state-machine transition (e.g. closing an already-closed batch) |
| `DUPLICATE` | 409 | false | `{ field, value, existing_id }` | Tenant-scoped uniqueness violated (SKU, invoice number, email) |
| `IDEMPOTENT_KEY_CONFLICT` | 409 | false | `{ key }` | Same `Idempotency-Key`, **different** request body (§6.3) |
| `VERSION_CONFLICT` | 409 | false | `{ your_version, current_version, changed_by, changed_at }` | Optimistic-lock failure — someone else saved first (§11) |
| `LOCKED` | 409 | true | `{ resource, locked_until }` | Row is inside another transaction's `FOR UPDATE` window longer than the wait budget |
| `IN_USE` | 409 | false | `{ blocking_module, blocking_count }` | Delete refused because the record is referenced |

### 3.6 Throttling, size and preconditions — `413`, `428`, `429`

| Code | HTTP | `retryable` | When |
|---|---|---|---|
| `PAYLOAD_TOO_LARGE` | 413 | false | Body or upload exceeds the route limit |
| `IDEMPOTENCY_KEY_REQUIRED` | 428 | false | A money/stock POST arrived without `Idempotency-Key` (§6.1) |
| `PRECONDITION_REQUIRED` | 428 | false | A version-guarded write arrived without `If-Match` (§11) |
| `RATE_LIMITED` | 429 | **true** | Quota exceeded — honour `Retry-After` (§10) |

### 3.7 Server and upstream — `5xx`

| Code | HTTP | `retryable` | When | Frontend state |
|---|---|---|---|---|
| `INTERNAL_ERROR` | 500 | true | Unhandled exception | Error boundary + Retry + the correlation id as **Reference** |
| `NOT_IMPLEMENTED` | 501 | false | Endpoint reserved but not built in this phase | Developer-facing |
| `UPSTREAM_FAILED` | 502 | true | Courier / SMS / payment / email gateway returned an error | "The courier service didn't respond. Your data is saved." + Retry |
| `SERVICE_UNAVAILABLE` | 503 | true | Maintenance mode, or a dependency is down | Maintenance screen with `Retry-After` countdown |
| `UPSTREAM_TIMEOUT` | 504 | true | Provider exceeded the call budget | Same as `UPSTREAM_FAILED`; local state is already committed (ADR-017) |

**The two rules that matter most for 5xx:**

1. The message tells the user **what happened to their data** — "Your data is
   saved, the courier booking is queued" is worth ten apologies.
2. A `5xx` **never** silently discards a mutation that was already committed
   locally. Remote calls are queued and retried, and the queue state is visible.

### 3.8 Client-only pseudo-codes

These never come from the server. The API client (`ARCHITECTURE.md` §6.3)
synthesises them so components branch on **one** union type.

| Code | When | Frontend state |
|---|---|---|
| `NETWORK_OFFLINE` | `navigator.onLine === false` or DNS/socket failure | Offline banner; mutations queue where the module supports it |
| `REQUEST_TIMEOUT` | Client-side timeout budget exceeded | Timeout state + Retry |
| `REQUEST_CANCELLED` | `AbortSignal` fired (unmount, key change, user cancel) | **Silent.** Never a toast, never an error boundary |
| `MALFORMED_RESPONSE` | Body failed envelope/schema parsing | Internal-error state; logged with the raw body length only, never the body |

`REQUEST_CANCELLED` being silent is a hard rule. Navigating away from a page
must never produce an error toast.

---

## 4. Validation errors

`422 VALIDATION_FAILED` is the only code that populates `fields`.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Please correct the highlighted fields.",
    "details": null,
    "fields": {
      "name": ["The product name is required."],
      "unit_price": ["Price must be greater than 0."],
      "items.0.quantity": ["Quantity must be at least 1."],
      "items.2.product_id": ["This product is not sold in the selected branch."],
      "_form": ["An invoice must contain at least one line item."]
    },
    "retryable": false,
    "correlation_id": "6c1e…"
  }
}
```

| Rule | Detail |
|---|---|
| Key format | Dot path matching the **request body**, so React Hook Form can `setError(path)` directly. Array indices are numeric: `items.0.quantity` |
| Form-level errors | Key `_form` — errors that belong to no single field |
| Value | Always an **array** of strings, even for one message |
| Language | Translated per `Accept-Language` (ADR-018) |
| Wording | Says what to do (`"Price must be greater than 0."`), not what the validator is called (`"gt validation failed"`) |
| Completeness | **All** failing fields in one response. Never one-at-a-time |
| Mapping | The frontend maps `fields` → form errors and focuses the **first** invalid control (ADR-023) |

Business preconditions that are field-shaped (e.g. "this product is not sold in
the selected branch") belong in `fields`. Those that are document-shaped
(e.g. "credit limit exceeded") get their own code from §3.4 — the UI needs a
different affordance for each.

---

## 5. Collections: pagination, filtering, sorting, search

### 5.1 Pagination

Page-based by default; every list endpoint supports it identically.

| Param | Default | Max | Notes |
|---|---|---|---|
| `page` | `1` | — | 1-indexed. Out-of-range page returns `data: []`, not `404` |
| `per_page` | `25` | `100` | `per_page` above the max is **rejected** with `VALIDATION_FAILED`, not silently clamped |

Response `meta.pagination` is defined in §2.2. `total` and `total_pages` are
omitted (`null`) when a count would be prohibitively expensive on a ledger scan;
`has_more` is then authoritative and the UI shows "Load more" instead of page
numbers.

**Cursor pagination** is used for the append-only high-volume tables
(`stock_movements`, `audit_logs`, `webhook_deliveries`, `notifications`):

```
GET /api/v1/stock-movements?limit=50&cursor=eyJpZCI6MTIzNDU2fQ
```

```json
"meta": { "cursor": { "next": "eyJpZCI6MTIzNDA2fQ", "has_more": true } }
```

An endpoint offers **one** pagination style, documented per endpoint. Cursors are
opaque, server-signed, and never constructed by a client.

### 5.2 Filtering

Filters are **explicit query parameters with a declared whitelist per endpoint**.
There is no generic query language and no `filter[raw]` escape hatch.

```
GET /api/v1/production-batches
      ?status=in_progress
      &factory_id=3a7e…
      &production_line_id=8b2c…
      &date_from=2026-08-01
      &date_to=2026-08-22
      &context_completeness=context_complete
```

| Pattern | Syntax | Example |
|---|---|---|
| Equality | `field=value` | `status=active` |
| Multi-value (IN) | `field=a,b,c` | `status=draft,collecting` |
| Range — date | `field_from` / `field_to`, inclusive | `date_from=2026-08-01&date_to=2026-08-22` |
| Range — number | `field_min` / `field_max` | `total_min=1000` |
| Null check | `field=null` / `field=!null` | `qc_result_id=null` |
| Boolean | `field=true` / `field=false` | `is_active=true` |
| Relation exists | `has_<relation>=true` | `has_attachments=true` |

Date-range params are interpreted in the **tenant's timezone** and converted
server-side. A client never has to pre-convert to UTC to get "today" right.

### 5.3 Sorting

```
GET /api/v1/products?sort=-created_at,name
```

- Comma-separated, applied left to right. `-` prefix = descending.
- Only whitelisted columns per endpoint; anything else → `VALIDATION_FAILED` on
  the `sort` field.
- Every list has a **deterministic default sort** with `id` as the final
  tiebreaker, so pagination cannot duplicate or skip rows.

### 5.4 Search

```
GET /api/v1/products?search=bread
```

One free-text param per endpoint. The searched columns are documented per
endpoint (e.g. products search `sku`, `name`, `barcode`) and are indexed.
Minimum 2 characters; shorter is rejected rather than triggering a table scan.

### 5.5 Field selection and expansion

```
GET /api/v1/sales-orders/{id}?include=items,customer,delivery
GET /api/v1/products?fields=id,sku,name          # list projection
```

- `include` accepts only whitelisted relations per endpoint. This is the **only**
  mechanism for nested data — the frontend never fires N+1 requests in a loop to
  assemble a row.
- Every `include` is eager-loaded server-side. An unsupported value →
  `VALIDATION_FAILED`.
- `fields` is available on list endpoints for pickers and typeaheads. `id` is
  always returned regardless.

### 5.6 Unknown parameters are rejected

An unrecognised query parameter returns `422 VALIDATION_FAILED` naming it.
Silently ignoring parameters is how "the filter doesn't work" bugs survive to
production. Exception: `utm_*` and the platform's own cache-busting params.

---

## 6. Idempotency

### 6.1 Where it is mandatory

Per ADR-028, `Idempotency-Key` is **required** on:

- payment recording and allocation,
- invoice posting,
- POS sale completion,
- sales/purchase order creation,
- stock movement writes (issue, receipt, adjustment, transfer, wastage),
- production batch close and output posting,
- courier booking,
- payroll finalisation,
- bulk import execution,
- inbound webhook processing (key derived from `provider_event_id`, §14.1).

Missing the header on these routes → `428 IDEMPOTENCY_KEY_REQUIRED`. The
frontend API client attaches it automatically, so this error means a bug, not
user behaviour.

### 6.2 Key format and lifetime

- Client-generated **UUID v4**, one per user intent — generated when the form is
  opened or the submit button is first pressed, **not** per HTTP attempt. Every
  retry of that intent reuses the same key.
- Scope: `(tenant_id, user_id, route, key)`.
- Retention: **24 hours**, then the key is purged and reuse is treated as new.

### 6.3 Server semantics

| Situation | Response |
|---|---|
| First use | Process normally; store status, body and a body hash against the key |
| Replay, same body hash, original finished | Return the **stored response verbatim**, with `meta.idempotent_replay: true` |
| Replay, same body hash, original still running | `409 LOCKED` with `retryable: true` and `Retry-After: 1` |
| Replay, **different** body hash | `409 IDEMPOTENT_KEY_CONFLICT` — never process |
| Original failed with `4xx` | Result is **not** cached; the corrected request may reuse the key |
| Original failed with `5xx` | Not cached; a retry re-executes inside a fresh transaction |

The stored response is written **inside** the same database transaction as the
business work. A crash between "work committed" and "key stored" would otherwise
allow a double payment.

### 6.4 Client obligations

- Mutations **never** auto-retry (`ARCHITECTURE.md` §6.3). The user retries
  explicitly; the key makes that safe.
- Double-click protection is a disabled button **and** an idempotency key. Not
  one or the other.

---

## 7. Correlation and observability

```
Client generates X-Correlation-Id (uuid v4)
  → middleware adopts it (or generates one if absent)
  → bound to the log context for the whole request
  → propagated to every queued job dispatched by that request
  → forwarded to every outbound provider call
  → echoed in the response header AND in error.correlation_id
```

| Rule | Detail |
|---|---|
| Always present | Every response, success or failure, carries it |
| User-visible on failure | Error UI shows it as **Reference**, copyable in one click |
| Log correlation | A `500` logs the full stack trace **server-side** with the id; the client gets a safe message and the id (ADR-025) |
| Job traceability | `jobs` payloads carry the id, so an export or courier booking traces back to the click that caused it |
| Audit link | `audit_logs` records the id, so an audit row joins to its request log |
| Never a secret | The id identifies a request, never a session — it is safe to display, screenshot and paste into a ticket |

---

## 8. Authentication endpoints

### 8.1 `POST /api/v1/auth/login`

```json
{ "email": "operator@tenant.com", "password": "…", "remember_device": true }
```

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi…",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": { "id": "…", "name": "…", "locale": "bn", "theme": "system" },
    "tenant": { "id": "…", "name": "…", "status": "active", "branding": { … } }
  },
  "meta": { "correlation_id": "…" }
}
```

- The **refresh token is set as an `httpOnly`, `Secure`, `SameSite=Strict`
  cookie** and never appears in the body (ADR-007).
- The access token is returned in the body and held **in memory only**.
- Permissions are **not** in the response or the token — see §8.5.
- Rate limited per email **and** per IP (§10). Failures return a single generic
  message; "wrong password" vs "no such user" is never disclosed.
- Multiple tenant memberships → `data.tenants[]` and
  `data.requires_tenant_selection: true`; the client then calls
  `POST /api/v1/auth/select-tenant`.

### 8.2 `POST /api/v1/auth/refresh`

- Body: **empty**. The refresh cookie is the credential.
- Rotates the refresh token (old one immediately invalid) and returns a new
  access token.
- Reuse of a rotated token → `401 REFRESH_REUSED`, the **entire family is
  revoked**, and a security event is logged.
- Exactly **one** in-flight refresh per client. Concurrent 401s queue behind it
  and replay after it resolves.

### 8.3 `POST /api/v1/auth/logout`

Revokes the current refresh family and clears the cookie. Always returns `200`,
even if the token was already invalid — logout must never fail.
`POST /api/v1/auth/logout-all` bumps `token_version` and kills every session.

### 8.4 The 401 protocol (binding)

```
request → 401
  ├── code = TOKEN_EXPIRED
  │     └── refresh once  ─ success → replay original request once
  │                       └─ failure → session-expiry state
  └── any other 401 code → session-expiry state immediately
```

Session-expiry state = a **modal re-authentication prompt that preserves unsaved
form state** (ADR-024). Silently discarding a half-typed production entry is a
defect, not a nuisance. Never refresh more than once per original request, and
never loop.

### 8.5 Identity and permission endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/v1/auth/me` | User, tenant, active company/branch, **flat permission array**, `user_scopes`, feature flags, locale, theme, `perm_version` |
| `GET /api/v1/auth/permissions` | The full permission catalogue — source of the generated TypeScript union (ADR-008) |
| `POST /api/v1/auth/select-tenant` | Issues a token bound to the chosen tenant |
| `POST /api/v1/auth/switch-branch` | Changes the active branch inside the user's scope |
| `PATCH /api/v1/auth/preferences` | Locale, theme, **`reduced_motion`**, density, landing page |

`perm_version` is a hash of the user's effective permissions. Every response may
carry `meta.perm_version`; when the client sees a change it refetches
`/auth/me` — so a role edit takes effect without re-login (ADR-008).

`reduced_motion` is a stored preference **in addition to** the OS
`prefers-reduced-motion` media query. Either one disables non-essential motion
(ADR-031).

### 8.6 Password and recovery

`POST /auth/forgot-password` · `POST /auth/reset-password` ·
`PATCH /auth/change-password`.

`forgot-password` **always** returns `200` with the same message whether or not
the email exists — enumeration is a vulnerability, not a convenience. A
successful reset or password change revokes every other session.

---

## 9. Tenancy and scope on the wire

### 9.1 Tenant resolution

| Client | Source of `tenant_id` |
|---|---|
| Authenticated API | **The JWT claim.** Nothing else |
| Public storefront | The storefront domain/subdomain → `storefronts.tenant_id` |
| Platform super-admin | JWT + explicit `X-Tenant` header, permitted only for `PLATFORM_ONLY` roles and **always** audited |

A `tenant_id` in a request body is never trusted (§1.6).

### 9.2 What the client never sends

Company, branch, factory, warehouse and line ids **are** legitimate request
data — but they are validated against `user_scopes` on every request.
Out-of-scope → `403 OUT_OF_SCOPE` (§3.2).

### 9.3 Active branch

`X-Branch-Id` selects the active branch when a user's scope spans several. If
omitted, the user's default branch applies. An invalid or out-of-scope value is
an error, never a silent fallback — silently writing a sale to the wrong branch
is worse than an error message.

---

## 10. Rate limiting

| Bucket | Limit | Window | Applies to |
|---|---|---|---|
| Login by email | 5 | 5 min | `POST /auth/login` |
| Login by IP | 20 | 5 min | `POST /auth/login` |
| Password reset by email | 3 | 1 hour | `POST /auth/forgot-password` |
| Authenticated general | 300 | 1 min per user | All `/api/v1/**` |
| Tenant aggregate | 3000 | 1 min per tenant | All `/api/v1/**` |
| Write operations | 60 | 1 min per user | `POST` · `PATCH` · `DELETE` |
| Report/export requests | 10 | 1 min per user | `/reports/**`, `/exports/**` |
| File upload | 30 | 1 min per user | `multipart` routes |
| Public storefront by IP | 120 | 1 min | Storefront read endpoints |
| Inbound webhooks by provider | 600 | 1 min | `/webhooks/**` |

- `429 RATE_LIMITED` with `retryable: true`, `Retry-After`, and the
  `X-RateLimit-*` headers.
- The UI shows a countdown, not a dead button.
- POS sale completion is **exempt** from the write bucket: a busy counter must
  never be throttled mid-transaction. It is protected by idempotency instead.

---

## 11. Concurrency and optimistic locking

Documents that multiple people edit simultaneously — production batches, sales
orders, invoices before posting, stock counts, payroll periods — carry a version.

```
GET  /api/v1/production-batches/{id}      → ETag: "17"   + data.version: 17
PATCH /api/v1/production-batches/{id}     If-Match: "17"
```

| Situation | Response |
|---|---|
| `If-Match` matches | Apply; version increments |
| `If-Match` stale | `409 VERSION_CONFLICT` with `{ your_version, current_version, changed_by, changed_at }` |
| `If-Match` missing on a guarded route | `428 PRECONDITION_REQUIRED` |

The UI response to `VERSION_CONFLICT` is a **conflict panel**, never a silent
overwrite and never a lost form: "Rahim updated this batch 2 minutes ago" with
*Review changes* / *Discard mine* / *Reload*.

Master data (products, customers, settings) uses last-write-wins with an audit
trail. Applying optimistic locking everywhere costs more UX friction than it
prevents.

---

## 12. Files

### 12.1 Upload

```
POST /api/v1/attachments
Content-Type: multipart/form-data

file            binary
attachable_type "production_batch" | "expense" | "employee" | …
attachable_id   uuid
purpose         "qc_photo" | "invoice_scan" | "nid_copy" | …
```

```json
{
  "success": true,
  "data": {
    "id": "…", "filename": "qc-2026-08-22.jpg", "mime_type": "image/jpeg",
    "size_bytes": 284133, "checksum": "sha256:…",
    "url": "https://…/attachments/…?expires=…&signature=…",
    "expires_at": "2026-08-22T10:41:07+00:00"
  }
}
```

| Rule | Detail |
|---|---|
| Validation | MIME **sniffed from content**, not trusted from the header or extension |
| Limits | 10 MB images · 25 MB documents · declared per `purpose`; over → `413` |
| Storage | `tenants/{tenant_id}/{module}/{yyyy}/{mm}/{uuid}.{ext}`, generated name (`ARCHITECTURE.md` §5.6) |
| Access | **Signed, expiring URLs only.** No public bucket, ever |
| Progress | Upload progress is a real percentage from the transport, never a fake animation (ADR-031) |
| Failure | Partial upload leaves **no** attachment row |

### 12.2 Download and print

- `GET /api/v1/attachments/{id}/download` → `302` to a signed URL.
- `GET /api/v1/sales-invoices/{id}/pdf` → generated PDF, `Content-Disposition:
  attachment`.
- `GET /api/v1/sales-invoices/{id}/print-preview` → the **template JSON** the
  frontend renders, so screen and paper come from one source of truth.

---

## 13. Long-running work: jobs, exports, imports

Anything that can exceed **5 seconds** is asynchronous. Nothing holds an HTTP
request open hoping it finishes.

### 13.1 The pattern

```
POST /api/v1/reports/production-summary/export    → 202 Accepted
  data: { job_id, status: "queued", poll_url, estimated_seconds }

GET  /api/v1/jobs/{job_id}                        → 200
  data: { status, progress_percent, processed, total, message, result, error }
```

`status` ∈ `queued` · `processing` · `completed` · `failed` · `cancelled`.

| Rule | Detail |
|---|---|
| Response code | `202` with a `job_id` — **never** a synchronous timeout |
| Polling | Client polls `poll_url` with backoff (1 s → 2 s → 5 s, capped), and stops on a terminal status |
| Progress | `progress_percent` is **real** — computed from `processed / total`. A fake progress bar is forbidden (ADR-031) |
| Completion | `result` carries the signed download URL and its `expires_at` |
| Failure | `error` uses the §2.3 error object. `retryable` decides whether the UI offers **Retry** |
| Cancellation | `DELETE /api/v1/jobs/{job_id}` requests cancellation; the job checks a flag at safe points |
| Notification | Completion also raises an in-app notification, so the user may navigate away (ADR-019) |

### 13.2 Imports

```
POST /api/v1/imports                 file + import_type + dry_run=true
GET  /api/v1/imports/{id}            status, counts, row-level errors
POST /api/v1/imports/{id}/commit     execute a validated dry run
```

`dry_run=true` writes **no rows** and returns per-row validation results
(DATABASE_DESIGN §13.3). The UI shows the preview and error report before the
user can commit. Committing requires an `Idempotency-Key`.

---

## 14. Webhooks

### 14.1 Inbound (courier and payment providers)

```
POST /api/v1/webhooks/couriers/{provider}
POST /api/v1/webhooks/payments/{provider}
```

| Rule | Detail |
|---|---|
| Authentication | Provider signature verified **before** parsing the body. Invalid → `401`, logged, never processed |
| Idempotency | Keyed on `provider_event_id`. A duplicate is acknowledged `200` **without reprocessing** (ADR-017) |
| Acknowledge fast | Verify → persist to `webhook_deliveries` → dispatch a job → return `200`. Business logic never runs inline |
| Out-of-order | Events carry a provider timestamp; an older event never overwrites a newer state |
| Unknown event type | Stored, acknowledged `200`, flagged `unhandled`. Never a `4xx` — providers disable endpoints that error |
| Replay | `POST /api/v1/webhook-deliveries/{id}/replay` re-runs a stored delivery for recovery |
| Envelope | Inbound webhooks are the **one** exception to §2 — the provider's shape is theirs. Responses still use the envelope |

### 14.2 Outbound (tenant integrations)

Tenants register endpoints in `webhook_endpoints`.

```json
{
  "event": "sales_order.created",
  "event_id": "5f2c…",
  "occurred_at": "2026-08-22T09:41:07+00:00",
  "tenant_id": "…",
  "data": { … },
  "meta": { "correlation_id": "…", "delivery_attempt": 1 }
}
```

- Signed `X-Slicemart-Signature: sha256=…` (HMAC of the raw body with the
  endpoint secret) plus `X-Slicemart-Event` and `X-Slicemart-Delivery`.
- Retries: 6 attempts with exponential backoff (1 m → 5 m → 30 m → 2 h → 6 h →
  24 h). Consecutive failures past the threshold disable the endpoint and notify
  the tenant admin.
- Every attempt is recorded in `webhook_deliveries` with status, response code
  and duration, and is visible in the UI. A silent integration failure is a
  defect.

---

## 15. Endpoint families

Full per-endpoint specifications are written **per phase**, in the module's own
contract section, before that module's backend work starts (ADR-029). This
section fixes the shape so no phase invents its own.

### 15.1 Standard CRUD set

For a resource `things`:

| Method | Path | Permission | Notes |
|---|---|---|---|
| `GET` | `/things` | `module.thing.view` | Paginated, filtered, sorted (§5) |
| `GET` | `/things/{id}` | `module.thing.view` | Supports `include` |
| `POST` | `/things` | `module.thing.create` | `201` + `Location` |
| `PATCH` | `/things/{id}` | `module.thing.edit` | Partial; omitted ≠ null (§1.5) |
| `DELETE` | `/things/{id}` | `module.thing.delete` | Soft delete; `409 IN_USE` if referenced |
| `GET` | `/things/options` | `module.thing.view` | Lightweight `{id,label}` list for pickers — **the only** endpoint a select box calls |
| `POST` | `/things/bulk` | per-action | `{ action, ids[], payload }`; returns per-id results, **never all-or-nothing silence** |

Documents add lifecycle sub-resources instead of a writable `status` field:
`POST /things/{id}/submit`, `/approve`, `/reject`, `/cancel`, `/post`, `/close`.
Status is never mutable through `PATCH` — that is how state machines get
bypassed.

### 15.2 Reports and dashboards

```
GET /api/v1/reports                              registry (report_definitions)
GET /api/v1/reports/{code}/schema                filters, columns, permissions
GET /api/v1/reports/{code}/data?…                paginated rows + totals
POST /api/v1/reports/{code}/export               202 → job (§13)
GET /api/v1/dashboards/{code}                    widgets the user may see
```

- The report registry is **data**, not 60 hand-written endpoints
  (DATABASE_DESIGN §13.1).
- Every aggregated response carries freshness, and the UI **must** display it:

  ```json
  "meta": { "freshness": { "as_of": "2026-08-22T06:00:00+00:00", "tier": "summary", "stale": false } }
  ```

  `tier: "live"` means computed now. A number without a timestamp is a number
  nobody can defend in a meeting.
- Widgets the user lacks permission for are **not returned and not fetched** —
  filtered server-side, never hidden with CSS.
- A response beyond the interactive row cap returns `202` with an export job
  instead of a 40-second table.

### 15.3 Reference and utility

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/health` | Liveness. No auth, no tenant, no DB write |
| `GET /api/v1/version` | Build/commit — shown in the UI footer for support |
| `GET /api/v1/settings` | Resolved settings for the current context (`user → branch → company → tenant → platform`), secrets **never** included |
| `GET /api/v1/feature-flags` | Effective flags for this tenant/user |
| `GET /api/v1/notifications` | Cursor-paginated in-app notifications |
| `GET /api/v1/audit-logs` | Cursor-paginated, filterable, permission-gated |
| `GET /api/v1/enums/{name}` | Server-owned enum values + translated labels, so no label is duplicated in the frontend |

---

### 15.4 Master-data catalogue — units · categories · brands

The first concrete instance of the §15.1 template (Phase 2, §7 item 52). These three
resources follow ADR-008's **2-action permission model**, so the generic
`create`/`edit`/`delete` names in §15.1 **do not apply**: every read requires
`catalog.<resource>.view` and every mutation — create, update, delete, restore, bulk —
requires `catalog.<resource>.manage`. All endpoints sit under the authenticated,
tenant-scoped `v1` group (`auth.jwt` + `tenant.active`), return the §2 envelope, and treat
another tenant's `id` as **404, never 403** (§17). Delete is a soft delete and returns
**409 `IN_USE`** (§3.5) when the row is still referenced; a duplicate `(tenant_id, code)`
returns **409 `DUPLICATE`** with `{ field, value, existing_id }`.

#### 15.4.1 `units`

| Endpoint | Permission | Notes |
|---|---|---|
| `GET /api/v1/units` | `catalog.unit.view` | Paginated, filtered, sorted (§5). Filters: `type`, `is_base`, `is_active`, `q` (code/name) |
| `GET /api/v1/units/{id}` | `catalog.unit.view` | Single resource |
| `GET /api/v1/units/options` | `catalog.unit.view` | Lightweight `{id,label}` list for select boxes; honours `is_active` |
| `POST /api/v1/units` | `catalog.unit.manage` | 201 + `Location`. 409 `DUPLICATE` on `(tenant_id, code)` |
| `PATCH /api/v1/units/{id}` | `catalog.unit.manage` | Partial; omitted ≠ null (§1.5). `is_active` is toggled here, not via a status verb |
| `DELETE /api/v1/units/{id}` | `catalog.unit.manage` | Soft delete; 409 `IN_USE` if referenced by products/conversions/BOM |
| `POST /api/v1/units/bulk` | `catalog.unit.manage` | `{ action, ids[], payload }`; per-id results, never all-or-nothing (§15.1) |

**Resource shape** — `id` (uuid), `code` (≤32), `name` (≤191), `type`
(`weight|volume|length|piece|time`), `is_base` (bool), `precision` (int 0–9 = decimal
places), `is_active` (bool), `created_at`, `updated_at`. **Create/patch body**: `code`,
`name`, `type`, `is_base`, `precision`, `is_active`.

#### 15.4.2 `categories`

| Endpoint | Permission | Notes |
|---|---|---|
| `GET /api/v1/categories` | `catalog.category.view` | Paginated/filtered/sorted (§5). Filters: `parent_id`, `is_active`, `q`. `?include=parent` supported |
| `GET /api/v1/categories/{id}` | `catalog.category.view` | Single resource; `include=parent,children` |
| `GET /api/v1/categories/options` | `catalog.category.view` | `{id,label}` list; `label` is the materialised `path` for disambiguation |
| `POST /api/v1/categories` | `catalog.category.manage` | 201 + `Location`. `parent_id` null = root. `path` is server-materialised, never client-set. 409 `DUPLICATE` on `(tenant_id, code)` |
| `PATCH /api/v1/categories/{id}` | `catalog.category.manage` | Partial. Re-parenting recomputes `path` for the subtree; a cycle (new parent is the node itself or one of its descendants) is rejected `422 VALIDATION_FAILED` on `parent_id` |
| `DELETE /api/v1/categories/{id}` | `catalog.category.manage` | Soft delete; 409 `IN_USE` if it has children or is referenced by products |
| `POST /api/v1/categories/bulk` | `catalog.category.manage` | `{ action, ids[], payload }`; per-id results |

**Resource shape** — `id` (uuid), `parent_id` (uuid\|null), `code` (≤32), `name` (≤191),
`path` (≤512, **read-only**), `is_active`, `created_at`, `updated_at`. **Create/patch
body**: `parent_id`, `code`, `name`, `is_active` (never `path`).

#### 15.4.3 `brands`

| Endpoint | Permission | Notes |
|---|---|---|
| `GET /api/v1/brands` | `catalog.brand.view` | Paginated/filtered/sorted (§5). Filters: `is_active`, `q` |
| `GET /api/v1/brands/{id}` | `catalog.brand.view` | Single resource |
| `GET /api/v1/brands/options` | `catalog.brand.view` | `{id,label}` list; honours `is_active` |
| `POST /api/v1/brands` | `catalog.brand.manage` | 201 + `Location`. 409 `DUPLICATE` on `(tenant_id, code)` |
| `PATCH /api/v1/brands/{id}` | `catalog.brand.manage` | Partial; omitted ≠ null |
| `DELETE /api/v1/brands/{id}` | `catalog.brand.manage` | Soft delete; 409 `IN_USE` if referenced by products |
| `POST /api/v1/brands/bulk` | `catalog.brand.manage` | `{ action, ids[], payload }`; per-id results |

**Resource shape** — `id` (uuid), `code` (≤32), `name` (≤191), `logo_path` (≤255,
nullable; a **disk path** not a URL, ADR-020), `is_active`, `created_at`, `updated_at`.
**Create/patch body**: `code`, `name`, `logo_path`, `is_active`.

#### 15.4.4 `products`

Products are the central tenant-scoped catalogue records used by production,
purchasing, sales and POS (ADR-016). Product CRUD follows ADR-032's two-action
permission model: reads require `catalog.product.view`; create, update and delete
require `catalog.product.manage`.

| Endpoint | Permission | Notes |
|---|---|---|
| `GET /api/v1/products` | `catalog.product.view` | Paginated/filtered/sorted (§5). Filters: `type`, `status`, `category_id`, `brand_id`, `is_online`, `q` (sku/name/barcode) |
| `GET /api/v1/products/{id}` | `catalog.product.view` | Single resource; `include=category,brand,units` supports shallow relations |
| `GET /api/v1/products/options` | `catalog.product.view` | Active products as `{id,label}` where label is `name (sku)` |
| `POST /api/v1/products` | `catalog.product.manage` | 201 + `Location`. `sku` is unique within a tenant, including soft-deleted rows |
| `PATCH /api/v1/products/{id}` | `catalog.product.manage` | Partial; omitted fields are unchanged and `null` clears nullable fields |
| `DELETE /api/v1/products/{id}` | `catalog.product.manage` | Soft delete; 409 `IN_USE` if variants, images, BOMs or other live references exist |

**Resource shape** — `id` (uuid), `sku`, `barcode`, `name`, `description`, `type`
(`raw_material|semi_finished|finished|packaging|consumable|service|asset_part`),
`category_id` and `brand_id` (uuid or null), `base_unit_id`, `purchase_unit_id`,
`sales_unit_id` (uuid or null), capability flags `is_produced`, `is_purchased`,
`is_sold`, `is_stock_tracked`, `has_variants`, `tracking_mode`
(`none|batch|serial|batch_and_serial`), `shelf_life_days`, `reorder_level`,
`reorder_quantity`, `standard_cost`, `default_sale_price`, `tax_profile_id`
(uuid or null), `weight`, `dimensions`, `is_online`, `online_slug`, `online_meta`,
`status` (`active|discontinued|draft`), `created_at`, `updated_at`.

Public relation identifiers are UUIDs; internal integer foreign keys are never
exposed. Decimal values are strings with four fractional places. `online_slug`
and `online_meta` are accepted for forward compatibility but are not required for
the Phase 2 catalogue workflow.

#### 15.4.5 `bill-of-materials`

Bill of materials are versioned recipes for products. They are tenant-scoped and
follow the two-action permission model: reads require `catalog.bom.view`; create,
update and lifecycle changes require `catalog.bom.manage`.

| Endpoint | Permission | Notes |
|---|---|---|
| `GET /api/v1/bill-of-materials` | `catalog.bom.view` | Paginated/filtered/sorted by product, status and effective date |
| `GET /api/v1/bill-of-materials/{id}` | `catalog.bom.view` | Includes component `items` by default; all public references are UUIDs |
| `POST /api/v1/bill-of-materials` | `catalog.bom.manage` | Creates the recipe and nested items in one transaction; 201 + `Location` |
| `PATCH /api/v1/bill-of-materials/{id}` | `catalog.bom.manage` | Partial header update; supplied `items` replaces the complete item set atomically |
| `DELETE /api/v1/bill-of-materials/{id}` | `catalog.bom.manage` | Archives the version by setting `status=archived`; historical rows remain resolvable |

**Resource shape** — `id` (uuid), `product_id`, `version`, `name`,
`output_quantity`, `output_unit_id`, `expected_yield_percentage`, `status`,
`effective_from`, `effective_to`, `items`, `created_at`, `updated_at`.
Each item contains `product_id`, `quantity`, `unit_id`,
`wastage_allowance_percentage`, `is_optional`, and `sort_order`. Decimal values
are JSON strings with four fractional places; item and relation IDs are UUIDs.
Create and update require `product_id`, `version`, `name`, `output_quantity`,
`output_unit_id`, and an `items` array; item quantities must be positive.

---

## 16. Frontend consumption rules (binding)

| # | Rule | Source |
|---|---|---|
| 1 | Exactly **one** API client. No component calls `fetch`/`axios` directly | ARCHITECTURE §6.3 |
| 2 | Request/response types are **generated** from the backend into `frontend/src/types/api/**`. Hand-written duplicates are a review rejection | ADR-029 |
| 3 | MSW handlers are derived from this contract. `mockData.ts` is deleted, not ported | ADR-029 |
| 4 | Components branch on `error.code`, never on `error.message` | §2.3 |
| 5 | Every request carries an `AbortSignal`; cancellation is silent | §3.8 |
| 6 | GETs may retry (max 3, backoff). Mutations **never** auto-retry | ADR-025 |
| 7 | Every mutating call that touches money or stock carries an `Idempotency-Key` generated per **intent**, not per attempt | §6 |
| 8 | Server data lives in TanStack Query. It is never copied into Zustand | ADR-021 |
| 9 | Every listed state in `error.code` has a designed UI state — no `catch {}`, no toast-only handling of a page-level failure | ADR-024 |
| 10 | `correlation_id` is surfaced in every error UI as a copyable **Reference** | §7 |
| 11 | `meta.freshness` is rendered wherever an aggregate is shown | §15.2 |
| 12 | A stale `perm_version` triggers a refetch of `/auth/me`, not a forced logout | §8.5 |

---

## 17. Contract testing

| Test | Guarantee |
|---|---|
| Envelope test on every endpoint | Response matches §2 exactly |
| Error-code coverage | Every code in §3 is produced by at least one test |
| Tenant isolation | Tenant A's uuid returns `404`, never `403` and never data (ADR-004) |
| Permission matrix | Every endpoint tested authorized **and** forbidden |
| Idempotency replay | Duplicate key → identical stored response; different body → `409` |
| Validation shape | `fields` keys are valid dot paths into the request body |
| Pagination stability | Deterministic ordering; no duplicate/skipped rows across pages |
| Generated types | Type generation is re-run in CI; a diff **fails the build** |
| MSW parity | Every MSW handler validates against the same schema as the real endpoint |

---

## 18. Forbidden

1. Returning `200` with `success: false`.
2. Returning a bare array or a bare object at the top level.
3. Exposing auto-increment ids, stack traces, SQL, class names, file paths or
   raw provider payloads to a client.
4. Trusting `tenant_id` from a request body.
5. Inventing an error code that is not in §3.
6. Using `error.message` for control flow.
7. Silently ignoring an unknown filter, sort or include value.
8. Holding a request open for long work instead of returning `202`.
9. A money/stock mutation without an idempotency key.
10. Auto-retrying a mutation.
11. Returning an aggregate without freshness metadata.
12. `PUT` as an update verb.
13. Hiding a widget with CSS instead of filtering it server-side.
14. A field the frontend needs being added to the code before it is added here.

---

## 19. Open questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| Q7 | Public API for tenant integrations in v1, or internal-only until v2? | stakeholder | Phase 10 |
| Q8 | GraphQL surface for the reporting layer, or REST only? Default answer: REST only | architect | Phase 8 |
| Q9 | Per-tenant rate-limit tiers tied to a subscription plan? | stakeholder | Phase 10 |

---

## 20. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Initial canonical contract. Envelope, 45-code error taxonomy, validation shape, collection contract, idempotency, correlation, auth protocol, tenancy on the wire, rate limits, optimistic locking, files, async jobs, webhooks, endpoint families, frontend consumption rules, contract tests. Supersedes all API fragments in `docs/_legacy/**`. |

