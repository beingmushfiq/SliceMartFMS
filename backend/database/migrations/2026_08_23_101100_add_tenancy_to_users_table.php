<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 3 — identity. DATABASE_DESIGN §3 `users`, §16.1 rule 1.
 *
 * `users` is the only table permitted a two-step creation: Wave 0 created the
 * framework stub so auth scaffolding boots, and this migration adds tenancy.
 * Everything below is therefore an `ALTER`, which constrains the tools
 * available in ways a `CREATE TABLE` is not. Three of those constraints were
 * measured against SQLite 3.51.3 rather than assumed.
 *
 * FINDING 1 — rule 1 is only safe because rule 3 exists. §1 requires a NOT NULL
 * `uuid` on every table, and SQLite refuses `ADD COLUMN ... NOT NULL` with no
 * default on a *populated* table (`Cannot add a NOT NULL column with default
 * value NULL`). It succeeds here only because `users` is still empty: rule 3
 * forbids a migration writing data, and the first row is created by
 * `CreateTenant` (§17.2) which runs after every migration. So the two-step
 * permission in rule 1 is bounded — a second step may add NOT NULL columns only
 * while the table is guaranteed empty, which is exactly the greenfield case it
 * was written for. It is not a general licence to backfill a live table.
 *
 * FINDING 2 — the sentinel idiom must change shape here. Wave 1 enforced
 * uniqueness over nullable columns with STORED generated columns. SQLite
 * rejects `ADD COLUMN ... STORED` outright (`cannot add a STORED column`) on
 * any table, empty or not, because a stored column would have to be
 * materialised for existing rows. VIRTUAL is accepted, indexable, recomputes
 * for pre-existing rows and is still read-only — verified on a populated table.
 * MySQL 8 accepts both, so VIRTUAL is the portable choice and the only one
 * available to a two-step table. STORED stays the idiom for `CREATE TABLE`
 * (Wave 1's precedent); VIRTUAL is used where an `ALTER` forces it.
 *
 * FINDING 3 — `(tenant_id, email)` cannot enforce what §3 needs, for the same
 * reason `settings` could not in Wave 1: `tenant_id` is nullable to mark a
 * platform user, and NULLs never collide in a UNIQUE index. As documented, two
 * platform users could share an email address, which on a login form is an
 * authentication defect and not merely a data-quality one. Uniqueness is
 * therefore enforced over `tenant_key`, which folds NULL to 0.
 *
 * DESIGN — `is_platform_user` is generated, not stored. §3 requires it to be
 * "mutually consistent with `tenant_id IS NULL`", which as a plain column is an
 * application convention that drifts the first time a row is written by a path
 * that forgets it. Derived from `tenant_id`, the consistency is a database
 * guarantee and the column cannot be written at all. A CHECK constraint would
 * express the same thing, but SQLite cannot add one via ALTER, so it could not
 * be exercised by the suite (the reasoning already applied to
 * `production_lines` in Wave 2).
 *
 * NOTE — §1 wants `uuid` and `tenant_id` immediately after `id`. `ALTER TABLE`
 * appends, so in this one table they sit at the end. Column order carries no
 * semantics; the alternative is a table rebuild that rule 1 exists to avoid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            // Wave 0's key is global. §1.1 requires tenant scoping, and two
            // tenants must be able to onboard the same person's address.
            $table->dropUnique('users_email_unique');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->uuid('uuid');

            // Nullable by design — NULL marks a platform user (§3). RESTRICT
            // because a tenant is deactivated, never hard-deleted (§1.3).
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->restrictOnDelete();

            $table->string('phone', 32)->nullable();

            // active | invited | suspended. No default, following the `tenants`
            // precedent: 'active' would silently over-grant an invited user and
            // 'invited' would lock out an owner, so the Action states it.
            $table->string('status', 32);

            // Overrides the tenant locale when set; NULL inherits (§3).
            $table->string('locale', 10)->nullable();

            // ADR-007. Two counters, not one, because they answer different
            // questions: `perm_version` invalidates a *cached permission set*
            // when roles or scopes change, while `token_version` invalidates
            // *every session* on logout-all or a forced reset
            // (API_CONTRACT §8.6). Bumping the wrong one either fails to lock
            // out a compromised session or logs the world out over a role edit.
            $table->unsignedInteger('perm_version')->default(1);
            $table->unsignedInteger('token_version')->default(1);

            $table->timestamp('last_login_at')->nullable();
            // 45 characters: an IPv4-mapped IPv6 literal is the longest form.
            $table->string('last_login_ip', 45)->nullable();

            // Phase 10. Present now so enabling 2FA is not a migration against
            // a large populated table.
            $table->text('two_factor_secret')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            // §1 permits a soft delete on master data. Users are referenced by
            // `created_by`/`updated_by` on every table in the schema, so a hard
            // delete could never succeed anyway.
            $table->softDeletes();
        });

        Schema::table('users', function (Blueprint $table): void {
            // Generated, never written. See FINDING 2 and DESIGN above.
            $table->unsignedBigInteger('tenant_key')->virtualAs('coalesce(tenant_id, 0)');
            $table->boolean('is_platform_user')->virtualAs('tenant_id is null');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->unique('uuid', 'uq_users_uuid');

            // §1.1 via the sentinel — one address per tenant, and one across
            // all platform users.
            $table->unique(['tenant_key', 'email'], 'uq_users_tenant_email');

            // Composite foreign key target for `role_user`, `user_scopes` and
            // `refresh_tokens`, so those tables can prove a user belongs to the
            // tenant they claim (ARCHITECTURE §3.1 layer 4).
            $table->unique(['tenant_id', 'id'], 'uq_users_tenant_id');

            // §1.2 — the user list filters by status and sorts by name.
            $table->index(['tenant_id', 'status', 'name'], 'ix_users_tenant_status_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique('uq_users_uuid');
            $table->dropUnique('uq_users_tenant_email');
            $table->dropUnique('uq_users_tenant_id');
            $table->dropIndex('ix_users_tenant_status_name');
        });

        // Before `tenant_id`: a generated column cannot outlive the column its
        // expression reads.
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['tenant_key', 'is_platform_user']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('tenant_id');
            $table->dropConstrainedForeignId('created_by');
            $table->dropConstrainedForeignId('updated_by');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'uuid',
                'phone',
                'status',
                'locale',
                'perm_version',
                'token_version',
                'last_login_at',
                'last_login_ip',
                'two_factor_secret',
                'two_factor_confirmed_at',
                'deleted_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->unique('email', 'users_email_unique');
        });
    }
};
