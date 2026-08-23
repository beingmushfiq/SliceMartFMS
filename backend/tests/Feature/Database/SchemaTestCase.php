<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Shared ground for the per-wave schema contract tests (DATABASE_DESIGN §16).
 *
 * The waves build on each other: Wave 2 needs a tenant before it can insert a
 * company, and Wave 3 will need a company before it can scope a user. Holding
 * the fixtures here means a later wave inserts its parents exactly the way the
 * wave that owns them proved they must be inserted, instead of re-deriving the
 * required columns from the migration and drifting away from it.
 *
 * Every claim in these tests is proved by making the database accept or reject
 * a statement. Reading index metadata would pass for a unique index that can
 * never fire, which is precisely the defect Wave 1 found in §13.3.
 */
abstract class SchemaTestCase extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{id: int, uuid: string}
     */
    protected function insertPlan(string $code = 'starter'): array
    {
        $uuid = (string) Str::uuid();

        return [
            'id' => DB::table('plans')->insertGetId($this->planAttributes(['code' => $code, 'uuid' => $uuid])),
            'uuid' => $uuid,
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function planAttributes(array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'code' => 'starter',
            'name' => 'Starter',
            'price' => '0.0000',
            'billing_period' => 'monthly',
            'limits' => json_encode(['users' => 5, 'warehouses' => 1]),
        ];
    }

    protected function insertTenant(int $planId, string $slug = 'slice-mart'): int
    {
        return DB::table('tenants')->insertGetId($this->tenantAttributes($planId, $slug));
    }

    /**
     * @return array<string, mixed>
     */
    protected function tenantAttributes(int $planId, string $slug = 'slice-mart'): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'name' => 'Tenant '.$slug,
            'slug' => $slug,
            'plan_id' => $planId,
            'status' => 'active',
            'timezone' => 'Asia/Dhaka',
            'currency_code' => 'BDT',
            'date_format' => 'd/m/Y',
            'number_format' => '1,234.56',
        ];
    }

    /**
     * A tenant with a plan behind it, for tests that only need somewhere to
     * hang tenant-scoped rows.
     */
    protected function insertTenantWithPlan(string $slug = 'slice-mart'): int
    {
        return $this->insertTenant($this->insertPlan($slug.'-plan')['id'], $slug);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertCompany(int $tenantId, array $overrides = []): int
    {
        return DB::table('companies')->insertGetId($this->companyAttributes($tenantId, $overrides));
    }

    /**
     * `default_key` is a stored generated column and is never written here —
     * the database derives it from `is_default` (see the migration).
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function companyAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Primary Company',
            'is_default' => false,
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertBranch(int $tenantId, int $companyId, array $overrides = []): int
    {
        return DB::table('branches')->insertGetId($this->branchAttributes($tenantId, $companyId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function branchAttributes(int $tenantId, int $companyId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'code' => 'BR-01',
            'name' => 'Head Office',
            'type' => 'mixed',
            'is_default' => false,
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertFactory(int $tenantId, int $companyId, array $overrides = []): int
    {
        return DB::table('factories')->insertGetId($this->factoryAttributes($tenantId, $companyId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function factoryAttributes(int $tenantId, int $companyId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'branch_id' => null,
            'code' => 'F-01',
            'name' => 'Main Factory',
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertProductionLine(int $tenantId, int $factoryId, array $overrides = []): int
    {
        return DB::table('production_lines')
            ->insertGetId($this->productionLineAttributes($tenantId, $factoryId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function productionLineAttributes(int $tenantId, int $factoryId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'factory_id' => $factoryId,
            'code' => 'L1',
            'name' => 'Line 1',
        ];
    }

    /**
     * A user. `tenant_id => null` makes a platform user (DATABASE_DESIGN §3).
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertUser(?int $tenantId, array $overrides = []): int
    {
        return DB::table('users')->insertGetId($this->userAttributes($tenantId, $overrides));
    }

    /**
     * `tenant_key` and `is_platform_user` are generated columns and are never
     * written here — the database derives both from `tenant_id`.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function userAttributes(?int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Test User',
            'email' => 'user@example.com',
            'password' => 'not-a-real-hash',
            'status' => 'active',
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertRole(?int $tenantId, array $overrides = []): int
    {
        return DB::table('roles')->insertGetId($this->roleAttributes($tenantId, $overrides));
    }

    /**
     * `tenant_id => null` makes a platform role template, not a platform actor.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function roleAttributes(?int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Operator',
            'slug' => 'operator',
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPermission(string $name = 'production.batch.approve', array $overrides = []): int
    {
        return DB::table('permissions')->insertGetId($this->permissionAttributes($name, $overrides));
    }

    /**
     * Splits the three-segment name into its columns (ADR-008) so a fixture
     * cannot create a row whose `name` and parts disagree.
     *
     * A malformed name fails the test rather than being padded with defaults:
     * substituting `view` for a missing action would produce exactly the
     * disagreement this method exists to prevent, and would do it silently.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function permissionAttributes(string $name, array $overrides = []): array
    {
        $parts = explode('.', $name);

        if (count($parts) !== 3) {
            self::fail("`{$name}` is not a `module.resource.action` permission name (ADR-008).");
        }

        [$module, $resource, $action] = $parts;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'name' => $name,
            'module' => $module,
            'resource' => $resource,
            'action' => $action,
        ];
    }

    /**
     * A refresh token in a rotation family (ADR-007).
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function refreshTokenAttributes(?int $tenantId, int $userId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'family_id' => (string) Str::uuid(),
            'token_hash' => hash('sha256', (string) Str::uuid()),
            'expires_at' => '2026-09-06 00:00:00',
        ];
    }

    /**
     * An audit row (ADR-027).
     *
     * `created_at` is supplied by the caller because the table has no database
     * default: ADR-027 puts the audit write inside the mutation's transaction, so
     * the moment that matters is the one the Action already holds.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function auditLogAttributes(?int $tenantId, ?int $userId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'action' => 'created',
            'auditable_type' => 'product',
            'auditable_id' => 1,
            'created_at' => '2026-08-23 12:00:00',
        ];
    }

    /**
     * An idempotency record (ADR-028). No `uuid` — the row is itself an external
     * identifier (see the migration).
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function idempotencyKeyAttributes(int $tenantId, int $userId, array $overrides = []): array
    {
        return $overrides + [
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'key' => (string) Str::uuid(),
            'endpoint' => 'sales.orders.store',
            'request_hash' => hash('sha256', '{"total":"100.0000"}'),
            'expires_at' => '2026-08-24 12:00:00',
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertAttachment(int $tenantId, array $overrides = []): int
    {
        return DB::table('attachments')->insertGetId($this->attachmentAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function attachmentAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'attachable_type' => 'product',
            'attachable_id' => 1,
            'disk' => 'local',
            'path' => 'tenants/1/attachments/01HZ-generated.pdf',
            'original_name' => 'spec sheet.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 24_576,
            'checksum' => hash('sha256', 'file-bytes'),
        ];
    }

    /**
     * A queued notification (ADR-019): `sent_at`, `read_at` and `failed_at` are
     * all absent, which is the state, not a gap in the fixture.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function notificationAttributes(?int $tenantId, int $userId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'type' => 'production.batch.qc_failed',
            'channel' => 'in_app',
            'title_key' => 'notifications.production.batch.qc_failed.title',
            'body_key' => 'notifications.production.batch.qc_failed.body',
            'params' => json_encode(['batch_no' => 'B-00042']),
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function notificationPreferenceAttributes(int $tenantId, int $userId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'type' => 'production.batch.qc_failed',
            'channel' => 'email',
            'enabled' => false,
        ];
    }

    /**
     * A tenant-wide numbering series (§1.4). `company_key` and `branch_key` are
     * stored generated columns and are never written here.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function documentSequenceAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => null,
            'branch_id' => null,
            'document_type' => 'invoice',
            'prefix' => 'INV-',
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function activitySnapshotAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'snapshot_date' => '2026-08-22',
            'active_users' => 12,
            'orders_created' => 34,
            'invoices_posted' => 30,
            'batches_closed' => 4,
            'deliveries_completed' => 28,
            'api_requests' => 91_204,
            'storage_bytes' => 1_073_741_824,
        ];
    }

    /**
     * A measurement unit (Wave 5). `type` must be one of: weight | volume |
     * length | piece | time.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertUnit(int $tenantId, array $overrides = []): int
    {
        return DB::table('units')->insertGetId($this->unitAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function unitAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => 'KG',
            'name' => 'Kilogram',
            'type' => 'weight',
            'is_base' => true,
        ];
    }

    /**
     * A conversion between two tenant-scoped units (Wave 5).
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertUnitConversion(int $tenantId, int $fromUnitId, int $toUnitId, array $overrides = []): int
    {
        return DB::table('unit_conversions')
            ->insertGetId($this->unitConversionAttributes($tenantId, $fromUnitId, $toUnitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function unitConversionAttributes(int $tenantId, int $fromUnitId, int $toUnitId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'from_unit_id' => $fromUnitId,
            'to_unit_id' => $toUnitId,
            'factor' => '1000.00000000',
        ];
    }

    /**
     * A product category (Wave 5). `parent_id => null` makes a root category.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertCategory(int $tenantId, array $overrides = []): int
    {
        return DB::table('categories')->insertGetId($this->categoryAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function categoryAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'parent_id' => null,
            'code' => 'RAW',
            'name' => 'Raw Materials',
        ];
    }

    /**
     * A brand (Wave 5).
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertBrand(int $tenantId, array $overrides = []): int
    {
        return DB::table('brands')->insertGetId($this->brandAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function brandAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => 'SM',
            'name' => 'Slice Mart Brand',
        ];
    }

    /**
     * A tax profile (Wave 5). `type` is `inclusive` or `exclusive`.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertTaxProfile(int $tenantId, array $overrides = []): int
    {
        return DB::table('tax_profiles')->insertGetId($this->taxProfileAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function taxProfileAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => 'VAT15',
            'name' => 'VAT 15%',
            'rate' => '15.0000',
            'type' => 'exclusive',
        ];
    }

    /**
     * A reason code (Wave 5). `context` must be one of: qc_defect | wastage |
     * stock_adjustment | sales_return | purchase_return | cancellation | rework.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertReasonCode(int $tenantId, array $overrides = []): int
    {
        return DB::table('reason_codes')->insertGetId($this->reasonCodeAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function reasonCodeAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'context' => 'stock_adjustment',
            'code' => 'ADJ-01',
            'name' => 'Counting Error',
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Wave 6 fixtures — master data B
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * A product (Wave 6). Requires a `tenant_id` and a `base_unit_id` from the
     * same tenant. All nullable FK columns default to `null`.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertProduct(int $tenantId, int $baseUnitId, array $overrides = []): int
    {
        return DB::table('products')->insertGetId($this->productAttributes($tenantId, $baseUnitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function productAttributes(int $tenantId, int $baseUnitId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'sku' => 'SKU-001',
            'name' => 'Test Product',
            'type' => 'finished',
            'base_unit_id' => $baseUnitId,
            'is_produced' => 1,
            'is_purchased' => 0,
            'is_sold' => 1,
            'is_stock_tracked' => 1,
            'has_variants' => 0,
            'tracking_mode' => 'none',
            'standard_cost' => '0.0000',
            'default_sale_price' => '0.0000',
            'status' => 'active',
        ];
    }

    /**
     * A product variant (Wave 6). Requires a `tenant_id` and `product_id`.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertProductVariant(int $tenantId, int $productId, array $overrides = []): int
    {
        return DB::table('product_variants')
            ->insertGetId($this->productVariantAttributes($tenantId, $productId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function productVariantAttributes(int $tenantId, int $productId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'product_id' => $productId,
            'sku' => 'SKU-001-RED-XL',
            'attributes' => '{"colour":"red","size":"XL"}',
            'price_delta' => '0.0000',
            'is_active' => 1,
        ];
    }

    /**
     * A product image (Wave 6). Requires a `tenant_id` and `product_id`.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertProductImage(int $tenantId, int $productId, array $overrides = []): int
    {
        return DB::table('product_images')
            ->insertGetId($this->productImageAttributes($tenantId, $productId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function productImageAttributes(int $tenantId, int $productId, array $overrides = []): array
    {
        return $overrides + [
            'tenant_id' => $tenantId,
            'product_id' => $productId,
            'path' => 'tenants/1/products/image.webp',
            'sort_order' => 0,
            'is_primary' => 1,
        ];
    }

    /**
     * A bill of materials (Wave 6). Requires a `tenant_id`, `product_id` (the
     * output product), and `output_unit_id`.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertBillOfMaterials(int $tenantId, int $productId, int $outputUnitId, array $overrides = []): int
    {
        return DB::table('bill_of_materials')
            ->insertGetId($this->billOfMaterialsAttributes($tenantId, $productId, $outputUnitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function billOfMaterialsAttributes(int $tenantId, int $productId, int $outputUnitId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'product_id' => $productId,
            'version' => '1',
            'name' => 'Standard Recipe v1',
            'output_quantity' => '1.0000',
            'output_unit_id' => $outputUnitId,
            'expected_yield_percentage' => '100.0000',
            'status' => 'active',
        ];
    }

    /**
     * A bill of materials item (Wave 6). Requires a `tenant_id`,
     * `bill_of_material_id`, `product_id` (the input material), and `unit_id`.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertBillOfMaterialItem(
        int $tenantId,
        int $bomId,
        int $productId,
        int $unitId,
        array $overrides = [],
    ): int {
        return DB::table('bill_of_material_items')
            ->insertGetId($this->billOfMaterialItemAttributes($tenantId, $bomId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function billOfMaterialItemAttributes(
        int $tenantId,
        int $bomId,
        int $productId,
        int $unitId,
        array $overrides = [],
    ): array {
        return $overrides + [
            'tenant_id' => $tenantId,
            'bill_of_material_id' => $bomId,
            'product_id' => $productId,
            'quantity' => '1.0000',
            'unit_id' => $unitId,
            'wastage_allowance_percentage' => '0.0000',
            'is_optional' => 0,
            'sort_order' => 0,
        ];
    }

    /**
     * Read one column from one row, narrowed to a string.
     *
     * `value()` returns `mixed`, and casting `mixed` is a static analysis error
     * at level 9. Narrowing once here — and failing loudly if the column holds
     * something that is not a scalar — keeps every call site able to assert an
     * exact value. The result is a string rather than the native type because
     * SQLite and MySQL return different PHP types for the same DECIMAL column,
     * so each caller casts to what it actually means to compare.
     */
    protected function columnValue(string $table, string $column, ?int $id = null): ?string
    {
        $query = DB::table($table);

        if ($id !== null) {
            $query->where('id', $id);
        }

        $value = $query->value($column);

        if ($value === null) {
            return null;
        }

        if (is_scalar($value)) {
            return (string) $value;
        }

        self::fail("`{$table}.{$column}` returned a non-scalar value.");
    }

    /**
     * Assert the insert was rejected *for the reason claimed*.
     *
     * A bare `catch (QueryException)` would also swallow a NOT NULL violation
     * caused by a typo in the fixture, reporting a constraint as enforced when
     * the probe never reached it. Matching the driver message closes that hole,
     * and asserting on it keeps the test from being counted risky.
     *
     * @param  array<string, mixed>  $attributes
     * @param  'unique'|'foreign'|'notnull'  $constraint
     */
    protected function assertInsertRejected(
        string $table,
        array $attributes,
        string $message,
        string $constraint = 'unique',
    ): void {
        try {
            DB::table($table)->insert($attributes);
        } catch (QueryException $e) {
            $this->assertMatchesRegularExpression(
                $this->constraintPattern($constraint),
                $e->getMessage(),
                "The insert into `{$table}` was rejected, but not by the expected "
                ."{$constraint} constraint: {$e->getMessage()}"
            );

            return;
        }

        self::fail($message);
    }

    /**
     * Assert a delete was refused by a foreign key, and refused *cleanly*.
     *
     * The distinction matters: a composite key declared `ON DELETE SET NULL`
     * also refuses the delete, but with `NOT NULL constraint failed` naming an
     * unrelated table, because SET NULL nulls every column of the key including
     * the leading `tenant_id`. That is the Wave 2 finding, and this assertion
     * is what keeps it from coming back.
     */
    protected function assertDeleteRejectedByForeignKey(string $table, int $id, string $message): void
    {
        try {
            DB::table($table)->where('id', $id)->delete();
        } catch (QueryException $e) {
            $this->assertStringNotContainsStringIgnoringCase(
                'NOT NULL',
                $e->getMessage(),
                'The delete failed with a NOT NULL violation instead of a foreign key '
                .'violation, which means a composite key led by `tenant_id` is using '
                ."SET NULL. See DATABASE_DESIGN §1.3. Driver said: {$e->getMessage()}"
            );

            $this->assertMatchesRegularExpression(
                $this->constraintPattern('foreign'),
                $e->getMessage(),
                "The delete from `{$table}` was rejected, but not by a foreign key: {$e->getMessage()}"
            );

            return;
        }

        self::fail($message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Wave 7 fixtures — master data C
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * A warehouse (Wave 7). Scope columns (company_id, branch_id, factory_id)
     * default to null — a tenant-wide warehouse.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertWarehouse(int $tenantId, array $overrides = []): int
    {
        return DB::table('warehouses')->insertGetId($this->warehouseAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function warehouseAttributes(int $tenantId, array $overrides = []): array
    {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => null,
            'branch_id' => null,
            'factory_id' => null,
            'code' => 'WH-'.$counter,
            'name' => 'Warehouse '.$counter,
            'type' => 'finished_goods',
            'is_default' => 0,
            'allows_negative_stock' => 0,
            'is_active' => 1,
        ];
    }

    /**
     * A warehouse location (Wave 7). `parent_id => null` creates a root
     * location (e.g. a zone).
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertWarehouseLocation(int $tenantId, int $warehouseId, array $overrides = []): int
    {
        return DB::table('warehouse_locations')
            ->insertGetId($this->warehouseLocationAttributes($tenantId, $warehouseId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function warehouseLocationAttributes(int $tenantId, int $warehouseId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'warehouse_id' => $warehouseId,
            'parent_id' => null,
            'code' => 'ZONE-A',
            'name' => 'Zone A',
            'type' => 'zone',
            'is_active' => 1,
        ];
    }

    /**
     * A party (Wave 7). Works as a supplier by default.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertParty(int $tenantId, array $overrides = []): int
    {
        return DB::table('parties')->insertGetId($this->partyAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function partyAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => 'SUP-001',
            'name' => 'Acme Supplies',
            'is_supplier' => 1,
            'is_customer' => 0,
            'is_dealer' => 0,
            'is_agent' => 0,
            'type' => 'business',
            'credit_limit' => '0.0000',
            'credit_days' => 30,
            'opening_balance' => '0.0000',
            'current_balance' => '0.0000',
            'status' => 'active',
        ];
    }

    /**
     * A party address (Wave 7). Structured fields required by courier APIs.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPartyAddress(int $tenantId, int $partyId, array $overrides = []): int
    {
        return DB::table('party_addresses')
            ->insertGetId($this->partyAddressAttributes($tenantId, $partyId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function partyAddressAttributes(int $tenantId, int $partyId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'party_id' => $partyId,
            'type' => 'shipping',
            'line1' => '123 Factory Road',
            'city' => 'Dhaka',
            'country_code' => 'BD',
            'is_default' => 1,
        ];
    }

    /**
     * A party contact person (Wave 7).
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPartyContact(int $tenantId, int $partyId, array $overrides = []): int
    {
        return DB::table('party_contacts')
            ->insertGetId($this->partyContactAttributes($tenantId, $partyId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function partyContactAttributes(int $tenantId, int $partyId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'party_id' => $partyId,
            'name' => 'Jane Smith',
            'is_primary' => 1,
        ];
    }

    /**
     * A price list (Wave 7).
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPriceList(int $tenantId, array $overrides = []): int
    {
        return DB::table('price_lists')->insertGetId($this->priceListAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function priceListAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => 'PL-RETAIL',
            'name' => 'Retail Price List',
            'currency_code' => 'BDT',
            'applies_to' => 'all',
            'priority' => 0,
            'is_active' => 1,
        ];
    }

    /**
     * A price list item (Wave 7). Requires tenant_id, price_list_id, and
     * product_id. variant_id defaults to null (base-product pricing).
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPriceListItem(
        int $tenantId,
        int $priceListId,
        int $productId,
        array $overrides = [],
    ): int {
        return DB::table('price_list_items')
            ->insertGetId($this->priceListItemAttributes($tenantId, $priceListId, $productId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function priceListItemAttributes(
        int $tenantId,
        int $priceListId,
        int $productId,
        array $overrides = [],
    ): array {
        return $overrides + [
            'tenant_id' => $tenantId,
            'price_list_id' => $priceListId,
            'product_id' => $productId,
            'variant_id' => null,
            'min_quantity' => '1.0000',
            'unit_price' => '100.0000',
            'discount_percentage' => '0.0000',
        ];
    }

    /**
     * A discount rule (Wave 7). Defaults to an order-level percentage rule.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function insertDiscountRule(int $tenantId, array $overrides = []): int
    {
        return DB::table('discount_rules')
            ->insertGetId($this->discountRuleAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function discountRuleAttributes(int $tenantId, array $overrides = []): array
    {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Seasonal 10% Off',
            'scope' => 'order',
            'scope_id' => null,
            'discount_type' => 'percentage',
            'value' => '10.0000',
            'priority' => 0,
            'is_active' => 1,
        ];
    }

    // =========================================================================
    // Wave 8 — HR identity fixtures
    // =========================================================================

    // ─── departments ─────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertDepartment(
        int $tenantId,
        int $companyId,
        array $overrides = []
    ): int {
        return DB::table('departments')
            ->insertGetId($this->departmentAttributes($tenantId, $companyId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function departmentAttributes(
        int $tenantId,
        int $companyId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'code' => 'DEPT-'.$counter,
            'name' => 'Department '.$counter,
            'parent_id' => null,
            'cost_center_code' => null,
            'head_employee_id' => null,
            'is_active' => 1,
        ];
    }

    // ─── designations ────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertDesignation(int $tenantId, array $overrides = []): int
    {
        return DB::table('designations')
            ->insertGetId($this->designationAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function designationAttributes(int $tenantId, array $overrides = []): array
    {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => 'DESIG-'.$counter,
            'name' => 'Designation '.$counter,
            'grade' => null,
            'is_active' => 1,
        ];
    }

    // ─── shifts ──────────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertShift(int $tenantId, array $overrides = []): int
    {
        return DB::table('shifts')
            ->insertGetId($this->shiftAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function shiftAttributes(int $tenantId, array $overrides = []): array
    {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => 'SHIFT-'.$counter,
            'name' => 'Shift '.$counter,
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'crosses_midnight' => 0,
            'break_minutes' => 30,
            'grace_in_minutes' => 10,
            'grace_out_minutes' => 10,
            'half_day_threshold_minutes' => 240,
            'is_active' => 1,
        ];
    }

    // ─── employees ───────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertEmployee(
        int $tenantId,
        int $companyId,
        array $overrides = []
    ): int {
        return DB::table('employees')
            ->insertGetId($this->employeeAttributes($tenantId, $companyId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function employeeAttributes(
        int $tenantId,
        int $companyId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'employee_code' => 'EMP-'.$counter,
            'user_id' => null,
            'branch_id' => null,
            'factory_id' => null,
            'production_line_id' => null,
            'department_id' => null,
            'designation_id' => null,
            'reports_to_employee_id' => null,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'display_name' => 'John Doe '.$counter,
            'gender' => null,
            'date_of_birth' => null,
            'national_id' => null,
            'phone' => '01700000000',
            'email' => null,
            'address_line1' => null,
            'address_line2' => null,
            'city' => null,
            'photo_path' => null,
            'date_of_joining' => '2024-01-01',
            'date_of_leaving' => null,
            'employment_type' => 'permanent',
            'employment_status' => 'active',
            'default_shift_id' => null,
            'salary_structure_id' => null,
            'bank_name' => null,
            'bank_account_number' => null,
            'mobile_wallet_number' => null,
            'is_active' => 1,
        ];
    }

    // =========================================================================
    // Wave 10 — Production fixtures
    // =========================================================================

    // ─── production_plans ───────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertProductionPlan(
        int $tenantId,
        int $companyId,
        int $factoryId,
        array $overrides = []
    ): int {
        return DB::table('production_plans')
            ->insertGetId($this->productionPlanAttributes($tenantId, $companyId, $factoryId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function productionPlanAttributes(
        int $tenantId,
        int $companyId,
        int $factoryId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'factory_id' => $factoryId,
            'plan_number' => 'PLAN-'.$counter,
            'plan_date' => '2026-08-24',
            'period_start' => '2026-08-24',
            'period_end' => '2026-08-31',
            'source' => 'manual',
            'status' => 'draft',
            'notes' => null,
            'approved_by' => null,
            'approved_at' => null,
        ];
    }

    // ─── production_plan_items ──────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertProductionPlanItem(
        int $tenantId,
        int $productionPlanId,
        int $productId,
        int $bomId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('production_plan_items')
            ->insertGetId($this->productionPlanItemAttributes($tenantId, $productionPlanId, $productId, $bomId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function productionPlanItemAttributes(
        int $tenantId,
        int $productionPlanId,
        int $productId,
        int $bomId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'production_plan_id' => $productionPlanId,
            'product_id' => $productId,
            'bill_of_material_id' => $bomId,
            'planned_quantity' => '100.0000',
            'unit_id' => $unitId,
            'production_line_id' => null,
            'scheduled_date' => '2026-08-24',
            'produced_quantity' => '0.0000',
            'status' => 'draft',
            'sort_order' => 0,
        ];
    }

    // ─── production_batches ─────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertProductionBatch(
        int $tenantId,
        int $factoryId,
        int $productId,
        int $bomId,
        int $outputUnitId,
        array $overrides = []
    ): int {
        return DB::table('production_batches')
            ->insertGetId($this->productionBatchAttributes($tenantId, $factoryId, $productId, $bomId, $outputUnitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function productionBatchAttributes(
        int $tenantId,
        int $factoryId,
        int $productId,
        int $bomId,
        int $outputUnitId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'batch_number' => 'BATCH-'.$counter,
            'production_plan_item_id' => null,
            'factory_id' => $factoryId,
            'production_line_id' => null,
            'product_id' => $productId,
            'bill_of_material_id' => $bomId,
            'shift_id' => null,
            'batch_date' => '2026-08-24',
            'started_at' => null,
            'completed_at' => null,
            'planned_quantity' => '500.0000',
            'output_unit_id' => $outputUnitId,
            'status' => 'draft',
            'context_completeness' => 'draft',
            'total_input_quantity' => '0.0000',
            'total_output_quantity' => '0.0000',
            'worker_reported_quantity' => '0.0000',
            'yield_percentage' => null,
            'variance_quantity' => null,
            'variance_percentage' => null,
            'analysis' => null,
            'supervisor_id' => null,
            'closed_by' => null,
            'closed_at' => null,
        ];
    }

    // ─── material_issues ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertMaterialIssue(
        int $tenantId,
        int $productionBatchId,
        int $warehouseId,
        array $overrides = []
    ): int {
        return DB::table('material_issues')
            ->insertGetId($this->materialIssueAttributes($tenantId, $productionBatchId, $warehouseId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function materialIssueAttributes(
        int $tenantId,
        int $productionBatchId,
        int $warehouseId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'issue_number' => 'MI-'.$counter,
            'production_batch_id' => $productionBatchId,
            'warehouse_id' => $warehouseId,
            'issue_date' => '2026-08-24',
            'status' => 'draft',
            'issued_by' => null,
            'notes' => null,
        ];
    }

    // ─── material_issue_items ───────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertMaterialIssueItem(
        int $tenantId,
        int $materialIssueId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('material_issue_items')
            ->insertGetId($this->materialIssueItemAttributes($tenantId, $materialIssueId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function materialIssueItemAttributes(
        int $tenantId,
        int $materialIssueId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'material_issue_id' => $materialIssueId,
            'product_id' => $productId,
            'requested_quantity' => '50.0000',
            'issued_quantity' => '0.0000',
            'returned_quantity' => '0.0000',
            'unit_id' => $unitId,
            'warehouse_location_id' => null,
            'unit_cost' => '10.0000',
            'stock_movement_id' => null,
        ];
    }

    // ─── production_batch_inputs ────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertProductionBatchInput(
        int $tenantId,
        int $productionBatchId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('production_batch_inputs')
            ->insertGetId($this->productionBatchInputAttributes($tenantId, $productionBatchId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function productionBatchInputAttributes(
        int $tenantId,
        int $productionBatchId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'production_batch_id' => $productionBatchId,
            'product_id' => $productId,
            'quantity' => '45.0000',
            'unit_id' => $unitId,
            'source' => 'material_issue',
            'material_issue_item_id' => null,
            'recorded_by' => null,
            'recorded_at' => '2026-08-24 10:00:00',
            'notes' => null,
        ];
    }

    // ─── worker_production_entries ──────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertWorkerProductionEntry(
        int $tenantId,
        int $productionBatchId,
        int $employeeId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('worker_production_entries')
            ->insertGetId($this->workerProductionEntryAttributes($tenantId, $productionBatchId, $employeeId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function workerProductionEntryAttributes(
        int $tenantId,
        int $productionBatchId,
        int $employeeId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'production_batch_id' => $productionBatchId,
            'employee_id' => $employeeId,
            'product_id' => $productId,
            'production_line_id' => null,
            'shift_id' => null,
            'work_date' => '2026-08-24',
            'measure_type' => 'piece',
            'quantity' => '120.0000',
            'unit_id' => $unitId,
            'rework_quantity' => '0.0000',
            'rejected_quantity' => '0.0000',
            'hours_worked' => null,
            'rate_type' => 'piece_rate',
            'rate' => null,
            'incentive_amount' => null,
            'payroll_period_id' => null,
            'entered_by' => null,
            'verified_by' => null,
            'verified_at' => null,
            'status' => 'draft',
        ];
    }

    // ─── production_outputs ─────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertProductionOutput(
        int $tenantId,
        int $productionBatchId,
        int $productId,
        int $unitId,
        int $targetWarehouseId,
        array $overrides = []
    ): int {
        return DB::table('production_outputs')
            ->insertGetId($this->productionOutputAttributes($tenantId, $productionBatchId, $productId, $unitId, $targetWarehouseId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function productionOutputAttributes(
        int $tenantId,
        int $productionBatchId,
        int $productId,
        int $unitId,
        int $targetWarehouseId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'production_batch_id' => $productionBatchId,
            'product_id' => $productId,
            'variant_id' => null,
            'quantity' => '100.0000',
            'unit_id' => $unitId,
            'output_type' => 'primary',
            'batch_code' => 'LOT-001',
            'expiry_date' => null,
            'target_warehouse_id' => $targetWarehouseId,
            'qc_required' => 1,
            'qc_status' => 'pending',
            'stock_movement_id' => null,
            'recorded_by' => null,
            'recorded_at' => '2026-08-24 12:00:00',
        ];
    }

    // ─── qc_parameters ─────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertQcParameter(
        int $tenantId,
        ?int $productId = null,
        ?int $unitId = null,
        array $overrides = []
    ): int {
        return DB::table('qc_parameters')
            ->insertGetId($this->qcParameterAttributes($tenantId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function qcParameterAttributes(
        int $tenantId,
        ?int $productId = null,
        ?int $unitId = null,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'product_id' => $productId,
            'name' => 'Visual Inspection',
            'type' => 'boolean',
            'unit_id' => $unitId,
            'min_value' => null,
            'max_value' => null,
            'options' => null,
            'is_mandatory' => 1,
            'sort_order' => 0,
        ];
    }

    // ─── qc_inspections ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertQcInspection(
        int $tenantId,
        int $inspectorId,
        ?int $productionBatchId = null,
        ?int $productionOutputId = null,
        array $overrides = []
    ): int {
        return DB::table('qc_inspections')
            ->insertGetId($this->qcInspectionAttributes($tenantId, $inspectorId, $productionBatchId, $productionOutputId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function qcInspectionAttributes(
        int $tenantId,
        int $inspectorId,
        ?int $productionBatchId = null,
        ?int $productionOutputId = null,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'inspection_number' => 'QC-'.Str::upper(Str::random(6)),
            'production_batch_id' => $productionBatchId,
            'production_output_id' => $productionOutputId,
            'goods_receipt_id' => null,
            'inspection_date' => '2026-08-24',
            'inspector_id' => $inspectorId,
            'sample_size' => '10.0000',
            'inspected_quantity' => '100.0000',
            'passed_quantity' => '95.0000',
            'failed_quantity' => '5.0000',
            'rework_quantity' => '3.0000',
            'scrap_quantity' => '2.0000',
            'result' => 'pass',
            'status' => 'approved',
            'notes' => null,
            'approved_by' => null,
            'approved_at' => null,
        ];
    }

    // ─── qc_inspection_results ─────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertQcInspectionResult(
        int $tenantId,
        int $qcInspectionId,
        int $qcParameterId,
        array $overrides = []
    ): int {
        return DB::table('qc_inspection_results')
            ->insertGetId($this->qcInspectionResultAttributes($tenantId, $qcInspectionId, $qcParameterId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function qcInspectionResultAttributes(
        int $tenantId,
        int $qcInspectionId,
        int $qcParameterId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'qc_inspection_id' => $qcInspectionId,
            'qc_parameter_id' => $qcParameterId,
            'value_numeric' => null,
            'value_boolean' => 1,
            'value_text' => 'Pass visual check',
            'is_within_spec' => 1,
            'notes' => null,
        ];
    }

    // ─── qc_defects ────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertQcDefect(
        int $tenantId,
        int $qcInspectionId,
        int $defectReasonId,
        array $overrides = []
    ): int {
        return DB::table('qc_defects')
            ->insertGetId($this->qcDefectAttributes($tenantId, $qcInspectionId, $defectReasonId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function qcDefectAttributes(
        int $tenantId,
        int $qcInspectionId,
        int $defectReasonId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'qc_inspection_id' => $qcInspectionId,
            'defect_reason_id' => $defectReasonId,
            'quantity' => '5.0000',
            'severity' => 'minor',
            'notes' => null,
        ];
    }

    // ─── wastage_records ───────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertWastageRecord(
        int $tenantId,
        int $productId,
        int $unitId,
        int $reasonCodeId,
        ?int $productionBatchId = null,
        ?int $warehouseId = null,
        array $overrides = []
    ): int {
        return DB::table('wastage_records')
            ->insertGetId($this->wastageRecordAttributes($tenantId, $productId, $unitId, $reasonCodeId, $productionBatchId, $warehouseId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function wastageRecordAttributes(
        int $tenantId,
        int $productId,
        int $unitId,
        int $reasonCodeId,
        ?int $productionBatchId = null,
        ?int $warehouseId = null,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'wastage_number' => 'WST-'.Str::upper(Str::random(6)),
            'production_batch_id' => $productionBatchId,
            'product_id' => $productId,
            'stage' => 'in_process',
            'quantity' => '12.5000',
            'unit_id' => $unitId,
            'reason_code_id' => $reasonCodeId,
            'estimated_cost' => '250.0000',
            'is_recoverable' => 0,
            'recovered_quantity' => '0.0000',
            'warehouse_id' => $warehouseId,
            'stock_movement_id' => null,
            'recorded_by' => null,
            'recorded_at' => '2026-08-24 14:00:00',
            'notes' => null,
        ];
    }

    // ─── rework_orders ─────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertReworkOrder(
        int $tenantId,
        int $sourceBatchId,
        int $productId,
        int $unitId,
        ?int $qcInspectionId = null,
        ?int $targetBatchId = null,
        array $overrides = []
    ): int {
        return DB::table('rework_orders')
            ->insertGetId($this->reworkOrderAttributes($tenantId, $sourceBatchId, $productId, $unitId, $qcInspectionId, $targetBatchId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function reworkOrderAttributes(
        int $tenantId,
        int $sourceBatchId,
        int $productId,
        int $unitId,
        ?int $qcInspectionId = null,
        ?int $targetBatchId = null,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'rework_number' => 'RWK-'.Str::upper(Str::random(6)),
            'source_batch_id' => $sourceBatchId,
            'qc_inspection_id' => $qcInspectionId,
            'product_id' => $productId,
            'quantity' => '8.0000',
            'unit_id' => $unitId,
            'target_batch_id' => $targetBatchId,
            'cycle_number' => 1,
            'status' => 'pending',
            'cost_incurred' => null,
            'notes' => null,
        ];
    }

    // ─── stock_movements ───────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertStockMovement(
        int $tenantId,
        int $productId,
        int $warehouseId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('stock_movements')
            ->insertGetId($this->stockMovementAttributes($tenantId, $productId, $warehouseId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function stockMovementAttributes(
        int $tenantId,
        int $productId,
        int $warehouseId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'movement_number' => 'STK-'.Str::upper(Str::random(8)),
            'product_id' => $productId,
            'variant_id' => null,
            'warehouse_id' => $warehouseId,
            'warehouse_location_id' => null,
            'batch_code' => null,
            'serial_number' => null,
            'expiry_date' => null,
            'movement_type' => 'opening_stock',
            'direction' => 'in',
            'stock_state' => 'available',
            'quantity' => '100.0000',
            'unit_id' => $unitId,
            'unit_cost' => '15.0000',
            'total_cost' => '1500.0000',
            'balance_after' => '100.0000',
            'reference_type' => null,
            'reference_id' => null,
            'related_movement_id' => null,
            'reason_code_id' => null,
            'moved_at' => '2026-08-24 10:00:00',
            'created_by' => null,
            'created_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── stock_balances ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertStockBalance(
        int $tenantId,
        int $productId,
        int $warehouseId,
        array $overrides = []
    ): int {
        return DB::table('stock_balances')
            ->insertGetId($this->stockBalanceAttributes($tenantId, $productId, $warehouseId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function stockBalanceAttributes(
        int $tenantId,
        int $productId,
        int $warehouseId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'product_id' => $productId,
            'variant_id' => null,
            'warehouse_id' => $warehouseId,
            'warehouse_location_id' => null,
            'batch_code' => null,
            'stock_state' => 'available',
            'quantity' => '100.0000',
            'average_cost' => '15.0000',
            'total_value' => '1500.0000',
            'last_movement_id' => null,
            'last_movement_at' => '2026-08-24 10:00:00',
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── stock_reservations ────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertStockReservation(
        int $tenantId,
        int $productId,
        int $warehouseId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('stock_reservations')
            ->insertGetId($this->stockReservationAttributes($tenantId, $productId, $warehouseId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function stockReservationAttributes(
        int $tenantId,
        int $productId,
        int $warehouseId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'product_id' => $productId,
            'variant_id' => null,
            'warehouse_id' => $warehouseId,
            'quantity' => '20.0000',
            'unit_id' => $unitId,
            'reference_type' => 'sales_order',
            'reference_id' => 1,
            'expires_at' => null,
            'status' => 'active',
            'created_by' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── stock_transfers ───────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertStockTransfer(
        int $tenantId,
        int $fromWarehouseId,
        int $toWarehouseId,
        array $overrides = []
    ): int {
        return DB::table('stock_transfers')
            ->insertGetId($this->stockTransferAttributes($tenantId, $fromWarehouseId, $toWarehouseId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function stockTransferAttributes(
        int $tenantId,
        int $fromWarehouseId,
        int $toWarehouseId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'transfer_number' => 'TRF-'.$counter,
            'from_warehouse_id' => $fromWarehouseId,
            'to_warehouse_id' => $toWarehouseId,
            'transfer_date' => '2026-08-24',
            'status' => 'draft',
            'dispatched_by' => null,
            'dispatched_at' => null,
            'received_by' => null,
            'received_at' => null,
            'notes' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── stock_transfer_items ──────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertStockTransferItem(
        int $tenantId,
        int $stockTransferId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('stock_transfer_items')
            ->insertGetId($this->stockTransferItemAttributes($tenantId, $stockTransferId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function stockTransferItemAttributes(
        int $tenantId,
        int $stockTransferId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'stock_transfer_id' => $stockTransferId,
            'product_id' => $productId,
            'variant_id' => null,
            'batch_code' => null,
            'sent_quantity' => '50.0000',
            'received_quantity' => '0.0000',
            'damaged_quantity' => '0.0000',
            'unit_id' => $unitId,
            'out_movement_id' => null,
            'in_movement_id' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── stock_adjustments ─────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertStockAdjustment(
        int $tenantId,
        int $warehouseId,
        int $reasonCodeId,
        array $overrides = []
    ): int {
        return DB::table('stock_adjustments')
            ->insertGetId($this->stockAdjustmentAttributes($tenantId, $warehouseId, $reasonCodeId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function stockAdjustmentAttributes(
        int $tenantId,
        int $warehouseId,
        int $reasonCodeId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'adjustment_number' => 'ADJ-'.$counter,
            'warehouse_id' => $warehouseId,
            'adjustment_date' => '2026-08-24',
            'type' => 'increase',
            'reason_code_id' => $reasonCodeId,
            'status' => 'draft',
            'total_value_impact' => '0.0000',
            'requested_by' => null,
            'approved_by' => null,
            'approved_at' => null,
            'notes' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── stock_adjustment_items ────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertStockAdjustmentItem(
        int $tenantId,
        int $stockAdjustmentId,
        int $productId,
        array $overrides = []
    ): int {
        return DB::table('stock_adjustment_items')
            ->insertGetId($this->stockAdjustmentItemAttributes($tenantId, $stockAdjustmentId, $productId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function stockAdjustmentItemAttributes(
        int $tenantId,
        int $stockAdjustmentId,
        int $productId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'stock_adjustment_id' => $stockAdjustmentId,
            'product_id' => $productId,
            'variant_id' => null,
            'batch_code' => null,
            'system_quantity' => '100.0000',
            'adjusted_quantity' => '105.0000',
            'difference_quantity' => '5.0000',
            'unit_cost' => '10.0000',
            'stock_movement_id' => null,
            'notes' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── stock_counts ──────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertStockCount(
        int $tenantId,
        int $warehouseId,
        array $overrides = []
    ): int {
        return DB::table('stock_counts')
            ->insertGetId($this->stockCountAttributes($tenantId, $warehouseId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function stockCountAttributes(
        int $tenantId,
        int $warehouseId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'count_number' => 'CNT-'.$counter,
            'warehouse_id' => $warehouseId,
            'count_date' => '2026-08-24',
            'type' => 'full',
            'status' => 'draft',
            'freeze_stock' => 0,
            'counted_by' => null,
            'reconciled_by' => null,
            'reconciled_at' => null,
            'stock_adjustment_id' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── stock_count_items ─────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertStockCountItem(
        int $tenantId,
        int $stockCountId,
        int $productId,
        array $overrides = []
    ): int {
        return DB::table('stock_count_items')
            ->insertGetId($this->stockCountItemAttributes($tenantId, $stockCountId, $productId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function stockCountItemAttributes(
        int $tenantId,
        int $stockCountId,
        int $productId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'stock_count_id' => $stockCountId,
            'product_id' => $productId,
            'variant_id' => null,
            'warehouse_location_id' => null,
            'batch_code' => null,
            'system_quantity' => '50.0000',
            'counted_quantity' => '48.0000',
            'variance_quantity' => '-2.0000',
            'recount_quantity' => null,
            'status' => 'pending',
            'counted_by' => null,
            'counted_at' => null,
            'notes' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── purchase_requisitions ─────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPurchaseRequisition(
        int $tenantId,
        array $overrides = []
    ): int {
        return DB::table('purchase_requisitions')
            ->insertGetId($this->purchaseRequisitionAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function purchaseRequisitionAttributes(
        int $tenantId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'requisition_number' => 'REQ-'.$counter,
            'branch_id' => null,
            'warehouse_id' => null,
            'required_by_date' => '2026-09-01',
            'status' => 'draft',
            'requested_by' => null,
            'approved_by' => null,
            'approved_at' => null,
            'rejection_reason' => null,
            'notes' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── purchase_requisition_items ────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPurchaseRequisitionItem(
        int $tenantId,
        int $purchaseRequisitionId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('purchase_requisition_items')
            ->insertGetId($this->purchaseRequisitionItemAttributes($tenantId, $purchaseRequisitionId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function purchaseRequisitionItemAttributes(
        int $tenantId,
        int $purchaseRequisitionId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'purchase_requisition_id' => $purchaseRequisitionId,
            'product_id' => $productId,
            'variant_id' => null,
            'quantity' => '100.0000',
            'unit_id' => $unitId,
            'ordered_quantity' => '0.0000',
            'estimated_unit_cost' => '10.0000',
            'notes' => null,
            'sort_order' => 0,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── purchase_orders ───────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPurchaseOrder(
        int $tenantId,
        int $partyId,
        array $overrides = []
    ): int {
        return DB::table('purchase_orders')
            ->insertGetId($this->purchaseOrderAttributes($tenantId, $partyId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function purchaseOrderAttributes(
        int $tenantId,
        int $partyId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'po_number' => 'PO-'.$counter,
            'party_id' => $partyId,
            'company_id' => null,
            'branch_id' => null,
            'warehouse_id' => null,
            'purchase_requisition_id' => null,
            'order_date' => '2026-08-24',
            'expected_date' => '2026-09-01',
            'currency_code' => 'USD',
            'subtotal' => '1000.0000',
            'discount_amount' => '0.0000',
            'tax_amount' => '50.0000',
            'shipping_amount' => '20.0000',
            'total_amount' => '1070.0000',
            'received_value' => '0.0000',
            'billed_value' => '0.0000',
            'payment_terms' => 'Net 30',
            'status' => 'draft',
            'approved_by' => null,
            'approved_at' => null,
            'notes' => null,
            'terms' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── purchase_order_items ──────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPurchaseOrderItem(
        int $tenantId,
        int $purchaseOrderId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('purchase_order_items')
            ->insertGetId($this->purchaseOrderItemAttributes($tenantId, $purchaseOrderId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function purchaseOrderItemAttributes(
        int $tenantId,
        int $purchaseOrderId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'purchase_order_id' => $purchaseOrderId,
            'product_id' => $productId,
            'variant_id' => null,
            'description' => null,
            'quantity' => '100.0000',
            'unit_id' => $unitId,
            'unit_price' => '10.0000',
            'discount_percentage' => '0.0000',
            'discount_amount' => '0.0000',
            'tax_profile_id' => null,
            'tax_amount' => '5.0000',
            'line_total' => '1005.0000',
            'received_quantity' => '0.0000',
            'billed_quantity' => '0.0000',
            'sort_order' => 0,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── goods_receipts ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertGoodsReceipt(
        int $tenantId,
        int $partyId,
        int $warehouseId,
        array $overrides = []
    ): int {
        return DB::table('goods_receipts')
            ->insertGetId($this->goodsReceiptAttributes($tenantId, $partyId, $warehouseId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function goodsReceiptAttributes(
        int $tenantId,
        int $partyId,
        int $warehouseId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'grn_number' => 'GRN-'.$counter,
            'purchase_order_id' => null,
            'party_id' => $partyId,
            'warehouse_id' => $warehouseId,
            'receipt_date' => '2026-08-24',
            'supplier_document_number' => 'DC-'.$counter,
            'status' => 'draft',
            'received_by' => null,
            'notes' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── goods_receipt_items ───────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertGoodsReceiptItem(
        int $tenantId,
        int $goodsReceiptId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('goods_receipt_items')
            ->insertGetId($this->goodsReceiptItemAttributes($tenantId, $goodsReceiptId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function goodsReceiptItemAttributes(
        int $tenantId,
        int $goodsReceiptId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'goods_receipt_id' => $goodsReceiptId,
            'purchase_order_item_id' => null,
            'product_id' => $productId,
            'variant_id' => null,
            'ordered_quantity' => '100.0000',
            'received_quantity' => '100.0000',
            'accepted_quantity' => '100.0000',
            'rejected_quantity' => '0.0000',
            'unit_id' => $unitId,
            'unit_cost' => '10.0000',
            'batch_code' => null,
            'expiry_date' => null,
            'warehouse_location_id' => null,
            'stock_movement_id' => null,
            'reason_code_id' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── purchase_bills ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPurchaseBill(
        int $tenantId,
        int $partyId,
        array $overrides = []
    ): int {
        return DB::table('purchase_bills')
            ->insertGetId($this->purchaseBillAttributes($tenantId, $partyId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function purchaseBillAttributes(
        int $tenantId,
        int $partyId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'bill_number' => 'BILL-'.$counter,
            'supplier_bill_number' => 'SUP-BILL-'.$counter,
            'party_id' => $partyId,
            'purchase_order_id' => null,
            'goods_receipt_id' => null,
            'bill_date' => '2026-08-24',
            'due_date' => '2026-09-24',
            'subtotal' => '1000.0000',
            'discount_amount' => '0.0000',
            'tax_amount' => '50.0000',
            'other_charges' => '0.0000',
            'total_amount' => '1050.0000',
            'paid_amount' => '0.0000',
            'status' => 'draft',
            'posted_by' => null,
            'posted_at' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── purchase_bill_items ───────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPurchaseBillItem(
        int $tenantId,
        int $purchaseBillId,
        array $overrides = []
    ): int {
        return DB::table('purchase_bill_items')
            ->insertGetId($this->purchaseBillItemAttributes($tenantId, $purchaseBillId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function purchaseBillItemAttributes(
        int $tenantId,
        int $purchaseBillId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'purchase_bill_id' => $purchaseBillId,
            'goods_receipt_item_id' => null,
            'product_id' => null,
            'description' => 'Office Supplies',
            'quantity' => '10.0000',
            'unit_id' => null,
            'unit_price' => '100.0000',
            'tax_profile_id' => null,
            'tax_amount' => '5.0000',
            'line_total' => '1005.0000',
            'expense_account_id' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── purchase_returns ──────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPurchaseReturn(
        int $tenantId,
        int $partyId,
        int $warehouseId,
        int $reasonCodeId,
        array $overrides = []
    ): int {
        return DB::table('purchase_returns')
            ->insertGetId($this->purchaseReturnAttributes($tenantId, $partyId, $warehouseId, $reasonCodeId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function purchaseReturnAttributes(
        int $tenantId,
        int $partyId,
        int $warehouseId,
        int $reasonCodeId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'return_number' => 'PRTN-'.$counter,
            'party_id' => $partyId,
            'goods_receipt_id' => null,
            'warehouse_id' => $warehouseId,
            'return_date' => '2026-08-24',
            'reason_code_id' => $reasonCodeId,
            'subtotal' => '500.0000',
            'tax_amount' => '25.0000',
            'total_amount' => '525.0000',
            'status' => 'draft',
            'debit_note_number' => null,
            'created_by' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── purchase_return_items ─────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPurchaseReturnItem(
        int $tenantId,
        int $purchaseReturnId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('purchase_return_items')
            ->insertGetId($this->purchaseReturnItemAttributes($tenantId, $purchaseReturnId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function purchaseReturnItemAttributes(
        int $tenantId,
        int $purchaseReturnId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'purchase_return_id' => $purchaseReturnId,
            'product_id' => $productId,
            'variant_id' => null,
            'batch_code' => null,
            'quantity' => '10.0000',
            'unit_id' => $unitId,
            'unit_cost' => '50.0000',
            'line_total' => '500.0000',
            'stock_movement_id' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── crm_leads ─────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertCrmLead(
        int $tenantId,
        array $overrides = []
    ): int {
        return DB::table('crm_leads')
            ->insertGetId($this->crmLeadAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function crmLeadAttributes(
        int $tenantId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'lead_number' => 'LEAD-'.$counter,
            'name' => 'Acme Corporation Lead '.$counter,
            'company_name' => 'Acme Corp',
            'phone' => '+15551234567',
            'email' => "lead{$counter}@acme.test",
            'source' => 'walk_in',
            'stage' => 'new',
            'assigned_to' => null,
            'expected_value' => '5000.0000',
            'expected_close_date' => '2026-09-30',
            'lost_reason_id' => null,
            'converted_party_id' => null,
            'converted_at' => null,
            'notes' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── crm_activities ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertCrmActivity(
        int $tenantId,
        string $subjectType,
        int $subjectId,
        array $overrides = []
    ): int {
        return DB::table('crm_activities')
            ->insertGetId($this->crmActivityAttributes($tenantId, $subjectType, $subjectId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function crmActivityAttributes(
        int $tenantId,
        string $subjectType,
        int $subjectId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'type' => 'call',
            'title' => 'Follow up call '.$counter,
            'description' => 'Discussed pricing and volume discounts.',
            'due_at' => '2026-08-25 14:00:00',
            'completed_at' => null,
            'outcome' => null,
            'assigned_to' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── sales_orders ──────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertSalesOrder(
        int $tenantId,
        array $overrides = []
    ): int {
        return DB::table('sales_orders')
            ->insertGetId($this->salesOrderAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function salesOrderAttributes(
        int $tenantId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'order_number' => 'SO-'.$counter,
            'channel' => 'counter',
            'company_id' => null,
            'branch_id' => null,
            'warehouse_id' => null,
            'party_id' => null,
            'customer_name' => 'Walk-in Customer '.$counter,
            'customer_phone' => '+15559876543',
            'pos_session_id' => null,
            'order_date' => '2026-08-24',
            'required_date' => '2026-08-26',
            'price_list_id' => null,
            'currency_code' => 'USD',
            'subtotal' => '200.0000',
            'discount_amount' => '0.0000',
            'tax_amount' => '10.0000',
            'shipping_amount' => '0.0000',
            'round_off' => '0.0000',
            'total_amount' => '210.0000',
            'paid_amount' => '0.0000',
            'due_amount' => '210.0000',
            'delivery_type' => 'pickup',
            'status' => 'draft',
            'payment_status' => 'unpaid',
            'salesperson_id' => null,
            'notes' => null,
            'internal_notes' => null,
            'confirmed_by' => null,
            'confirmed_at' => null,
            'cancelled_by' => null,
            'cancelled_at' => null,
            'cancellation_reason_id' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── sales_order_items ─────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertSalesOrderItem(
        int $tenantId,
        int $salesOrderId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('sales_order_items')
            ->insertGetId($this->salesOrderItemAttributes($tenantId, $salesOrderId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function salesOrderItemAttributes(
        int $tenantId,
        int $salesOrderId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'sales_order_id' => $salesOrderId,
            'product_id' => $productId,
            'variant_id' => null,
            'description' => null,
            'quantity' => '10.0000',
            'unit_id' => $unitId,
            'unit_price' => '20.0000',
            'discount_percentage' => '0.0000',
            'discount_amount' => '0.0000',
            'tax_profile_id' => null,
            'tax_amount' => '10.0000',
            'line_total' => '210.0000',
            'delivered_quantity' => '0.0000',
            'returned_quantity' => '0.0000',
            'batch_code' => null,
            'stock_reservation_id' => null,
            'sort_order' => 0,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── invoice_templates ─────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertInvoiceTemplate(
        int $tenantId,
        array $overrides = []
    ): int {
        return DB::table('invoice_templates')
            ->insertGetId($this->invoiceTemplateAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function invoiceTemplateAttributes(
        int $tenantId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => null,
            'name' => 'Standard Invoice Template '.$counter,
            'type' => 'invoice',
            'paper_size' => 'a4',
            'orientation' => 'portrait',
            'definition' => json_encode(['elements' => []], JSON_THROW_ON_ERROR),
            'is_default' => 0,
            'is_active' => 1,
            'version' => 1,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── invoices ──────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertInvoice(
        int $tenantId,
        array $overrides = []
    ): int {
        return DB::table('invoices')
            ->insertGetId($this->invoiceAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function invoiceAttributes(
        int $tenantId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'invoice_number' => 'INV-'.$counter,
            'sales_order_id' => null,
            'company_id' => null,
            'branch_id' => null,
            'party_id' => null,
            'invoice_date' => '2026-08-24',
            'due_date' => '2026-09-24',
            'subtotal' => '200.0000',
            'discount_amount' => '0.0000',
            'tax_amount' => '10.0000',
            'shipping_amount' => '0.0000',
            'round_off' => '0.0000',
            'total_amount' => '210.0000',
            'paid_amount' => '0.0000',
            'status' => 'draft',
            'invoice_template_id' => null,
            'printed_count' => 0,
            'posted_by' => null,
            'posted_at' => null,
            'voided_by' => null,
            'voided_at' => null,
            'void_reason' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── invoice_items ─────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertInvoiceItem(
        int $tenantId,
        int $invoiceId,
        array $overrides = []
    ): int {
        return DB::table('invoice_items')
            ->insertGetId($this->invoiceItemAttributes($tenantId, $invoiceId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function invoiceItemAttributes(
        int $tenantId,
        int $invoiceId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'invoice_id' => $invoiceId,
            'sales_order_item_id' => null,
            'product_id' => null,
            'description' => 'Custom line item',
            'quantity' => '1.0000',
            'unit_id' => null,
            'unit_price' => '200.0000',
            'discount_amount' => '0.0000',
            'tax_profile_id' => null,
            'tax_amount' => '10.0000',
            'line_total' => '210.0000',
            'sort_order' => 0,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── sales_returns ─────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertSalesReturn(
        int $tenantId,
        int $warehouseId,
        int $reasonCodeId,
        array $overrides = []
    ): int {
        return DB::table('sales_returns')
            ->insertGetId($this->salesReturnAttributes($tenantId, $warehouseId, $reasonCodeId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function salesReturnAttributes(
        int $tenantId,
        int $warehouseId,
        int $reasonCodeId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'return_number' => 'SRTN-'.$counter,
            'invoice_id' => null,
            'sales_order_id' => null,
            'party_id' => null,
            'warehouse_id' => $warehouseId,
            'return_date' => '2026-08-24',
            'reason_code_id' => $reasonCodeId,
            'restock' => 1,
            'subtotal' => '100.0000',
            'tax_amount' => '5.0000',
            'total_amount' => '105.0000',
            'refund_method' => 'credit_note',
            'credit_note_number' => 'CN-'.$counter,
            'status' => 'draft',
            'approved_by' => null,
            'approved_at' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── sales_return_items ────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertSalesReturnItem(
        int $tenantId,
        int $salesReturnId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('sales_return_items')
            ->insertGetId($this->salesReturnItemAttributes($tenantId, $salesReturnId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function salesReturnItemAttributes(
        int $tenantId,
        int $salesReturnId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'sales_return_id' => $salesReturnId,
            'invoice_item_id' => null,
            'product_id' => $productId,
            'variant_id' => null,
            'batch_code' => null,
            'quantity' => '5.0000',
            'unit_id' => $unitId,
            'unit_price' => '20.0000',
            'line_total' => '100.0000',
            'condition' => 'good',
            'stock_movement_id' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── payments ──────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPayment(
        int $tenantId,
        array $overrides = []
    ): int {
        return DB::table('payments')
            ->insertGetId($this->paymentAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function paymentAttributes(
        int $tenantId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'payment_number' => 'PAY-'.$counter,
            'direction' => 'in',
            'party_id' => null,
            'company_id' => null,
            'branch_id' => null,
            'payment_date' => '2026-08-24',
            'method' => 'cash',
            'bank_account_id' => null,
            'reference_number' => 'REF-'.$counter,
            'amount' => '500.0000',
            'allocated_amount' => '0.0000',
            'unallocated_amount' => '500.0000',
            'currency_code' => 'USD',
            'status' => 'draft',
            'received_by' => null,
            'posted_at' => null,
            'notes' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── payment_allocations ───────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPaymentAllocation(
        int $tenantId,
        int $paymentId,
        string $allocatableType,
        int $allocatableId,
        array $overrides = []
    ): int {
        return DB::table('payment_allocations')
            ->insertGetId($this->paymentAllocationAttributes($tenantId, $paymentId, $allocatableType, $allocatableId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function paymentAllocationAttributes(
        int $tenantId,
        int $paymentId,
        string $allocatableType,
        int $allocatableId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'payment_id' => $paymentId,
            'allocatable_type' => $allocatableType,
            'allocatable_id' => $allocatableId,
            'amount' => '200.0000',
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── sales_order_payments ──────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertSalesOrderPayment(
        int $tenantId,
        int $salesOrderId,
        array $overrides = []
    ): int {
        return DB::table('sales_order_payments')
            ->insertGetId($this->salesOrderPaymentAttributes($tenantId, $salesOrderId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function salesOrderPaymentAttributes(
        int $tenantId,
        int $salesOrderId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'sales_order_id' => $salesOrderId,
            'payment_id' => null,
            'method' => 'cash',
            'amount' => '210.0000',
            'change_given' => '0.0000',
            'reference' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── pos_terminals ─────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPosTerminal(
        int $tenantId,
        int $branchId,
        array $overrides = []
    ): int {
        return DB::table('pos_terminals')
            ->insertGetId($this->posTerminalAttributes($tenantId, $branchId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function posTerminalAttributes(
        int $tenantId,
        int $branchId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'code' => 'TERM-'.$counter,
            'name' => 'Counter Terminal '.$counter,
            'default_warehouse_id' => null,
            'printer_config' => json_encode(['paper_size' => '80mm', 'auto_cut' => true]),
            'is_active' => true,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── pos_sessions ──────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPosSession(
        int $tenantId,
        int $branchId,
        int $warehouseId,
        int $terminalId,
        int $userId,
        array $overrides = []
    ): int {
        return DB::table('pos_sessions')
            ->insertGetId($this->posSessionAttributes($tenantId, $branchId, $warehouseId, $terminalId, $userId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function posSessionAttributes(
        int $tenantId,
        int $branchId,
        int $warehouseId,
        int $terminalId,
        int $userId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'session_number' => 'SESS-'.$counter,
            'branch_id' => $branchId,
            'warehouse_id' => $warehouseId,
            'terminal_id' => $terminalId,
            'user_id' => $userId,
            'opened_at' => '2026-08-24 08:00:00',
            'closed_at' => null,
            'opening_cash' => '100.0000',
            'expected_cash' => '100.0000',
            'counted_cash' => null,
            'cash_variance' => null,
            'card_total' => '0.0000',
            'mobile_total' => '0.0000',
            'credit_total' => '0.0000',
            'sales_count' => 0,
            'refund_total' => '0.0000',
            'status' => 'open',
            'closed_by' => null,
            'notes' => null,
            'created_at' => '2026-08-24 08:00:00',
            'updated_at' => '2026-08-24 08:00:00',
        ];
    }

    // ─── pos_offline_queue ─────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPosOfflineQueue(
        int $tenantId,
        int $terminalId,
        int $userId,
        array $overrides = []
    ): int {
        return DB::table('pos_offline_queue')
            ->insertGetId($this->posOfflineQueueAttributes($tenantId, $terminalId, $userId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function posOfflineQueueAttributes(
        int $tenantId,
        int $terminalId,
        int $userId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'terminal_id' => $terminalId,
            'user_id' => $userId,
            'idempotency_key' => 'IDEMP-POS-'.$counter,
            'payload' => json_encode(['action' => 'checkout', 'total' => '150.0000']),
            'client_created_at' => '2026-08-24 10:30:00',
            'synced_at' => null,
            'status' => 'pending',
            'rejection_reason' => null,
            'created_at' => '2026-08-24 10:30:00',
            'updated_at' => '2026-08-24 10:30:00',
        ];
    }

    // ─── courier_providers ─────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertCourierProvider(
        ?int $tenantId = null,
        array $overrides = []
    ): int {
        return DB::table('courier_providers')
            ->insertGetId($this->courierProviderAttributes($tenantId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function courierProviderAttributes(
        ?int $tenantId = null,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => 'provider_'.$counter,
            'name' => 'Courier Provider '.$counter,
            'adapter_class' => 'App\\Services\\Couriers\\CustomAdapter',
            'is_active' => true,
            'credentials' => json_encode(['api_key' => 'secret_'.$counter]),
            'capabilities' => json_encode(['create_shipment' => true, 'get_status' => true]),
            'webhook_secret' => 'whsec_'.$counter,
            'default_charge' => '50.0000',
            'settings' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── run_sheets ────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertRunSheet(
        int $tenantId,
        int $branchId,
        array $overrides = []
    ): int {
        return DB::table('run_sheets')
            ->insertGetId($this->runSheetAttributes($tenantId, $branchId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function runSheetAttributes(
        int $tenantId,
        int $branchId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'run_sheet_number' => 'RS-'.$counter,
            'branch_id' => $branchId,
            'rider_id' => null,
            'vehicle_id' => null,
            'run_date' => '2026-08-24',
            'status' => 'draft',
            'total_stops' => 0,
            'completed_stops' => 0,
            'total_cod_expected' => '0.0000',
            'total_cod_collected' => '0.0000',
            'dispatched_at' => null,
            'returned_at' => null,
            'reconciled_by' => null,
            'reconciled_at' => null,
            'created_at' => '2026-08-24 08:00:00',
            'updated_at' => '2026-08-24 08:00:00',
        ];
    }

    // ─── delivery_orders ───────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertDeliveryOrder(
        int $tenantId,
        int $salesOrderId,
        int $warehouseId,
        array $overrides = []
    ): int {
        return DB::table('delivery_orders')
            ->insertGetId($this->deliveryOrderAttributes($tenantId, $salesOrderId, $warehouseId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function deliveryOrderAttributes(
        int $tenantId,
        int $salesOrderId,
        int $warehouseId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'delivery_number' => 'DO-'.$counter,
            'sales_order_id' => $salesOrderId,
            'invoice_id' => null,
            'party_id' => null,
            'warehouse_id' => $warehouseId,
            'delivery_address_id' => null,
            'recipient_name' => 'Recipient '.$counter,
            'recipient_phone' => '+880171100000'.$counter,
            'delivery_type' => 'own_delivery',
            'courier_provider_id' => null,
            'courier_shipment_id' => null,
            'run_sheet_id' => null,
            'rider_id' => null,
            'scheduled_date' => '2026-08-24',
            'delivered_at' => null,
            'status' => 'pending',
            'cod_amount' => '0.0000',
            'cod_collected_amount' => '0.0000',
            'cod_status' => 'not_applicable',
            'delivery_charge' => '60.0000',
            'weight' => '1.5000',
            'package_count' => 1,
            'special_instructions' => null,
            'attempt_count' => 0,
            'failure_reason_id' => null,
            'pod_signature_path' => null,
            'pod_photo_path' => null,
            'pod_received_by' => null,
            'stock_movement_id' => null,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── delivery_order_items ──────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertDeliveryOrderItem(
        int $tenantId,
        int $deliveryOrderId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): int {
        return DB::table('delivery_order_items')
            ->insertGetId($this->deliveryOrderItemAttributes($tenantId, $deliveryOrderId, $productId, $unitId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function deliveryOrderItemAttributes(
        int $tenantId,
        int $deliveryOrderId,
        int $productId,
        int $unitId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'delivery_order_id' => $deliveryOrderId,
            'sales_order_item_id' => null,
            'product_id' => $productId,
            'variant_id' => null,
            'batch_code' => null,
            'quantity' => '10.0000',
            'delivered_quantity' => '0.0000',
            'returned_quantity' => '0.0000',
            'unit_id' => $unitId,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── delivery_status_events ────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertDeliveryStatusEvent(
        int $tenantId,
        int $deliveryOrderId,
        string $status,
        array $overrides = []
    ): int {
        return DB::table('delivery_status_events')
            ->insertGetId($this->deliveryStatusEventAttributes($tenantId, $deliveryOrderId, $status, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function deliveryStatusEventAttributes(
        int $tenantId,
        int $deliveryOrderId,
        string $status,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'delivery_order_id' => $deliveryOrderId,
            'status' => $status,
            'source' => 'system',
            'courier_event_id' => null,
            'occurred_at' => '2026-08-24 11:00:00',
            'location' => 'Central Hub',
            'latitude' => null,
            'longitude' => null,
            'notes' => 'Status transition to '.$status,
            'raw_payload' => null,
            'created_by' => null,
            'created_at' => '2026-08-24 11:00:00',
        ];
    }

    // ─── courier_shipments ─────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertCourierShipment(
        int $tenantId,
        int $deliveryOrderId,
        int $courierProviderId,
        array $overrides = []
    ): int {
        return DB::table('courier_shipments')
            ->insertGetId($this->courierShipmentAttributes($tenantId, $deliveryOrderId, $courierProviderId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function courierShipmentAttributes(
        int $tenantId,
        int $deliveryOrderId,
        int $courierProviderId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'delivery_order_id' => $deliveryOrderId,
            'courier_provider_id' => $courierProviderId,
            'consignment_id' => 'CS-'.$counter,
            'awb_number' => 'AWB-'.$counter,
            'label_path' => null,
            'tracking_url' => null,
            'status' => 'draft',
            'provider_status_raw' => 'in_review',
            'charge_amount' => '60.0000',
            'cod_amount' => '0.0000',
            'requested_at' => '2026-08-24 10:00:00',
            'confirmed_at' => null,
            'last_synced_at' => null,
            'request_payload' => null,
            'response_payload' => null,
            'error_message' => null,
            'retry_count' => 0,
            'created_at' => '2026-08-24 10:00:00',
            'updated_at' => '2026-08-24 10:00:00',
        ];
    }

    // ─── courier_webhook_events ────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertCourierWebhookEvent(
        int $courierProviderId,
        array $overrides = []
    ): int {
        return DB::table('courier_webhook_events')
            ->insertGetId($this->courierWebhookEventAttributes($courierProviderId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function courierWebhookEventAttributes(
        int $courierProviderId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'tenant_id' => null,
            'courier_provider_id' => $courierProviderId,
            'provider_event_id' => 'EVT-WH-'.$counter,
            'signature_valid' => true,
            'payload' => json_encode(['event' => 'order.delivered', 'consignment_id' => 'CS-'.$counter]),
            'processed_at' => null,
            'status' => 'received',
            'error_message' => null,
            'created_at' => '2026-08-24 11:30:00',
            'updated_at' => '2026-08-24 11:30:00',
        ];
    }

    // ─── cod_reconciliations ───────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertCodReconciliation(
        int $tenantId,
        string $sourceType,
        int $sourceId,
        array $overrides = []
    ): int {
        return DB::table('cod_reconciliations')
            ->insertGetId($this->codReconciliationAttributes($tenantId, $sourceType, $sourceId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function codReconciliationAttributes(
        int $tenantId,
        string $sourceType,
        int $sourceId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'reconciliation_number' => 'RECON-'.$counter,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'period_start' => '2026-08-24',
            'period_end' => '2026-08-24',
            'expected_amount' => '1000.0000',
            'received_amount' => '1000.0000',
            'variance_amount' => '0.0000',
            'bank_account_id' => null,
            'status' => 'draft',
            'reconciled_by' => null,
            'reconciled_at' => null,
            'notes' => null,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── leave_types ─────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertLeaveType(
        int $tenantId,
        string $code = 'ANNUAL',
        array $overrides = []
    ): int {
        return DB::table('leave_types')
            ->insertGetId($this->leaveTypeAttributes($tenantId, $code, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function leaveTypeAttributes(
        int $tenantId,
        string $code = 'ANNUAL',
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => $code.'_'.$counter,
            'name' => 'Leave Type '.$counter,
            'is_paid' => true,
            'annual_quota_days' => '14.0000',
            'accrual_method' => 'yearly',
            'carry_forward_allowed' => true,
            'max_carry_forward_days' => '5.0000',
            'requires_attachment' => false,
            'min_notice_days' => 2,
            'is_active' => true,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── leave_requests ──────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertLeaveRequest(
        int $tenantId,
        int $employeeId,
        int $leaveTypeId,
        array $overrides = []
    ): int {
        return DB::table('leave_requests')
            ->insertGetId($this->leaveRequestAttributes($tenantId, $employeeId, $leaveTypeId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function leaveRequestAttributes(
        int $tenantId,
        int $employeeId,
        int $leaveTypeId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'request_number' => 'LR-'.$counter,
            'employee_id' => $employeeId,
            'leave_type_id' => $leaveTypeId,
            'start_date' => '2026-08-24',
            'end_date' => '2026-08-26',
            'total_days' => '3.0000',
            'is_half_day' => false,
            'reason' => 'Family event',
            'attachment_id' => null,
            'status' => 'draft',
            'approved_by' => null,
            'approved_at' => null,
            'rejection_reason' => null,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── leave_balances ──────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertLeaveBalance(
        int $tenantId,
        int $employeeId,
        int $leaveTypeId,
        int $year = 2026,
        array $overrides = []
    ): int {
        return DB::table('leave_balances')
            ->insertGetId($this->leaveBalanceAttributes($tenantId, $employeeId, $leaveTypeId, $year, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function leaveBalanceAttributes(
        int $tenantId,
        int $employeeId,
        int $leaveTypeId,
        int $year = 2026,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'employee_id' => $employeeId,
            'leave_type_id' => $leaveTypeId,
            'year' => $year,
            'opening_days' => '14.0000',
            'accrued_days' => '0.0000',
            'used_days' => '2.0000',
            'carried_forward_days' => '0.0000',
            'balance_days' => '12.0000',
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── shift_assignments ───────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertShiftAssignment(
        int $tenantId,
        int $employeeId,
        int $shiftId,
        array $overrides = []
    ): int {
        return DB::table('shift_assignments')
            ->insertGetId($this->shiftAssignmentAttributes($tenantId, $employeeId, $shiftId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function shiftAssignmentAttributes(
        int $tenantId,
        int $employeeId,
        int $shiftId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'employee_id' => $employeeId,
            'shift_id' => $shiftId,
            'effective_from' => '2026-08-01',
            'effective_to' => null,
            'assigned_by' => null,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── holidays ────────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertHoliday(
        int $tenantId,
        string $holidayDate = '2026-12-25',
        array $overrides = []
    ): int {
        return DB::table('holidays')
            ->insertGetId($this->holidayAttributes($tenantId, $holidayDate, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function holidayAttributes(
        int $tenantId,
        string $holidayDate = '2026-12-25',
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => null,
            'name' => 'Holiday '.$counter,
            'holiday_date' => $holidayDate,
            'is_recurring' => true,
            'applies_to_branch_id' => null,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── employee_documents ──────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertEmployeeDocument(
        int $tenantId,
        int $employeeId,
        int $attachmentId,
        string $docType = 'nid',
        array $overrides = []
    ): int {
        return DB::table('employee_documents')
            ->insertGetId($this->employeeDocumentAttributes($tenantId, $employeeId, $attachmentId, $docType, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function employeeDocumentAttributes(
        int $tenantId,
        int $employeeId,
        int $attachmentId,
        string $docType = 'nid',
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'employee_id' => $employeeId,
            'document_type' => $docType,
            'attachment_id' => $attachmentId,
            'issued_on' => '2020-01-01',
            'expires_on' => '2030-01-01',
            'notes' => 'Official national identity document',
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── salary_components ───────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertSalaryComponent(
        int $tenantId,
        string $code = 'BASIC',
        string $type = 'earning',
        array $overrides = []
    ): int {
        return DB::table('salary_components')
            ->insertGetId($this->salaryComponentAttributes($tenantId, $code, $type, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function salaryComponentAttributes(
        int $tenantId,
        string $code = 'BASIC',
        string $type = 'earning',
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => $code.'_'.$counter,
            'name' => 'Salary Component '.$counter,
            'component_type' => $type,
            'is_taxable' => true,
            'affects_gross' => true,
            'is_active' => true,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── salary_structures ───────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertSalaryStructure(
        int $tenantId,
        string $code = 'EXEC_STRUCT',
        array $overrides = []
    ): int {
        return DB::table('salary_structures')
            ->insertGetId($this->salaryStructureAttributes($tenantId, $code, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function salaryStructureAttributes(
        int $tenantId,
        string $code = 'EXEC_STRUCT',
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'code' => $code.'_'.$counter,
            'name' => 'Salary Structure '.$counter,
            'effective_from' => '2026-01-01',
            'effective_to' => null,
            'pay_frequency' => 'monthly',
            'is_active' => true,
            'notes' => null,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── salary_structure_components ──────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertSalaryStructureComponent(
        int $tenantId,
        int $salaryStructureId,
        int $componentId,
        array $overrides = []
    ): int {
        return DB::table('salary_structure_components')
            ->insertGetId($this->salaryStructureComponentAttributes($tenantId, $salaryStructureId, $componentId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function salaryStructureComponentAttributes(
        int $tenantId,
        int $salaryStructureId,
        int $componentId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'salary_structure_id' => $salaryStructureId,
            'component_id' => $componentId,
            'calculation_type' => 'fixed',
            'value' => '50000.0000',
            'base_component_id' => null,
            'sort_order' => 1,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── payroll_periods ─────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPayrollPeriod(
        int $tenantId,
        int $companyId,
        string $periodCode = '2026-08',
        array $overrides = []
    ): int {
        return DB::table('payroll_periods')
            ->insertGetId($this->payrollPeriodAttributes($tenantId, $companyId, $periodCode, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payrollPeriodAttributes(
        int $tenantId,
        int $companyId,
        string $periodCode = '2026-08',
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'period_code' => $periodCode.'_'.$counter,
            'pay_frequency' => 'monthly',
            'period_start' => '2026-08-01',
            'period_end' => '2026-08-31',
            'payment_date' => '2026-09-01',
            'status' => 'open',
            'total_gross' => '0.0000',
            'total_deductions' => '0.0000',
            'total_net' => '0.0000',
            'employee_count' => 0,
            'calculated_by' => null,
            'calculated_at' => null,
            'approved_by' => null,
            'approved_at' => null,
            'locked_at' => null,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── attendances ─────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertAttendance(
        int $tenantId,
        int $employeeId,
        string $date = '2026-08-24',
        array $overrides = []
    ): int {
        return DB::table('attendances')
            ->insertGetId($this->attendanceAttributes($tenantId, $employeeId, $date, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function attendanceAttributes(
        int $tenantId,
        int $employeeId,
        string $date = '2026-08-24',
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'employee_id' => $employeeId,
            'attendance_date' => $date,
            'shift_id' => null,
            'check_in_at' => '2026-08-24 09:00:00',
            'check_out_at' => '2026-08-24 18:00:00',
            'check_in_source' => 'biometric',
            'check_out_source' => 'biometric',
            'worked_minutes' => 540,
            'late_minutes' => 0,
            'early_leave_minutes' => 0,
            'overtime_minutes' => 0,
            'status' => 'present',
            'leave_request_id' => null,
            'remarks' => null,
            'approved_by' => null,
            'approved_at' => null,
            'payroll_period_id' => null,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── payslips ────────────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPayslip(
        int $tenantId,
        int $payrollPeriodId,
        int $employeeId,
        array $overrides = []
    ): int {
        return DB::table('payslips')
            ->insertGetId($this->payslipAttributes($tenantId, $payrollPeriodId, $employeeId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payslipAttributes(
        int $tenantId,
        int $payrollPeriodId,
        int $employeeId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'payroll_period_id' => $payrollPeriodId,
            'employee_id' => $employeeId,
            'payslip_number' => 'SLIP-'.$counter,
            'gross_amount' => '60000.0000',
            'total_earnings' => '60000.0000',
            'total_deductions' => '5000.0000',
            'net_amount' => '55000.0000',
            'paid_days' => '30.0000',
            'absent_days' => '0.0000',
            'leave_days' => '0.0000',
            'overtime_minutes' => 0,
            'produced_quantity' => null,
            'payment_method' => 'bank',
            'payment_status' => 'unpaid',
            'paid_at' => null,
            'payment_reference' => null,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── payslip_items ───────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPayslipItem(
        int $tenantId,
        int $payslipId,
        int $salaryComponentId,
        array $overrides = []
    ): int {
        return DB::table('payslip_items')
            ->insertGetId($this->payslipItemAttributes($tenantId, $payslipId, $salaryComponentId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payslipItemAttributes(
        int $tenantId,
        int $payslipId,
        int $salaryComponentId,
        array $overrides = []
    ): array {
        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'payslip_id' => $payslipId,
            'salary_component_id' => $salaryComponentId,
            'component_code' => 'BASIC',
            'component_type' => 'earning',
            'calculation_basis' => json_encode(['base_rate' => 50000]),
            'quantity' => null,
            'rate' => null,
            'amount' => '50000.0000',
            'sort_order' => 1,
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    // ─── payroll_advances ────────────────────────────────────────────────────

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function insertPayrollAdvance(
        int $tenantId,
        int $employeeId,
        array $overrides = []
    ): int {
        return DB::table('payroll_advances')
            ->insertGetId($this->payrollAdvanceAttributes($tenantId, $employeeId, $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payrollAdvanceAttributes(
        int $tenantId,
        int $employeeId,
        array $overrides = []
    ): array {
        static $counter = 0;
        $counter++;

        return $overrides + [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'employee_id' => $employeeId,
            'advance_number' => 'ADV-'.$counter,
            'amount' => '20000.0000',
            'issued_on' => '2026-08-01',
            'recovery_start_period_id' => null,
            'installment_amount' => '5000.0000',
            'recovered_amount' => '0.0000',
            'status' => 'active',
            'notes' => 'Salary advance request',
            'created_at' => '2026-08-24 18:00:00',
            'updated_at' => '2026-08-24 18:00:00',
        ];
    }

    /**
     * SQLite and MySQL word the same violation differently, and the suite runs
     * on SQLite while production runs on MySQL.
     *
     * @param  'unique'|'foreign'|'notnull'  $constraint
     */
    private function constraintPattern(string $constraint): string
    {
        return match ($constraint) {
            'unique' => '/UNIQUE constraint failed|Duplicate entry/i',
            'foreign' => '/FOREIGN KEY constraint failed|foreign key constraint fails/i',
            default => '/NOT NULL constraint failed|cannot be null/i',
        };
    }
}
