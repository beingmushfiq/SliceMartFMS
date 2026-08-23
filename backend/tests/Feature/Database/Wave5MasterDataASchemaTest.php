<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 5 master data A schema contract — DATABASE_DESIGN §4 Group C, §16.
 *
 * Group C is the first wave whose tables are *used by* every downstream wave
 * (every product, every stock movement, every document). A defect here does not
 * affect one module; it undermines the entire catalogue. The contract therefore
 * covers:
 *
 *  - All six tables exist with the required columns and uniqueness constraints.
 *  - All composite FK isolation claims are proved by attempting the cross-tenant
 *    insert and requiring rejection (ARCHITECTURE §3.1 layer 4).
 *  - The self-referential `categories` FK is checked and cannot cross tenants.
 *  - Unit conversion factors are stored as DECIMAL(18,8), not floats.
 *  - Tax rates are stored as DECIMAL(8,4), not floats.
 *  - `reason_codes` partitions by context (two codes can share a code string
 *    across contexts, but not within one).
 *  - The deferred `production_lines.capacity_unit_id` FK (originally Wave 2,
 *    closed by migration 103100) is now active — in Wave2OrgSchemaTest,
 *    `test_a_production_line_capacity_unit_cannot_reference_a_unit_in_another_tenant`
 *    carries that assertion; this file does not repeat it.
 */
final class Wave5MasterDataASchemaTest extends SchemaTestCase
{
    /**
     * The six tables Wave 5 owns (DATABASE_DESIGN §16).
     */
    private const WAVE_5_TABLES = [
        'units',
        'unit_conversions',
        'categories',
        'brands',
        'tax_profiles',
        'reason_codes',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Structural smoke tests
    // ─────────────────────────────────────────────────────────────────────────

    public function test_wave_5_creates_every_documented_table(): void
    {
        foreach (self::WAVE_5_TABLES as $table) {
            $this->assertTrue(Schema::hasTable($table), "Wave 5 table `{$table}` is missing.");
        }
    }

    public function test_every_master_data_table_is_tenant_scoped_from_its_second_column(): void
    {
        // unit_conversions is a leaf/join table and does not carry soft-delete.
        // All others — including reason_codes, which is tenant-configurable
        // catalogue data — carry soft-delete so records can be deactivated
        // without breaking historical references.
        $withSoftDelete = ['units', 'categories', 'brands', 'tax_profiles', 'reason_codes'];
        $withoutSoftDelete = ['unit_conversions'];

        foreach (array_merge($withSoftDelete, $withoutSoftDelete) as $table) {
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
        }

        foreach ($withSoftDelete as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "`{$table}` is master data and must be soft-deletable (§1)."
            );
        }

        foreach ($withoutSoftDelete as $table) {
            $this->assertFalse(
                Schema::hasColumn($table, 'deleted_at'),
                "`{$table}` is a leaf/ledger table and must not carry `deleted_at` (§1)."
            );
        }
    }

    public function test_no_wave_5_migration_uses_float_double_or_enum(): void
    {
        // §1 — money, quantity and percentage columns must be DECIMAL. MySQL ENUM
        // is forbidden. Wave1PlatformSchemaTest already scans all migrations, but
        // this duplicates the assertion in Wave 5's own docblock so the coverage
        // is explicit and survives any future refactor of Wave1's scanner.
        foreach ($this->wave5Migrations() as $path) {
            $source = (string) file_get_contents($path);

            foreach (['->float(', '->double(', '->enum('] as $forbidden) {
                $this->assertStringNotContainsString(
                    $forbidden,
                    $source,
                    basename($path)." uses `{$forbidden}`, which violates §1's money/enum rules."
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `units`
    // ─────────────────────────────────────────────────────────────────────────

    public function test_a_unit_code_is_unique_within_a_tenant_and_reusable_across_tenants(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $this->insertUnit($first, ['code' => 'KG']);

        $this->assertInsertRejected(
            'units',
            $this->unitAttributes($first, ['code' => 'KG', 'name' => 'Kilogram Duplicate']),
            'One tenant was allowed two units with the same code.'
        );

        // §1.1 — another tenant may use the same code without collision.
        $this->insertUnit($second, ['code' => 'KG']);

        $this->assertSame(2, DB::table('units')->count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `unit_conversions`
    // ─────────────────────────────────────────────────────────────────────────

    public function test_a_unit_conversion_pair_is_unique_per_tenant(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $kg = $this->insertUnit($tenant, ['code' => 'KG', 'type' => 'weight']);
        $g = $this->insertUnit($tenant, ['code' => 'G', 'type' => 'weight', 'is_base' => false]);

        $this->insertUnitConversion($tenant, $kg, $g);

        $this->assertInsertRejected(
            'unit_conversions',
            $this->unitConversionAttributes($tenant, $kg, $g, ['factor' => '999.00000000']),
            'One tenant was allowed two conversion factors for the same ordered unit pair.'
        );
    }

    public function test_a_conversion_from_unit_cannot_reference_a_unit_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $owner = $this->insertTenant($plan['id'], 'tenant-one');
        $rogue = $this->insertTenant($plan['id'], 'tenant-two');

        $ownerUnit = $this->insertUnit($owner, ['code' => 'KG']);
        $rogueUnit = $this->insertUnit($rogue, ['code' => 'G', 'is_base' => false]);

        $this->assertInsertRejected(
            'unit_conversions',
            $this->unitConversionAttributes($rogue, $ownerUnit, $rogueUnit),
            'A unit conversion was accepted with `from_unit_id` pointing at another tenant. '
            .'The composite FK (tenant_id, from_unit_id) → units is not active.',
            'foreign',
        );
    }

    public function test_a_conversion_to_unit_cannot_reference_a_unit_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $owner = $this->insertTenant($plan['id'], 'tenant-one');
        $rogue = $this->insertTenant($plan['id'], 'tenant-two');

        $ownerUnit = $this->insertUnit($owner, ['code' => 'KG']);
        $rogueUnit = $this->insertUnit($rogue, ['code' => 'G', 'is_base' => false]);

        $this->assertInsertRejected(
            'unit_conversions',
            $this->unitConversionAttributes($rogue, $rogueUnit, $ownerUnit),
            'A unit conversion was accepted with `to_unit_id` pointing at another tenant. '
            .'The composite FK (tenant_id, to_unit_id) → units is not active.',
            'foreign',
        );
    }

    public function test_a_conversion_factor_is_stored_as_decimal_and_not_rounded(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $kg = $this->insertUnit($tenant, ['code' => 'KG']);
        $lb = $this->insertUnit($tenant, ['code' => 'LB', 'is_base' => false]);

        // 1 pound = 453.59237 grams — eight-decimal precision required.
        $this->insertUnitConversion($tenant, $kg, $lb, ['factor' => '0.00220462']);

        $factor = $this->columnValue('unit_conversions', 'factor');

        // DECIMAL(18,8). A FLOAT/DOUBLE column would mangle this.
        $this->assertSame(0.00220462, (float) $factor);
    }

    public function test_deleting_a_unit_that_has_conversions_is_refused_cleanly(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $kg = $this->insertUnit($tenant, ['code' => 'KG']);
        $g = $this->insertUnit($tenant, ['code' => 'G', 'is_base' => false]);

        $this->insertUnitConversion($tenant, $kg, $g);

        // The FK on `from_unit_id` is RESTRICT, so deleting a unit that is
        // referenced as a "from" unit must be rejected cleanly — not with a
        // NOT NULL error on tenant_id (the SET NULL composite-key failure mode).
        $this->assertDeleteRejectedByForeignKey(
            'units',
            $kg,
            'A unit with conversions attached was deleted outright, orphaning conversion data.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `categories`
    // ─────────────────────────────────────────────────────────────────────────

    public function test_a_category_code_is_unique_within_a_tenant_and_reusable_across_tenants(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $this->insertCategory($first, ['code' => 'RAW']);

        $this->assertInsertRejected(
            'categories',
            $this->categoryAttributes($first, ['code' => 'RAW', 'name' => 'Raw Dup']),
            'One tenant was allowed two categories with the same code.'
        );

        $this->insertCategory($second, ['code' => 'RAW']);
        $this->assertSame(2, DB::table('categories')->count());
    }

    public function test_a_child_category_cannot_reference_a_parent_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $owner = $this->insertTenant($plan['id'], 'tenant-one');
        $rogue = $this->insertTenant($plan['id'], 'tenant-two');

        // A root category owned by "owner".
        $parent = $this->insertCategory($owner, ['code' => 'ROOT']);

        // Attempting to create a child in "rogue" pointing at "owner"'s parent.
        // The composite self-FK `(tenant_id, parent_id) → categories(tenant_id, id)`
        // must reject this.
        $this->assertInsertRejected(
            'categories',
            $this->categoryAttributes($rogue, ['code' => 'CHILD', 'parent_id' => $parent]),
            'A category in one tenant was attached to a parent category in another. '
            .'The composite self-FK is not active, so category trees could be stitched '
            .'across tenant boundaries.',
            'foreign',
        );
    }

    public function test_a_root_category_may_exist_without_a_parent(): void
    {
        $tenant = $this->insertTenantWithPlan();

        // `parent_id => null` means root — not checked by the FK (MATCH SIMPLE).
        $this->insertCategory($tenant, ['parent_id' => null]);

        $this->assertSame(1, DB::table('categories')->whereNull('parent_id')->count());
    }

    public function test_a_category_tree_holds_together_end_to_end(): void
    {
        $tenant = $this->insertTenantWithPlan();

        // Root → Subcategory → Leaf — every row must carry the same tenant_id.
        $root = $this->insertCategory($tenant, [
            'code' => 'FOOD',
            'name' => 'Food',
        ]);

        $sub = $this->insertCategory($tenant, [
            'code' => 'BAKERY',
            'name' => 'Bakery',
            'parent_id' => $root,
        ]);

        $leaf = $this->insertCategory($tenant, [
            'code' => 'BREAD',
            'name' => 'Bread',
            'parent_id' => $sub,
        ]);

        // Three rows, all same tenant, joined through parent_id.
        $row = DB::table('categories as leaf')
            ->join('categories as sub', 'sub.id', '=', 'leaf.parent_id')
            ->join('categories as root', 'root.id', '=', 'sub.parent_id')
            ->where('leaf.id', $leaf)
            ->select('leaf.tenant_id', 'root.code as root_code')
            ->first();

        $this->assertNotNull($row, 'Three-level category tree does not join through parent_id.');
        $this->assertSame($tenant, (int) $row->tenant_id);
        $this->assertSame('FOOD', $row->root_code);
    }

    public function test_deleting_a_category_with_children_is_refused_cleanly(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $parent = $this->insertCategory($tenant, ['code' => 'PARENT']);
        $this->insertCategory($tenant, ['code' => 'CHILD', 'parent_id' => $parent]);

        $this->assertDeleteRejectedByForeignKey(
            'categories',
            $parent,
            'A category with children was deleted outright, leaving orphaned child categories.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `brands`
    // ─────────────────────────────────────────────────────────────────────────

    public function test_a_brand_code_is_unique_within_a_tenant_and_reusable_across_tenants(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $this->insertBrand($first, ['code' => 'SM']);

        $this->assertInsertRejected(
            'brands',
            $this->brandAttributes($first, ['code' => 'SM', 'name' => 'SM Dup']),
            'One tenant was allowed two brands with the same code.'
        );

        $this->insertBrand($second, ['code' => 'SM']);
        $this->assertSame(2, DB::table('brands')->count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `tax_profiles`
    // ─────────────────────────────────────────────────────────────────────────

    public function test_a_tax_profile_code_is_unique_within_a_tenant(): void
    {
        $tenant = $this->insertTenantWithPlan();

        $this->insertTaxProfile($tenant, ['code' => 'VAT15']);

        $this->assertInsertRejected(
            'tax_profiles',
            $this->taxProfileAttributes($tenant, ['code' => 'VAT15', 'name' => 'VAT Dup']),
            'One tenant was allowed two tax profiles with the same code.'
        );
    }

    public function test_a_tax_rate_is_stored_as_decimal_and_not_rounded(): void
    {
        $tenant = $this->insertTenantWithPlan();

        $this->insertTaxProfile($tenant, ['rate' => '5.5000']);

        $rate = $this->columnValue('tax_profiles', 'rate');

        // §1 — percentage is DECIMAL(8,4). A FLOAT would mangle fractional rates.
        $this->assertSame(5.5, (float) $rate);
    }

    public function test_both_documented_tax_types_can_be_inserted(): void
    {
        // DATABASE_DESIGN §19 Q2 is open. The schema must accept both documented
        // types now without pre-empting the answer. This test fails if a CHECK
        // or ENUM were added that restricts the vocabulary.
        $tenant = $this->insertTenantWithPlan();

        $this->insertTaxProfile($tenant, ['code' => 'INC', 'name' => 'Incl', 'type' => 'inclusive']);
        $this->insertTaxProfile($tenant, ['code' => 'EXC', 'name' => 'Excl', 'type' => 'exclusive']);

        $this->assertSame(2, DB::table('tax_profiles')->count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `reason_codes`
    // ─────────────────────────────────────────────────────────────────────────

    public function test_a_reason_code_is_unique_within_a_tenant_and_context(): void
    {
        $tenant = $this->insertTenantWithPlan();

        $this->insertReasonCode($tenant, ['context' => 'wastage', 'code' => 'R01']);

        $this->assertInsertRejected(
            'reason_codes',
            $this->reasonCodeAttributes($tenant, [
                'context' => 'wastage',
                'code' => 'R01',
                'name' => 'Duplicate',
            ]),
            'One tenant was allowed two reason codes with the same (context, code).'
        );
    }

    public function test_two_contexts_may_share_a_code_within_the_same_tenant(): void
    {
        // The unique key is (tenant_id, context, code). Two different contexts
        // in one tenant may independently use the code `R01`.
        $tenant = $this->insertTenantWithPlan();

        $this->insertReasonCode($tenant, ['context' => 'wastage', 'code' => 'R01', 'name' => 'Wastage R01']);
        $this->insertReasonCode($tenant, ['context' => 'stock_adjustment', 'code' => 'R01', 'name' => 'Adj R01']);

        $this->assertSame(2, DB::table('reason_codes')->count());
    }

    public function test_all_documented_reason_code_contexts_can_be_inserted(): void
    {
        // DATABASE_DESIGN §4 lists exactly these contexts. All must insert without
        // error so the vocabulary is not narrowed by an undocumented CHECK or ENUM.
        $contexts = [
            'qc_defect', 'wastage', 'stock_adjustment',
            'sales_return', 'purchase_return', 'cancellation', 'rework',
        ];

        $tenant = $this->insertTenantWithPlan();

        foreach ($contexts as $context) {
            DB::table('reason_codes')->insert($this->reasonCodeAttributes($tenant, [
                'context' => $context,
                'code' => strtoupper(substr($context, 0, 8)),
                'name' => "Test: {$context}",
            ]));
        }

        $this->assertSame(count($contexts), DB::table('reason_codes')->count());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cross-tenant isolation — all five FK-bearing tables
    // ─────────────────────────────────────────────────────────────────────────

    public function test_no_wave_5_table_uses_a_single_column_key_to_a_tenant_scoped_parent(): void
    {
        // A `foreignId('unit_id')->constrained()` would compile, migrate, and
        // silently drop tenant isolation to application code. This scan is cheap
        // insurance against that regression in future waves touching these tables.
        $tenantScopedParents = ['units', 'categories', 'brands', 'tax_profiles', 'reason_codes'];

        foreach ($this->wave5Migrations() as $path) {
            $source = (string) file_get_contents($path);

            foreach ($tenantScopedParents as $parent) {
                $this->assertStringNotContainsString(
                    "constrained('{$parent}')",
                    $source,
                    basename($path)." uses a single-column foreign key to `{$parent}`. A "
                    .'tenant-scoped parent must be referenced by a composite key on '
                    ."(tenant_id, {$parent}_id) so the database rejects a cross-tenant "
                    .'reference (§1.1, ARCHITECTURE §3.1 layer 4).'
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Generated columns — sentinel read-only guarantee
    // ─────────────────────────────────────────────────────────────────────────

    public function test_unit_is_base_can_be_cleared_to_allow_a_non_base_unit(): void
    {
        // Basic smoke: the boolean flag is readable/writable (not a generated
        // column), so an Action that changes the base unit works.
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant, ['is_base' => true]);

        DB::table('units')->where('id', $unit)->update(['is_base' => false]);

        $this->assertSame('0', $this->columnValue('units', 'is_base', $unit));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return list<string>
     */
    private function wave5Migrations(): array
    {
        return array_values(array_filter(
            glob(database_path('migrations/*.php')) ?: [],
            static fn (string $path): bool => (bool) preg_match(
                '/10(25|26|27|28|29|30|31)00_/',
                $path
            ),
        ));
    }
}
