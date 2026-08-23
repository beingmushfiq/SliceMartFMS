<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 6 — master data B: products.
 *
 * This is the single central catalogue for production, purchasing, sales, POS
 * and e-commerce (ADR-016). Every table in Groups D–G that references a
 * product does so through a composite FK (tenant_id, product_id) targeting the
 * unique key declared here.
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - Money / cost columns: DECIMAL(18,4) — standard_cost, default_sale_price.
 *   - Quantity columns:     DECIMAL(18,4) — reorder_level, reorder_quantity.
 *   - Percentage:           DECIMAL(8,4)  — not used on this table directly.
 *   - Enums:                VARCHAR(32), validated in PHP. Never MySQL ENUM.
 *   - JSON:                 dimensions, online_meta (genuinely schemaless).
 *   - Booleans:             TINYINT(1) with explicit default.
 *
 * FK strategy:
 *   - category_id, brand_id, tax_profile_id — nullable optional classifiers;
 *     all RESTRICT because the sentence "records are deactivated, not deleted"
 *     (§1.3) means a hard-delete of a referenced master row is never valid and
 *     SET NULL would only mask the defect.
 *   - base_unit_id, purchase_unit_id, sales_unit_id — all composite
 *     (tenant_id, unit_id) → units(tenant_id, id), RESTRICT.
 *
 * Soft delete: YES — products is master data (§1).
 *
 * No tracking_mode enum — stored as VARCHAR(32): none | batch | serial |
 * batch_and_serial. Validated in the Product Eloquent model.
 *
 * weight is DECIMAL(18,4) (§1 money/quantity rule — physical quantities must
 * not be FLOAT). dimensions is JSON (schemaless per courier API surface).
 *
 * is_online, online_slug, online_meta are e-commerce exposure columns
 * documented for Phase 9; they are created now so Wave 23 (ecommerce) never
 * needs to ALTER a large populated table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');
            $table->string('sku', 100);
            $table->string('barcode', 100)->nullable();
            $table->string('name', 191);
            $table->text('description')->nullable();

            // Product type — what role this SKU plays in the business.
            // Stored as VARCHAR(32); PHP enum validates accepted values.
            // raw_material | semi_finished | finished | packaging |
            // consumable | service | asset_part
            $table->string('type', 32);

            // Optional classifiers — composite FKs so cross-tenant assignment
            // is rejected at the database level (§1.3).
            $table->foreignId('category_id')->nullable();
            $table->foreignId('brand_id')->nullable();

            // Unit linkage — all three are composite (tenant_id, unit_id).
            // purchase_unit_id / sales_unit_id are converted through
            // unit_conversions; base_unit_id is the canonical stock unit.
            $table->foreignId('base_unit_id');
            $table->foreignId('purchase_unit_id')->nullable();
            $table->foreignId('sales_unit_id')->nullable();

            // Capability flags — TINYINT(1) with explicit default (§1).
            $table->tinyInteger('is_produced')->default(0);
            $table->tinyInteger('is_purchased')->default(0);
            $table->tinyInteger('is_sold')->default(0);
            $table->tinyInteger('is_stock_tracked')->default(1);
            $table->tinyInteger('has_variants')->default(0);

            // Batch / serial tracking mode.
            // none | batch | serial | batch_and_serial
            $table->string('tracking_mode', 32)->default('none');

            $table->unsignedSmallInteger('shelf_life_days')->nullable();

            // Reorder thresholds — DECIMAL(18,4): weights and piece counts.
            $table->decimal('reorder_level', 18, 4)->nullable();
            $table->decimal('reorder_quantity', 18, 4)->nullable();

            // Financials — DECIMAL(18,4) per §1.
            $table->decimal('standard_cost', 18, 4)->default('0.0000');
            $table->decimal('default_sale_price', 18, 4)->default('0.0000');

            // Optional tax profile — composite FK.
            $table->foreignId('tax_profile_id')->nullable();

            // Physical attributes — required by courier rate calls (Wave 18).
            // weight: DECIMAL(18,4) because physical quantities must not be FLOAT.
            // dimensions: JSON — schemaless, shape differs per courier API.
            $table->decimal('weight', 18, 4)->nullable();
            $table->json('dimensions')->nullable();

            // E-commerce exposure columns (Phase 9 / Wave 23). Created now to
            // avoid a slow ALTER on a large table in a later wave (§16.1 rule 5).
            $table->tinyInteger('is_online')->default(0);
            $table->string('online_slug', 191)->nullable();
            $table->json('online_meta')->nullable();

            // Lifecycle status: active | discontinued | draft
            $table->string('status', 32)->default('draft');

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_products_uuid');

            // §1.1 — both sku and barcode are unique within a tenant, never
            // globally (a barcode that one tenant calls "SKU-001" may be
            // reused by another tenant under a different name).
            $table->unique(['tenant_id', 'sku'], 'uq_products_tenant_sku');

            // barcode nullable: NULL != NULL, so this key does not prevent two
            // products from having no barcode — which is correct.
            $table->unique(['tenant_id', 'barcode'], 'uq_products_tenant_barcode');

            // §1.1 — required so child tables can declare composite FKs.
            $table->unique(['tenant_id', 'id'], 'uq_products_tenant_id');

            // e-commerce slug is unique per tenant when set.
            $table->unique(['tenant_id', 'online_slug'], 'uq_products_tenant_online_slug');

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            // category_id
            $table->foreign(['tenant_id', 'category_id'], 'fk_products_tenant_category')
                ->references(['tenant_id', 'id'])
                ->on('categories')
                ->restrictOnDelete();

            // brand_id
            $table->foreign(['tenant_id', 'brand_id'], 'fk_products_tenant_brand')
                ->references(['tenant_id', 'id'])
                ->on('brands')
                ->restrictOnDelete();

            // base_unit_id — mandatory
            $table->foreign(['tenant_id', 'base_unit_id'], 'fk_products_tenant_base_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            // purchase_unit_id — optional
            $table->foreign(['tenant_id', 'purchase_unit_id'], 'fk_products_tenant_purchase_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            // sales_unit_id — optional
            $table->foreign(['tenant_id', 'sales_unit_id'], 'fk_products_tenant_sales_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            // tax_profile_id — optional
            $table->foreign(['tenant_id', 'tax_profile_id'], 'fk_products_tenant_tax_profile')
                ->references(['tenant_id', 'id'])
                ->on('tax_profiles')
                ->restrictOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // List screens filter by tenant + status, sort by name.
            $table->index(['tenant_id', 'status', 'name'], 'ix_products_tenant_status_name');

            // Purchasing / production filters by type.
            $table->index(['tenant_id', 'type', 'status'], 'ix_products_tenant_type_status');

            // Stock dashboard and reorder alerts filter by tracking flags.
            $table->index(['tenant_id', 'is_stock_tracked', 'status'], 'ix_products_tenant_stock_status');

            // e-commerce lookup by slug.
            $table->index(['tenant_id', 'is_online', 'status'], 'ix_products_tenant_online_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
