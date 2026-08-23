<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 7 — master data C: party_contacts.
 *
 * Individual contact persons associated with a party — the purchasing manager
 * at a supplier, the accounts-payable clerk at a customer, etc.
 *
 * `is_primary` marks the default contact for outbound communication. No
 * database unique constraint on `(tenant_id, party_id)` where `is_primary = 1`
 * — an application-layer rule is sufficient and avoids a generated-column index.
 *
 * FK strategy:
 *   - (tenant_id, party_id) → parties(tenant_id, id): CASCADE.
 *     Contact rows have no independent meaning; they follow the parent party.
 *
 * Soft delete: NO — lifecycle follows the parent party.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('party_contacts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->foreignId('party_id');

            $table->string('name', 191);
            $table->string('designation', 100)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email', 191)->nullable();

            $table->tinyInteger('is_primary')->default(0);

            $table->timestamps();
            // No softDeletes — lifecycle follows the parent party.

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_party_contacts_uuid');

            // Required for potential future child tables.
            $table->unique(['tenant_id', 'id'], 'uq_party_contacts_tenant_id');

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            // CASCADE: contacts have no independent meaning without their party.
            $table->foreign(['tenant_id', 'party_id'], 'fk_party_contacts_tenant_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->cascadeOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            $table->index(['tenant_id', 'party_id', 'is_primary'], 'ix_party_contacts_tenant_party_primary');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('party_contacts');
    }
};
