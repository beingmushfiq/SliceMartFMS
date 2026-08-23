<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

/**
 * Wave 4 infrastructure schema contract — DATABASE_DESIGN §3, §1.1-§1.4, §13.3,
 * §14.5, §18; API_CONTRACT §6, §7; ADR-018, ADR-019, ADR-027, ADR-028.
 *
 * Waves 1-3 built the tenancy spine and proved it cannot be crossed. Wave 4 is
 * the cross-cutting machinery that every later wave writes into, so a defect
 * here does not stay in one module: an audit row that can be rewritten, an
 * idempotency key that replays one user's response to another, or a numbering
 * series that can exist twice all surface as module bugs much later.
 *
 * Four tests here are worth reading before changing anything:
 *
 *   - `test_an_audit_row_survives_the_deletion_of_its_actor` pins the one place
 *     §1.3's CASCADE guidance is deliberately overruled by ADR-027, and its
 *     consequence: a user who has done anything can never be hard-deleted.
 *   - `test_one_idempotency_key_may_be_reused_across_routes_and_users` asserts
 *     the resolution of a rank-4 conflict between two documents of equal
 *     precedence. Narrowing the key back to §3's wording is a data-exposure bug,
 *     not a simplification.
 *   - `test_a_tenant_cannot_hold_two_series_for_one_document_type` covers the
 *     third instance of the §1.1 NULL-in-a-unique-key defect, and the one where
 *     the consequence is duplicate document numbers.
 *   - `test_a_queued_notification_is_distinguishable_from_a_failed_one` pins the
 *     absence of a `status` column as a design decision rather than an omission.
 */
final class Wave4InfraSchemaTest extends SchemaTestCase
{
    /**
     * The seven tables Wave 4 creates (§16).
     */
    private const WAVE_4_TABLES = [
        'audit_logs',
        'idempotency_keys',
        'attachments',
        'notifications',
        'notification_preferences',
        'document_sequences',
        'activity_snapshots',
    ];

    public function test_wave_4_creates_every_documented_table(): void
    {
        foreach (self::WAVE_4_TABLES as $table) {
            $this->assertTrue(Schema::hasTable($table), "Wave 4 table `{$table}` is missing.");
        }
    }

    public function test_every_wave_4_table_is_tenant_scoped(): void
    {
        // §15 — exactly six tables in the whole schema carry no `tenant_id`, and
        // none of them is in this wave. Checked as a group because these are the
        // tables every later module writes into, so one missing column would
        // silently opt a cross-cutting concern out of `BelongsToTenant`.
        foreach (self::WAVE_4_TABLES as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'tenant_id'),
                "`{$table}` has no `tenant_id`, but §15 lists only six such tables and "
                .'this is not one of them.'
            );
        }
    }

    public function test_the_audit_trail_has_no_update_or_delete_affordance(): void
    {
        // ADR-027 / §18 — append-only. The application-code half of that rule is
        // unenforceable from here, so this asserts the schema half: the columns
        // that would make either operation look legitimate are absent.
        $this->assertFalse(
            Schema::hasColumn('audit_logs', 'updated_at'),
            '`audit_logs` grew an `updated_at`. Eloquent would then maintain it for '
            .'free on any model with default timestamps, which is an UPDATE path onto '
            .'an append-only table (ADR-027).'
        );

        $this->assertFalse(
            Schema::hasColumn('audit_logs', 'deleted_at'),
            '`audit_logs` grew a `deleted_at`. A hidden audit row is worse than a '
            .'deleted one, because it still passes a row count (ADR-027).'
        );
    }

    public function test_an_audit_row_records_the_moment_the_caller_supplied(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'actor@tenant.test']);

        $id = DB::table('audit_logs')->insertGetId(
            $this->auditLogAttributes($tenant, $user, ['created_at' => '2026-08-23 09:15:00'])
        );

        // No CURRENT_TIMESTAMP default: ADR-027 puts the write inside the
        // mutation's transaction, so the business moment is the caller's, and a
        // database default would silently substitute the row-write clock.
        $this->assertSame(
            '2026-08-23 09:15:00',
            $this->columnValue('audit_logs', 'created_at', $id),
            'The audit row did not keep the timestamp it was given.'
        );

        // And it is required — an audit row with no time is not evidence.
        $attributes = $this->auditLogAttributes($tenant, $user);
        unset($attributes['created_at']);

        $this->assertInsertRejected(
            'audit_logs',
            $attributes,
            'An audit row was accepted with no `created_at`, so the trail cannot be '
            .'ordered (ADR-027).',
            'notnull',
        );
    }

    public function test_an_audit_row_survives_the_deletion_of_its_actor(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'leaver@tenant.test']);

        DB::table('audit_logs')->insert($this->auditLogAttributes($tenant, $user));

        // The deliberate inversion of §1.3. Wave 3 proved that deleting a user
        // takes their grants, scopes and tokens — all CASCADE, all correct. Here
        // RESTRICT wins, because deleting a user must not be able to erase the
        // record of what they did.
        $this->assertDeleteRejectedByForeignKey(
            'users',
            $user,
            'A user with audit history was hard-deleted. Whatever they did is now '
            .'unattributable, which is the one outcome ADR-027 exists to prevent.'
        );

        // The same holds one level up, and is the more surprising consequence: a
        // tenant that has done anything cannot be dropped either. Offboarding is
        // an explicit archive-then-purge Action that must decide what happens to
        // the trail — not something a cascade decides by accident.
        $this->assertDeleteRejectedByForeignKey(
            'tenants',
            $tenant,
            'A tenant with audit history was deleted outright, taking the evidence '
            .'with it.'
        );
    }

    public function test_an_audit_row_may_name_no_actor_and_no_record(): void
    {
        $tenant = $this->insertTenantWithPlan();

        // NULL `user_id` means "the platform did this" — a scheduled job, a queue
        // worker, a console command. It is a different claim from "we do not know
        // who did this", which §3's vocabulary has no row for because an
        // unattributable mutation is a defect, not a state.
        DB::table('audit_logs')->insert($this->auditLogAttributes($tenant, null, [
            'action' => 'exported',
        ]));

        // And `logged_in` / `permission_denied` record an event against no row at
        // all, so the polymorphic pair must be optional. Forcing a target would
        // mean inventing one.
        DB::table('audit_logs')->insert($this->auditLogAttributes(null, null, [
            'action' => 'permission_denied',
            'auditable_type' => null,
            'auditable_id' => null,
        ]));

        $this->assertSame(2, DB::table('audit_logs')->count());
    }

    public function test_an_audit_row_can_be_found_by_its_correlation_id(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'actor@tenant.test']);
        $correlationId = (string) Str::uuid();

        DB::table('audit_logs')->insert($this->auditLogAttributes($tenant, $user, [
            'correlation_id' => $correlationId,
        ]));

        // API_CONTRACT §7 — a support ticket arrives carrying only the Reference
        // the user was shown. This is the join that turns it back into "what
        // changed", so it must be a lookup and not a scan.
        $this->assertSame(
            1,
            DB::table('audit_logs')->where('correlation_id', $correlationId)->count(),
            'An audit row could not be located by the correlation id the user was '
            .'shown, so a support Reference resolves to nothing (API_CONTRACT §7).'
        );
    }

    public function test_one_idempotency_key_is_stored_once_per_intent(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'buyer@tenant.test']);
        $key = (string) Str::uuid();

        DB::table('idempotency_keys')->insert(
            $this->idempotencyKeyAttributes($tenant, $user, ['key' => $key])
        );

        // §6.3 — the second arrival of the same intent must find the stored row,
        // not create a sibling. Without this key both requests would execute and
        // ADR-028's whole guarantee would be a no-op.
        $this->assertInsertRejected(
            'idempotency_keys',
            $this->idempotencyKeyAttributes($tenant, $user, ['key' => $key]),
            'The same key was stored twice for one route and user, so a retry would '
            .'execute the operation a second time (ADR-028).'
        );
    }

    public function test_one_idempotency_key_may_be_reused_across_routes_and_users(): void
    {
        $plan = $this->insertPlan();
        $tenant = $this->insertTenant($plan['id'], 'tenant-one');
        $other = $this->insertTenant($plan['id'], 'tenant-two');

        $first = $this->insertUser($tenant, ['email' => 'one@tenant-one.test']);
        $second = $this->insertUser($tenant, ['email' => 'two@tenant-one.test']);
        $outsider = $this->insertUser($other, ['email' => 'three@tenant-two.test']);

        $key = (string) Str::uuid();

        // The FINDING, pinned. §3 documents unique `(tenant_id, key)`;
        // API_CONTRACT §6.2 scopes it `(tenant_id, user_id, route, key)`. Both
        // are rank-4 documents, so this was escalated rather than decided
        // silently, and resolved in favour of §6.2.
        //
        // Under §3's narrower key every one of these four inserts after the first
        // would collide. Two of those collisions are merely wrong: one client
        // reusing a key across two routes, and two users of a tenant generating
        // the same UUID. The third is a security bug — §6.3 replays the stored
        // response verbatim when the body hash matches, so the second caller
        // would receive the first caller's response body.
        DB::table('idempotency_keys')->insert([
            $this->idempotencyKeyAttributes($tenant, $first, ['key' => $key]),
            $this->idempotencyKeyAttributes($tenant, $first, [
                'key' => $key,
                'endpoint' => 'inventory.transfers.store',
            ]),
            $this->idempotencyKeyAttributes($tenant, $second, ['key' => $key]),
            $this->idempotencyKeyAttributes($other, $outsider, ['key' => $key]),
        ]);

        $this->assertSame(
            4,
            DB::table('idempotency_keys')->where('key', $key)->count(),
            'One of these four distinct intents was rejected as a duplicate. If the '
            .'unique key has been narrowed back to §3 as written, a retry of one '
            .'intent can now return another user\'s response body (API_CONTRACT §6.3).'
        );
    }

    public function test_an_in_flight_idempotent_request_is_distinguishable_from_a_finished_one(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'buyer@tenant.test']);

        $id = DB::table('idempotency_keys')->insertGetId(
            $this->idempotencyKeyAttributes($tenant, $user)
        );

        // §6.3 has three branches, and NULL is what separates two of them: a
        // replay arriving while the original is still running gets `409 LOCKED`
        // with `Retry-After: 1`, while a finished one gets the stored response.
        // A default of 0 or 202 would collapse those two states into one.
        $this->assertNull(
            $this->columnValue('idempotency_keys', 'response_status', $id),
            'A newly stored key already has a `response_status`, so the server cannot '
            .'tell an in-flight request from a completed one (API_CONTRACT §6.3).'
        );

        $this->assertNull($this->columnValue('idempotency_keys', 'response_body', $id));
    }

    public function test_an_idempotency_key_cannot_be_written_without_an_actor(): void
    {
        $tenant = $this->insertTenantWithPlan();

        // §6.1's eleven routes are all authenticated tenant actions, and §14.1
        // keys inbound webhooks in `webhook_deliveries` instead — precisely so an
        // unauthenticated caller never writes here. NOT NULL is what enforces
        // that split, and it is also what keeps the unique key firing (§1.1).
        $attributes = $this->idempotencyKeyAttributes($tenant, 1);
        $attributes['user_id'] = null;

        $this->assertInsertRejected(
            'idempotency_keys',
            $attributes,
            'An idempotency key was stored with no user. Every NULL-user row would '
            .'then be exempt from the unique key, so no replay of it could ever be '
            .'detected (§1.1).',
            'notnull',
        );
    }

    public function test_the_same_file_may_be_attached_to_two_records(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $checksum = hash('sha256', 'one-signed-pdf');

        DB::table('attachments')->insert([
            $this->attachmentAttributes($tenant, [
                'attachable_type' => 'batch',
                'attachable_id' => 5,
                'checksum' => $checksum,
            ]),
            $this->attachmentAttributes($tenant, [
                'attachable_type' => 'delivery',
                'attachable_id' => 9,
                'checksum' => $checksum,
            ]),
        ]);

        // `checksum` is indexed but deliberately not unique. The same QC photo
        // legitimately belongs to a batch and to the delivery that shipped it,
        // and a unique key would reject the second attachment and force the user
        // to re-upload under a different name — worse than storing the bytes
        // twice.
        $this->assertSame(
            2,
            DB::table('attachments')->where('checksum', $checksum)->count(),
            'The second attachment of an identical file was rejected. Deduplication '
            .'is a storage decision, not a constraint that refuses the row.'
        );
    }

    public function test_an_attachment_is_unlinked_rather_than_erased(): void
    {
        $tenant = $this->insertTenantWithPlan();

        // The wave's only soft delete, and §1 restricts `deleted_at` to master
        // data. It is earned here because nothing in the database can delete the
        // file: the Action removes the row inside its transaction and queues the
        // disk removal for after commit (ARCHITECTURE §5.2). A hard delete would
        // commit the row's removal while the file removal is merely queued, and a
        // failed job would leave a file nobody can find and nobody can prove they
        // own.
        $this->assertTrue(
            Schema::hasColumn('attachments', 'deleted_at'),
            '`attachments` lost its `deleted_at`, so a failed disk-removal job now '
            .'orphans the file with no row to retry from.'
        );

        DB::table('attachments')->insert($this->attachmentAttributes($tenant, [
            'deleted_at' => '2026-08-23 12:00:00',
        ]));

        $this->assertSame(
            1,
            DB::table('attachments')->whereNotNull('deleted_at')->count(),
            'An unlinked attachment left no row for the purge job to work from.'
        );
    }

    public function test_a_tenant_with_attachments_cannot_be_deleted(): void
    {
        $tenant = $this->insertTenantWithPlan();

        DB::table('attachments')->insert($this->attachmentAttributes($tenant));

        // RESTRICT, not CASCADE, for the same reason as the soft delete: a
        // cascade would drop every row while the files stay on disk, and there
        // would then be nothing left that says who they belonged to.
        $this->assertDeleteRejectedByForeignKey(
            'tenants',
            $tenant,
            'A tenant holding attachments was deleted, orphaning every file it owned '
            .'on disk with no row to identify them.'
        );
    }

    public function test_a_notification_stores_translation_keys_not_rendered_text(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'recipient@tenant.test']);

        // ADR-018 — the row records what happened; the client renders it in the
        // reader's current locale. A rendered string would freeze the
        // notification into the locale active at write time, usually the actor's
        // rather than the recipient's.
        $id = DB::table('notifications')->insertGetId($this->notificationAttributes($tenant, $user));

        $this->assertSame(
            'notifications.production.batch.qc_failed.title',
            $this->columnValue('notifications', 'title_key', $id)
        );

        foreach (['title', 'body', 'message'] as $column) {
            $this->assertFalse(
                Schema::hasColumn('notifications', $column),
                "`notifications.{$column}` exists, which is rendered text. ADR-018 "
                .'stores keys and params so the recipient reads it in their own locale.'
            );
        }

        // UI_SYSTEM §5 has exactly four status colours, so a notification that
        // does not say otherwise renders in the neutral one rather than in none.
        $this->assertSame('info', $this->columnValue('notifications', 'severity', $id));
    }

    public function test_a_queued_notification_is_distinguishable_from_a_failed_one(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'recipient@tenant.test']);

        $queued = DB::table('notifications')->insertGetId($this->notificationAttributes($tenant, $user));

        // Three nullable timestamps and no `status` column. A derived status enum
        // would be a fourth source of truth that can disagree with the other
        // three, and the disagreement would be invisible.
        $this->assertFalse(
            Schema::hasColumn('notifications', 'status'),
            '`notifications` grew a `status`. It can only ever restate `sent_at`, '
            .'`read_at` and `failed_at`, and will eventually contradict them.'
        );

        // All three NULL *is* the queued state — a state, not a missing value,
        // which is why none of them carries a default.
        $this->assertNull($this->columnValue('notifications', 'sent_at', $queued));
        $this->assertNull($this->columnValue('notifications', 'read_at', $queued));
        $this->assertNull($this->columnValue('notifications', 'failed_at', $queued));

        $this->assertSame(
            1,
            DB::table('notifications')
                ->whereNull('sent_at')
                ->whereNull('failed_at')
                ->count(),
            'The delivery worker\'s pending query found nothing, so a queued '
            .'notification would never be picked up (ADR-019).'
        );

        // And a delivery that never happened must stay visible: that is exactly
        // the question this table is asked when a user says they were never told.
        $this->assertFalse(
            Schema::hasColumn('notifications', 'deleted_at'),
            '`notifications` grew a `deleted_at`. A dismissed notification would then '
            .'be indistinguishable from one that was never delivered.'
        );
    }

    public function test_a_platform_user_can_be_notified_but_cannot_hold_a_preference(): void
    {
        $platformUser = $this->insertUser(null, ['email' => 'root@platform.test']);

        // Billing failures and tenant health go to platform users, who have no
        // tenant — so `notifications.tenant_id` is nullable.
        DB::table('notifications')->insert($this->notificationAttributes(null, $platformUser, [
            'type' => 'platform.billing.payment_failed',
            'severity' => 'danger',
        ]));

        $this->assertSame(1, DB::table('notifications')->whereNull('tenant_id')->count());

        // The deliberate asymmetry inside one wave. `notification_preferences`
        // suppresses a delivery, and §1.3 rule 1 prefers NOT NULL wherever a row
        // grants or suppresses something — which also keeps the composite key to
        // `users` always checked. The cost is that a platform user cannot yet opt
        // out of anything, which is correct until platform preferences are
        // designed rather than inherited by accident.
        $attributes = $this->notificationPreferenceAttributes(1, $platformUser);
        $attributes['tenant_id'] = null;

        $this->assertInsertRejected(
            'notification_preferences',
            $attributes,
            'A preference row was accepted with no tenant. The composite key to '
            .'`users` is unchecked whenever any column is NULL, so that row could '
            .'suppress notifications for a user in any tenant (§1.3).',
            'notnull',
        );
    }

    public function test_a_preference_row_exists_only_because_someone_set_it(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'recipient@tenant.test']);

        // `enabled` has no default. The absence of a row means "use the type's
        // default", so a defaulted row would be indistinguishable from a choice
        // nobody made — and would silently shadow a default the dispatcher later
        // changes.
        $attributes = $this->notificationPreferenceAttributes($tenant, $user);
        unset($attributes['enabled']);

        $this->assertInsertRejected(
            'notification_preferences',
            $attributes,
            'A preference row was accepted with no decision in it, which is '
            .'indistinguishable from having no row at all — except that it overrides '
            .'the default.',
            'notnull',
        );

        $this->assertFalse(
            Schema::hasColumn('notification_preferences', 'deleted_at'),
            '`notification_preferences` grew a `deleted_at`. A soft-deleted row would '
            .'keep shadowing the default it was supposed to release, which is the '
            .'§13.3 poisoning Wave 1 already found in `settings`.'
        );
    }

    public function test_one_preference_per_user_per_type_per_channel(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $user = $this->insertUser($tenant, ['email' => 'recipient@tenant.test']);

        DB::table('notification_preferences')->insert(
            $this->notificationPreferenceAttributes($tenant, $user)
        );

        // Two rows for one combination means the dispatcher reads an arbitrary
        // one of them, so turning a notification off would work intermittently.
        $this->assertInsertRejected(
            'notification_preferences',
            $this->notificationPreferenceAttributes($tenant, $user, ['enabled' => true]),
            'A user holds two conflicting preferences for the same type and channel, '
            .'so whether they are notified depends on row order.'
        );

        // The same type on a different channel is a different decision: opting
        // out of the email is not opting out of the in-app notification.
        DB::table('notification_preferences')->insert(
            $this->notificationPreferenceAttributes($tenant, $user, ['channel' => 'in_app'])
        );

        $this->assertSame(2, DB::table('notification_preferences')->count());
    }

    public function test_a_tenant_cannot_hold_two_series_for_one_document_type(): void
    {
        $tenant = $this->insertTenantWithPlan();

        DB::table('document_sequences')->insert($this->documentSequenceAttributes($tenant));

        // The `document_sequences` FINDING, and the third instance of the §1.1
        // defect after Wave 1's `settings` and Wave 3's `users.email`. §3's key
        // `(tenant_id, company_id, branch_id, document_type)` has two nullable
        // columns of four, so as documented `(1, NULL, NULL, 'invoice')` is
        // insertable without limit.
        //
        // The consequence is specific and severe: two transactions would lock
        // *different* rows for the same document type, which is exactly the
        // duplicate-number failure §1.4's `FOR UPDATE` lock exists to prevent,
        // arriving through the key instead of through the lock.
        $this->assertInsertRejected(
            'document_sequences',
            $this->documentSequenceAttributes($tenant),
            'A tenant was allowed two tenant-wide invoice series. The allocator would '
            .'lock one of them arbitrarily, and two concurrent invoices would be '
            .'issued the same number (§1.4).'
        );
    }

    public function test_a_series_may_be_scoped_to_a_company_or_a_branch(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $company = $this->insertCompany($tenant);
        $branch = $this->insertBranch($tenant, $company);

        // OPEN QUESTION Q3 — per company or per branch is unresolved (§19), with
        // a provisional stance of per company. Both scope columns are nullable so
        // the answer can be configuration rather than a migration, and all three
        // shapes must coexist for that to be true. Per §19 the answer lands in
        // DECISIONS.md first; this test asserts the schema does not pre-empt it.
        DB::table('document_sequences')->insert([
            $this->documentSequenceAttributes($tenant),
            $this->documentSequenceAttributes($tenant, ['company_id' => $company]),
            $this->documentSequenceAttributes($tenant, [
                'company_id' => $company,
                'branch_id' => $branch,
            ]),
        ]);

        $this->assertSame(3, DB::table('document_sequences')->count());

        // Narrowing or widening a scope is still one series per shape.
        $this->assertInsertRejected(
            'document_sequences',
            $this->documentSequenceAttributes($tenant, ['company_id' => $company]),
            'A company was allowed two invoice series of its own.'
        );
    }

    public function test_a_sequence_scope_cannot_be_widened_by_deleting_its_company(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $company = $this->insertCompany($tenant);

        DB::table('document_sequences')->insert(
            $this->documentSequenceAttributes($tenant, ['company_id' => $company])
        );

        // RESTRICT, not SET NULL. §1.3 forbids SET NULL under a composite key led
        // by `tenant_id` — Wave 2 proved it fails with a NOT NULL violation — but
        // the semantic reason is worse than the mechanical one: nulling
        // `company_id` would silently convert a company series into the tenant-wide
        // one, merging two numbering streams that have already issued numbers.
        $this->assertDeleteRejectedByForeignKey(
            'companies',
            $company,
            'A company with its own numbering series was deleted, merging its issued '
            .'numbers into another series.'
        );
    }

    public function test_a_sequence_counter_starts_at_one_and_is_not_a_last_issued_marker(): void
    {
        $tenant = $this->insertTenantWithPlan();

        $id = DB::table('document_sequences')->insertGetId($this->documentSequenceAttributes($tenant));

        // `next_number` is the next number to issue, not the last one issued. A
        // fresh series genuinely starts at 1, so this is a known value rather
        // than an unknown one and §18's "nullable with no default" rule for
        // unknowns does not apply.
        $this->assertSame(1, (int) $this->columnValue('document_sequences', 'next_number', $id));
        $this->assertSame(5, (int) $this->columnValue('document_sequences', 'padding', $id));
        $this->assertSame('never', $this->columnValue('document_sequences', 'reset_period', $id));

        // NULL means never reset, and for a `never` series that is permanent.
        // The allocator compares it against the current period inside the same
        // lock, so two transactions cannot both decide a reset is due.
        $this->assertNull($this->columnValue('document_sequences', 'last_reset_at', $id));
    }

    public function test_the_sequence_scope_sentinels_are_derived_and_never_written(): void
    {
        $tenant = $this->insertTenantWithPlan();
        $company = $this->insertCompany($tenant);

        $tenantWide = DB::table('document_sequences')->insertGetId(
            $this->documentSequenceAttributes($tenant)
        );

        $perCompany = DB::table('document_sequences')->insertGetId(
            $this->documentSequenceAttributes($tenant, ['company_id' => $company])
        );

        $this->assertSame(0, (int) $this->columnValue('document_sequences', 'company_key', $tenantWide));
        $this->assertSame($company, (int) $this->columnValue('document_sequences', 'company_key', $perCompany));

        // Read-only, so no Action can desynchronise the sentinel from the column
        // it folds — which would defeat the unique key that depends on it.
        $rejected = false;

        try {
            DB::table('document_sequences')->where('id', $tenantWide)->update(['company_key' => 99]);
        } catch (Throwable) {
            $rejected = true;
        }

        $this->assertTrue(
            $rejected,
            '`document_sequences.company_key` is writable, so a row can claim a scope '
            .'its `company_id` does not have and escape the unique key.'
        );
    }

    public function test_one_activity_snapshot_per_tenant_per_day(): void
    {
        $plan = $this->insertPlan();
        $tenant = $this->insertTenant($plan['id'], 'tenant-one');
        $other = $this->insertTenant($plan['id'], 'tenant-two');

        DB::table('activity_snapshots')->insert($this->activitySnapshotAttributes($tenant));

        // §13.3 — a second row for the same day would be double-counted into
        // `tenant_usage_counters`, and a plan limit would then be enforced against
        // a number nobody can reproduce. A backfill re-run must be an upsert onto
        // this key, not a second row.
        $this->assertInsertRejected(
            'activity_snapshots',
            $this->activitySnapshotAttributes($tenant, ['orders_created' => 99]),
            'A tenant was allowed two snapshots for one day, so usage counters can be '
            .'double-counted by a backfill (§13.3).'
        );

        DB::table('activity_snapshots')->insert($this->activitySnapshotAttributes($other));
        DB::table('activity_snapshots')->insert(
            $this->activitySnapshotAttributes($tenant, ['snapshot_date' => '2026-08-23'])
        );

        $this->assertSame(3, DB::table('activity_snapshots')->count());
    }

    public function test_a_snapshot_metric_cannot_be_silently_omitted(): void
    {
        $tenant = $this->insertTenantWithPlan();

        // Every count is NOT NULL with no default. §18 reserves "nullable, no
        // default" for values that must be unknown, and none of these is unknown:
        // the job computes every metric in one pass over one day's data. A
        // default would let a writer that forgets a metric record a silent zero,
        // which reads as "nothing happened" and is then enforced as a plan limit
        // or shown as tenant health.
        foreach (['active_users', 'orders_created', 'invoices_posted', 'api_requests'] as $metric) {
            $attributes = $this->activitySnapshotAttributes($tenant);
            unset($attributes[$metric]);

            $this->assertInsertRejected(
                'activity_snapshots',
                $attributes,
                "A snapshot was accepted with no `{$metric}`, so an unmeasured metric "
                .'is indistinguishable from a measured zero (§18).',
                'notnull',
            );
        }
    }

    public function test_a_snapshot_is_recomputable_and_an_audit_row_is_not(): void
    {
        $tenant = $this->insertTenantWithPlan();

        // The deliberate contrast inside one wave. A snapshot is derived
        // arithmetic: every column can be recomputed from rows that still exist,
        // so a corrected backfill must be able to overwrite it — which is what
        // `updated_at` is for. An audit row is evidence and can never be
        // rewritten, which is why it has no `updated_at` at all.
        $this->assertTrue(
            Schema::hasColumn('activity_snapshots', 'updated_at'),
            '`activity_snapshots` lost its `updated_at`, but a snapshot is a cache '
            .'that must be correctable by a re-run (§18).'
        );

        $id = DB::table('activity_snapshots')->insertGetId($this->activitySnapshotAttributes($tenant));

        DB::table('activity_snapshots')->where('id', $id)->update(['orders_created' => 41]);

        $this->assertSame(41, (int) $this->columnValue('activity_snapshots', 'orders_created', $id));

        // No actor columns: the only writer is the scheduled job, so `created_by`
        // and `updated_by` would be NULL on every row forever. An always-NULL
        // column is not an audit trail, it is noise implying an actor exists. The
        // job's run is audited in `audit_logs` with `user_id` NULL instead.
        foreach (['created_by', 'updated_by', 'deleted_at'] as $column) {
            $this->assertFalse(
                Schema::hasColumn('activity_snapshots', $column),
                "`activity_snapshots.{$column}` exists, but this table is derived data "
                .'written only by a scheduled job (§1, §13.3).'
            );
        }
    }
}
