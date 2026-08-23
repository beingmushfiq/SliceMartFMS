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
