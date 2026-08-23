<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Schema;

/**
 * Wave 7 — master data C schema contract tests.
 *
 * Tables under test: warehouses, warehouse_locations, parties,
 * party_addresses, party_contacts, price_lists, price_list_items,
 * discount_rules. Plus the deferred FK closure (104500) that adds
 * parties.price_list_id → price_lists.
 *
 * Testing philosophy: every claim is proved behaviourally — a duplicate row
 * is attempted and the database rejects it, a cross-tenant FK is probed and
 * refused, etc. Reading index metadata is not sufficient (a unique index that
 * can never fire passes a metadata check with flying colours).
 */
class Wave7MasterDataCSchemaTest extends SchemaTestCase
{
    // ─────────────────────────────────────────────────────────────────────────
    // Existence
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_all_wave_7_tables_exist(): void
    {
        foreach ([
            'warehouses',
            'warehouse_locations',
            'parties',
            'party_addresses',
            'party_contacts',
            'price_lists',
            'price_list_items',
            'discount_rules',
        ] as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Table `{$table}` does not exist."
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Structural: tenant_id is first non-id column
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_warehouses_tenant_id_is_second_column(): void
    {
        $cols = Schema::getColumnListing('warehouses');
        self::assertSame('tenant_id', $cols[1]);
    }

    /** @test */
    public function test_warehouse_locations_tenant_id_is_second_column(): void
    {
        $cols = Schema::getColumnListing('warehouse_locations');
        self::assertSame('tenant_id', $cols[1]);
    }

    /** @test */
    public function test_parties_tenant_id_is_second_column(): void
    {
        $cols = Schema::getColumnListing('parties');
        self::assertSame('tenant_id', $cols[1]);
    }

    /** @test */
    public function test_price_lists_tenant_id_is_second_column(): void
    {
        $cols = Schema::getColumnListing('price_lists');
        self::assertSame('tenant_id', $cols[1]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Soft delete presence
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_master_data_tables_have_deleted_at(): void
    {
        foreach (['warehouses', 'parties', 'price_lists', 'discount_rules'] as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table `{$table}` should have deleted_at (master data)."
            );
        }
    }

    /** @test */
    public function test_child_tables_have_no_deleted_at(): void
    {
        // warehouse_locations, party_addresses, party_contacts,
        // price_list_items have no independent lifecycle.
        foreach ([
            'warehouse_locations',
            'party_addresses',
            'party_contacts',
            'price_list_items',
        ] as $table) {
            self::assertFalse(
                Schema::hasColumn($table, 'deleted_at'),
                "Table `{$table}` should NOT have deleted_at."
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // No float / double / enum columns
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_no_float_double_or_enum_columns_in_wave_7_tables(): void
    {
        $forbidden = ['float', 'double', 'enum'];

        foreach ([
            'warehouses', 'warehouse_locations', 'parties', 'party_addresses',
            'party_contacts', 'price_lists', 'price_list_items', 'discount_rules',
        ] as $table) {
            foreach (Schema::getColumnListing($table) as $col) {
                $type = Schema::getColumnType($table, $col);
                self::assertNotContains(
                    $type,
                    $forbidden,
                    "Table `{$table}`.`{$col}` uses forbidden type `{$type}`."
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // warehouses: unique (tenant_id, code)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_warehouse_code_is_unique_within_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $this->insertWarehouse($tid, ['code' => 'WH-01']);

        $this->assertInsertRejected(
            'warehouses',
            $this->warehouseAttributes($tid, ['code' => 'WH-01']),
            'Duplicate warehouse code within same tenant should be rejected.'
        );
    }

    /** @test */
    public function test_same_warehouse_code_allowed_across_tenants(): void
    {
        $t1 = $this->insertTenantWithPlan('tenant-a');
        $t2 = $this->insertTenantWithPlan('tenant-b');

        $this->insertWarehouse($t1, ['code' => 'WH-01']);
        // Must not throw:
        $id = $this->insertWarehouse($t2, ['code' => 'WH-01']);
        self::assertGreaterThan(0, $id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // warehouses: cross-tenant composite FKs (company, branch, factory)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_warehouse_rejects_cross_tenant_company(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-wh-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-wh-b');

        $cid = $this->insertCompany($t1);

        $this->assertInsertRejected(
            'warehouses',
            $this->warehouseAttributes($t2, ['company_id' => $cid]),
            'Cross-tenant company_id should be rejected by composite FK.',
            'foreign'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // warehouse_locations: unique (tenant_id, warehouse_id, code)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_location_code_unique_within_warehouse(): void
    {
        $tid = $this->insertTenantWithPlan();
        $whid = $this->insertWarehouse($tid);
        $this->insertWarehouseLocation($tid, $whid, ['code' => 'A-01']);

        $this->assertInsertRejected(
            'warehouse_locations',
            $this->warehouseLocationAttributes($tid, $whid, ['code' => 'A-01']),
            'Duplicate location code in same warehouse should be rejected.'
        );
    }

    /** @test */
    public function test_same_location_code_allowed_in_different_warehouses(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh1 = $this->insertWarehouse($tid, ['code' => 'WH-1']);
        $wh2 = $this->insertWarehouse($tid, ['code' => 'WH-2']);

        $this->insertWarehouseLocation($tid, $wh1, ['code' => 'A-01']);
        $id = $this->insertWarehouseLocation($tid, $wh2, ['code' => 'A-01']);
        self::assertGreaterThan(0, $id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // warehouse_locations: cross-tenant composite FKs
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_warehouse_location_rejects_cross_tenant_warehouse(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-wl-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-wl-b');

        $whid = $this->insertWarehouse($t1);

        $this->assertInsertRejected(
            'warehouse_locations',
            $this->warehouseLocationAttributes($t2, $whid),
            'Cross-tenant warehouse_id should be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_warehouse_location_self_referential_parent_is_restricted(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-loc-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-loc-b');

        $wh1 = $this->insertWarehouse($t1);
        $parent = $this->insertWarehouseLocation($t1, $wh1, ['code' => 'ZONE-A']);

        $wh2 = $this->insertWarehouse($t2);

        // t2 location tries to use t1's location as parent — cross-tenant.
        $this->assertInsertRejected(
            'warehouse_locations',
            $this->warehouseLocationAttributes($t2, $wh2, ['parent_id' => $parent, 'code' => 'BIN-X']),
            'Cross-tenant parent_id should be rejected by composite FK.',
            'foreign'
        );
    }

    /** @test */
    public function test_deleting_warehouse_with_location_is_refused(): void
    {
        $tid = $this->insertTenantWithPlan();
        $whid = $this->insertWarehouse($tid);
        $this->insertWarehouseLocation($tid, $whid);

        $this->assertDeleteRejectedByForeignKey(
            'warehouses',
            $whid,
            'Deleting a warehouse that has locations should be refused.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // parties: unique (tenant_id, code)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_party_code_unique_within_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $this->insertPriceList($tid);
        $this->insertParty($tid, ['code' => 'SUP-001']);

        $this->assertInsertRejected(
            'parties',
            $this->partyAttributes($tid, ['code' => 'SUP-001']),
            'Duplicate party code within same tenant should be rejected.'
        );
    }

    /** @test */
    public function test_same_party_code_allowed_across_tenants(): void
    {
        $t1 = $this->insertTenantWithPlan('ten-p-a');
        $t2 = $this->insertTenantWithPlan('ten-p-b');

        $this->insertParty($t1, ['code' => 'SUP-001']);
        $id = $this->insertParty($t2, ['code' => 'SUP-001']);
        self::assertGreaterThan(0, $id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // parties: cross-tenant composite FK (tax_profile)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_party_rejects_cross_tenant_tax_profile(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-party-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-party-b');

        $taxId = $this->insertTaxProfile($t1);

        $this->assertInsertRejected(
            'parties',
            $this->partyAttributes($t2, ['tax_profile_id' => $taxId]),
            'Cross-tenant tax_profile_id should be rejected by composite FK.',
            'foreign'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // parties → price_lists: deferred FK (104500 closure)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_party_rejects_cross_tenant_price_list(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-pl-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-pl-b');

        $plId = $this->insertPriceList($t1);

        $this->assertInsertRejected(
            'parties',
            $this->partyAttributes($t2, ['price_list_id' => $plId]),
            'Cross-tenant price_list_id should be rejected by the deferred composite FK.',
            'foreign'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // party_addresses: CASCADE on parent party delete
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_party_addresses_cascade_on_party_delete(): void
    {
        $tid = $this->insertTenantWithPlan();
        $partId = $this->insertParty($tid);
        $addrId = $this->insertPartyAddress($tid, $partId);

        // Hard-delete the party (simulating a purge of a soft-deleted row).
        DB::table('parties')->where('id', $partId)->delete();

        // Address should have been removed by CASCADE.
        self::assertNull(
            DB::table('party_addresses')->where('id', $addrId)->value('id'),
            'party_addresses should CASCADE on party deletion.'
        );
    }

    /** @test */
    public function test_party_address_rejects_cross_tenant_party(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-addr-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-addr-b');
        $partId = $this->insertParty($t1);

        $this->assertInsertRejected(
            'party_addresses',
            $this->partyAddressAttributes($t2, $partId),
            'Cross-tenant party_id in party_addresses should be rejected.',
            'foreign'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // party_contacts: CASCADE on parent party delete
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_party_contacts_cascade_on_party_delete(): void
    {
        $tid = $this->insertTenantWithPlan();
        $partId = $this->insertParty($tid);
        $contId = $this->insertPartyContact($tid, $partId);

        DB::table('parties')->where('id', $partId)->delete();

        self::assertNull(
            DB::table('party_contacts')->where('id', $contId)->value('id'),
            'party_contacts should CASCADE on party deletion.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // price_lists: unique (tenant_id, code)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_price_list_code_unique_within_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $this->insertPriceList($tid, ['code' => 'PL-RETAIL']);

        $this->assertInsertRejected(
            'price_lists',
            $this->priceListAttributes($tid, ['code' => 'PL-RETAIL']),
            'Duplicate price_list code within same tenant should be rejected.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // price_list_items: unique key (tenant, list, product, variant, min_qty)
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_price_list_item_unique_key_fires_for_non_null_variant(): void
    {
        // When variant_id IS NOT NULL the unique key can fire because the
        // entire tuple is non-null. Two rows for the same list + product +
        // variant + min_quantity are rejected.
        $tid = $this->insertTenantWithPlan();
        $plId = $this->insertPriceList($tid);
        $uid = $this->insertUnit($tid);
        $prdId = $this->insertProduct($tid, $uid, ['has_variants' => 1]);
        $varId = $this->insertProductVariant($tid, $prdId, ['sku' => 'VAR-RED']);

        $this->insertPriceListItem($tid, $plId, $prdId, ['variant_id' => $varId]);

        $this->assertInsertRejected(
            'price_list_items',
            $this->priceListItemAttributes($tid, $plId, $prdId, ['variant_id' => $varId]),
            'Duplicate (list, product, variant_id=non-null, min_qty) should be rejected.'
        );
    }

    /** @test */
    public function test_price_list_item_null_variant_key_does_not_block_null_duplicates(): void
    {
        // DATABASE_DESIGN §1.1 Amendment: NULL != NULL, so the unique key
        // (tenant_id, price_list_id, product_id, variant_id, min_quantity)
        // cannot protect rows where variant_id IS NULL. Two base-product rows
        // with the same other columns are accepted by the database. This is a
        // documented hole that the application layer must guard. Pinned here so
        // a later reader cannot mistake the key for protection it does not provide.
        $tid = $this->insertTenantWithPlan();
        $plId = $this->insertPriceList($tid);
        $uid = $this->insertUnit($tid);
        $prdId = $this->insertProduct($tid, $uid);

        $this->insertPriceListItem($tid, $plId, $prdId); // variant_id = NULL

        // Second insert with same key columns and variant_id = NULL MUST succeed.
        $id = DB::table('price_list_items')
            ->insertGetId($this->priceListItemAttributes($tid, $plId, $prdId));
        self::assertGreaterThan(0, $id, 'Null-variant duplicate is not blocked by the DB (documented hole).');
    }

    /** @test */
    public function test_price_list_item_null_variant_allows_variant_specific_row(): void
    {
        // NULL != NULL, so a base-product row (variant_id = NULL) and a
        // variant-specific row (variant_id IS NOT NULL) do NOT conflict.
        $tid = $this->insertTenantWithPlan();
        $plId = $this->insertPriceList($tid);
        $uid = $this->insertUnit($tid);
        $prdId = $this->insertProduct($tid, $uid, ['has_variants' => 1]);
        $varId = $this->insertProductVariant($tid, $prdId, ['sku' => 'VAR-RED']);

        // Base-product row (no variant).
        $this->insertPriceListItem($tid, $plId, $prdId);

        // Variant-specific row with the same product & min_qty — must succeed.
        $id = $this->insertPriceListItem($tid, $plId, $prdId, ['variant_id' => $varId]);
        self::assertGreaterThan(0, $id);
    }

    /** @test */
    public function test_price_list_item_rejects_cross_tenant_price_list(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-pli-a');
        $t2 = $this->insertTenant($plan['id'], 'ten-pli-b');
        $plId = $this->insertPriceList($t1);
        $uid = $this->insertUnit($t2);
        $prdId = $this->insertProduct($t2, $uid);

        $this->assertInsertRejected(
            'price_list_items',
            $this->priceListItemAttributes($t2, $plId, $prdId),
            'Cross-tenant price_list_id in price_list_items should be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_price_list_item_rejects_cross_tenant_product(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 'ten-pli-c');
        $t2 = $this->insertTenant($plan['id'], 'ten-pli-d');
        $plId = $this->insertPriceList($t2);
        $uid = $this->insertUnit($t1);
        $prdId = $this->insertProduct($t1, $uid);

        $this->assertInsertRejected(
            'price_list_items',
            $this->priceListItemAttributes($t2, $plId, $prdId),
            'Cross-tenant product_id in price_list_items should be rejected.',
            'foreign'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DECIMAL precision
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_party_credit_limit_stores_decimal_18_4(): void
    {
        $tid = $this->insertTenantWithPlan();
        $id = $this->insertParty($tid, ['credit_limit' => '250000.1234']);

        self::assertSame(250000.1234, (float) $this->columnValue('parties', 'credit_limit', $id));
    }

    /** @test */
    public function test_price_list_item_unit_price_stores_decimal_18_4(): void
    {
        $tid = $this->insertTenantWithPlan();
        $plId = $this->insertPriceList($tid);
        $uid = $this->insertUnit($tid);
        $prdId = $this->insertProduct($tid, $uid);
        $id = $this->insertPriceListItem($tid, $plId, $prdId, ['unit_price' => '9999.9999']);

        self::assertSame(9999.9999, (float) $this->columnValue('price_list_items', 'unit_price', $id));
    }

    /** @test */
    public function test_price_list_item_discount_percentage_stores_decimal_8_4(): void
    {
        $tid = $this->insertTenantWithPlan();
        $plId = $this->insertPriceList($tid);
        $uid = $this->insertUnit($tid);
        $prdId = $this->insertProduct($tid, $uid);
        $id = $this->insertPriceListItem($tid, $plId, $prdId, ['discount_percentage' => '12.5000']);

        self::assertSame(12.5, (float) $this->columnValue('price_list_items', 'discount_percentage', $id));
    }

    /** @test */
    public function test_discount_rule_value_stores_decimal_18_4(): void
    {
        $tid = $this->insertTenantWithPlan();
        $id = $this->insertDiscountRule($tid, ['value' => '15.7500']);

        self::assertSame(15.75, (float) $this->columnValue('discount_rules', 'value', $id));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // discount_rules: basic insert and uniqueness
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_discount_rule_can_be_inserted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $id = $this->insertDiscountRule($tid);
        self::assertGreaterThan(0, $id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deferred FK closure: parties.price_list_id validated by the DB
    // ─────────────────────────────────────────────────────────────────────────

    /** @test */
    public function test_deleting_price_list_referenced_by_party_is_refused(): void
    {
        $tid = $this->insertTenantWithPlan();
        $plId = $this->insertPriceList($tid);
        $this->insertParty($tid, ['price_list_id' => $plId]);

        $this->assertDeleteRejectedByForeignKey(
            'price_lists',
            $plId,
            'Deleting a price_list referenced by a party should be refused (deferred FK).'
        );
    }
}
