<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 6 — master data B: product_variants.
 *
 * A variant is a specific configuration of a product (e.g. Red / XL) that gets
 * its own SKU and barcode but shares the parent's `base_unit_id`, category, tax
 * profile, and all capability flags.  A product with `has_variants = 1` may
 * have many variant rows; a product with `has_variants = 0` should have none
 * (enforced at the Action layer, not here, because the schema cannot easily
 * express a cross-row constraint without a trigger).
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - price_delta: DECIMAL(18,4) — the signed offset from `products.default_sale_price`.
 *     May be negative (smaller size = lower price) or zero.
 *   - attributes: JSON — deliberately schemaless: different product families
 *     use different attribute keys (colour/size vs RAM/storage, etc.).
 *   - sku, barcode: unique (tenant_id, sku) / (tenant_id, barcode) — same rule
 *     as the parent products table (§1.1).  Variant SKUs must be globally unique
 *     within a tenant, not only within the product.
 *
 * FK strategy:
 *   - (tenant_id, product_id) → products(tenant_id, id), RESTRICT.
 *     A variant cannot be reassigned to a different product — if the parent
 *     cannot be deleted (RESTRICT), orphaned variants cannot appear.
 *   - no separate unit FK: the variant inherits the product's base_unit_id.
 *
 * Soft delete: YES — a discontinued variant may still appear on historical
 * invoices; hard delete would break those references.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            // Parent product — composite FK so cross-tenant parenting is
            // rejected at the database level.
            $table->foreignId('product_id');

            $table->string('sku', 100);
            $table->string('barcode', 100)->nullable();

            // Attribute bag — colour, size, RAM, flavour, etc. Schema is
            // product-family specific; validated and displayed by the UI.
            $table->json('attributes');

            // Signed price delta added to products.default_sale_price.
            // DECIMAL(18,4) per §1 money rule.
            $table->decimal('price_delta', 18, 4)->default('0.0000');

            $table->tinyInteger('is_active')->default(1);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_product_variants_uuid');

            // §1.1 — variant SKU unique within a tenant, not just the product.
            $table->unique(['tenant_id', 'sku'], 'uq_product_variants_tenant_sku');

            // barcode nullable — NULL != NULL, so duplicate NULL rows are fine.
            $table->unique(['tenant_id', 'barcode'], 'uq_product_variants_tenant_barcode');

            // Required for child tables (e.g. product_images, price_list_items)
            // to declare composite FKs targeting this table.
            $table->unique(['tenant_id', 'id'], 'uq_product_variants_tenant_id');

            // ── Composite foreign key on parent product (§1.3) ─────────────
            $table->foreign(['tenant_id', 'product_id'], 'fk_product_variants_tenant_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // Variant list screen filters by product.
            $table->index(['tenant_id', 'product_id', 'is_active'], 'ix_product_variants_tenant_product_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
