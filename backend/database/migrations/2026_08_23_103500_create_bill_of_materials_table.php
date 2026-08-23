<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 6 — master data B: bill_of_materials.
 *
 * A Bill of Materials (BoM) is the versioned recipe that describes how a
 * finished or semi-finished product is assembled from its component inputs.
 * Versioning is mandatory (DATABASE_DESIGN §4 `bill_of_materials`): a
 * production batch freezes the BoM version it used so historical cost and
 * yield calculations always resolve the correct recipe, even after the recipe
 * changes.
 *
 * Unique `(tenant_id, product_id, version)` — a product may have multiple BoM
 * versions, but not two active versions with the same number.
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - output_quantity: DECIMAL(18,4) — weight-based or piece-count output.
 *   - expected_yield_percentage: DECIMAL(8,4) — percentage per §1.
 *   - status: VARCHAR(32) — draft | active | archived.
 *   - effective_from / effective_to: DATE columns (not DATETIME) — a BoM
 *     version applies to an entire calendar day; time-of-day granularity is
 *     not meaningful and would complicate the batch-to-version lookup.
 *
 * FK strategy:
 *   - (tenant_id, product_id) → products(tenant_id, id), RESTRICT.
 *     The output product must not be deleted while a BoM exists for it.
 *   - (tenant_id, output_unit_id) → units(tenant_id, id), RESTRICT.
 *
 * Soft delete: NO — a BoM is archived by setting status = 'archived'.  A
 * production batch that references an archived BoM must still be able to
 * resolve it; soft-deleting a BoM would break that lookup unless every
 * consumer used withTrashed(), which is an application-layer footgun.  The
 * status column is the correct lifecycle signal for catalogue data that must
 * remain historically resolvable (DATABASE_DESIGN §1, "Never on … posted
 * financial documents").
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_of_materials', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            // The product this BoM produces.
            $table->foreignId('product_id');

            // Version string — '1', '1.1', '2024-A', etc. The format is
            // tenant-defined; the uniqueness constraint enforces no duplicates.
            $table->string('version', 32);

            $table->string('name', 191);

            // Standard batch output quantity and unit.
            $table->decimal('output_quantity', 18, 4);
            $table->foreignId('output_unit_id');

            // Target yield — what percentage of input should become good output.
            // Stored as DECIMAL(8,4) per §1 percentage rule.
            $table->decimal('expected_yield_percentage', 8, 4)->default('100.0000');

            // draft | active | archived
            $table->string('status', 32)->default('draft');

            // Effective date range — DATE columns. Null effective_to means
            // "current until superseded".
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            // No softDeletes — lifecycle is managed through status (see docblock).

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_bill_of_materials_uuid');

            // A product may have many BoM versions, but not two with the same
            // version string.
            $table->unique(
                ['tenant_id', 'product_id', 'version'],
                'uq_bill_of_materials_tenant_product_version'
            );

            // Required for child bill_of_material_items to declare a composite FK.
            $table->unique(['tenant_id', 'id'], 'uq_bill_of_materials_tenant_id');

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            $table->foreign(['tenant_id', 'product_id'], 'fk_bom_tenant_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'output_unit_id'], 'fk_bom_tenant_output_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // BoM picker filters by product and active status.
            $table->index(
                ['tenant_id', 'product_id', 'status'],
                'ix_bom_tenant_product_status'
            );

            // Effective-date lookup for a batch's production date.
            $table->index(
                ['tenant_id', 'product_id', 'effective_from', 'effective_to'],
                'ix_bom_tenant_product_effective'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_of_materials');
    }
};
