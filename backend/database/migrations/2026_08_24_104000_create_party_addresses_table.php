<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 7 — master data C: party_addresses.
 *
 * Structured address rows for a party. The DATABASE_DESIGN §4 note is
 * explicit: courier integrations (Phase 6) require individual structured
 * fields — a single free-text `address` column would block Phase 6.
 *
 * A party may have many addresses (headquarters billing, multiple shipping
 * depots, etc.). `is_default` marks the one that pre-fills forms; only one
 * per type should be default, but this is an application-layer rule, not a
 * database unique constraint (a unique partial index would need a generated
 * column, which adds migration complexity for minimal gain).
 *
 * `latitude` and `longitude` are DECIMAL(10,7) — seven decimal places give
 * ~1 cm precision, which is sufficient for delivery routing.
 *
 * FK strategy:
 *   - (tenant_id, party_id) → parties(tenant_id, id): CASCADE. Addresses
 *     have no independent meaning; if the party is deleted (hard-delete of
 *     soft-deleted master data during a purge), addresses go with it.
 *     DATABASE_DESIGN §1.3 permits CASCADE for child rows with no independent
 *     meaning.
 *
 * Soft delete: NO — lifecycle follows the parent party.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('party_addresses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->foreignId('party_id');

            // billing | shipping
            $table->string('type', 32)->default('shipping');

            // Human-readable label: "Head Office", "Warehouse A", etc.
            $table->string('label', 64)->nullable();

            $table->string('contact_name', 191)->nullable();
            $table->string('phone', 32)->nullable();

            // Structured address fields required by courier APIs (Phase 6).
            $table->string('line1', 191);
            $table->string('line2', 191)->nullable();
            $table->string('area', 100)->nullable();
            $table->string('city', 100);
            $table->string('district', 100)->nullable();
            $table->string('postal_code', 20)->nullable();

            // ISO 3166-1 alpha-2, e.g. 'BD', 'US'.
            $table->string('country_code', 2)->default('BD');

            // DECIMAL(10,7) — ~1 cm precision; sufficient for routing.
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->tinyInteger('is_default')->default(0);

            $table->timestamps();
            // No softDeletes — lifecycle follows the parent party.

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_party_addresses_uuid');

            // Required so child tables can declare composite FKs.
            $table->unique(['tenant_id', 'id'], 'uq_party_addresses_tenant_id');

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            // CASCADE: addresses have no independent meaning without their party.
            $table->foreign(['tenant_id', 'party_id'], 'fk_party_addresses_tenant_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->cascadeOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            $table->index(['tenant_id', 'party_id', 'type'], 'ix_party_addresses_tenant_party_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('party_addresses');
    }
};
