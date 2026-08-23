<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 7 — deferred FK closure.
 *
 * `parties` (103900) references `price_lists` (104200) via a composite
 * foreign key `(tenant_id, price_list_id) → price_lists(tenant_id, id)`.
 * Because `price_lists` is created AFTER `parties` in the migration sequence
 * (price_lists is later in Wave 7 to keep related tables grouped), the FK
 * cannot be declared inline. It is added here after both tables exist.
 *
 * This is the same pattern as Wave 5's `103100` closure for
 * `production_lines.capacity_unit_id` (DATABASE_DESIGN §16.1 rule 2).
 *
 * The column `parties.price_list_id` and its supporting index already exist;
 * this migration only adds the foreign key constraint.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parties', function (Blueprint $table): void {
            // Deferred FK: (tenant_id, price_list_id) → price_lists(tenant_id, id)
            // Now that price_lists exists, this constraint can be registered.
            $table->foreign(['tenant_id', 'price_list_id'], 'fk_parties_tenant_price_list')
                ->references(['tenant_id', 'id'])
                ->on('price_lists')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('parties', function (Blueprint $table): void {
            $table->dropForeign('fk_parties_tenant_price_list');
        });
    }
};
