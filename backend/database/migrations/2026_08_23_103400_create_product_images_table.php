<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 6 — master data B: product_images.
 *
 * Stores image references for both base products and their variants.  An image
 * that belongs to a specific variant has `variant_id` set; one that applies to
 * the product in general has `variant_id = NULL`.
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - path: the storage-disk path to the file (the disk itself is stored in
 *     the `attachments` table for uploaded documents; product images use a
 *     dedicated path column rather than polymorphic attachment because image
 *     ordering and the "primary" flag are product-specific concerns).
 *   - alt_key: the i18n translation key for the alt text, not the raw text —
 *     product images are catalogue data and their alt text is localised.
 *   - sort_order: UNSIGNED SMALLINT 0–65535, same pattern as reason_codes.
 *   - is_primary: TINYINT(1) — exactly one image per (tenant, product, variant)
 *     should be primary; enforced at the Action layer.
 *
 * FK strategy:
 *   - (tenant_id, product_id) → products(tenant_id, id), RESTRICT.
 *   - (tenant_id, variant_id) → product_variants(tenant_id, id), RESTRICT,
 *     nullable. When variant_id is NULL the FK is not checked (MATCH SIMPLE),
 *     which is the correct semantics: a product-level image is not tied to any
 *     variant.
 *
 * Soft delete: NO — images are either present or not.  A deleted image is
 * simply removed from the filesystem and the row is hard-deleted.  There is no
 * historical reference that needs to resolve a deleted image (invoices embed
 * the path at print time, not a live FK).  This matches the "leaf table" rule
 * in DATABASE_DESIGN §1.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();

            $table->foreignId('product_id');
            // nullable: an image may belong to the product in general rather
            // than a specific variant.
            $table->foreignId('variant_id')->nullable();

            // Storage path on the configured disk.
            $table->string('path', 500);

            // Internationalisation key for the alt attribute.
            $table->string('alt_key', 191)->nullable();

            // Display ordering within a product / variant.
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->tinyInteger('is_primary')->default(0);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            // No softDeletes — leaf table (DATABASE_DESIGN §1).

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            $table->foreign(['tenant_id', 'product_id'], 'fk_product_images_tenant_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            // variant_id nullable — MATCH SIMPLE means this FK is not checked
            // when variant_id IS NULL, which is the correct semantics.
            $table->foreign(['tenant_id', 'variant_id'], 'fk_product_images_tenant_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // Image gallery for a product: all images ordered by sort position.
            $table->index(
                ['tenant_id', 'product_id', 'sort_order'],
                'ix_product_images_tenant_product_sort'
            );

            // Variant-specific gallery.
            $table->index(
                ['tenant_id', 'variant_id', 'sort_order'],
                'ix_product_images_tenant_variant_sort'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};
