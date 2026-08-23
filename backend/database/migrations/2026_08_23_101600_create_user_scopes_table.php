<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 3 — identity. DATABASE_DESIGN §3 `user_scopes`, ARCHITECTURE §3.3.
 *
 * Which slice of the hierarchy a user may act in. **No rows means the whole
 * tenant**, subject to permissions — so this table restricts, it never grants,
 * and an empty table is the permissive state. That inversion is the reason
 * ARCHITECTURE §3.3 insists an out-of-scope request returns `403` naming the
 * missing scope rather than `404` or an empty list: the resource exists and the
 * user's own tenant owns it, so pretending otherwise would misdescribe a
 * configuration problem as a missing record.
 *
 * DESIGN — `tenant_id` is **NOT NULL**, deliberately unlike `role_user` in this
 * same wave. A scope names a company, branch, factory, production line or
 * warehouse, all of which live inside exactly one tenant, so a NULL-tenant
 * scope row would name nothing. Because it is NOT NULL, the composite key to
 * `users` is *always* checked, and a platform user (`users.tenant_id IS NULL`)
 * therefore cannot acquire a scope row at all — the database rejects it, with
 * no Action required. That is the guarantee `role_user` could not have, and the
 * contrast is the point: nullability there was forced by platform roles and cost
 * a real enforcement layer.
 *
 * DESIGN — `scope_id` carries **no foreign key**, and this is not a deferred
 * obligation under §16.1 rule 2. The target table varies by `scope_type`, which
 * is the same polymorphic situation as `settings.scope_id` in Wave 1, and no
 * single-target key can express it. `warehouse` additionally points at a table
 * that does not exist until Wave 7. Validity of the pair is an Action's
 * responsibility; §1.2's polymorphic index rule is what applies here instead.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_scopes', function (Blueprint $table): void {
            $table->id();

            // NOT NULL — see the DESIGN note above.
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('user_id');

            // company | branch | factory | production_line | warehouse (§3).
            $table->string('scope_type', 32);

            // Polymorphic — no FK. See the DESIGN note above.
            $table->unsignedBigInteger('scope_id');

            // Who granted the scope. As with `role_user`, this is an
            // authorisation change and `audit_logs` (Wave 4) also records it.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique('uuid', 'uq_user_scopes_uuid');

            // §3 — one row per user per scope target. All three columns are NOT
            // NULL, so this key works exactly as documented with no sentinel.
            $table->unique(['user_id', 'scope_type', 'scope_id'], 'uq_user_scopes_user_scope');

            // CASCADE — a scope has no meaning without its user (§1.3).
            $table->foreign(['tenant_id', 'user_id'], 'fk_user_scopes_tenant_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->cascadeOnDelete();

            $table->foreign('tenant_id', 'fk_user_scopes_tenant')
                ->references('id')
                ->on('tenants')
                ->restrictOnDelete();

            // §1.2 polymorphic pair — answers "who may act in this branch?",
            // which the scope editor and any reassignment flow both need.
            $table->index(['tenant_id', 'scope_type', 'scope_id'], 'ix_user_scopes_tenant_scope');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_scopes');
    }
};
