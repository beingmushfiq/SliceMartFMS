<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 7 — master data C: parties.
 *
 * A party is any external actor the tenant transacts with — supplier, customer,
 * dealer, agent, or any combination. One row may carry multiple roles
 * simultaneously (PROJECT_CONTEXT §5.2): `is_supplier` and `is_customer` are
 * independent boolean flags, so a distributor who sells goods back to the
 * tenant occupies exactly one row, not two.
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - Money:      DECIMAL(18,4) — credit_limit, opening_balance, current_balance.
 *   - Booleans:   TINYINT(1) with explicit default.
 *   - Enums:      VARCHAR(32) — type (`individual` | `business`), status.
 *
 * `current_balance` is a cached running total (a read-optimised denorm per
 * DATABASE_DESIGN §18). It is updated by the payments and invoicing actions,
 * never by the party creation/edit action itself.
 *
 * FK strategy:
 *   - price_list_id — optional. Composite (tenant_id, price_list_id) →
 *     price_lists(tenant_id, id). RESTRICT — a price list referenced by a
 *     party cannot be deleted.
 *   - tax_profile_id — optional. Composite RESTRICT (same rationale).
 *   - assigned_to — nullable FK to users. Simple (non-composite) because the
 *     users table has a tenant_id but platform users (tenant_id = NULL) cannot
 *     be assigned to a party (the application layer must guard this). This FK
 *     uses nullOnDelete because an assigned user being deactivated should not
 *     block the party — the party just becomes unassigned.
 *
 * Soft delete: YES — parties is master data (DATABASE_DESIGN §1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parties', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->string('code', 32);
            $table->string('name', 191);
            $table->string('legal_name', 191)->nullable();

            // Role flags — a party may satisfy multiple roles simultaneously.
            $table->tinyInteger('is_supplier')->default(0);
            $table->tinyInteger('is_customer')->default(0);
            $table->tinyInteger('is_dealer')->default(0);
            $table->tinyInteger('is_agent')->default(0);

            // individual | business
            $table->string('type', 32)->default('business');

            $table->string('tax_identifier', 64)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email', 191)->nullable();

            // Credit terms — DECIMAL(18,4) for limit; SMALLINT for days.
            $table->decimal('credit_limit', 18, 4)->default('0.0000');
            $table->unsignedSmallInteger('credit_days')->default(0);

            // Optional default price list for this party.
            $table->foreignId('price_list_id')->nullable();

            // Optional default tax profile.
            $table->foreignId('tax_profile_id')->nullable();

            // Ledger cache columns.
            $table->decimal('opening_balance', 18, 4)->default('0.0000');
            $table->decimal('current_balance', 18, 4)->default('0.0000');

            // CRM — the user who manages this party.
            // nullOnDelete: losing the user should not cascade to the party.
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();

            // active | inactive | blacklisted
            $table->string('status', 32)->default('active');

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_parties_uuid');

            // Code unique within a tenant (parties.code is the CRM short-name).
            $table->unique(['tenant_id', 'code'], 'uq_parties_tenant_code');

            // Required so child tables (party_addresses, party_contacts,
            // sales_orders, purchase_orders) can declare composite FKs.
            $table->unique(['tenant_id', 'id'], 'uq_parties_tenant_id');

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            // NOTE: (tenant_id, price_list_id) → price_lists is intentionally
            // OMITTED here. price_lists is created at 104200, AFTER this
            // migration (103900). The FK is added by the Wave 7 deferred closure
            // migration at 104500, once price_lists exists.
            // See DATABASE_DESIGN §16.1 rule 2.

            $table->foreign(['tenant_id', 'tax_profile_id'], 'fk_parties_tenant_tax_profile')
                ->references(['tenant_id', 'id'])
                ->on('tax_profiles')
                ->restrictOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // Supplier list, customer list — filtered by role flag and status.
            $table->index(['tenant_id', 'is_supplier', 'status'], 'ix_parties_tenant_supplier_status');
            $table->index(['tenant_id', 'is_customer', 'status'], 'ix_parties_tenant_customer_status');

            // CRM dashboard — parties by assigned user.
            $table->index(['tenant_id', 'assigned_to', 'status'], 'ix_parties_tenant_assigned');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parties');
    }
};
