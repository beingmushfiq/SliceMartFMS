# AUTHORITATIVE API SPECIFICATION & CONTRACT REFERENCE

> **Status:** Canonical Wire Format & API Reference.
> **Protocol:** HTTPS / JSON over REST.
> **Root Prefixes:**
> * Tenant Scope: `/api/v1/...`
> * Public / Auth: `/api/v1/auth/...`, `/api/v1/public/...`
> * Platform Scope: `/api/platform/v1/...`
> **Last updated:** 2026-08-27

---

## 1. Global Wire Format & Envelopes

### 1.1 Standard Response Envelopes (API_CONTRACT §2)

* **Single Entity Envelope (HTTP 200 / 201):**
  ```json
  {
    "data": {
      "uuid": "019534a2-7b81-7f91-8abc-98124501bca2",
      "code": "PRD-001",
      "name": "Sliced White Bread (Large)",
      "type": "finished_good",
      "status": "active",
      "created_at": "2026-08-27T10:00:00Z"
    }
  }
  ```

* **Paginated List Envelope (HTTP 200):**
  ```json
  {
    "data": [
      {
        "uuid": "019534a2-7b81-7f91-8abc-98124501bca2",
        "code": "PRD-001",
        "name": "Sliced White Bread (Large)"
      }
    ],
    "meta": {
      "current_page": 1,
      "from": 1,
      "last_page": 4,
      "per_page": 25,
      "to": 25,
      "total": 98
    },
    "links": {
      "first": "/api/v1/products?page=1",
      "last": "/api/v1/products?page=4",
      "prev": null,
      "next": "/api/v1/products?page=2"
    }
  }
  ```

* **Standard Error Envelope (HTTP 4xx / 5xx):**
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Please correct the highlighted fields.",
      "correlation_id": "req_01j7xyz890",
      "details": null,
      "fields": {
        "code": ["The code has already been taken."]
      }
    }
  }
  ```

### 1.2 Mandatory Request & Response Headers

| Header | Scope / Direction | Format | Description |
|---|---|---|---|
| `X-Correlation-Id` | Bidirectional | `string` (UUID v7 or client ID) | Request tracing token echoed by the server. |
| `Authorization` | Client → Server | `Bearer <JWT>` | Short-lived 15-min JWT access token. |
| `Accept` | Client → Server | `application/json` | Enforces JSON response representation. |
| `Accept-Language` | Client → Server | `en` or `bn` | Directs backend localization messages. |
| `Idempotency-Key` | Client → Server | `string` (UUID) | Required on sensitive mutating POST/PATCH actions. |
| `If-Match` | Client → Server | `"<version_hash>"` | Optimistic concurrency control lock. |

---

## 2. Error Codes Matrix

| HTTP Status | Error Code | Description / Client Action |
|---|---|---|
| **401** | `UNAUTHENTICATED` | Missing or malformed Authorization header. Redirect to login. |
| **401** | `TOKEN_EXPIRED` | JWT has expired. Client triggers single-flight `/auth/refresh` using httpOnly cookie. |
| **401** | `TOKEN_INVALID` | Signature verification or issuer check failed. Clear session. |
| **401** | `REFRESH_EXPIRED` | 14-day refresh token expired. Full re-login required. |
| **401** | `REFRESH_REUSED` | Stolen refresh token detected; token family revoked. Emergency logout. |
| **402** | `TENANT_INACTIVE` | Tenant account is past due or suspended. Display read-only billing banner. |
| **403** | `FORBIDDEN` | Authenticated user lacks required permission. Display access denied. |
| **403** | `OUT_OF_SCOPE` | User has permission but lacks access to the specific facility/branch. |
| **403** | `TENANT_MISMATCH` | Request attempted to access an entity belonging to another tenant. |
| **404** | `NOT_FOUND` | Resource not found within the active tenant scope. |
| **409** | `DUPLICATE` | Unique constraint violated (e.g. code already exists for tenant). |
| **409** | `IN_USE` | Deletion rejected because foreign rows reference this entity. |
| **409** | `STALE_STATE` | `If-Match` version mismatch; concurrent edit conflict. Prompt user to merge. |
| **422** | `VALIDATION_FAILED` | Input payload validation error. Populates form field errors. |
| **429** | `RATE_LIMITED` | Rate limit threshold exceeded. Retry after backoff. |
| **500** | `INTERNAL_ERROR` | Unhandled server exception. Display safe error with `correlation_id`. |

---

## 3. Core API Endpoints

### 3.1 Authentication & Session (`routes/api_public.php` & `routes/api_tenant.php`)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | None | Authenticate email/password. Returns JWT + sets refresh cookie. |
| `POST` | `/api/v1/auth/refresh` | Public (Cookie) | None | Rotates refresh token and issues fresh 15-min JWT. |
| `POST` | `/api/v1/auth/logout` | Public (Cookie) | None | Invalidates current refresh token & clears cookie. |
| `POST` | `/api/v1/auth/logout-all` | Bearer JWT | None | Invalidates all active sessions for current user. |
| `GET` | `/api/v1/auth/me` | Bearer JWT | None | Fetches active user profile, tenant info, and scopes. |
| `GET` | `/api/v1/auth/permissions`| Bearer JWT | None | Returns compiled list of granted permission strings. |
| `POST` | `/api/v1/auth/switch-branch` | Bearer JWT | None | Switches active branch context for the session. |
| `PATCH`| `/api/v1/auth/preferences` | Bearer JWT | None | Updates user language, theme, and UI density. |
| `PATCH`| `/api/v1/auth/change-password` | Bearer JWT | None | Updates user password with current password check. |
| `POST` | `/api/v1/auth/forgot-password` | Public | None | Sends password reset email link. |
| `POST` | `/api/v1/auth/reset-password` | Public | None | Resets password using valid token. |

---

### 3.2 Catalogue & Master Data (`routes/api_tenant.php`)

#### Units & Conversions
* `GET /api/v1/units` (Permission: `catalog.unit.view`): List units with pagination & filters.
* `GET /api/v1/units/options` (Permission: `catalog.unit.view`): Lightweight unit dropdown options list.
* `POST /api/v1/units` (Permission: `catalog.unit.manage`): Create a new measurement unit.
* `GET /api/v1/units/{unit:uuid}` (Permission: `catalog.unit.view`): Show unit details and conversions.
* `PATCH /api/v1/units/{unit:uuid}` (Permission: `catalog.unit.manage`): Update unit properties.
* `DELETE /api/v1/units/{unit:uuid}` (Permission: `catalog.unit.manage`): Soft delete unit (guarded against in-use references).

#### Categories & Brands
* `GET /api/v1/categories`, `GET /api/v1/categories/options` (Permission: `catalog.category.view`)
* `POST /api/v1/categories`, `PATCH /api/v1/categories/{category:uuid}`, `DELETE /api/v1/categories/{category:uuid}` (Permission: `catalog.category.manage`)
* `GET /api/v1/brands`, `GET /api/v1/brands/options` (Permission: `catalog.brand.view`)
* `POST /api/v1/brands`, `PATCH /api/v1/brands/{brand:uuid}`, `DELETE /api/v1/brands/{brand:uuid}` (Permission: `catalog.brand.manage`)

#### Products & Variants
* `GET /api/v1/products` (Permission: `catalog.product.view`): Paginated product catalog. Filter by category, brand, type, status.
* `GET /api/v1/products/options` (Permission: `catalog.product.view`): Lightweight SKU / product picker.
* `POST /api/v1/products` (Permission: `catalog.product.manage`): Create product with embedded variants.
* `GET /api/v1/products/{product:uuid}` (Permission: `catalog.product.view`): Show product, variants, and active BOM references.
* `PATCH /api/v1/products/{product:uuid}` (Permission: `catalog.product.manage`): Update product metadata & attributes.
* `DELETE /api/v1/products/{product:uuid}` (Permission: `catalog.product.manage`): Soft delete product (guarded if referenced in BOMs or stock).

#### Bill of Materials (BOM)
* `GET /api/v1/bill-of-materials` (Permission: `catalog.bom.view`): List active recipes.
* `POST /api/v1/bill-of-materials` (Permission: `catalog.bom.manage`): Create a versioned recipe with items.
* `GET /api/v1/bill-of-materials/{bom:uuid}` (Permission: `catalog.bom.view`): View full recipe ingredients and costs.
* `PATCH /api/v1/bill-of-materials/{bom:uuid}` (Permission: `catalog.bom.manage`): Update or create new BOM version.
* `DELETE /api/v1/bill-of-materials/{bom:uuid}` (Permission: `catalog.bom.manage`): Archive recipe version.

#### Warehouses & Locations
* `GET /api/v1/warehouses`, `GET /api/v1/warehouses/options` (Permission: `inventory.warehouse.view`)
* `POST /api/v1/warehouses`, `PATCH /api/v1/warehouses/{warehouse:uuid}`, `DELETE /api/v1/warehouses/{warehouse:uuid}` (Permission: `inventory.warehouse.manage`)
* `GET /api/v1/warehouses/{warehouse:uuid}/locations` (Permission: `inventory.warehouse.view`)
* `POST /api/v1/warehouses/{warehouse:uuid}/locations` (Permission: `inventory.warehouse.manage`)
* `PATCH /api/v1/warehouses/{warehouse:uuid}/locations/{location:uuid}` (Permission: `inventory.warehouse.manage`)
* `DELETE /api/v1/warehouses/{warehouse:uuid}/locations/{location:uuid}` (Permission: `inventory.warehouse.manage`)

#### Pricing & Tax Profiles
* `GET /api/v1/pricing/tax-profiles`, `POST`, `PATCH`, `DELETE` (Permission: `pricing.tax-profile.*`)
* `GET /api/v1/pricing/price-lists`, `POST`, `PATCH`, `DELETE` (Permission: `pricing.price-list.*`)
* `GET /api/v1/pricing/discount-rules`, `POST`, `PATCH`, `DELETE` (Permission: `pricing.discount-rule.*`)

---

## 4. Example Request & Response Payloads

### Create Product (`POST /api/v1/products`)

* **Request Headers:**
  ```http
  POST /api/v1/products HTTP/1.1
  Host: api.slicemart.com
  Authorization: Bearer eyJhbGciOi...
  Content-Type: application/json
  Idempotency-Key: b79e924a-67bc-4993-9c88-12d45a901e12
  ```

* **Request Body:**
  ```json
  {
    "code": "PRD-BREAD-01",
    "name": "Milk Bread 400g",
    "type": "finished_good",
    "category_id": 4,
    "brand_id": 1,
    "base_unit_id": 2,
    "tax_profile_id": 1,
    "min_stock_level": "100.0000",
    "max_stock_level": "5000.0000",
    "variants": [
      {
        "sku": "SKU-MB400-STD",
        "name": "Standard Slice",
        "barcode": "8941234567890",
        "attributes": {
          "weight": "400g",
          "slice_count": 16
        }
      }
    ]
  }
  ```

* **Response Body (HTTP 201 Created):**
  ```json
  {
    "data": {
      "uuid": "019534af-1120-7f52-8fa1-01a23c4b5e67",
      "code": "PRD-BREAD-01",
      "name": "Milk Bread 400g",
      "type": "finished_good",
      "category": {
        "uuid": "019534af-1121-7f52-8fa1-01a23c4b5e68",
        "name": "Bakery"
      },
      "brand": {
        "uuid": "019534af-1122-7f52-8fa1-01a23c4b5e69",
        "name": "Slice Mart"
      },
      "base_unit": {
        "uuid": "019534af-1123-7f52-8fa1-01a23c4b5e70",
        "symbol": "pcs"
      },
      "min_stock_level": "100.0000",
      "max_stock_level": "5000.0000",
      "variants": [
        {
          "uuid": "019534af-1124-7f52-8fa1-01a23c4b5e71",
          "sku": "SKU-MB400-STD",
          "name": "Standard Slice",
          "barcode": "8941234567890"
        }
      ],
      "created_at": "2026-08-27T10:15:00Z"
    }
  }
  ```
