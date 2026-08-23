<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 3 — identity. DATABASE_DESIGN §3 `permissions`.
 *
 * The one deliberate exemption from §1's tenant rule in this wave: permissions
 * are a **global catalogue with no `tenant_id`**. A tenant cannot invent a
 * permission, because a permission only means something if a backend policy
 * checks it, and policies ship in code. §1.1 does not apply to a table that has
 * no tenant, so `name` is globally unique.
 *
 * ADR-008 — the three segments are stored *both* joined in `name` and split
 * across `module`/`resource`/`action`. That is intentional duplication, not
 * redundancy: `name` is the identity the token, the seeder and the generated
 * TypeScript union all use, while the split columns are what the role editor
 * groups by. Deriving the split at read time would put string parsing in the
 * hot path of every permission screen; deriving `name` at read time would make
 * the identity a computed value that cannot be indexed as a natural key.
 *
 * DESIGN — no soft delete. §1 permits one on master data, but a soft-deleted
 * permission is a hazard: a policy checking `production.batch.approve` would
 * find nothing and silently deny, or worse, a `withTrashed()` somewhere would
 * resurrect it. §17.1 makes `PermissionSeeder` the only writer, so a retired
 * permission is removed from the seeder and its `role_permission` rows cascade.
 *
 * DESIGN — no `created_by`/`updated_by`. §1 makes them nullable for system
 * writes, and every row here *is* a system write from the seeder. Columns that
 * would be permanently NULL are noise.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid');

            // The canonical three-segment identity, e.g.
            // `production.batch.approve` (ADR-008).
            $table->string('name', 128);

            $table->string('module', 64);
            $table->string('resource', 64);

            // view | create | edit | delete | approve | export | print |
            // manage | configure (ADR-008).
            $table->string('action', 32);

            // Shown in the role editor. Translated client-side by key where the
            // UI needs it, so this is the developer-facing description.
            $table->string('description', 255)->nullable();

            $table->timestamps();

            $table->unique('uuid', 'uq_permissions_uuid');
            $table->unique('name', 'uq_permissions_name');

            // The role editor lists permissions grouped by module then resource,
            // which is also the order the seeder walks.
            $table->index(['module', 'resource'], 'ix_permissions_module_resource');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};
