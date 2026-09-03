# API ARCHITECTURE — ENTERPRISE CONTRACT & ENVELOPE

> **Status:** Canonical API Specification  
> **API Version:** v1 (`/api/v1/*`)  
> **Standard:** RESTful JSON with Strict Response Envelope & Deterministic Error Codes  

---

## 1. Uniform Response Envelopes

Every API endpoint across all 3 applications returns a deterministic JSON envelope:

### 1.1 Success Single Resource:
```json
{
  "success": true,
  "data": {
    "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "order_number": "SO-2026-0012",
    "status": "approved",
    "total_amount": "4500.0000"
  },
  "message": "Sales order approved successfully."
}
```

### 1.2 Success Paginated Collection:
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Standard Finished Loaf", "sku": "BREAD-001" }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 25,
    "total_records": 142,
    "total_pages": 6
  },
  "links": {
    "first": "/api/v1/products?page=1",
    "last": "/api/v1/products?page=6",
    "prev": null,
    "next": "/api/v1/products?page=2"
  }
}
```

### 1.3 Error Response:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Available stock (12.0000) is insufficient for required quantity (25.0000).",
    "details": {
      "product_id": 48,
      "warehouse_id": 2,
      "available": "12.0000",
      "requested": "25.0000"
    }
  }
}
```

---

## 2. Standard Error Code Registry (42 Codes)

| Error Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Missing, expired, or invalid JWT token. |
| `UNAUTHORIZED` | 403 | Authenticated user lacks required permission. |
| `TENANT_INACTIVE` | 402 / 423 | Tenant subscription is suspended or expired. |
| `TENANT_NOT_FOUND` | 404 | Domain or header tenant resolution failed. |
| `RECORD_NOT_FOUND` | 404 | Requested entity UUID not found in tenant partition. |
| `VALIDATION_FAILED` | 422 | Input parameters failed form request rules. |
| `IDEMPOTENCY_CONFLICT` | 409 | Duplicate request submitted with same Idempotency-Key. |
| `INSUFFICIENT_STOCK` | 422 | Warehouse stock balance is below requested movement. |
| `BATCH_LOCKED` | 422 | Production batch is already completed or closed. |
| `PERIOD_CLOSED` | 422 | Financial accounting period is locked for edits. |
| `CREDIT_LIMIT_EXCEEDED`| 422 | Customer balance exceeds approved credit threshold. |
| `THREE_WAY_MATCH_FAILED`| 422| Bill values deviate from PO/GRN beyond tolerance. |

---

## 3. Idempotency & Concurrency Controls

For financial and inventory mutations (e.g. `POST /api/v1/pos/checkout`, `POST /api/v1/sales/orders/{id}/approve`):
- Clients send `Idempotency-Key: <UUIDv4>`.
- The server records the key in cache/table for 24 hours.
- Duplicate submissions within the window return the cached response immediately without re-executing transactions.

---

## 4. Webhook Ingress Security

Incoming courier (Steadfast, Pathao, REDX) and payment gateway webhooks:
- Must verify HMAC-SHA256 signature in `X-Signature` or `Authorization` header.
- Must execute within an idempotent handler (`event_id` uniqueness check).
- Immediate `200 OK` acknowledgment with asynchronous background queue job processing.
