<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Wave 1 platform schema contract — DATABASE_DESIGN §1, §2, §13.3, §16.
 *
 * Every uniqueness claim here is proved by attempting a duplicate insert and
 * requiring the database to reject it, never by reading index metadata.
 * Asserting on the DDL would happily pass for a unique index that can never
 * fire, which is exactly the defect this wave uncovered in §13.3.
 */
final class Wave1PlatformSchemaTest extends SchemaTestCase
{
    /**
     * The six tables Wave 1 owns (§16).
     */
    private const WAVE_1_TABLES = [
        'plans',
        'tenants',
        'tenant_subscriptions',
        'tenant_usage_counters',
        'settings',
        'feature_flags',
    ];

    /**
     * Wave 1 tables that carry `tenant_id`. `plans` and `tenants` are exempt —
     * one is platform-owned, the other *is* the tenant (§2).
     */
    private const TENANT_COLUMN_TABLES = [
        'tenant_subscriptions',
        'tenant_usage_counters',
        'settings',
        'feature_flags',
    ];

    public function test_wave_1_creates_every_documented_table(): void
    {
        foreach (self::WAVE_1_TABLES as $table) {
            $this->assertTrue(Schema::hasTable($table), "Wave 1 table `{$table}` is missing.");
        }
    }

    public function test_every_table_exposes_a_unique_public_uuid(): void
    {
        foreach (self::WAVE_1_TABLES as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'uuid'),
                "`{$table}` has no `uuid`, so internal ids would leak into URLs (§1)."
            );
        }

        $plan = $this->insertPlan();

        // The duplicate differs in `code`, so only the uuid key can reject it.
        $this->assertInsertRejected(
            'plans',
            $this->planAttributes(['uuid' => $plan['uuid'], 'code' => 'uuid-probe']),
            '`plans.uuid` accepted a duplicate.'
        );
    }

    public function test_tenant_id_is_the_first_column_after_the_primary_key(): void
    {
        foreach (self::TENANT_COLUMN_TABLES as $table) {
            $columns = Schema::getColumnListing($table);

            $this->assertSame('id', $columns[0] ?? null, "`{$table}` does not start with `id`.");
            $this->assertSame(
                'tenant_id',
                $columns[1] ?? null,
                "`{$table}` must place `tenant_id` immediately after `id` (§1)."
            );
        }
    }

    public function test_a_tenant_slug_is_globally_unique_and_requires_a_real_plan(): void
    {
        $plan = $this->insertPlan();
        $this->insertTenant($plan['id'], 'slice-mart');

        $this->assertInsertRejected(
            'tenants',
            $this->tenantAttributes($plan['id'], 'slice-mart'),
            '`tenants.slug` accepted a duplicate — subdomain routing would be ambiguous.'
        );

        $this->assertInsertRejected(
            'tenants',
            $this->tenantAttributes($plan['id'] + 999, 'orphan-tenant'),
            '`tenants.plan_id` accepted a missing plan — the foreign key is not enforced.',
            'foreign',
        );
    }

    public function test_usage_counters_are_unique_per_tenant_metric_and_period(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $counter = [
            'tenant_id' => $first,
            'metric' => 'users',
            'period' => '2026-08',
            'value' => 3,
        ];

        DB::table('tenant_usage_counters')->insert($counter + ['uuid' => (string) Str::uuid()]);

        $this->assertInsertRejected(
            'tenant_usage_counters',
            $counter + ['uuid' => (string) Str::uuid()],
            'A second counter row for the same (tenant, metric, period) was accepted.'
        );

        // The same metric must still be recordable for the next period and for
        // another tenant, or quota tracking would be unusable.
        DB::table('tenant_usage_counters')->insert([
            ['uuid' => (string) Str::uuid()] + ['period' => '2026-09'] + $counter,
            ['uuid' => (string) Str::uuid()] + ['tenant_id' => $second] + $counter,
        ]);

        $this->assertSame(3, DB::table('tenant_usage_counters')->count());
    }

    public function test_a_platform_default_setting_cannot_be_duplicated(): void
    {
        $row = [
            'tenant_id' => null,
            'scope' => 'platform',
            'scope_id' => null,
            'group' => 'general',
            'key' => 'default_currency_code',
            'value' => json_encode('BDT'),
            'value_type' => 'string',
        ];

        DB::table('settings')->insert($row + ['uuid' => (string) Str::uuid()]);

        $this->assertInsertRejected(
            'settings',
            $row + ['uuid' => (string) Str::uuid()],
            'Two platform defaults for the same key were accepted, so §13.3 '
            .'resolution has no single fallback to return.'
        );
    }

    public function test_a_nullable_unique_key_cannot_protect_the_platform_row(): void
    {
        // This is the finding, reproduced. It pins down *why* `settings` and
        // `feature_flags` enforce uniqueness over stored generated columns
        // instead of the literal key printed in §13.3: in both MySQL and
        // SQLite, NULL never equals NULL inside a UNIQUE index, so the exact
        // constraint the document specifies silently permits duplicates on the
        // one row the resolution order depends on most.
        DB::statement(
            'create table nullable_key_probe ('
            .'id integer primary key autoincrement, '
            .'tenant_id integer null, '
            .'scope varchar(32) not null, '
            .'scope_id integer null, '
            .'"group" varchar(32) not null, '
            .'"key" varchar(128) not null)'
        );
        DB::statement(
            'create unique index uq_nullable_key_probe on nullable_key_probe '
            .'(tenant_id, scope, scope_id, "group", "key")'
        );

        $row = [
            'tenant_id' => null,
            'scope' => 'platform',
            'scope_id' => null,
            'group' => 'general',
            'key' => 'default_currency_code',
        ];

        DB::table('nullable_key_probe')->insert($row);
        DB::table('nullable_key_probe')->insert($row);

        $this->assertSame(
            2,
            DB::table('nullable_key_probe')->count(),
            'If this now fails, the database learned to collide NULLs and the '
            .'sentinel columns on `settings`/`feature_flags` can be revisited.'
        );
    }

    public function test_the_same_setting_key_is_independent_per_tenant(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $row = [
            'scope' => 'tenant',
            'scope_id' => null,
            'group' => 'inventory',
            'key' => 'allow_negative_stock',
            'value' => json_encode(false),
            'value_type' => 'boolean',
        ];

        DB::table('settings')->insert([
            ['uuid' => (string) Str::uuid(), 'tenant_id' => $first] + $row,
            ['uuid' => (string) Str::uuid(), 'tenant_id' => $second] + $row,
        ]);

        $this->assertSame(2, DB::table('settings')->count());

        $this->assertInsertRejected(
            'settings',
            ['uuid' => (string) Str::uuid(), 'tenant_id' => $first] + $row,
            'A tenant was allowed two rows for the same setting key.'
        );
    }

    public function test_a_global_feature_flag_is_unique_and_still_overridable_per_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant = $this->insertTenant($plan['id']);

        $flag = ['key' => 'pos_offline_queue', 'description' => 'Gates the unfinished POS offline queue.'];

        DB::table('feature_flags')->insert(['uuid' => (string) Str::uuid(), 'tenant_id' => null] + $flag);

        $this->assertInsertRejected(
            'feature_flags',
            ['uuid' => (string) Str::uuid(), 'tenant_id' => null] + $flag,
            'The global flag row was duplicated, so evaluation order is undefined.'
        );

        DB::table('feature_flags')->insert(
            ['uuid' => (string) Str::uuid(), 'tenant_id' => $tenant, 'enabled' => true] + $flag
        );

        $this->assertSame(2, DB::table('feature_flags')->count());
    }

    public function test_soft_deletes_are_limited_to_master_data(): void
    {
        foreach (['plans', 'tenants'] as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "`{$table}` is master data and should be deactivated via a soft delete (§1)."
            );
        }

        foreach (self::TENANT_COLUMN_TABLES as $table) {
            $this->assertFalse(
                Schema::hasColumn($table, 'deleted_at'),
                "`{$table}` must not be soft-deletable — §1 forbids `deleted_at` on billing "
                .'history and counters, and a hidden row would poison settings resolution.'
            );
        }
    }

    public function test_no_migration_uses_a_float_double_or_mysql_enum_column(): void
    {
        foreach (File::files(database_path('migrations')) as $file) {
            $source = $file->getContents();

            foreach (['->float(', '->double(', '->enum('] as $forbidden) {
                $this->assertStringNotContainsString(
                    $forbidden,
                    $source,
                    "{$file->getFilename()} uses `{$forbidden}`. §1 requires DECIMAL for money, "
                    .'quantity and percentage, and forbids MySQL ENUM outright.'
                );
            }
        }
    }
}
