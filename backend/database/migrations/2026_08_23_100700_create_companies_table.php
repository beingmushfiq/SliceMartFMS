<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 2 — org. DATABASE_DESIGN §2 `companies`.
 *
 * The first tenant-scoped table in the schema, so it establishes two patterns
 * every later wave copies.
 *
 * 1. `unique (tenant_id, id)` looks redundant next to the primary key, and is
 *    not. ARCHITECTURE §3.1 layer 4 promises the *database* rejects a
 *    cross-tenant reference, and a single-column `company_id` foreign key
 *    cannot do that — it would happily let a branch in tenant 2 point at a
 *    company in tenant 1. Children therefore declare a composite foreign key
 *    on `(tenant_id, company_id)`, which needs this key as its target.
 *
 * 2. `default_key` makes "one default company per tenant" a database
 *    invariant. `unique (tenant_id, is_default)` cannot express it — that
 *    would also forbid a second *non*-default company. Folding the row to
 *    NULL when `is_default = 0` uses the same NULL-never-collides behaviour
 *    that broke `settings` in Wave 1, this time deliberately: NULLs do not
 *    collide, so unlimited non-defaults are fine, while the single default
 *    row collapses to `tenant_id` and can only exist once. Promoting a new
 *    default must therefore clear the old one in the same transaction, which
 *    is the correct behaviour anyway.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table): void {
            $table->id();
            // §1 — tenant_id is the first column after id.
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->string('name', 191);
            // The registered legal entity name, which differs from the trading
            // name often enough that invoices need both.
            $table->string('legal_name', 191)->nullable();
            $table->string('tax_identifier', 64)->nullable();
            $table->string('registration_number', 64)->nullable();

            $table->text('address')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email', 191)->nullable();
            $table->string('logo_path', 255)->nullable();

            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Uniqueness sentinel. Never written by application code.
            $table->unsignedBigInteger('default_key')
                ->nullable()
                ->storedAs('case when is_default = 1 then tenant_id else null end');

            $table->unique('uuid', 'uq_companies_uuid');
            // §1.1 — a code is unique within a tenant, never globally.
            $table->unique(['tenant_id', 'name'], 'uq_companies_tenant_name');
            $table->unique('default_key', 'uq_companies_default');
            // Composite foreign key target for every tenant-scoped child.
            $table->unique(['tenant_id', 'id'], 'uq_companies_tenant_id');

            // §1.2 — the company list filters active and sorts by name.
            $table->index(['tenant_id', 'is_active', 'name'], 'ix_companies_tenant_active_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
