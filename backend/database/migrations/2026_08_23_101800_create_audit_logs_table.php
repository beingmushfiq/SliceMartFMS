<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 4 — infrastructure. DATABASE_DESIGN §3 `audit_logs`, ADR-027.
 *
 * Append-only: no `updated_at`, no `deleted_at`, no UPDATE path, no DELETE path.
 * §18's checklist states the application-code half of that; the schema half is
 * the absence of the columns that would make either operation look legitimate.
 * `timestamps()` is therefore deliberately not called — an `updated_at` on an
 * append-only table is an invitation, and Eloquent would keep it current for
 * free the moment somebody attached a model with the default `$timestamps`.
 *
 * DESIGN — `created_at` is NOT NULL with **no database default**. ADR-027 puts
 * the audit write inside the same transaction as the mutation it records, so the
 * caller already holds the moment that matters and must pass it. A
 * `CURRENT_TIMESTAMP` default would silently substitute the row-write clock,
 * which drifts from the business event by the length of the transaction and, on
 * a retried job, by however long the retry took.
 *
 * DESIGN — `user_id` is a composite foreign key with **RESTRICT**, not CASCADE,
 * and this is the one place in the schema where those two words are in direct
 * conflict with each other. §1.3 permits CASCADE for "a child with no
 * independent meaning", and an audit row does belong to its actor — but ADR-027
 * makes the row's independent meaning the entire point: deleting a user must not
 * be able to erase the record of what they did. RESTRICT wins, and it costs
 * nothing operationally because §1.3 already forbids hard-deleting referenced
 * master data and `users` carries `deleted_at` for exactly this reason. The
 * consequence is worth stating plainly: **a user who has done anything can never
 * be hard-deleted, and neither can a tenant.** Offboarding is an explicit
 * archive-then-purge Action that must decide what happens to the audit trail; it
 * is not something a cascade may decide by accident.
 *
 * DESIGN — the polymorphic pair is nullable. Most rows name a model, but
 * `logged_in` and `permission_denied` (§3's own vocabulary) record an event
 * against no row at all, and forcing a target would mean inventing one. §1.2's
 * index still functions: it simply does not serve the rows that have no target,
 * which are never looked up that way.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();

            // §3 — nullable for platform actions. As everywhere in Wave 3, the
            // composite key below goes unchecked on those rows (§1.3); harmless
            // here, because an audit row grants nothing and is never the subject
            // of an authorisation decision.
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->uuid('uuid');

            // §3 — nullable for system, queue and scheduler actions. NULL means
            // "the platform did this", which is a different claim from "we do
            // not know who did this"; §3's vocabulary has no row for the latter
            // because an unattributable mutation is a defect, not a state.
            $table->unsignedBigInteger('user_id')->nullable();

            // created | updated | deleted | approved | voided | locked |
            // exported | logged_in | permission_denied … (§1: VARCHAR, never
            // MySQL ENUM, validated by a PHP enum).
            $table->string('action', 32);

            // §14.5 — explicit pair with a closed vocabulary. See the DESIGN
            // note on why both halves are nullable.
            $table->string('auditable_type', 64)->nullable();
            $table->unsignedBigInteger('auditable_id')->nullable();

            // Redacted by allow-list before they reach here (§3). The allow-list
            // is the reason these are `json` and not `text`: a redactor that
            // cannot parse its input cannot redact it.
            $table->json('before')->nullable();
            $table->json('after')->nullable();

            // Denormalised from `before`/`after` so "which rows touched price?"
            // is an indexable question rather than a full-table JSON scan.
            $table->json('changed_fields')->nullable();

            // module, route, and the operator's reason text where the workflow
            // demands one (void, correction, manual adjustment).
            $table->json('context')->nullable();

            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 512)->nullable();

            // API_CONTRACT §7 — joins this row to its request log, its queued
            // jobs and the Reference the user was shown if the request failed.
            // Nullable because a console command has no inbound request to adopt
            // an id from.
            $table->uuid('correlation_id')->nullable();

            // No timestamps() — see the class note.
            $table->timestamp('created_at');

            $table->unique('uuid', 'uq_audit_logs_uuid');

            $table->foreign('tenant_id', 'fk_audit_logs_tenant')
                ->references('id')
                ->on('tenants')
                ->restrictOnDelete();

            // RESTRICT — see the DESIGN note. This is the constraint that makes
            // the audit trail survive its actor.
            $table->foreign(['tenant_id', 'user_id'], 'fk_audit_logs_tenant_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->restrictOnDelete();

            // §1.2 / §14.5 — the record's own history tab.
            $table->index(['tenant_id', 'auditable_type', 'auditable_id'], 'ix_audit_logs_tenant_auditable');

            // §3 — the tenant-wide audit trail, always read newest-first.
            $table->index(['tenant_id', 'created_at'], 'ix_audit_logs_tenant_created');

            // §3 — "what did this user do?", the answer an investigation starts from.
            $table->index(['tenant_id', 'user_id', 'created_at'], 'ix_audit_logs_tenant_user_created');

            // API_CONTRACT §7 — a support ticket arrives holding only the
            // Reference, so this must be a lookup and not a scan.
            $table->index('correlation_id', 'ix_audit_logs_correlation');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
