<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 2 — org. DATABASE_DESIGN §2 `branches`.
 *
 * `company_id` is deliberately **not** a plain `foreignId()->constrained()`.
 * A single-column foreign key only proves the company exists, not that it
 * belongs to the same tenant, so a bug or a forged id could attach a branch in
 * tenant 2 to a company in tenant 1 and the database would accept it.
 * ARCHITECTURE §3.1 layer 4 requires the schema itself to reject that, so the
 * key is composite on `(tenant_id, company_id)` against
 * `companies (tenant_id, id)`. Every tenant-scoped parent reference from here
 * on follows this form.
 *
 * `default_key` folds to the owning company rather than the tenant: a tenant
 * with three companies needs a default branch in each, and `company_id` is
 * already globally unique, so it is a sufficient sentinel on its own.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id');

            $table->string('code', 32);
            $table->string('name', 191);

            // sales | warehouse | factory | mixed (§1 enums are VARCHAR,
            // validated by a PHP enum, never MySQL ENUM).
            $table->string('type', 32);

            $table->text('address')->nullable();
            $table->string('phone', 32)->nullable();

            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Uniqueness sentinel. Never written by application code.
            $table->unsignedBigInteger('default_key')
                ->nullable()
                ->storedAs('case when is_default = 1 then company_id else null end');

            $table->unique('uuid', 'uq_branches_uuid');
            // §1.1 — unique within the tenant, not within the company: a branch
            // code appears on documents and in exports, where the company is
            // not always present to disambiguate it.
            $table->unique(['tenant_id', 'code'], 'uq_branches_tenant_code');
            $table->unique('default_key', 'uq_branches_default');
            // Composite foreign key target for `factories` and, later, for
            // warehouses, sales orders and every branch-scoped document.
            $table->unique(['tenant_id', 'id'], 'uq_branches_tenant_id');

            $table->foreign(['tenant_id', 'company_id'], 'fk_branches_tenant_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            // §1.2 — the branch list filters by company and active flag, and
            // sorts by name.
            $table->index(['tenant_id', 'company_id', 'is_active', 'name'], 'ix_branches_tenant_company_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
