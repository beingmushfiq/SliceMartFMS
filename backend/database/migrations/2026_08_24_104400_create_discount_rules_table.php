<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 7 — master data C: discount_rules.
 *
 * A discount rule encodes a conditional discount that the pricing engine
 * applies automatically during order entry. Rules are evaluated in `priority`
 * order (lower number = higher priority, first match wins — or cumulative,
 * depending on the engine implementation in Phase 5).
 *
 * `scope` narrows the rule to a product, category, party, or whole order.
 * `scope_id` identifies the specific row within that scope; NULL when
 * scope = `order` (applies to every order).
 *
 * `condition` is a JSON blob — the shape is defined by the discount engine's
 * evaluator, not the schema. Examples:
 *   {"min_quantity": 10}
 *   {"customer_group": "vip"}
 *   {"min_order_value": "1000.0000"}
 *
 * `value` is the discount amount — either a percentage (0–100) if
 * discount_type = `percentage`, or an absolute amount (DECIMAL(18,4)) if
 * discount_type = `fixed`. Using DECIMAL(18,4) covers both cases.
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - Enums:   VARCHAR(32) — scope, discount_type.
 *   - value:   DECIMAL(18,4) — covers both percentage and fixed-amount values.
 *   - Dates:   DATE — valid_from / valid_to.
 *   - Booleans: TINYINT(1).
 *
 * No cross-table FK on scope_id — `scope_id` is a polymorphic reference
 * (product_id, category_id, party_id, or NULL) and no MySQL-level FK can
 * span multiple target tables. The application layer enforces referential
 * consistency.
 *
 * Soft delete: YES — discount_rules is configurable master data (§1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discount_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->string('name', 191);

            // product | category | party | order
            $table->string('scope', 32)->default('order');

            // ID of the product/category/party this rule targets.
            // NULL when scope = 'order'.
            $table->unsignedBigInteger('scope_id')->nullable();

            // JSON condition evaluated by the discount engine.
            $table->json('condition')->nullable();

            // percentage | fixed
            $table->string('discount_type', 32)->default('percentage');

            // DECIMAL(18,4) covers both percentage (0–100) and fixed-amount.
            $table->decimal('value', 18, 4);

            // Optional effective date window.
            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();

            // Lower number = higher priority.
            $table->unsignedSmallInteger('priority')->default(0);

            $table->tinyInteger('is_active')->default(1);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_discount_rules_uuid');

            // Required so future child tables can declare composite FKs.
            $table->unique(['tenant_id', 'id'], 'uq_discount_rules_tenant_id');

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // Discount engine queries active rules for a tenant by scope.
            $table->index(
                ['tenant_id', 'scope', 'is_active', 'priority'],
                'ix_discount_rules_tenant_scope_active'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_rules');
    }
};
