<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 3 — identity. DATABASE_DESIGN §3 `role_permission`.
 *
 * DESIGN — this pivot has **no `tenant_id`, deliberately**, and unlike
 * `permissions` the reason is not that it sits outside tenancy. A row joins a
 * tenant-scoped `role` to a global `permission`. The tenant is already an
 * attribute of the role, and `role_id` is globally unique, so a single-column
 * key here still proves exactly one thing and cannot be ambiguous.
 *
 * Adding `tenant_id` would *create* a cross-tenant hazard rather than close one:
 * a denormalised copy can disagree with `roles.tenant_id`, and then the two
 * answers to "whose grant is this?" have to be reconciled by whichever query
 * happens to run. ARCHITECTURE §3.1 layer 4 asks the database to make a
 * cross-tenant *reference* impossible; here the reference is to a row that
 * carries its own tenant, so the guarantee already holds. This is the shape
 * §1's tenant rule is exempting when it says pivots follow their parent.
 *
 * §1.3 — CASCADE on both sides. A pivot row has no independent meaning: delete
 * the role and the grant is meaningless, remove a retired permission from
 * `PermissionSeeder` (§17.1) and every grant of it must go with it. This is one
 * of the three cases §1.3 permits CASCADE for.
 *
 * DESIGN — composite primary key, no surrogate `id` and no `uuid`. §1 requires
 * both on every table, and this is the documented exception: §3 specifies
 * "primary key on both". A pivot row is never addressed by a URL or an API
 * payload — it is written as a set difference when a role's permissions are
 * saved — so a public identifier would have no caller. The composite PK is also
 * what makes a duplicate grant impossible without a second unique key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_permission', function (Blueprint $table): void {
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();

            // §3 — the pair *is* the identity.
            $table->primary(['role_id', 'permission_id']);

            // The PK covers `role_id` lookups (a role's permission set). The
            // reverse — "which roles grant this?", asked by the permission
            // audit screen — needs its own index, and §1.2 requires every FK to
            // be indexed regardless.
            $table->index('permission_id', 'ix_role_permission_permission');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_permission');
    }
};
