<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 7 — master data C: price_lists.
 *
 * A price list is a named schedule of unit prices and discounts that applies
 * to a particular scope: all customers, a customer group, or a specific
 * channel (e-commerce, POS, wholesale). The `priority` column resolves
 * conflicts when multiple lists could apply to one transaction.
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - Enums: VARCHAR(32) — applies_to (`all` | `customer_group` | `channel`),
 *     channel (nullable, application-defined string).
 *   - Booleans: TINYINT(1) with explicit default.
 *   - Dates: DATE not DATETIME — a price list applies for a calendar day range,
 *     not a specific moment.
 *
 * Note: `parties` references `price_lists` via a composite FK, so
 * `price_lists` must be created BEFORE `parties` in the migration order.
 * This file's timestamp (104200) precedes `parties` (103900). The order
 * is enforced by the wave rule: within Wave 7 a table may reference earlier
 * tables or tables in the same wave that have lower timestamps. `parties`
 * (103900) correctly references `price_lists` (104200) — WRONG, the
 * timestamp for price_lists is HIGHER than parties.
 *
 * CORRECTION: `parties` is created at 103900 and `price_lists` at 104200.
 * `parties.price_list_id` cannot declare a FK to a table that does not yet
 * exist at migration time. The composite FK in `parties` must be deferred to
 * a separate closure migration at the end of Wave 7. This file creates the
 * `price_lists` table; the deferred FK from `parties → price_lists` is added
 * in `104700_wave7_deferred_fk_closure`.
 *
 * Soft delete: YES — price_lists is master data (DATABASE_DESIGN §1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_lists', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->string('code', 32);
            $table->string('name', 191);

            // ISO 4217 currency code, e.g. 'BDT', 'USD'.
            $table->string('currency_code', 3)->default('BDT');

            // all | customer_group | channel
            $table->string('applies_to', 32)->default('all');

            // Tenant-defined channel name when applies_to = 'channel'.
            // e.g. 'pos', 'wholesale', 'ecommerce'.
            $table->string('channel', 32)->nullable();

            // Higher priority wins when multiple lists match.
            $table->unsignedSmallInteger('priority')->default(0);

            // Optional effective date range.
            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();

            $table->tinyInteger('is_active')->default(1);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_price_lists_uuid');

            // Code unique within a tenant.
            $table->unique(['tenant_id', 'code'], 'uq_price_lists_tenant_code');

            // Required so child tables (price_list_items, parties) can declare
            // composite FKs.
            $table->unique(['tenant_id', 'id'], 'uq_price_lists_tenant_id');

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // Pricing engine picks the highest-priority active list for a channel.
            $table->index(
                ['tenant_id', 'applies_to', 'is_active', 'priority'],
                'ix_price_lists_tenant_applies_active_priority'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_lists');
    }
};
