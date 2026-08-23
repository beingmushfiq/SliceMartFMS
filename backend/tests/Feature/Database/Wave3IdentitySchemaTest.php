<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

/**
 * Wave 3 identity schema contract — DATABASE_DESIGN §3, §16.1, ARCHITECTURE
 * §3.1-§3.3, ADR-007, ADR-008.
 *
 * Wave 2 proved the org hierarchy cannot be crossed. Wave 3 is where crossing
 * it would actually grant something, so the same layer-5 obligation applies
 * with higher stakes: a defect here is a privilege escalation, not a reporting
 * error.
 *
 * Three things in this file are worth reading before changing anything:
 *
 *   - `test_two_platform_users_cannot_share_an_email` exists because the unique
 *     key §3 documents cannot enforce itself. `(tenant_id, email)` is unenforced
 *     wherever `tenant_id` is NULL, which is every platform user.
 *   - `test_a_platform_role_assignment_is_not_checked_by_the_database` asserts a
 *     **hole**, not a guarantee. It is the one place in this wave where the
 *     database is not the last line of defence, and it is pinned so that the
 *     gap is visible in the suite rather than only in a migration docblock.
 *   - `test_pruning_a_rotation_chain_takes_its_ancestors` pins a delete rule
 *     that points the opposite way from the column name, and would otherwise be
 *     "corrected" into a purge job that fails nondeterministically.
 */
final class Wave3IdentitySchemaTest extends SchemaTestCase
{
    /**
     * The six tables Wave 3 creates, plus `users` which it finalises (§16).
     */
    private const WAVE_3_TABLES = [
        'users',
        'permissions',
        'roles',
        'role_permission',
        'role_user',
        'user_scopes',
        'refresh_tokens',
    ];

    public function test_wave_3_creates_every_documented_table(): void
    {
        foreach (self::WAVE_3_TABLES as $table) {
            $this->assertTrue(Schema::hasTable($table), "Wave 3 table `{$table}` is missing.");
        }
    }

    public function test_the_users_table_carries_tenancy_after_its_second_step(): void
    {
        // §16.1 rule 1 — `users` is the only two-step table, and `ALTER TABLE`
        // appends, so §1's "`tenant_id` immediately after `id`" cannot hold
        // here. Column position carries no semantics; presence does. This test
        // asserts what the finalise step owes rather than where it landed.
        foreach (['uuid', 'tenant_id', 'status', 'perm_version', 'token_version', 'deleted_at'] as $column) {
            $this->assertTrue(
                Schema::hasColumn('users', $column),
                "`users.{$column}` is missing, so the Wave 3 finalise step is incomplete."
            );
        }

        $user = $this->insertUser($this->insertTenantWithPlan());

        // ADR-007 — both counters start at 1, so a token minted before any role
        // edit still compares equal and is not spuriously rejected on first use.
        $this->assertSame(1, (int) $this->columnValue('users', 'perm_version', $user));
        $this->assertSame(1, (int) $this->columnValue('users', 'token_version', $user));
    }

    public function test_an_email_is_unique_within_a_tenant_and_reusable_across_tenants(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $this->insertUser($first, ['email' => 'ops@slicemart.test']);

        $this->assertInsertRejected(
            'users',
            $this->userAttributes($first, ['email' => 'ops@slicemart.test']),
            'One tenant was allowed two users with the same email, so a login form '
            .'has no single row to authenticate against.'
        );

        // §1.1 — Wave 0's global key is dropped precisely so this works. One
        // person may be a member of two tenants, which API_CONTRACT §8.1 relies
        // on when it returns `data.tenants[]` and `requires_tenant_selection`.
        $this->insertUser($second, ['email' => 'ops@slicemart.test']);

        $this->assertSame(2, DB::table('users')->where('email', 'ops@slicemart.test')->count());
    }

    public function test_two_platform_users_cannot_share_an_email(): void
    {
        $this->insertUser(null, ['email' => 'root@platform.test']);

        // The `users` FINDING 3, pinned. `(tenant_id, email)` as documented in §3
        // would accept this row, because `tenant_id` is NULL on both and NULLs
        // never collide in a UNIQUE index on MySQL 8 or SQLite alike. The
        // `tenant_key` sentinel folds NULL to 0 so platform users share one
        // namespace and the key actually fires.
        $this->assertInsertRejected(
            'users',
            $this->userAttributes(null, ['email' => 'root@platform.test']),
            'Two platform users were allowed the same email address. The uniqueness '
            .'sentinel is not enforcing, so the platform login form cannot resolve '
            .'a single account.'
        );
    }

    public function test_the_platform_user_flag_is_derived_and_never_written(): void
    {
        $tenantUser = $this->insertUser($this->insertTenantWithPlan(), ['email' => 'staff@tenant.test']);
        $platformUser = $this->insertUser(null, ['email' => 'root@platform.test']);

        // §3 requires `is_platform_user` to be "mutually consistent with
        // `tenant_id IS NULL`". Derived, that is a database guarantee; stored, it
        // is a convention that drifts the first time a row is written by a path
        // that forgets it.
        $this->assertSame(0, (int) $this->columnValue('users', 'is_platform_user', $tenantUser));
        $this->assertSame(1, (int) $this->columnValue('users', 'is_platform_user', $platformUser));

        $this->assertSame(0, (int) $this->columnValue('users', 'tenant_key', $platformUser));

        // Read-only, so an Action cannot promote itself to the platform by
        // writing the flag — it would have to move the tenant, which the FK and
        // every scope above it would notice.
        $rejected = false;

        try {
            DB::table('users')->where('id', $tenantUser)->update(['is_platform_user' => 1]);
        } catch (Throwable) {
            $rejected = true;
        }

        $this->assertTrue(
            $rejected,
            '`users.is_platform_user` is writable, so a tenant user can be flagged as '
            .'a platform user without changing `tenant_id`.'
        );
    }

    public function test_the_permission_catalogue_is_global_and_has_no_tenant(): void
    {
        // §3 and ADR-008 — the single global exception in the whole schema. A
        // tenant cannot invent a permission because only a backend policy gives
        // one meaning, and policies ship in code.
        $this->assertFalse(
            Schema::hasColumn('permissions', 'tenant_id'),
            '`permissions` grew a `tenant_id`, which would let two tenants hold '
            .'different definitions of one policy check (§3, ADR-008).'
        );

        $this->insertPermission('production.batch.approve');

        $this->assertInsertRejected(
            'permissions',
            $this->permissionAttributes('production.batch.approve'),
            'The permission catalogue accepted a duplicate name, so a token claim '
            .'no longer identifies exactly one permission.'
        );

        $this->assertSame(
            'batch',
            $this->columnValue('permissions', 'resource'),
            'The three-segment name was not split into its columns, so the role '
            .'editor has nothing to group by (ADR-008).'
        );
    }

    public function test_a_role_slug_is_unique_per_tenant_and_per_platform_template(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $this->insertRole($first, ['slug' => 'operator']);

        $this->assertInsertRejected(
            'roles',
            $this->roleAttributes($first, ['slug' => 'operator']),
            'One tenant was allowed two roles with the same slug.'
        );

        // ADR-008 — roles are tenant-owned, so every tenant gets its own
        // `operator`. A global slug would leak one tenant's role list into
        // another tenant's validation errors.
        $this->insertRole($second, ['slug' => 'operator']);

        $this->insertRole(null, ['slug' => 'super_admin', 'is_system' => true]);

        // The `roles` FINDING — the same NULL problem as `users.email`, and it
        // matters because §17.2 has `CreateTenant` copy templates by slug. Two
        // templates sharing one slug would make that copy pick arbitrarily.
        $this->assertInsertRejected(
            'roles',
            $this->roleAttributes(null, ['slug' => 'super_admin']),
            'Two platform role templates were allowed the same slug, so `CreateTenant` '
            .'would seed an arbitrary one of them (§17.2).'
        );

        $this->assertSame(3, DB::table('roles')->count());
    }

    public function test_a_role_permission_grant_is_identified_by_its_pair_alone(): void
    {
        // §3 documents "primary key on both", which is the one place §1's `id`
        // and `uuid` requirements are waived. A pivot row is written as a set
        // difference when a role is saved and is never addressed by a URL, so a
        // public identifier would have no caller.
        $this->assertFalse(
            Schema::hasColumn('role_permission', 'uuid'),
            '`role_permission` grew a `uuid`, implying it is addressable. It is not (§3).'
        );

        $role = $this->insertRole($this->insertTenantWithPlan());
        $permission = $this->insertPermission('sales.invoice.create');

        DB::table('role_permission')->insert(['role_id' => $role, 'permission_id' => $permission]);

        $this->assertInsertRejected(
            'role_permission',
            ['role_id' => $role, 'permission_id' => $permission],
            'A role was granted the same permission twice. The composite primary key '
            .'is what makes a duplicate grant impossible without a second unique key.'
        );
    }

    public function test_removing_a_permission_from_the_catalogue_removes_every_grant_of_it(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $permission = $this->insertPermission('production.batch.approve');

        DB::table('role_permission')->insert([
            ['role_id' => $this->insertRole($first), 'permission_id' => $permission],
            ['role_id' => $this->insertRole($second), 'permission_id' => $permission],
        ]);

        // §17.1 makes `PermissionSeeder` the only writer of `permissions`, so a
        // retired permission is dropped from the seeder. §1.3 permits CASCADE
        // for a child with no independent meaning, and the alternative is worse
        // than a dangling row: a policy checking a name that no longer exists
        // would silently deny.
        DB::table('permissions')->where('id', $permission)->delete();

        $this->assertSame(
            0,
            DB::table('role_permission')->count(),
            'Grants of a retired permission survived it, so every role still claims '
            .'a permission no policy can check.'
        );
    }

    public function test_a_role_cannot_be_granted_to_a_user_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $owner = $this->insertTenant($plan['id'], 'tenant-one');
        $attacker = $this->insertTenant($plan['id'], 'tenant-two');

        $role = $this->insertRole($owner, ['slug' => 'owner-admin']);
        $outsider = $this->insertUser($attacker, ['email' => 'outsider@tenant-two.test']);

        // ARCHITECTURE §3.1 layer 4, and the reason `users` and `roles` both
        // carry `unique (tenant_id, id)`. Single-column keys would accept this:
        // the role exists, the user exists, and only the composite key can see
        // that they belong to different tenants.
        $this->assertInsertRejected(
            'role_user',
            $this->roleAssignmentAttributes($owner, $role, $outsider),
            'A role from one tenant was granted to a user in another. This is a '
            .'privilege escalation, not a data-quality problem.',
            'foreign',
        );
    }

    public function test_a_platform_role_assignment_is_not_checked_by_the_database(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $template = $this->insertRole(null, ['slug' => 'super_admin', 'is_system' => true]);
        $tenantUser = $this->insertUser($tenant, ['email' => 'staff@tenant.test']);

        // THIS ASSERTS A HOLE, NOT A GUARANTEE.
        //
        // `role_user.tenant_id` must be nullable so a platform user can hold a
        // platform role (ARCHITECTURE §3.2). But a composite foreign key is not
        // checked at all when any of its columns is NULL — MATCH SIMPLE, the only
        // behaviour MySQL 8 and SQLite implement. So on a NULL-tenant row neither
        // composite key fires, and the database accepts a platform grant pointing
        // at an ordinary tenant user: exactly the escalation the composite keys
        // were added to stop.
        //
        // No schema fix exists. A CHECK spanning three tables is not expressible,
        // SQLite cannot add a trigger via ALTER, and MySQL 8 rejects a foreign key
        // on a virtual generated column, which rules out the sentinel trick used
        // for uniqueness in this same wave.
        //
        // The obligation therefore moves up a layer: the Action that assigns a
        // platform role must assert both sides are platform, inside the
        // transaction, before the insert. When that Action exists this test stays
        // as-is — it describes the database, which will not have changed — and the
        // Action gets its own test proving it refuses this pair.
        DB::table('role_user')->insert($this->roleAssignmentAttributes(null, $template, $tenantUser));

        $this->assertSame(
            1,
            DB::table('role_user')->whereNull('tenant_id')->count(),
            'The database now rejects a NULL-tenant grant. If that is deliberate, the '
            .'`role_user` FINDING is obsolete and this test should be replaced by one '
            .'asserting the rejection.'
        );

        // The same NULL blindness means RESTRICT does not protect a template
        // either: the key that would refuse the delete is not evaluated.
        DB::table('roles')->where('id', $template)->delete();

        $this->assertSame(
            1,
            DB::table('role_user')->count(),
            'The grant was cleaned up, which would mean the NULL-tenant key is being '
            .'enforced after all.'
        );
    }

    public function test_a_role_with_members_cannot_be_deleted(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $role = $this->insertRole($tenant);
        $user = $this->insertUser($tenant, ['email' => 'member@tenant.test']);

        DB::table('role_user')->insert($this->roleAssignmentAttributes($tenant, $role, $user));

        // §1.3 — asymmetric on purpose. Cascading here would silently strip a
        // user's authority as a side effect of tidying up a role list; the
        // operator must reassign first, which is a decision.
        $this->assertDeleteRejectedByForeignKey(
            'roles',
            $role,
            'A role holding members was deleted outright, silently removing whatever '
            .'authority those members had through it.'
        );
    }

    public function test_deleting_a_user_takes_their_grants_scopes_and_tokens(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $role = $this->insertRole($tenant);
        $user = $this->insertUser($tenant, ['email' => 'leaver@tenant.test']);

        DB::table('role_user')->insert($this->roleAssignmentAttributes($tenant, $role, $user));
        DB::table('user_scopes')->insert($this->scopeAttributes($tenant, $user));
        DB::table('refresh_tokens')->insert($this->refreshTokenAttributes($tenant, $user));

        // §1.3 — all three are children with no independent meaning. Leaving any
        // of them behind is worse than a dangling row: an orphan refresh token is
        // a live session for an account that no longer exists.
        DB::table('users')->where('id', $user)->delete();

        $this->assertSame(0, DB::table('role_user')->count(), 'A deleted user kept their role grants.');
        $this->assertSame(0, DB::table('user_scopes')->count(), 'A deleted user kept their scope rows.');
        $this->assertSame(0, DB::table('refresh_tokens')->count(), 'A deleted user kept a usable refresh token.');
    }

    public function test_a_platform_user_cannot_be_given_a_scope_row(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $platformUser = $this->insertUser(null, ['email' => 'root@platform.test']);

        // The deliberate contrast with `role_user`. `user_scopes.tenant_id` is
        // NOT NULL, because a scope names a company, branch, factory, line or
        // warehouse and each of those lives in exactly one tenant. Because it is
        // NOT NULL the composite key is *always* checked, so this is refused by
        // the database with no Action involved — the enforcement layer that
        // `role_user` had to give up.
        $this->assertInsertRejected(
            'user_scopes',
            $this->scopeAttributes($tenant, $platformUser),
            'A platform user was given a tenant scope row. Platform access is granted '
            .'by a platform role, never by scoping into one tenant.',
            'foreign',
        );
    }

    public function test_a_scope_row_cannot_name_a_user_in_another_tenant(): void
    {
        $plan = $this->insertPlan();
        $owner = $this->insertTenant($plan['id'], 'tenant-one');
        $attacker = $this->insertTenant($plan['id'], 'tenant-two');

        $outsider = $this->insertUser($attacker, ['email' => 'outsider@tenant-two.test']);

        $this->assertInsertRejected(
            'user_scopes',
            $this->scopeAttributes($owner, $outsider),
            'A user in one tenant was scoped into another tenant.',
            'foreign',
        );
    }

    public function test_one_scope_row_per_user_per_target(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'manager@tenant.test']);

        $this->insertUserScope($tenant, $user, 'branch', 7);

        $this->assertInsertRejected(
            'user_scopes',
            $this->scopeAttributes($tenant, $user, 'branch', 7),
            'A user was scoped to the same branch twice, so revoking one row leaves '
            .'the access in place.'
        );

        // `scope_id` is polymorphic and carries no foreign key (§16.1 rule 2 does
        // not apply — the target varies by `scope_type`, and `warehouse` points at
        // a Wave 7 table). Id 7 therefore means a different row per type, and the
        // key must include the type to say so.
        $this->insertUserScope($tenant, $user, 'warehouse', 7);

        // ARCHITECTURE §3.3 — this table restricts, it never grants. An empty set
        // is the permissive state, which is why an out-of-scope request is a 403
        // naming the missing scope and not a 404 or an empty list.
        $unrestricted = $this->insertUser($tenant, ['email' => 'owner@tenant.test']);

        $this->assertSame(
            0,
            DB::table('user_scopes')->where('user_id', $unrestricted)->count(),
            'A user with no scope rows should see the whole tenant, so no row is '
            .'required to represent that (§3).'
        );

        $this->assertSame(2, DB::table('user_scopes')->count());
    }

    public function test_a_token_hash_is_unique_across_the_whole_platform(): void
    {
        $plan = $this->insertPlan();
        $first = $this->insertTenant($plan['id'], 'tenant-one');
        $second = $this->insertTenant($plan['id'], 'tenant-two');

        $hash = hash('sha256', 'a-single-issued-token');

        DB::table('refresh_tokens')->insert($this->refreshTokenAttributes(
            $first,
            $this->insertUser($first, ['email' => 'one@tenant-one.test']),
            ['token_hash' => $hash],
        ));

        // A deliberate §1.1 exception. API_CONTRACT §8.2 sends an empty body and
        // makes the cookie the only credential, so this lookup runs before any
        // tenant context exists. A tenant-scoped key could not serve the one
        // query the table exists for — and worse, would allow the same secret to
        // authenticate in two tenants.
        $this->assertInsertRejected(
            'refresh_tokens',
            $this->refreshTokenAttributes(
                $second,
                $this->insertUser($second, ['email' => 'two@tenant-two.test']),
                ['token_hash' => $hash],
            ),
            'The same refresh token hash was accepted in two tenants, so one secret '
            .'resolves to two sessions.'
        );
    }

    public function test_pruning_a_rotation_chain_takes_its_ancestors(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'session@tenant.test']);
        $family = (string) Str::uuid();

        $issued = DB::table('refresh_tokens')->insertGetId(
            $this->refreshTokenAttributes($tenant, $user, ['family_id' => $family])
        );

        $rotated = DB::table('refresh_tokens')->insertGetId(
            $this->refreshTokenAttributes($tenant, $user, ['family_id' => $family])
        );

        // Rotation as it actually happens (§8.2): the successor is created, then
        // the predecessor is revoked and pointed at it.
        DB::table('refresh_tokens')->where('id', $issued)->update([
            'replaced_by_id' => $rotated,
            'revoked_at' => '2026-08-23 12:00:00',
        ]);

        // The `refresh_tokens` FINDING, pinned. `replaced_by_id` inverts the
        // usual direction: the *predecessor* is the referencing row, so a rule on
        // "deleting the parent" acts on the newer token. Under RESTRICT a bulk
        // `delete where expires_at < ?` would fail whenever the driver reached a
        // successor before its predecessor — nondeterministically, which is the
        // worst possible failure mode for a purge job. CASCADE prunes the family
        // as the single unit of meaning it is.
        DB::table('refresh_tokens')->where('id', $rotated)->delete();

        $this->assertSame(
            0,
            DB::table('refresh_tokens')->count(),
            'Deleting a rotated token left its predecessor behind. If `replaced_by_id` '
            .'has been switched to RESTRICT, the nightly purge will fail on whichever '
            .'row order the driver happens to produce (ADR-007).'
        );
    }

    public function test_the_identity_ledgers_are_not_soft_deletable(): void
    {
        // §1 permits `deleted_at` on master data only. `users` and `roles` are
        // master data and are referenced everywhere, so they must deactivate.
        foreach (['users', 'roles'] as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "`{$table}` is master data referenced across the schema and must be "
                .'deactivated by a soft delete, never removed (§1).'
            );
        }

        // The rest are grants and a security ledger. A `deleted_at` on
        // `refresh_tokens` is the dangerous one: a careless global scope would
        // hide exactly the revoked rows the reuse detector compares against, and
        // ADR-007's stolen-token detection would silently stop working.
        foreach (['permissions', 'role_permission', 'role_user', 'user_scopes', 'refresh_tokens'] as $table) {
            $this->assertFalse(
                Schema::hasColumn($table, 'deleted_at'),
                "`{$table}` grew a `deleted_at`. Revocation is a delete plus an "
                .'`audit_logs` row, not a hidden row (§1).'
            );
        }
    }

    public function test_an_actor_column_is_deliberately_not_tenant_scoped(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $platformAdmin = $this->insertUser(null, ['email' => 'root@platform.test']);

        // Every other reference to `users` in this wave is a composite key. The
        // actor columns are single-column on purpose: a platform admin has no
        // tenant, so `(tenant_id, created_by)` would be unenforced on exactly the
        // rows where knowing the actor matters most, and would reject a support
        // action outright the rest of the time. `created_by` records *who acted*,
        // it does not grant anything, so it needs no tenant proof — the authority
        // was checked before the write.
        $role = $this->insertRole($tenant, ['created_by' => $platformAdmin]);

        $this->assertSame(
            $platformAdmin,
            (int) $this->columnValue('roles', 'created_by', $role),
            'A platform admin could not be recorded as the actor on a tenant row, so '
            .'support actions would be attributed to nobody.'
        );

        // It is still a real key — an unknown actor is not recordable.
        $this->assertInsertRejected(
            'roles',
            $this->roleAttributes($tenant, ['slug' => 'ghost-made', 'created_by' => 999_999]),
            'A row was attributed to a user that does not exist.',
            'foreign',
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function roleAssignmentAttributes(?int $tenantId, int $roleId, int $userId): array
    {
        return [
            'tenant_id' => $tenantId,
            'role_id' => $roleId,
            'user_id' => $userId,
        ];
    }

    private function insertUserScope(int $tenantId, int $userId, string $scopeType, int $scopeId): int
    {
        return DB::table('user_scopes')
            ->insertGetId($this->scopeAttributes($tenantId, $userId, $scopeType, $scopeId));
    }

    /**
     * @return array<string, mixed>
     */
    private function scopeAttributes(
        int $tenantId,
        int $userId,
        string $scopeType = 'branch',
        int $scopeId = 1,
    ): array {
        return [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'scope_type' => $scopeType,
            'scope_id' => $scopeId,
        ];
    }
}
