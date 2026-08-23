<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 5 — deferred FK closure. DATABASE_DESIGN §16.1 deferred-forward-reference
 * table.
 *
 * `production_lines.capacity_unit_id` was created in Wave 2 (migration 101000)
 * as a nullable, unconstrained column because its target — `units` — did not
 * exist yet (§16.1 rule 2: "a nullable FK added later is correct; a missing FK
 * is not"). The index was also pre-created in Wave 2 so that this migration
 * can add the FK without an ALTER on a populated column (§16.1 rule 5).
 *
 * This migration closes that obligation now that `units` (102500) exists.
 *
 * The composite key is `(tenant_id, capacity_unit_id) → units(tenant_id, id)`,
 * `RESTRICT`. The column is nullable, so the MATCH SIMPLE rule applies:
 * a `NULL capacity_unit_id` (no unit set) is not checked — which is the correct
 * semantics here, because capacity planning is optional (§2). When it is set,
 * the FK verifies the unit belongs to the same tenant.
 *
 * The parallel Wave 2 test `test_the_deferred_capacity_unit_foreign_key_is_still_owed`
 * (which asserted `units` does not exist yet) must be replaced in Wave5MasterDataASchemaTest
 * by a test proving the FK is now active and rejects a cross-tenant unit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('production_lines', function (Blueprint $table): void {
            // The index `ix_production_lines_tenant_capacity_unit` was created
            // in Wave 2. Adding only the FK here avoids a full-table ALTER that
            // would be slow on a populated column in production.
            $table->foreign(
                ['tenant_id', 'capacity_unit_id'],
                'fk_production_lines_tenant_capacity_unit'
            )
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('production_lines', function (Blueprint $table): void {
            $table->dropForeign('fk_production_lines_tenant_capacity_unit');
        });
    }
};
