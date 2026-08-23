<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 3 — identity. DATABASE_DESIGN §3 `roles`.
 *
 * `tenant_id` is nullable, and here the NULL means something different from
 * `users`: it marks a **platform template** that `CreateTenant` copies into a
 * new tenant (§17.2 seeds Owner, Admin, Manager, Operator, Viewer), not a
 * platform actor. A template is never attached to a user directly — `role_user`
 * requires a tenant-scoped role — so the two meanings never collide in a query.
 *
 * FINDING — the documented unique key `(tenant_id, slug)` has the Wave 1 NULL
 * problem a third time: with `tenant_id` NULL, nothing stops two platform
 * templates sharing a slug, and `CreateTenant` selecting templates by slug
 * would then copy an arbitrary one. Enforced over the `tenant_key` sentinel
 * instead. VIRTUAL rather than STORED for consistency with `users` in this same
 * wave — the two tables are read together constantly and one idiom is easier to
 * trust than two, and it costs nothing here since MySQL 8 and SQLite both index
 * VIRTUAL columns.
 *
 * ADR-008 — "roles are tenant-owned and fully editable. No role name is
 * hardcoded in logic." `is_system` therefore protects a row from *deletion*, it
 * does not make its name meaningful to code. The only reserved identity is the
 * platform `super_admin`, which is a template row here (`tenant_id IS NULL`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();

            // NULL marks a platform template, not a platform user.
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->string('name', 191);
            $table->string('slug', 64);
            $table->string('description', 255)->nullable();

            // A system role cannot be deleted. It can still be renamed and have
            // its permissions edited (ADR-008).
            $table->boolean('is_system')->default(false);

            // Display ordering only — NOT a privilege ranking. Authorisation is
            // the union of granted permissions, never a comparison of levels,
            // so a lower number confers nothing.
            $table->unsignedSmallInteger('level')->default(0);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Uniqueness sentinel. Never written by application code.
            $table->unsignedBigInteger('tenant_key')->virtualAs('coalesce(tenant_id, 0)');

            $table->unique('uuid', 'uq_roles_uuid');
            // §1.1 via the sentinel — see the FINDING above.
            $table->unique(['tenant_key', 'slug'], 'uq_roles_tenant_slug');

            // Composite foreign key target for `role_user`.
            $table->unique(['tenant_id', 'id'], 'uq_roles_tenant_id');

            // §1.2 — the role list sorts by level then name.
            $table->index(['tenant_id', 'level', 'name'], 'ix_roles_tenant_level_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
