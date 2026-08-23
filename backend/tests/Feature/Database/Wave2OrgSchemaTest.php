<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

/**
 * Wave 2 org schema contract — DATABASE_DESIGN §1.1-§1.3, §2, §16.
 *
 * Wave 2 is the first wave where tenant isolation is a *schema* promise rather
 * than an application one. ARCHITECTURE §3.1 layer 4 states the database itself
 * rejects a cross-tenant reference, and layer 5 states a test proves it and
 * fails closed. This file is layer 5 for the org hierarchy.
 *
 * Two behaviours here were found by probing a schema that had already migrated
 * cleanly, and neither would be caught by reading the DDL:
 *
 *   - a composite foreign key genuinely does reject a cross-tenant parent
 *     (`test_a_branch_cannot_reference_a_company_in_another_tenant`), and
 *   - `ON DELETE SET NULL` under a composite key led by `tenant_id` fails with
 *     a NOT NULL violation naming the wrong table, so §1.3 forbids it
 *     (`test_deleting_a_referenced_branch_is_refused_cleanly`).
 */
final class Wave2OrgSchemaTest extends SchemaTestCase
{
    /**
     * The four tables Wave 2 owns (§16).
     */
    private const WAVE_2_TABLES = [
        'companies',
        'branches',
        'factories',
        'production_lines',
    ];

    public function test_wave_2_creates_every_documented_table(): void
    {
        foreach (self::WAVE_2_TABLES as $table) {
            $this->assertTrue(Schema::hasTable($table), "Wave 2 table `{$table}` is missing.");
        }
    }

    public function test_every_org_table_is_tenant_scoped_from_its_second_column(): void
    {
        foreach (self::WAVE_2_TABLES as $table) {
            $columns = Schema::getColumnListing($table);

            $this->assertSame('id', $columns[0] ?? null, "`{$table}` does not start with `id`.");
            $this->assertSame(
                'tenant_id',
                $columns[1] ?? null,
                "`{$table}` must place `tenant_id` immediately after `id` (§1)."
            );
            $this->assertTrue(
                Schema::hasColumn($table, 'uuid'),
                "`{$table}` has no `uuid`, so internal ids would leak into URLs (§1)."
            );
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "`{$table}` is master data and must be deactivated by a soft delete, never removed (§1.3)."
            );
        }
    }

    public function test_a_company_name_is_unique_within_a_tenant_and_reusable_across_tenants(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $this->insertCompany($first, ['name' => 'Slice Mart Ltd']);

        $this->assertInsertRejected(
            'companies',
            $this->companyAttributes($first, ['name' => 'Slice Mart Ltd']),
            'One tenant was allowed two companies with the same name.'
        );

        // §1.1 — the key is tenant-scoped, so an unrelated tenant may trade
        // under the same name. A globally unique name would leak the existence
        // of other tenants through a validation error.
        $this->insertCompany($second, ['name' => 'Slice Mart Ltd']);

        $this->assertSame(2, DB::table('companies')->count());
    }

    public function test_at_most_one_default_company_exists_per_tenant(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $this->insertCompany($first, ['name' => 'Primary', 'is_default' => true]);

        $this->assertInsertRejected(
            'companies',
            $this->companyAttributes($first, ['name' => 'Also Primary', 'is_default' => true]),
            'A tenant was allowed two default companies, so §13.3 scope resolution '
            .'has no single company to fall back to.'
        );

        // The sentinel must not restrict non-defaults: it folds to NULL when
        // `is_default = 0`, and NULLs never collide.
        $this->insertCompany($first, ['name' => 'Second Company']);
        $this->insertCompany($first, ['name' => 'Third Company']);

        // Nor may it leak across tenants — every tenant needs its own default.
        $this->insertCompany($second, ['name' => 'Their Primary', 'is_default' => true]);

        $this->assertSame(4, DB::table('companies')->count());
    }

    public function test_a_branch_cannot_reference_a_company_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $owner = $this->insertTenant($plan['id'], 'tenant-one');
        $attacker = $this->insertTenant($plan['id'], 'tenant-two');

        $company = $this->insertCompany($owner);

        // ARCHITECTURE §3.1 layer 4. A single-column `company_id` foreign key
        // would accept this row, because the company does exist — just not in
        // this tenant. Only the composite `(tenant_id, company_id)` key can
        // tell the difference, and this is the assertion that proves it does.
        $this->assertInsertRejected(
            'branches',
            $this->branchAttributes($attacker, $company, ['code' => 'STOLEN']),
            'A branch in one tenant was attached to a company in another. Tenant '
            .'isolation is not enforced by the schema, so layer 4 of §3.1 is absent.',
            'foreign',
        );
    }

    public function test_a_factory_cannot_reference_a_branch_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $owner = $this->insertTenant($plan['id'], 'tenant-one');
        $attacker = $this->insertTenant($plan['id'], 'tenant-two');

        $branch = $this->insertBranch($owner, $this->insertCompany($owner));
        $attackerCompany = $this->insertCompany($attacker);

        // The nullable branch key must be checked too: nullable means "may be
        // absent", not "may point anywhere".
        $this->assertInsertRejected(
            'factories',
            $this->factoryAttributes($attacker, $attackerCompany, ['branch_id' => $branch]),
            'A factory was attached to a branch belonging to another tenant.',
            'foreign',
        );
    }

    public function test_a_factory_may_exist_without_a_branch(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $company = $this->insertCompany($tenant);

        // §2 — a tenant that runs production without a branch hierarchy is
        // valid, so the nullable key must actually accept NULL.
        $this->insertFactory($tenant, $company, ['branch_id' => null]);

        $this->assertSame(1, DB::table('factories')->whereNull('branch_id')->count());
    }

    public function test_deleting_a_referenced_branch_is_refused_cleanly(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $company = $this->insertCompany($tenant);
        $branch = $this->insertBranch($tenant, $company);

        $this->insertFactory($tenant, $company, ['branch_id' => $branch]);

        // This is the Wave 2 finding, pinned. `RESTRICT` refuses the delete with
        // a foreign key error naming `branches`. `SET NULL` also refuses it, but
        // with `NOT NULL constraint failed: factories.tenant_id`, because it
        // nulls every column of the composite key including the tenant. Both
        // "fail", so a test that only asserted the delete threw would pass on
        // the broken schema; the helper distinguishes them.
        $this->assertDeleteRejectedByForeignKey(
            'branches',
            $branch,
            'A branch with a factory attached was deleted outright, orphaning production data.'
        );
    }

    public function test_a_branch_code_is_unique_per_tenant_across_companies(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $first = $this->insertCompany($tenant, ['name' => 'Company One']);
        $second = $this->insertCompany($tenant, ['name' => 'Company Two']);

        $this->insertBranch($tenant, $first, ['code' => 'DHK-01']);

        // Deliberately tenant-scoped rather than company-scoped: a branch code
        // is printed on documents and exports where the company is not present
        // to disambiguate it, so two companies in one tenant may not share one.
        $this->assertInsertRejected(
            'branches',
            $this->branchAttributes($tenant, $second, ['code' => 'DHK-01']),
            'Two companies in the same tenant were allowed the same branch code, '
            .'so a code on a printed document is ambiguous.'
        );
    }

    public function test_a_default_branch_is_allowed_once_per_company_not_once_per_tenant(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $first = $this->insertCompany($tenant, ['name' => 'Company One']);
        $second = $this->insertCompany($tenant, ['name' => 'Company Two']);

        $this->insertBranch($tenant, $first, ['code' => 'C1-MAIN', 'is_default' => true]);

        $this->assertInsertRejected(
            'branches',
            $this->branchAttributes($tenant, $first, ['code' => 'C1-ALT', 'is_default' => true]),
            'A company was allowed two default branches.'
        );

        // A tenant with several companies needs a default branch in each, which
        // is why the sentinel folds to `company_id` and not to `tenant_id`.
        $this->insertBranch($tenant, $second, ['code' => 'C2-MAIN', 'is_default' => true]);

        $this->assertSame(2, DB::table('branches')->where('is_default', true)->count());
    }

    public function test_a_production_line_code_is_unique_per_factory_not_per_tenant(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $company = $this->insertCompany($tenant);
        $first = $this->insertFactory($tenant, $company, ['code' => 'F-01']);
        $second = $this->insertFactory($tenant, $company, ['code' => 'F-02']);

        $this->insertProductionLine($tenant, $first, ['code' => 'L1']);

        $this->assertInsertRejected(
            'production_lines',
            $this->productionLineAttributes($tenant, $first, ['code' => 'L1']),
            'One factory was allowed two production lines with the same code.'
        );

        // C4 — a tenant may run any number of lines, and two factories may each
        // number their first line `L1`.
        $this->insertProductionLine($tenant, $second, ['code' => 'L1']);
        $this->insertProductionLine($tenant, $first, ['code' => 'L2']);

        $this->assertSame(3, DB::table('production_lines')->count());
    }

    public function test_a_production_line_cannot_reference_a_factory_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $owner = $this->insertTenant($plan['id'], 'tenant-one');
        $attacker = $this->insertTenant($plan['id'], 'tenant-two');

        $factory = $this->insertFactory($owner, $this->insertCompany($owner));

        $this->assertInsertRejected(
            'production_lines',
            $this->productionLineAttributes($attacker, $factory),
            'A production line was attached to a factory in another tenant.',
            'foreign',
        );
    }

    public function test_capacity_is_stored_as_a_decimal_and_not_rounded(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $factory = $this->insertFactory($tenant, $this->insertCompany($tenant));

        $this->insertProductionLine($tenant, $factory, ['capacity_per_shift' => '1250.7500']);

        $capacity = $this->columnValue('production_lines', 'capacity_per_shift');

        // §1 — quantity is DECIMAL(18,4). A float column would return
        // 1250.75000000001 or similar and quietly corrupt capacity planning.
        $this->assertSame(1250.75, (float) $capacity);
    }

    public function test_a_production_line_capacity_unit_cannot_reference_a_unit_in_another_tenant(): void
    {
        // Wave 5 closure of the deferred forward reference documented in
        // DATABASE_DESIGN §16.1 (the deferred-forward-reference table) and
        // originally pinned in this file as
        // `test_the_deferred_capacity_unit_foreign_key_is_still_owed`.
        //
        // That test asserted `units` did not yet exist and accepted a
        // `capacity_unit_id` pointing at a phantom row. Now that migration 103100
        // has closed the FK, this replaces it: the composite
        // `(tenant_id, capacity_unit_id) → units(tenant_id, id)` must reject a
        // unit that exists but belongs to a different tenant.
        $plan = $this->insertPlan();
        $owner = $this->insertTenant($plan['id'], 'tenant-one');
        $rogue = $this->insertTenant($plan['id'], 'tenant-two');

        // A real unit owned by tenant "owner".
        $unit = $this->insertUnit($owner, ['code' => 'KG', 'type' => 'weight']);

        $factory = $this->insertFactory($rogue, $this->insertCompany($rogue));

        // The composite FK should reject this: the unit belongs to "owner" but
        // the production line sits in "rogue". A single-column FK would accept it.
        $this->assertInsertRejected(
            'production_lines',
            $this->productionLineAttributes($rogue, $factory, ['capacity_unit_id' => $unit]),
            'A production line was allowed to reference a capacity unit that belongs to '
            .'another tenant. The composite FK (tenant_id, capacity_unit_id) → units is '
            .'not active, so DATABASE_DESIGN §16.1 is violated.',
            'foreign',
        );
    }

    public function test_the_default_sentinels_are_derived_and_never_written(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $company = $this->insertCompany($tenant, ['is_default' => true]);

        $this->assertSame(
            $tenant,
            (int) $this->columnValue('companies', 'default_key', $company),
            'The company `default_key` was not derived from `is_default`.'
        );

        // A generated column is read-only: an Action that tried to maintain the
        // sentinel by hand would fail here, which is the intent.
        $rejected = false;

        try {
            DB::table('companies')->where('id', $company)->update(['default_key' => 999]);
        } catch (Throwable) {
            $rejected = true;
        }

        $this->assertTrue($rejected, '`companies.default_key` is writable, so it is not a generated column.');

        // Clearing the flag releases the sentinel, which is what lets an Action
        // promote a different company inside one transaction.
        DB::table('companies')->where('id', $company)->update(['is_default' => false]);

        $this->assertNull($this->columnValue('companies', 'default_key', $company));
    }

    public function test_the_org_hierarchy_holds_together_end_to_end(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $company = $this->insertCompany($tenant, ['is_default' => true]);
        $branch = $this->insertBranch($tenant, $company, ['type' => 'factory', 'is_default' => true]);
        $factory = $this->insertFactory($tenant, $company, ['branch_id' => $branch]);
        $line = $this->insertProductionLine($tenant, $factory);

        // Tenant → Company → Branch → Factory → Production Line, every hop
        // carrying the same `tenant_id` (ARCHITECTURE §2.1).
        $row = DB::table('production_lines as pl')
            ->join('factories as f', function ($join): void {
                $join->on('f.id', '=', 'pl.factory_id')->on('f.tenant_id', '=', 'pl.tenant_id');
            })
            ->join('branches as b', function ($join): void {
                $join->on('b.id', '=', 'f.branch_id')->on('b.tenant_id', '=', 'f.tenant_id');
            })
            ->join('companies as c', function ($join): void {
                $join->on('c.id', '=', 'b.company_id')->on('c.tenant_id', '=', 'b.tenant_id');
            })
            ->where('pl.id', $line)
            ->select('pl.tenant_id', 'c.id as company_id')
            ->first();

        $this->assertNotNull($row, 'The org hierarchy does not join cleanly on (tenant_id, id).');
        $this->assertSame($tenant, (int) $row->tenant_id);
        $this->assertSame($company, (int) $row->company_id);
    }

    public function test_no_org_table_uses_a_single_column_key_to_a_tenant_scoped_parent(): void
    {
        // A `foreignId('company_id')->constrained()` would compile and migrate,
        // and would silently drop tenant isolation to application code. This
        // scan is cheap insurance against that regression in future waves.
        $tenantScopedParents = ['companies', 'branches', 'factories', 'production_lines'];

        foreach ($this->waveTwoMigrations() as $path) {
            $source = (string) file_get_contents($path);

            foreach ($tenantScopedParents as $parent) {
                $singular = Str::singular($parent);

                $this->assertStringNotContainsString(
                    "constrained('{$parent}')",
                    $source,
                    basename($path)." uses a single-column foreign key to `{$parent}`. A "
                    .'tenant-scoped parent must be referenced by a composite key on '
                    ."(tenant_id, {$singular}_id) so the database rejects a cross-tenant "
                    .'reference (§1.1, ARCHITECTURE §3.1 layer 4).'
                );
            }
        }
    }

    /**
     * @return list<string>
     */
    private function waveTwoMigrations(): array
    {
        return array_values(array_filter(
            glob(database_path('migrations/*.php')) ?: [],
            static fn (string $path): bool => (bool) preg_match(
                '/create_(companies|branches|factories|production_lines)_table/',
                $path
            ),
        ));
    }
}
