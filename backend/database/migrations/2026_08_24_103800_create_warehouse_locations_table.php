<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 7 — master data C: warehouse_locations.
 *
 * A warehouse location is a named position within a warehouse — a zone, rack,
 * shelf, bin, or any other granularity the tenant chooses. Locations form a
 * tree: zone → rack → bin, expressed through the nullable `parent_id`.
 *
 * Unique `(tenant_id, warehouse_id, code)` — a code is unique within a
 * warehouse, not globally.
 *
 * FK strategy:
 *   - (tenant_id, warehouse_id) → warehouses(tenant_id, id): RESTRICT.
 *     A location cannot exist without its warehouse.
 *   - (tenant_id, parent_id) → warehouse_locations(tenant_id, id): RESTRICT.
 *     A child location cannot outlive its parent zone/rack.
 *     NULL parent_id = root location — MATCH SIMPLE skips the check, which is
 *     correct (no parent to validate against).
 *
 * Soft delete: NO — a location's active/inactive lifecycle is managed by
 * `is_active`. Stock balance rows reference location IDs historically; a
 * hard soft-delete would require every consumer to use withTrashed(), which
 * is a footgun (same rationale as bill_of_materials).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouse_locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->foreignId('warehouse_id');

            // NULL = root location (zone at the top of the tree).
            $table->foreignId('parent_id')->nullable();

            $table->string('code', 32);
            $table->string('name', 191);

            // zone | rack | shelf | bin | other — VARCHAR(32), not ENUM.
            $table->string('type', 32)->default('bin');

            $table->tinyInteger('is_active')->default(1);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            // No softDeletes — lifecycle is managed through is_active.

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_warehouse_locations_uuid');

            // Code unique within a warehouse.
            $table->unique(
                ['tenant_id', 'warehouse_id', 'code'],
                'uq_warehouse_locations_tenant_warehouse_code'
            );

            // Required so child tables (stock_balances, etc.) can declare
            // composite FKs to this table.
            $table->unique(['tenant_id', 'id'], 'uq_warehouse_locations_tenant_id');

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_wl_tenant_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            // Self-referential tree: a bin cannot outlive its rack.
            $table->foreign(['tenant_id', 'parent_id'], 'fk_wl_tenant_parent')
                ->references(['tenant_id', 'id'])
                ->on('warehouse_locations')
                ->restrictOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // List screen: all locations in a warehouse, filtered by active.
            $table->index(
                ['tenant_id', 'warehouse_id', 'is_active'],
                'ix_wl_tenant_warehouse_active'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouse_locations');
    }
};
