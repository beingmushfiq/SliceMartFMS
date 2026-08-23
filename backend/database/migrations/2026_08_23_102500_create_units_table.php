<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 5 — master data A. DATABASE_DESIGN §4 `units`.
 *
 * `units` is the first Wave 5 table and the one that closes a deferred forward
 * reference from Wave 2: `production_lines.capacity_unit_id` has been pointing
 * at this table since Wave 2, with its FK held back by §16.1 rule 2. The
 * closing migration is 103100; this migration only creates the table.
 *
 * `unique (tenant_id, id)` — not redundant beside the PK. Every child table
 * that carries a `unit_id` column and needs tenant isolation declares a
 * composite FK on `(tenant_id, unit_id)` pointing at this key. Without it,
 * a single-column `unit_id` FK only proves the unit row exists globally, not
 * that it belongs to the caller's tenant (ARCHITECTURE §3.1 layer 4).
 *
 * `precision` is `UNSIGNED TINYINT` rather than the §1 `DECIMAL(18,4)` quantity
 * type — it is an integer count of decimal places (0–9), not a measured amount.
 * Deliberate departure from §1, noted here.
 *
 * `type` is `VARCHAR(32)` per §1 (no MySQL ENUM). Valid values:
 * `weight` `volume` `length` `piece` `time`. Enforced by a PHP-backed enum, not
 * a CHECK constraint, because SQLite cannot add one through ALTER TABLE.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table): void {
            $table->id();
            // §1 — tenant_id is the first column after id.
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            // §1 — VARCHAR(32), never a MySQL ENUM (migration cost).
            // Vocabulary: weight | volume | length | piece | time.
            $table->string('code', 32);
            $table->string('name', 191);
            $table->string('type', 32);

            // Whether this is the base unit for its type within the tenant.
            // Conversion factors are defined relative to the base unit.
            $table->boolean('is_base')->default(false);

            // Number of decimal places the tenant displays for this unit (0–9).
            // UNSIGNED TINYINT, not DECIMAL — it is a count of places, not a
            // measurement. Deliberate departure from §1's quantity rule.
            $table->unsignedTinyInteger('precision')->default(2);

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_units_uuid');

            // §1.1 — unit codes are unique within a tenant, never globally.
            $table->unique(['tenant_id', 'code'], 'uq_units_tenant_code');

            // Composite foreign key target for every tenant-scoped child that
            // references a unit: `unit_conversions`, `products.base_unit_id`,
            // `production_lines.capacity_unit_id` (closed in 103100), etc.
            // A single-column `unit_id` constrained() would only prove the row
            // exists, not that it belongs to the same tenant.
            $table->unique(['tenant_id', 'id'], 'uq_units_tenant_id');

            // §1.2 — the unit list filters by type and active flag.
            $table->index(['tenant_id', 'type', 'is_active'], 'ix_units_tenant_type_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
