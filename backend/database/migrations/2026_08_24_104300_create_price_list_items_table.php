<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 7 — master data C: price_list_items.
 *
 * Line items within a price list — one row per product (or product+variant)
 * per minimum-quantity break. The pricing engine picks the row with the
 * highest `min_quantity` that does not exceed the ordered quantity.
 *
 * Unique `(tenant_id, price_list_id, product_id, variant_id, min_quantity)`:
 * variant_id is nullable, but NULL ≠ NULL so a NULL variant_id does not cause
 * duplicate keys — which is correct: the "base product" price and the
 * "variant-specific" price can coexist, and the engine picks the more specific
 * one (variant_id IS NOT NULL takes priority).
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - unit_price:           DECIMAL(18,4).
 *   - discount_percentage:  DECIMAL(8,4).
 *   - min_quantity:         DECIMAL(18,4) — weight-based products need
 *                           fractional thresholds.
 *
 * FK strategy:
 *   - (tenant_id, price_list_id) → price_lists: RESTRICT.
 *   - (tenant_id, product_id) → products: RESTRICT.
 *   - (tenant_id, variant_id) → product_variants: RESTRICT. Nullable; MATCH
 *     SIMPLE skips the check when variant_id IS NULL.
 *
 * No soft delete — items are line children of price_lists with no independent
 * lifecycle (DATABASE_DESIGN §1.3 — CASCADE is not needed here either because
 * price_list.softDelete is the lifecycle gate).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_list_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();

            $table->foreignId('price_list_id');
            $table->foreignId('product_id');
            $table->foreignId('variant_id')->nullable();

            // Quantity break — inclusive lower bound.
            $table->decimal('min_quantity', 18, 4)->default('1.0000');

            $table->decimal('unit_price', 18, 4);
            $table->decimal('discount_percentage', 8, 4)->default('0.0000');

            $table->timestamps();
            // No softDeletes — lifecycle governed by the parent price_list.

            // ── Unique keys ────────────────────────────────────────────────
            // The full pricing key: one row per list × product × variant × break.
            // variant_id is nullable; NULL ≠ NULL so a base-product break and a
            // variant-specific break can coexist in the same key slot.
            $table->unique(
                ['tenant_id', 'price_list_id', 'product_id', 'variant_id', 'min_quantity'],
                'uq_price_list_items_key'
            );

            // Required for potential future child tables.
            $table->unique(['tenant_id', 'id'], 'uq_price_list_items_tenant_id');

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            $table->foreign(['tenant_id', 'price_list_id'], 'fk_pli_tenant_price_list')
                ->references(['tenant_id', 'id'])
                ->on('price_lists')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_pli_tenant_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            // Nullable variant_id — MATCH SIMPLE skips check when NULL.
            $table->foreign(['tenant_id', 'variant_id'], 'fk_pli_tenant_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // Pricing engine lookup by price_list + product.
            $table->index(
                ['tenant_id', 'price_list_id', 'product_id'],
                'ix_pli_tenant_list_product'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_list_items');
    }
};
