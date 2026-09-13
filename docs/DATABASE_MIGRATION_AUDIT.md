# MySQL Migration & Schema Audit Report

**Date:** September 2026  
**Platform:** DevCenterPoint ProERP  
**Database Engine Target:** MySQL 8.0+ / MariaDB 10.5+ (Websuru cPanel)  
**Status:** PASSED / CERTIFIED  

---

## 1. Executive Summary

A comprehensive audit of all migration files in `backend/database/migrations` and database configuration in `backend/config/database.php` was executed to verify 100% compatibility with MySQL 8.0+ on Websuru cPanel shared hosting.

All 120+ database tables were inspected for:
- Data type compatibility
- JSON column constraints
- Compound index key byte lengths
- Foreign key cascade / deletion constraints
- MySQL PHP extension and PDO version compatibility

---

## 2. Key Findings & Corrections

### 2.1 PHP Driver Compatibility (`Pdo\Mysql`)
- **Issue:** `backend/config/database.php` initially imported `use Pdo\Mysql;` and referenced `Mysql::ATTR_SSL_CA`. The `Pdo\Mysql` namespace was introduced in PHP 8.5. On environments running PHP 8.2 or PHP 8.3 (common on cPanel), this caused fatal `Class "Pdo\Mysql" not found` errors.
- **Resolution:** Replaced with `PDO::MYSQL_ATTR_SSL_CA`, which is universally supported across PHP 8.1, 8.2, 8.3, 8.4, and 8.5+. Set `'engine' => 'InnoDB'` explicitly on `mysql` and `mariadb` connections.

### 2.2 JSON Column Defaults
- **Finding:** MySQL 5.7 and 8.0 strict mode forbid raw string defaults on JSON columns (e.g. `->default('[]')`).
- **Audit Result:** All migrations consistently declare JSON columns as nullable (`$table->json('column')->nullable();`) with default data initialization handled at the Eloquent Model `$attributes` or `$casts` layer.

### 2.3 Character Set, Collation & Index Lengths
- **Target Configuration:**
  - `DB_CHARSET=utf8mb4`
  - `DB_COLLATION=utf8mb4_unicode_ci`
- **Prefix Indexes:** `'prefix_indexes' => true` is active.
- **Index Byte Bounds:** In InnoDB with `DYNAMIC` or `COMPACT` row format, the maximum key length is 3,072 bytes. All composite unique indexes pairing `tenant_id` (bigint, 8 bytes) with string codes (e.g. `varchar(64)`) consume at most ~264 bytes, well within the 3,072 byte limit.

### 2.4 Financial Precision
- **Audit Result:** All monetary and financial balance columns use `decimal(18, 4)`. Floating point `float` or `double` is strictly absent from accounting/pricing fields, satisfying GAAP/IFRS standards and ADR-028.

### 2.5 Multi-Tenant Foreign Key Cascading
- Tables implement `tenant_id` as `unsignedBigInteger` constrained to `tenants(id)` with `cascadeOnDelete()`.
- Route-level and application-level `TenantScope` filters all queries by `tenant_id = ?` to prevent cross-tenant data leakage.

---

## 3. Migration Execution Commands on Production

```bash
# Verify database connection
php artisan db:show

# Run all migrations in batch
php artisan migrate --force

# Seed production structural records
php artisan db:seed --class=ProductionSeeder --force
```
