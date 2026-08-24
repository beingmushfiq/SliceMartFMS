<?php

declare(strict_types=1);

namespace Tests\Feature\Models;

use App\Core\Tenancy\TenantContext;
use App\Models\BillOfMaterial;
use App\Models\BillOfMaterialItem;
use App\Models\Brand;
use App\Models\Category;
use App\Models\DiscountRule;
use App\Models\Party;
use App\Models\PartyAddress;
use App\Models\PartyContact;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\ReasonCode;
use App\Models\TaxProfile;
use App\Models\Unit;
use App\Models\UnitConversion;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Tests\Feature\Database\SchemaTestCase;

/**
 * Contract tests for the Wave 5–7 master-data models (ARCHITECTURE §3.1, §5).
 *
 * Four invariants, each proved against the live schema rather than against a
 * second copy of the column list:
 *
 *   1. Every model maps to the table its migration actually created — a wrong
 *      `$table` (or a wrong Eloquent pluralisation) fails here, not in a
 *      controller three modules later.
 *
 *   2. Every `$fillable` column exists on that table. `Schema::hasColumn()`
 *      asks the database, so a renamed or misspelled column cannot survive.
 *
 *   3. `tenant_id` is never mass-assignable. BelongsToTenant stamps it from
 *      TenantContext (layer 3); a fillable `tenant_id` would let untrusted
 *      input overwrite the stamp.
 *
 *   4. The tenant global scope (layer 2) hides other tenants' rows. Two
 *      tenants get a full set of master data, then a query bound to tenant A
 *      must see A's row and must not see B's.
 *
 * SchemaTestCase carries RefreshDatabase and the raw-DB fixtures. The fixtures
 * are used instead of Eloquent creates precisely because they write `tenant_id`
 * explicitly, which is the only way to plant a foreign tenant's row while the
 * write hook is stamping the bound tenant.
 */
final class MasterDataModelTest extends SchemaTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Clear any context that might have leaked from a previous test.
        TenantContext::flush();
    }

    protected function tearDown(): void
    {
        TenantContext::flush();
        parent::tearDown();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1 — table mapping
    // ─────────────────────────────────────────────────────────────────────────

    public function test_every_master_data_model_maps_to_its_migrated_table(): void
    {
        foreach (self::masterDataModels() as $class => $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Table `{$table}` does not exist; {$class} models a table no migration created."
            );

            self::assertSame(
                $table,
                $class::query()->getModel()->getTable(),
                "{$class}::getTable() must resolve to `{$table}`."
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2 — every fillable column exists
    // ─────────────────────────────────────────────────────────────────────────

    public function test_every_fillable_column_exists_on_its_table(): void
    {
        foreach (self::masterDataModels() as $class => $table) {
            $fillable = $class::query()->getModel()->getFillable();

            self::assertNotSame(
                [],
                $fillable,
                "{$class} must declare \$fillable; an empty list plus the default \$guarded = ['*'] makes the model unwritable."
            );

            foreach ($fillable as $column) {
                self::assertTrue(
                    Schema::hasColumn($table, $column),
                    "`{$column}` is fillable on {$class} but does not exist on `{$table}`."
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3 — tenant_id is guarded (ARCHITECTURE §3.1 layer 3)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_tenant_id_is_never_mass_assignable(): void
    {
        foreach (self::masterDataModels() as $class => $table) {
            $model = $class::query()->getModel();

            self::assertNotContains(
                'tenant_id',
                $model->getFillable(),
                "{$class} must not list `tenant_id` in \$fillable — BelongsToTenant stamps `{$table}`.tenant_id."
            );

            self::assertFalse(
                $model->isFillable('tenant_id'),
                "{$class} must reject mass assignment of `tenant_id`."
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4 — tenant global scope (ARCHITECTURE §3.1 layer 2)
    // ─────────────────────────────────────────────────────────────────────────

    public function test_tenant_scope_hides_rows_owned_by_another_tenant(): void
    {
        $tenantA = $this->insertTenantWithPlan('tenant-a');
        $tenantB = $this->insertTenantWithPlan('tenant-b');

        $rowsA = $this->seedMasterData($tenantA);
        $rowsB = $this->seedMasterData($tenantB);

        TenantContext::bind($this->tenantPayload($tenantA));

        foreach (self::masterDataModels() as $class => $table) {
            $idA = $rowsA[$class];
            $idB = $rowsB[$class];

            self::assertTrue(
                $class::query()->whereKey($idA)->exists(),
                "{$class} must see `{$table}` row {$idA}, which belongs to the bound tenant."
            );

            self::assertFalse(
                $class::query()->whereKey($idB)->exists(),
                "{$class} leaked `{$table}` row {$idB}, which belongs to another tenant."
            );

            self::assertTrue(
                $class::hasGlobalScope('tenant'),
                "{$class} must register the `tenant` global scope via BelongsToTenant."
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fixtures owned by this test
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Every master-data model created for Waves 5–7, mapped to the table its
     * migration created. Adding a model without adding it here means it is
     * never checked, so the list is the single place a new table is registered.
     *
     * @return array<class-string<Model>, string>
     */
    private static function masterDataModels(): array
    {
        return [
            Unit::class => 'units',
            UnitConversion::class => 'unit_conversions',
            Category::class => 'categories',
            Brand::class => 'brands',
            TaxProfile::class => 'tax_profiles',
            ReasonCode::class => 'reason_codes',
            Product::class => 'products',
            ProductVariant::class => 'product_variants',
            ProductImage::class => 'product_images',
            BillOfMaterial::class => 'bill_of_materials',
            BillOfMaterialItem::class => 'bill_of_material_items',
            Warehouse::class => 'warehouses',
            WarehouseLocation::class => 'warehouse_locations',
            Party::class => 'parties',
            PartyAddress::class => 'party_addresses',
            PartyContact::class => 'party_contacts',
            PriceList::class => 'price_lists',
            PriceListItem::class => 'price_list_items',
            DiscountRule::class => 'discount_rules',
        ];
    }

    /**
     * Insert exactly one row per master-data table for the given tenant and
     * return the model-to-id map.
     *
     * The raw-DB fixtures are deliberate: they take `tenant_id` as an argument,
     * so a row can be planted for a tenant that is not the bound one. Creating
     * the same row through Eloquent would stamp the bound tenant instead and
     * the isolation test would prove nothing.
     *
     * A second unit is needed because `unit_conversions` converts between two
     * distinct units of the same tenant.
     *
     * @return array<class-string<Model>, int>
     */
    private function seedMasterData(int $tenantId): array
    {
        $baseUnit = $this->insertUnit($tenantId);
        $altUnit = $this->insertUnit($tenantId, ['code' => 'G', 'name' => 'Gram', 'is_base' => false]);
        $product = $this->insertProduct($tenantId, $baseUnit);
        $billOfMaterial = $this->insertBillOfMaterials($tenantId, $product, $baseUnit);
        $warehouse = $this->insertWarehouse($tenantId);
        $party = $this->insertParty($tenantId);
        $priceList = $this->insertPriceList($tenantId);

        return [
            Unit::class => $baseUnit,
            UnitConversion::class => $this->insertUnitConversion($tenantId, $baseUnit, $altUnit),
            Category::class => $this->insertCategory($tenantId),
            Brand::class => $this->insertBrand($tenantId),
            TaxProfile::class => $this->insertTaxProfile($tenantId),
            ReasonCode::class => $this->insertReasonCode($tenantId),
            Product::class => $product,
            ProductVariant::class => $this->insertProductVariant($tenantId, $product),
            ProductImage::class => $this->insertProductImage($tenantId, $product),
            BillOfMaterial::class => $billOfMaterial,
            BillOfMaterialItem::class => $this->insertBillOfMaterialItem($tenantId, $billOfMaterial, $product, $baseUnit),
            Warehouse::class => $warehouse,
            WarehouseLocation::class => $this->insertWarehouseLocation($tenantId, $warehouse),
            Party::class => $party,
            PartyAddress::class => $this->insertPartyAddress($tenantId, $party),
            PartyContact::class => $this->insertPartyContact($tenantId, $party),
            PriceList::class => $priceList,
            PriceListItem::class => $this->insertPriceListItem($tenantId, $priceList, $product),
            DiscountRule::class => $this->insertDiscountRule($tenantId),
        ];
    }

    /**
     * The four keys TenantContext actually reads from a tenant row. They are
     * read back from the database rather than copied from the fixture defaults
     * so the bound id always matches the rows that were just inserted.
     *
     * @return array<string, mixed>
     */
    private function tenantPayload(int $tenantId): array
    {
        return [
            'id' => $tenantId,
            'uuid' => $this->columnValue('tenants', 'uuid', $tenantId),
            'slug' => $this->columnValue('tenants', 'slug', $tenantId),
            'status' => $this->columnValue('tenants', 'status', $tenantId),
        ];
    }
}
