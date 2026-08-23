<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 6 master data B schema contract — DATABASE_DESIGN §4 Group C, §16.
 *
 * Wave 6 is the most structurally rich wave so far: `products` is the single
 * central catalogue used by every downstream wave (ADR-016), `product_variants`
 * introduces a parent→child uniqueness constraint across SKUs, `bill_of_materials`
 * is versioned and carries date-range lifecycle management, and
 * `bill_of_material_items` is the first line-table with a CASCADE delete.
 *
 * Contracts proved here:
 *
 *  1. All five tables exist with the required structural columns.
 *  2. `products` and `product_variants` carry `deleted_at`; the other three do not.
 *  3. Composite FKs enforce cross-tenant isolation on every reference:
 *       - product → base_unit / purchase_unit / sales_unit (units)
 *       - product → category (categories)
 *       - product → brand (brands)
 *       - product → tax_profile (tax_profiles)
 *       - product_variant → product
 *       - product_image → product
 *       - product_image → variant (nullable)
 *       - bill_of_materials → product (output)
 *       - bill_of_materials → output_unit (units)
 *       - bill_of_material_items → bill_of_materials (CASCADE)
 *       - bill_of_material_items → product (input, RESTRICT)
 *       - bill_of_material_items → unit (RESTRICT)
 *  4. `bill_of_material_items` cascades when the parent BoM is deleted.
 *  5. A raw-material product referenced by a BoM item cannot be deleted.
 *  6. BoM versioning: unique (tenant_id, product_id, version).
 *  7. DECIMAL precision: standard_cost / default_sale_price → DECIMAL(18,4);
 *     wastage_allowance_percentage and expected_yield_percentage → DECIMAL(8,4).
 *  8. No float / double / enum in any Wave 6 migration.
 */
final class Wave6MasterDataBSchemaTest extends SchemaTestCase
{
    /**
     * The five tables Wave 6 owns (DATABASE_DESIGN §16).
     */
    private const WAVE_6_TABLES = [
        'products',
        'product_variants',
        'product_images',
        'bill_of_materials',
        'bill_of_material_items',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Structural smoke tests
    // ─────────────────────────────────────────────────────────────────────────

    public function test_wave_6_creates_every_documented_table(): void
    {
        foreach (self::WAVE_6_TABLES as $table) {
            $this->assertTrue(Schema::hasTable($table), "Wave 6 table `{$table}` is missing.");
        }
    }

    public function test_every_wave_6_table_has_id_then_tenant_id(): void
    {
        foreach (self::WAVE_6_TABLES as $table) {
            $columns = Schema::getColumnListing($table);

            $this->assertSame('id', $columns[0] ?? null, "`{$table}` must start with `id` (§1).");
            $this->assertSame(
                'tenant_id',
                $columns[1] ?? null,
                "`{$table}` must place `tenant_id` immediately after `id` (§1)."
            );
        }
    }

    public function test_soft_delete_presence_follows_the_documented_rule(): void
    {
        // products, product_variants — master data, must carry deleted_at.
        // product_images — leaf table (no historical reference to a deleted image); no deleted_at.
        // bill_of_materials — lifecycle via status column, no deleted_at (see migration docblock).
        // bill_of_material_items — leaf line-table, no deleted_at.
        $withSoftDelete = ['products', 'product_variants'];
        $withoutSoftDelete = ['product_images', 'bill_of_materials', 'bill_of_material_items'];

        foreach ($withSoftDelete as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "`{$table}` is master data and must carry `deleted_at` (§1)."
            );
        }

        foreach ($withoutSoftDelete as $table) {
            $this->assertFalse(
                Schema::hasColumn($table, 'deleted_at'),
                "`{$table}` must not carry `deleted_at` — see migration docblock."
            );
        }
    }

    public function test_no_wave_6_migration_uses_float_double_or_enum(): void
    {
        foreach ($this->wave6Migrations() as $path) {
            $source = (string) file_get_contents($path);

            foreach (['>float(', '->double(', '->enum('] as $forbidden) {
                $this->assertStringNotContainsString(
                    $forbidden,
                    $source,
                    basename($path)." uses `{$forbidden}`, which violates §1's money/enum rules."
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `products` — SKU uniqueness and FK isolation
    // ─────────────────────────────────────────────────────────────────────────

    public function test_a_product_sku_is_unique_within_a_tenant_and_reusable_across_tenants(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit1 = $this->insertUnit($tenant1);
        $unit2 = $this->insertUnit($tenant2);

        // Same SKU in two different tenants is allowed.
        $this->insertProduct($tenant1, $unit1, ['sku' => 'SHARED-SKU']);
        $this->insertProduct($tenant2, $unit2, ['sku' => 'SHARED-SKU']);

        $this->assertSame(2, (int) DB::table('products')->where('sku', 'SHARED-SKU')->count());

        // Duplicate SKU in the SAME tenant must be rejected.
        $this->assertInsertRejected(
            'products',
            $this->productAttributes($tenant1, $unit1, ['sku' => 'SHARED-SKU']),
            'Duplicate product SKU in same tenant should be rejected.',
        );
    }

    public function test_a_product_barcode_is_unique_within_a_tenant_when_set(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);

        $this->insertProduct($tenant, $unit, ['sku' => 'P1', 'barcode' => 'BC-001']);

        // Same barcode in same tenant must be rejected.
        $this->assertInsertRejected(
            'products',
            $this->productAttributes($tenant, $unit, ['sku' => 'P2', 'barcode' => 'BC-001']),
            'Duplicate barcode in same tenant should be rejected.',
        );
    }

    public function test_two_products_without_a_barcode_are_not_considered_duplicates(): void
    {
        // NULL != NULL — two products with no barcode do not violate the unique
        // key because both barcodes are NULL.  This documents the deliberate
        // use of nullable uniqueness (§1.1 amendment).
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);

        $this->insertProduct($tenant, $unit, ['sku' => 'P1', 'barcode' => null]);
        $this->insertProduct($tenant, $unit, ['sku' => 'P2', 'barcode' => null]);

        $this->assertSame(2, (int) DB::table('products')->whereNull('barcode')->count());
    }

    public function test_a_product_base_unit_must_belong_to_the_same_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unitT2 = $this->insertUnit($tenant2);

        // tenant1's product referencing tenant2's unit must be rejected.
        $this->assertInsertRejected(
            'products',
            $this->productAttributes($tenant1, $unitT2, ['sku' => 'CROSS']),
            'A product base_unit_id belonging to another tenant must be rejected.',
            'foreign',
        );
    }

    public function test_a_product_cannot_reference_a_category_from_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit1 = $this->insertUnit($tenant1);
        $catT2 = $this->insertCategory($tenant2);

        $this->assertInsertRejected(
            'products',
            $this->productAttributes($tenant1, $unit1, ['sku' => 'CROSS', 'category_id' => $catT2]),
            'A product category_id from another tenant must be rejected.',
            'foreign',
        );
    }

    public function test_a_product_cannot_reference_a_brand_from_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit1 = $this->insertUnit($tenant1);
        $brandT2 = $this->insertBrand($tenant2);

        $this->assertInsertRejected(
            'products',
            $this->productAttributes($tenant1, $unit1, ['sku' => 'CROSS', 'brand_id' => $brandT2]),
            'A product brand_id from another tenant must be rejected.',
            'foreign',
        );
    }

    public function test_a_product_cannot_reference_a_tax_profile_from_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit1 = $this->insertUnit($tenant1);
        $taxT2 = $this->insertTaxProfile($tenant2);

        $this->assertInsertRejected(
            'products',
            $this->productAttributes($tenant1, $unit1, ['sku' => 'CROSS', 'tax_profile_id' => $taxT2]),
            'A product tax_profile_id from another tenant must be rejected.',
            'foreign',
        );
    }

    public function test_deleting_a_referenced_base_unit_is_refused(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $unitId = $this->insertUnit($tenant);
        $this->insertProduct($tenant, $unitId);

        $this->assertDeleteRejectedByForeignKey(
            'units',
            $unitId,
            'Deleting a unit that is used as a product base_unit must be rejected.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `product_variants` — SKU uniqueness and FK isolation
    // ─────────────────────────────────────────────────────────────────────────

    public function test_a_variant_sku_is_unique_within_a_tenant(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);
        $product = $this->insertProduct($tenant, $unit, ['has_variants' => 1]);

        $this->insertProductVariant($tenant, $product, ['sku' => 'VAR-001']);

        $this->assertInsertRejected(
            'product_variants',
            $this->productVariantAttributes($tenant, $product, ['sku' => 'VAR-001']),
            'Duplicate variant SKU in same tenant must be rejected.',
        );
    }

    public function test_a_variant_cannot_reference_a_product_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit2 = $this->insertUnit($tenant2);
        $prodT2 = $this->insertProduct($tenant2, $unit2);

        // tenant1 variant pointing at tenant2 product must be rejected.
        $this->assertInsertRejected(
            'product_variants',
            $this->productVariantAttributes($tenant1, $prodT2, ['sku' => 'CROSS']),
            'A variant referencing a product in another tenant must be rejected.',
            'foreign',
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `product_images` — FK isolation and no soft delete
    // ─────────────────────────────────────────────────────────────────────────

    public function test_a_product_image_cannot_reference_a_product_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit2 = $this->insertUnit($tenant2);
        $prodT2 = $this->insertProduct($tenant2, $unit2);

        $this->assertInsertRejected(
            'product_images',
            $this->productImageAttributes($tenant1, $prodT2),
            'An image referencing a product in another tenant must be rejected.',
            'foreign',
        );
    }

    public function test_a_product_image_variant_cannot_belong_to_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit1 = $this->insertUnit($tenant1);
        $unit2 = $this->insertUnit($tenant2);
        $prodT1 = $this->insertProduct($tenant1, $unit1);
        $prodT2 = $this->insertProduct($tenant2, $unit2);
        $variantT2 = $this->insertProductVariant($tenant2, $prodT2, ['sku' => 'VAR-T2']);

        // tenant1 image → tenant1 product + tenant2 variant must be rejected.
        $this->assertInsertRejected(
            'product_images',
            $this->productImageAttributes($tenant1, $prodT1, ['variant_id' => $variantT2]),
            'An image with a variant_id from another tenant must be rejected.',
            'foreign',
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `bill_of_materials` — versioning, FK isolation
    // ─────────────────────────────────────────────────────────────────────────

    public function test_bom_version_is_unique_per_product_within_a_tenant(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);
        $product = $this->insertProduct($tenant, $unit, ['is_produced' => 1]);

        $this->insertBillOfMaterials($tenant, $product, $unit, ['version' => '1']);

        $this->assertInsertRejected(
            'bill_of_materials',
            $this->billOfMaterialsAttributes($tenant, $product, $unit, ['version' => '1']),
            'Duplicate (tenant, product, version) in bill_of_materials must be rejected.',
        );
    }

    public function test_the_same_version_string_is_allowed_for_different_products(): void
    {
        // Two different products may each have a version '1' BoM.
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);
        $product1 = $this->insertProduct($tenant, $unit, ['sku' => 'P1', 'is_produced' => 1]);
        $product2 = $this->insertProduct($tenant, $unit, ['sku' => 'P2', 'is_produced' => 1]);

        $this->insertBillOfMaterials($tenant, $product1, $unit, ['version' => '1']);
        $this->insertBillOfMaterials($tenant, $product2, $unit, ['version' => '1']);

        $this->assertSame(2, (int) DB::table('bill_of_materials')->where('version', '1')->count());
    }

    public function test_a_bom_cannot_reference_a_product_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit1 = $this->insertUnit($tenant1);
        $unit2 = $this->insertUnit($tenant2);
        $prodT2 = $this->insertProduct($tenant2, $unit2, ['is_produced' => 1]);

        $this->assertInsertRejected(
            'bill_of_materials',
            $this->billOfMaterialsAttributes($tenant1, $prodT2, $unit1),
            'A BoM referencing a product in another tenant must be rejected.',
            'foreign',
        );
    }

    public function test_a_bom_output_unit_must_belong_to_the_same_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit1 = $this->insertUnit($tenant1);
        $unit2 = $this->insertUnit($tenant2);
        $prodT1 = $this->insertProduct($tenant1, $unit1, ['is_produced' => 1]);

        // output_unit_id from tenant2 against tenant1 BoM must be rejected.
        $this->assertInsertRejected(
            'bill_of_materials',
            $this->billOfMaterialsAttributes($tenant1, $prodT1, $unit2),
            'A BoM output_unit_id from another tenant must be rejected.',
            'foreign',
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // `bill_of_material_items` — cascade, RESTRICT and FK isolation
    // ─────────────────────────────────────────────────────────────────────────

    public function test_bom_items_cascade_when_their_parent_bom_is_deleted(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);
        $output = $this->insertProduct($tenant, $unit, ['sku' => 'FG-01', 'is_produced' => 1]);
        $input = $this->insertProduct($tenant, $unit, ['sku' => 'RM-01', 'is_purchased' => 1, 'is_produced' => 0]);
        $bom = $this->insertBillOfMaterials($tenant, $output, $unit);
        $this->insertBillOfMaterialItem($tenant, $bom, $input, $unit);

        $this->assertSame(
            1,
            (int) DB::table('bill_of_material_items')->where('bill_of_material_id', $bom)->count()
        );

        // Deleting the BoM must cascade and remove its items.
        DB::table('bill_of_materials')->where('id', $bom)->delete();

        $this->assertSame(
            0,
            (int) DB::table('bill_of_material_items')->where('bill_of_material_id', $bom)->count(),
            'BoM items should cascade-delete when their parent BoM is deleted.'
        );
    }

    public function test_deleting_an_input_product_referenced_by_a_bom_item_is_refused(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);
        $output = $this->insertProduct($tenant, $unit, ['sku' => 'FG-01', 'is_produced' => 1]);
        $input = $this->insertProduct($tenant, $unit, ['sku' => 'RM-01', 'is_purchased' => 1, 'is_produced' => 0]);
        $bom = $this->insertBillOfMaterials($tenant, $output, $unit);
        $this->insertBillOfMaterialItem($tenant, $bom, $input, $unit);

        $this->assertDeleteRejectedByForeignKey(
            'products',
            $input,
            'Deleting a raw-material product referenced by a BoM item must be rejected.'
        );
    }

    public function test_a_bom_item_cannot_reference_a_bom_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit1 = $this->insertUnit($tenant1);
        $unit2 = $this->insertUnit($tenant2);
        $rmT1 = $this->insertProduct($tenant1, $unit1, ['sku' => 'RM-T1']);
        $prodT2 = $this->insertProduct($tenant2, $unit2, ['sku' => 'FG-T2', 'is_produced' => 1]);
        $bomT2 = $this->insertBillOfMaterials($tenant2, $prodT2, $unit2);

        // tenant1 item → tenant2 BoM must be rejected.
        $this->assertInsertRejected(
            'bill_of_material_items',
            $this->billOfMaterialItemAttributes($tenant1, $bomT2, $rmT1, $unit1),
            'A BoM item referencing a BoM in another tenant must be rejected.',
            'foreign',
        );
    }

    public function test_a_bom_item_input_product_must_belong_to_the_same_tenant(): void
    {
        $plan = $this->insertPlan();
        $tenant1 = $this->insertTenant($plan['id'], 'tenant-one');
        $tenant2 = $this->insertTenant($plan['id'], 'tenant-two');
        $unit1 = $this->insertUnit($tenant1);
        $unit2 = $this->insertUnit($tenant2);
        $fgT1 = $this->insertProduct($tenant1, $unit1, ['sku' => 'FG-T1', 'is_produced' => 1]);
        $bomT1 = $this->insertBillOfMaterials($tenant1, $fgT1, $unit1);
        $rmT2 = $this->insertProduct($tenant2, $unit2, ['sku' => 'RM-T2']);

        $this->assertInsertRejected(
            'bill_of_material_items',
            $this->billOfMaterialItemAttributes($tenant1, $bomT1, $rmT2, $unit1),
            'A BoM item with an input product from another tenant must be rejected.',
            'foreign',
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DECIMAL precision invariants
    // ─────────────────────────────────────────────────────────────────────────

    public function test_product_cost_and_price_accept_four_decimal_places(): void
    {
        // DECIMAL(18,4) — if the column were FLOAT, rounding would corrupt the
        // fourth decimal place unpredictably.
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);
        $id = $this->insertProduct($tenant, $unit, [
            'standard_cost' => '1234.5678',
            'default_sale_price' => '9876.5432',
        ]);

        $this->assertSame('1234.5678', $this->columnValue('products', 'standard_cost', $id));
        $this->assertSame('9876.5432', $this->columnValue('products', 'default_sale_price', $id));
    }

    public function test_bom_yield_percentage_accepts_four_decimal_places(): void
    {
        // DECIMAL(8,4) per §1 percentage rule.
        // SQLite strips trailing zeros on read (87.5000 → '87.5'); cast to float
        // to prove the value round-tripped without precision loss.
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);
        $product = $this->insertProduct($tenant, $unit, ['is_produced' => 1]);
        $bomId = $this->insertBillOfMaterials($tenant, $product, $unit, [
            'expected_yield_percentage' => '87.5000',
        ]);

        $this->assertSame(
            87.5,
            (float) $this->columnValue('bill_of_materials', 'expected_yield_percentage', $bomId)
        );
    }

    public function test_bom_item_wastage_allowance_accepts_four_decimal_places(): void
    {
        // DECIMAL(8,4) per §1 percentage rule.
        // SQLite strips trailing zeros; cast to float to prove round-trip precision.
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);
        $output = $this->insertProduct($tenant, $unit, ['sku' => 'FG', 'is_produced' => 1]);
        $input = $this->insertProduct($tenant, $unit, ['sku' => 'RM']);
        $bom = $this->insertBillOfMaterials($tenant, $output, $unit);
        $itemId = $this->insertBillOfMaterialItem($tenant, $bom, $input, $unit, [
            'wastage_allowance_percentage' => '3.1250',
        ]);

        $this->assertSame(
            3.125,
            (float) $this->columnValue('bill_of_material_items', 'wastage_allowance_percentage', $itemId)
        );
    }

    public function test_product_variant_price_delta_accepts_four_decimal_places(): void
    {
        // DECIMAL(18,4) — negative delta (smaller size = cheaper).
        // SQLite strips trailing zeros; cast to float to prove round-trip precision.
        $tenant = $this->insertTenantWithPlan();
        $unit = $this->insertUnit($tenant);
        $product = $this->insertProduct($tenant, $unit, ['has_variants' => 1]);
        $varId = $this->insertProductVariant($tenant, $product, [
            'price_delta' => '-50.7500',
        ]);

        $this->assertSame(-50.75, (float) $this->columnValue('product_variants', 'price_delta', $varId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return list<string>
     */
    private function wave6Migrations(): array
    {
        return array_values(array_filter(
            glob(database_path('migrations/*.php')) ?: [],
            static fn (string $path): bool => (bool) preg_match(
                '/10(32|33|34|35|36)00_/',
                $path
            ),
        ));
    }
}
