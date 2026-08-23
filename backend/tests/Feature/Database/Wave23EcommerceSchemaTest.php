<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;

/**
 * Wave 23: E-commerce Schema Tests.
 *
 * Covers:
 *   - storefronts
 *   - storefront_pages
 *   - storefront_products
 *   - carts
 *   - cart_items
 *   - coupons
 *   - coupon_redemptions
 *   - shipping_zones
 *   - product_reviews
 *   - wishlists
 */
class Wave23EcommerceSchemaTest extends SchemaTestCase
{
    /** @var list<string> */
    private const TABLES = [
        'storefronts',
        'storefront_pages',
        'storefront_products',
        'carts',
        'cart_items',
        'coupons',
        'coupon_redemptions',
        'shipping_zones',
        'product_reviews',
        'wishlists',
    ];

    #[Test]
    public function all_wave23_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasTable($table),
                "Failed asserting that table [{$table}] exists."
            );
        }
    }

    #[Test]
    public function every_wave23_table_has_tenant_id_in_primary_position(): void
    {
        foreach (self::TABLES as $table) {
            $columns = Schema::getColumnListing($table);
            $this->assertGreaterThanOrEqual(
                2,
                count($columns),
                "Table [{$table}] must have at least 2 columns."
            );
            $this->assertSame(
                'tenant_id',
                $columns[1],
                "Table [{$table}] must place 'tenant_id' at ordinal position 1 (second column after id)."
            );
        }
    }

    #[Test]
    public function soft_delete_and_lifecycle_compliance(): void
    {
        $softDeleteTables = [
            'storefronts',
            'storefront_pages',
            'storefront_products',
            'carts',
            'coupons',
            'shipping_zones',
            'product_reviews',
        ];

        foreach ($softDeleteTables as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table [{$table}] must have softDeletes (deleted_at)."
            );
        }

        $nonSoftDeleteTables = [
            'cart_items',
            'coupon_redemptions',
            'wishlists',
        ];

        foreach ($nonSoftDeleteTables as $table) {
            $this->assertFalse(
                Schema::hasColumn($table, 'deleted_at'),
                "Table [{$table}] must not have deleted_at."
            );
        }

        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'uuid'),
                "Table [{$table}] must have uuid."
            );
        }
    }

    #[Test]
    public function storefront_code_and_subdomain_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $b1 = $this->insertBranch($t1, $c1);
        $w1 = $this->insertWarehouse($t1);

        $c2 = $this->insertCompany($t2);
        $b2 = $this->insertBranch($t2, $c2);
        $w2 = $this->insertWarehouse($t2);

        // Same code allowed across different tenants
        $sf1 = $this->insertStorefront($t1, $c1, $b1, $w1, 'MAIN_STORE', ['subdomain' => 'store1-brand']);
        $sf2 = $this->insertStorefront($t2, $c2, $b2, $w2, 'MAIN_STORE', ['subdomain' => 'store2-brand']);

        $this->assertGreaterThan(0, $sf1);
        $this->assertGreaterThan(0, $sf2);

        // Duplicate code in same tenant rejected
        $this->expectException(QueryException::class);
        DB::table('storefronts')->insert($this->storefrontAttributes($t1, $c1, $b1, $w1, 'MAIN_STORE', [
            'code' => 'MAIN_STORE_DUPE',
            'subdomain' => 'store3-brand',
        ]));
        DB::table('storefronts')->insert($this->storefrontAttributes($t1, $c1, $b1, $w1, 'MAIN_STORE', [
            'code' => 'MAIN_STORE_DUPE',
            'subdomain' => 'store4-brand',
        ]));
    }

    #[Test]
    public function storefront_pages_slug_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $w = $this->insertWarehouse($t);
        $sf = $this->insertStorefront($t, $c, $b, $w);

        $this->insertStorefrontPage($t, $sf, 'about-us', ['slug' => 'about-us']);

        $this->expectException(QueryException::class);
        DB::table('storefront_pages')->insert($this->storefrontPageAttributes($t, $sf, 'about-us', [
            'slug' => 'about-us',
        ]));
    }

    #[Test]
    public function storefront_products_slot_and_seo_slug_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $w = $this->insertWarehouse($t);
        $sf = $this->insertStorefront($t, $c, $b, $w);

        $unit = $this->insertUnit($t);
        $product = $this->insertProduct($t, $unit);

        $this->insertStorefrontProduct($t, $sf, $product, null, ['seo_slug' => 'white-bread']);

        // Duplicate (storefront, product, null variant) rejected
        $this->expectException(QueryException::class);
        DB::table('storefront_products')->insert($this->storefrontProductAttributes(
            $t,
            $sf,
            $product,
            null,
            ['seo_slug' => 'white-bread-2']
        ));
    }

    #[Test]
    public function carts_and_cart_items_lifecycle_and_cascade(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $w = $this->insertWarehouse($t);
        $sf = $this->insertStorefront($t, $c, $b, $w);

        $unit = $this->insertUnit($t);
        $product = $this->insertProduct($t, $unit);

        $cartId = $this->insertCart($t, $sf);
        $itemId = $this->insertCartItem($t, $cartId, $product, $unit);

        $this->assertGreaterThan(0, $cartId);
        $this->assertGreaterThan(0, $itemId);

        // Deleting cart cascades and removes cart item
        DB::table('carts')->where('id', $cartId)->delete();
        $this->assertDatabaseMissing('cart_items', ['id' => $itemId]);
    }

    #[Test]
    public function coupons_code_uniqueness_and_redemption_slot(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $w = $this->insertWarehouse($t);
        $sf = $this->insertStorefront($t, $c, $b, $w);

        $couponId = $this->insertCoupon($t, 'DISCOUNT50', $sf, ['code' => 'DISCOUNT50']);
        $this->assertGreaterThan(0, $couponId);

        // Duplicate coupon code within tenant rejected
        $this->expectException(QueryException::class);
        DB::table('coupons')->insert($this->couponAttributes($t, 'DISCOUNT50', $sf, ['code' => 'DISCOUNT50']));
    }

    #[Test]
    public function coupon_redemption_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $w = $this->insertWarehouse($t);
        $sf = $this->insertStorefront($t, $c, $b, $w);

        $couponId = $this->insertCoupon($t, 'SAVE10', $sf);
        $orderId = $this->insertSalesOrder($t, ['company_id' => $c, 'branch_id' => $b]);

        $this->insertCouponRedemption($t, $couponId, $orderId);

        // Duplicate redemption for same coupon and sales order rejected
        $this->expectException(QueryException::class);
        DB::table('coupon_redemptions')->insert($this->couponRedemptionAttributes($t, $couponId, $orderId));
    }

    #[Test]
    public function shipping_zones_storage_and_ordering(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $w = $this->insertWarehouse($t);
        $sf = $this->insertStorefront($t, $c, $b, $w);

        $zoneId = $this->insertShippingZone($t, $sf, 'Chittagong Region');
        $this->assertGreaterThan(0, $zoneId);

        $row = DB::table('shipping_zones')->where('id', $zoneId)->first();
        $this->assertNotNull($row);
        $this->assertSame($sf, (int) $row->storefront_id);
    }

    #[Test]
    public function product_reviews_rating_and_status(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $w = $this->insertWarehouse($t);
        $sf = $this->insertStorefront($t, $c, $b, $w);

        $unit = $this->insertUnit($t);
        $product = $this->insertProduct($t, $unit);

        $reviewId = $this->insertProductReview($t, $sf, $product, [
            'rating' => 4,
            'status' => 'pending',
        ]);
        $this->assertGreaterThan(0, $reviewId);

        $row = DB::table('product_reviews')->where('id', $reviewId)->first();
        $this->assertNotNull($row);
        $this->assertSame(4, (int) $row->rating);
        $this->assertSame('pending', $row->status);
    }

    #[Test]
    public function wishlists_slot_uniqueness(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $w = $this->insertWarehouse($t);
        $sf = $this->insertStorefront($t, $c, $b, $w);

        $customer = $this->insertParty($t);
        $unit = $this->insertUnit($t);
        $product = $this->insertProduct($t, $unit);

        $this->insertWishlist($t, $sf, $customer, $product, null);

        // Duplicate wishlist item rejected
        $this->expectException(QueryException::class);
        DB::table('wishlists')->insert($this->wishlistAttributes($t, $sf, $customer, $product, null));
    }

    #[Test]
    public function cross_tenant_references_are_rejected(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $c1 = $this->insertCompany($t1);
        $b1 = $this->insertBranch($t1, $c1);
        $w1 = $this->insertWarehouse($t1);
        $sf1 = $this->insertStorefront($t1, $c1, $b1, $w1);

        $unit2 = $this->insertUnit($t2);
        $prod2 = $this->insertProduct($t2, $unit2);

        // Trying to attach tenant 2 product to tenant 1 storefront
        $this->expectException(QueryException::class);
        $this->insertStorefrontProduct($t1, $sf1, $prod2);
    }

    #[Test]
    public function ecommerce_decimal_precision_round_trip(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $c = $this->insertCompany($t);
        $b = $this->insertBranch($t, $c);
        $w = $this->insertWarehouse($t);
        $sf = $this->insertStorefront($t, $c, $b, $w);

        $cartId = $this->insertCart($t, $sf, null, [
            'subtotal' => '12345.6789',
            'discount_amount' => '123.4567',
            'total_amount' => '12222.2222',
        ]);

        $row = DB::table('carts')->where('id', $cartId)->first();
        $this->assertNotNull($row);
        $this->assertSame(12345.6789, (float) $row->subtotal);
        $this->assertSame(123.4567, (float) $row->discount_amount);
        $this->assertSame(12222.2222, (float) $row->total_amount);
    }
}
