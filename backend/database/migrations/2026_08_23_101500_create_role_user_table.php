<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 3 — identity. DATABASE_DESIGN §3 `role_user`.
 *
 * Unlike `role_permission`, this pivot *does* carry `tenant_id`, and it must:
 * both parents are tenant-scoped, so without it a tenant-A role could be
 * attached to a tenant-B user and every layer above the database would believe
 * the grant. The composite keys below are the whole point of the
 * `unique (tenant_id, id)` targets added to `users` and `roles`.
 *
 * `tenant_id` is **nullable**, which §3 does not state and which is forced by
 * the platform case. ARCHITECTURE §3.2 requires platform routes to demand a
 * platform role, so a platform user must be able to hold one — and a platform
 * user has `tenant_id IS NULL`, as does a platform role template. A NOT NULL
 * column here could reference neither, making platform authorisation
 * unrepresentable.
 *
 * FINDING — that nullability buys back less than it looks like. A composite
 * foreign key is not checked at all when any of its columns is NULL (MATCH
 * SIMPLE, the only behaviour MySQL 8 and SQLite implement). So on a platform
 * row — `tenant_id NULL` — *neither* composite key is enforced, and the
 * database would accept a NULL-tenant grant pointing at an ordinary tenant
 * user: precisely the privilege escalation the composite keys exist to stop.
 * The same rule is what lets a Wave 2 factory sit under no branch
 * (`Wave2OrgSchemaTest::test_a_factory_may_exist_without_a_branch`), benign
 * there and dangerous here.
 *
 * There is no schema fix available. A CHECK spanning three tables is not
 * expressible, a trigger is unavailable on SQLite via ALTER, and a generated
 * sentinel cannot carry a foreign key on MySQL 8 (foreign keys on virtual
 * generated columns are rejected). So this is recorded as a **known gap that an
 * Action must close**: assigning a platform role asserts both sides are
 * platform, inside the transaction, before the insert. It is the one place in
 * this wave where the database is not the last line of defence, and
 * `Wave3IdentitySchemaTest` pins the exact shape of the hole so nobody later
 * mistakes it for a guarantee that exists.
 *
 * §1.3 — CASCADE on the user, RESTRICT on the role. Asymmetric on purpose: a
 * deleted user's grants are meaningless, but a role still holding members must
 * not be deletable out from under them — the operator has to reassign first,
 * which is a decision and not a side effect.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_user', function (Blueprint $table): void {
            $table->id();

            // NULL marks a platform assignment. See the FINDING above.
            $table->unsignedBigInteger('tenant_id')->nullable();

            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('user_id');

            // Who granted the role and when. This is an authorisation change, so
            // `audit_logs` (Wave 4) records it too; these columns keep the
            // answer available on the row itself for the user-detail screen,
            // without a polymorphic audit query per row.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // §3 — a user holds a given role once. Both columns are NOT NULL, so
            // this is the one unique key in this wave that works exactly as
            // documented, with no sentinel needed.
            $table->unique(['role_id', 'user_id'], 'uq_role_user_role_user');

            $table->foreign(['tenant_id', 'role_id'], 'fk_role_user_tenant_role')
                ->references(['tenant_id', 'id'])
                ->on('roles')
                ->restrictOnDelete();

            // CASCADE, and safe: `users.tenant_id` is nullable but this key is
            // only checked when it is non-NULL, and DATABASE_DESIGN §1.3 forbids
            // SET NULL under a key led by `tenant_id`, not CASCADE.
            $table->foreign(['tenant_id', 'user_id'], 'fk_role_user_tenant_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->cascadeOnDelete();

            // §1.2 — the hot read is "every role held by this user", run on
            // every permission resolution.
            $table->index(['tenant_id', 'user_id'], 'ix_role_user_tenant_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_user');
    }
};
