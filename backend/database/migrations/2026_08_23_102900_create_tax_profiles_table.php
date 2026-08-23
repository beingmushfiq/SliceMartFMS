<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 5 — master data A. DATABASE_DESIGN §4 `tax_profiles`.
 *
 * A tax profile bundles the rate and computation mode (inclusive vs. exclusive,
 * simple vs. compound) that a product or party inherits by default. Products
 * carry a nullable `tax_profile_id`; parties carry one too (§4). Both FKs will
 * be declared when those tables are created.
 *
 * OPEN QUESTION Q2 — "Is the tax model (inclusive / exclusive / compound)
 * correct for all target markets?" (DATABASE_DESIGN §19). This schema captures
 * the current design without resolving Q2. Do not extend the tax model here —
 * Q2 must be answered in DECISIONS.md first (§19 rule). The columns `type` and
 * `is_compound` exist per the current spec and will be revised if Q2 changes the
 * model.
 *
 * `rate` is `DECIMAL(8,4)` — the §1 percentage convention (up to 9999.9999 %).
 *
 * `unique (tenant_id, id)` — required as the composite FK target for
 * `products.tax_profile_id` and `parties.tax_profile_id` in later waves.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_profiles', function (Blueprint $table): void {
            $table->id();
            // §1 — tenant_id is the first column after id.
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->string('code', 32);
            $table->string('name', 191);

            // §1 — DECIMAL(8,4) for percentages. Never FLOAT.
            $table->decimal('rate', 8, 4);

            // `inclusive` — the listed price already contains the tax.
            // `exclusive` — tax is added on top of the listed price.
            // §1 — VARCHAR(32), never a MySQL ENUM.
            $table->string('type', 32);

            // Whether this tax is compounded on top of any previously applied
            // tax layer. See Q2 before extending this flag.
            $table->boolean('is_compound')->default(false);

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_tax_profiles_uuid');

            // §1.1 — tax profile codes are unique within a tenant.
            $table->unique(['tenant_id', 'code'], 'uq_tax_profiles_tenant_code');

            // Composite FK target for `products.tax_profile_id`,
            // `parties.tax_profile_id` (both Wave 5+).
            $table->unique(['tenant_id', 'id'], 'uq_tax_profiles_tenant_id');

            // §1.2 — the tax profile list filters active profiles.
            $table->index(['tenant_id', 'is_active'], 'ix_tax_profiles_tenant_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_profiles');
    }
};
