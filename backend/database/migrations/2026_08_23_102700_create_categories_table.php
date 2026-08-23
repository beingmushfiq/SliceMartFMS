<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 5 — master data A. DATABASE_DESIGN §4 `categories`.
 *
 * A self-referencing adjacency tree. A category with `parent_id = NULL` is a
 * root; any other category holds a reference to its immediate parent. The
 * `path` column materialises the ancestor chain (e.g. `1/4/17`) for cheap
 * subtree queries without a recursive CTE on every read.
 *
 * SELF-REFERENTIAL COMPOSITE FK — `(tenant_id, parent_id)` points at
 * `categories(tenant_id, id)`. This is both composite (for cross-tenant
 * isolation, §1.3) and nullable (`parent_id IS NULL` means root). The MATCH
 * SIMPLE rule (DATABASE_DESIGN §1.3 amendment) is correct here: a NULL
 * `parent_id` means "no parent", so skipping the check when `parent_id` is
 * NULL is the intended semantics, not a gap.
 *
 * `RESTRICT` — a category with children cannot be deleted outright. An Action
 * must re-parent or remove the children first. SET NULL is forbidden on a
 * composite key led by `tenant_id` (§1.3 correction).
 *
 * `unique (tenant_id, code)` — category codes are tenant-scoped, so two
 * tenants may use the same taxonomy. A code is printed on exports and is
 * therefore unique across the whole tenant, not just within a branch.
 *
 * `unique (tenant_id, id)` — this table is referenced by `products.category_id`
 * via a composite FK, so it must carry this target key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table): void {
            $table->id();
            // §1 — tenant_id is the first column after id.
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            // Self-referential parent. NULL = root category.
            $table->unsignedBigInteger('parent_id')->nullable();

            $table->string('code', 32);
            $table->string('name', 191);

            // Materialised ancestor path: slash-separated `id` values from root
            // to self, e.g. `1/4/17`. Written by the Action that creates or
            // moves a category. Cheap subtree read: `WHERE path LIKE '1/4/%'`.
            // VARCHAR(512) — accommodates 50+ levels of nesting at 10 chars each.
            $table->string('path', 512)->nullable();

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_categories_uuid');

            // §1.1 — category codes are unique within a tenant.
            $table->unique(['tenant_id', 'code'], 'uq_categories_tenant_code');

            // Composite FK target for `products.category_id` and any other
            // table that references a category by (tenant_id, category_id).
            $table->unique(['tenant_id', 'id'], 'uq_categories_tenant_id');

            // Self-referential composite FK — proves the parent belongs to the
            // same tenant. RESTRICT: a parent with children cannot be deleted.
            // NULL parent_id is not checked (MATCH SIMPLE §1.3 amendment) —
            // that is correct: NULL means "no parent", not "parent anywhere".
            $table->foreign(['tenant_id', 'parent_id'], 'fk_categories_tenant_parent')
                ->references(['tenant_id', 'id'])
                ->on('categories')
                ->restrictOnDelete();

            // §1.2 — the category tree is always read per tenant, filtered active.
            $table->index(['tenant_id', 'is_active'], 'ix_categories_tenant_active');
            // Subtree reads use path LIKE, so the leading column must be tenant_id.
            $table->index(['tenant_id', 'path'], 'ix_categories_tenant_path');
            // FK index on parent — required by §1.2 every FK must be indexed.
            $table->index(['tenant_id', 'parent_id'], 'ix_categories_tenant_parent');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
