<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 2 — org. DATABASE_DESIGN §2 `factories`.
 *
 * `branch_id` is nullable per §2 — a factory need not sit under a branch, and a
 * tenant that runs production without a branch hierarchy is valid. The nullable
 * composite key is safe here for the same reason it was unsafe in `settings`:
 * this is a *foreign* key, and NULLs in a foreign key mean "no reference", not
 * "matches everything". Only UNIQUE indexes are broken by nullable columns.
 *
 * When `branch_id` is set, the composite `(tenant_id, branch_id)` key still
 * guarantees the branch belongs to the same tenant (ARCHITECTURE §3.1 layer 4).
 *
 * FINDING — the branch key is `RESTRICT`, not `SET NULL`, and it is not a free
 * choice. `ON DELETE SET NULL` nulls **every** column of the referencing key,
 * so on a composite `(tenant_id, branch_id)` it would attempt to null
 * `tenant_id` as well, which is `NOT NULL`. Verified against SQLite: deleting a
 * referenced branch failed with `NOT NULL constraint failed:
 * factories.tenant_id` — a confusing error at an unrelated call site rather
 * than either a clean detach or a clean rejection. `RESTRICT` is also the
 * correct semantic under §1.3: branches are master data, deactivated via
 * `is_active`/`deleted_at` and never hard-deleted, and a factory must be
 * reassigned deliberately rather than silently orphaned. **No composite
 * foreign key in this schema may use `SET NULL` while `tenant_id` leads it**;
 * §1.3 now records this.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('branch_id')->nullable();

            $table->string('code', 32);
            $table->string('name', 191);
            $table->text('address')->nullable();

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_factories_uuid');
            // §1.1 — tenant-scoped, so two tenants may both run factory `F01`.
            $table->unique(['tenant_id', 'code'], 'uq_factories_tenant_code');
            // Composite foreign key target for `production_lines` and, later,
            // for warehouses and production batches.
            $table->unique(['tenant_id', 'id'], 'uq_factories_tenant_id');

            $table->foreign(['tenant_id', 'company_id'], 'fk_factories_tenant_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            // RESTRICT, not SET NULL — see the FINDING above. SET NULL would
            // try to null `tenant_id` too, and `tenant_id` is NOT NULL.
            $table->foreign(['tenant_id', 'branch_id'], 'fk_factories_tenant_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            // §1.2 — the factory list filters by company and active flag.
            $table->index(['tenant_id', 'company_id', 'is_active'], 'ix_factories_tenant_company_active');
            $table->index(['tenant_id', 'branch_id'], 'ix_factories_tenant_branch');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factories');
    }
};
