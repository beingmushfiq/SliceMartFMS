# DATABASE ARCHITECTURE — DUAL-ENGINE RELATIONAL SPECIFICATION

> **Status:** Canonical Database Specification  
> **Engines Supported:** SQLite 3.35+ (Local Development & CI) / MySQL 8.0+ & MariaDB 10.6+ (Production Staging & Multi-Tenant Live)  
> **Schema Scale:** 173 Relational Tables across 25 Migration Waves  

---

## 1. Multi-Tenancy Partitioning Strategy

SliceMart implements a **Shared-Database, Shared-Schema with Discriminator Column (`tenant_id`)** pattern.

### 1.1 Integrity Rules:
1. **Tenant ID Mandatory:** Every business table contains an unsigned big integer `tenant_id` referencing `tenants(id)` with `onDelete('cascade')` or restricted.
2. **UUID Immutability:** Every business table contains a unique `uuid` column (`CHAR(36)`) generated upon creation. External API references (URLs, barcodes, tracking tokens) expose only UUIDs or friendly codes, never auto-incrementing sequential primary keys.
3. **Compound Foreign Keys & Uniqueness:**
   - Sequential numbers are unique *per tenant*, not globally:
     ```sql
     UNIQUE KEY `uq_tenant_invoice_num` (`tenant_id`, `invoice_number`)
     UNIQUE KEY `uq_tenant_product_sku` (`tenant_id`, `sku`)
     UNIQUE KEY `uq_tenant_party_phone` (`tenant_id`, `phone`)
     ```
4. **Automated Query Scoping:**
   - Every Eloquent model inherits a trait or applies a global scope ensuring `WHERE tenant_id = TenantContext::current()->tenantId()` is automatically bound to every `SELECT`, `UPDATE`, and `DELETE`.

---

## 2. Dual-Engine Portability (SQLite & MySQL)

To maintain seamless developer experience on local machines with SQLite while guaranteeing enterprise performance in production on MySQL:

1. **No Engine-Specific Dialects:**
   - Do not use MySQL-specific `MATCH(...) AGAINST(...)` full-text search directly without a driver fallback to `LIKE %query%`.
   - Do not use MySQL-specific stored procedures, triggers, or non-standard spatial geometry datatypes.
2. **JSON Column Handlers:**
   - JSON fields (`json` in migrations) must be cast to `array` in Eloquent models.
   - Use Laravel's `whereJsonContains` abstraction rather than raw MySQL JSON operators `->>` or `JSON_EXTRACT`.
3. **Strict Type Alignment:**
   - Financial amounts are strictly `decimal(15, 4)` to eliminate floating-point rounding inaccuracies.
   - Quantities are strictly `decimal(12, 4)` to support fractional measurements (e.g., 2.375 kg of yeast).

---

## 3. High-Volume Ledger Immutability

Two central ledgers in the platform are strictly **append-only**:
1. **Stock Movement Ledger (`stock_ledger_entries` / `stock_movements`):**
   - Stock is never directly overwritten. Every arrival, sale, batch consumption, scrap, or return appends a movement line.
   - Current stock in a warehouse location is the sum of ledger lines.
2. **General Ledger Lines (`journal_entry_lines`):**
   - Financial journal entries once posted can never be updated or deleted.
   - Reversals require an offsetting adjusting journal entry with audit reference.

---

## 4. Indexing & Query Performance

Critical compound indexes for large-volume reporting:
- `stock_movements`: `INDEX idx_sm_tenant_product_created (tenant_id, product_id, created_at)`
- `journal_entry_lines`: `INDEX idx_jel_tenant_account_date (tenant_id, chart_of_account_id, entry_date)`
- `sales_orders`: `INDEX idx_so_tenant_status_date (tenant_id, status, order_date)`
- `sales_order_items`: `INDEX idx_soi_tenant_order_product (tenant_id, sales_order_id, product_id)`
- `production_batches`: `INDEX idx_pb_tenant_plan_status (tenant_id, production_plan_id, status)`
