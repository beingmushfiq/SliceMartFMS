<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 6 — master data B: bill_of_material_items.
 *
 * Each row is one component (input material) in a BoM recipe.  The parent BoM
 * row carries the output product; each item row carries an input product plus
 * the quantity of that input needed to produce the BoM's `output_quantity`.
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - quantity: DECIMAL(18,4) — weight-based or piece-count inputs.
 *   - wastage_allowance_percentage: DECIMAL(8,4) — percentage per §1.  This is
 *     the planned waste factor, not the actual wastage measured during a batch
 *     (that lives in `wastage_records`).
 *   - sort_order: UNSIGNED SMALLINT — display ordering in the recipe editor.
 *   - is_optional: TINYINT(1) — an optional component may be omitted from a
 *     specific batch without breaking the batch's completeness check.
 *
 * FK strategy:
 *   - (tenant_id, bill_of_material_id) → bill_of_materials(tenant_id, id),
 *     CASCADE — an item has no independent meaning once its recipe is gone.
 *   - (tenant_id, product_id) → products(tenant_id, id), RESTRICT — deleting
 *     a raw material that is still in a live recipe must be blocked.
 *   - (tenant_id, unit_id) → units(tenant_id, id), RESTRICT.
 *
 * Soft delete: NO — items are either in the recipe or they are not.  Recipe
 * changes produce a new BoM version rather than soft-deleting individual items.
 * Historical batches reference the frozen BoM version and never re-read the
 * items after the batch is closed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_of_material_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();

            // Parent recipe.
            $table->foreignId('bill_of_material_id');

            // Input material — the product consumed by this recipe step.
            $table->foreignId('product_id');

            // Quantity of this input required per BoM output_quantity.
            $table->decimal('quantity', 18, 4);

            // Unit in which the input quantity is expressed.
            $table->foreignId('unit_id');

            // Planned yield-loss percentage for this component.
            // Stored as DECIMAL(8,4) per §1 percentage rule.
            $table->decimal('wastage_allowance_percentage', 8, 4)->default('0.0000');

            // An optional component may be omitted from a batch without
            // failing the context-completeness check.
            $table->tinyInteger('is_optional')->default(0);

            // Recipe display ordering in the BoM editor.
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            // No softDeletes — see docblock.

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            // CASCADE: an item is a line of its recipe; it cannot outlive it.
            $table->foreign(['tenant_id', 'bill_of_material_id'], 'fk_bom_items_tenant_bom')
                ->references(['tenant_id', 'id'])
                ->on('bill_of_materials')
                ->cascadeOnDelete();

            // RESTRICT: a raw-material product must not be deleted while it
            // appears in an active recipe.
            $table->foreign(['tenant_id', 'product_id'], 'fk_bom_items_tenant_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_bom_items_tenant_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // Recipe detail screen — all items for a BoM in display order.
            $table->index(
                ['tenant_id', 'bill_of_material_id', 'sort_order'],
                'ix_bom_items_tenant_bom_sort'
            );

            // Material requirements planning — find every recipe that uses
            // a given product as an input.
            $table->index(
                ['tenant_id', 'product_id'],
                'ix_bom_items_tenant_product'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_of_material_items');
    }
};
