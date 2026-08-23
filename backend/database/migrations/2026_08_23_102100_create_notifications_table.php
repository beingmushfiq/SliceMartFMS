<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 4 — infrastructure. DATABASE_DESIGN §3 `notifications`, ADR-019, ADR-018.
 *
 * Every notification is a persisted row, not a transient toast (ADR-019), so it
 * can be listed, marked read, retried and audited. One row per
 * recipient-per-channel: the same event delivered in-app and by email is two
 * rows, because each has its own delivery outcome and one succeeding tells you
 * nothing about the other.
 *
 * DESIGN — `title_key` / `body_key` / `params`, never rendered text (ADR-018).
 * The row stores what happened; the client renders it in the reader's current
 * locale. Storing the rendered string would freeze a notification into the locale
 * that was active at write time — usually the *actor's*, not the recipient's —
 * and a later locale change would leave a permanently mistranslated inbox. The
 * cost is that a translation key can go missing after the row exists, which is a
 * frontend fallback problem (UI_SYSTEM) rather than a data problem.
 *
 * DESIGN — three nullable outcome timestamps, no `status` column. `sent_at`,
 * `read_at` and `failed_at` are facts with times; a `status` enum derived from
 * them would be a fourth source of truth that can disagree with the other three,
 * and the disagreement would be invisible. A queued row is one where all three
 * are NULL — which is a state, not a missing value, and is why none of them
 * carries a default.
 *
 * DESIGN — `deleted_at` is absent. Dismissing a notification sets `read_at`; the
 * row is retained until the retention job removes it. A soft-deleted
 * notification would be indistinguishable from a delivery that never happened,
 * which is exactly the question this table is asked when a user says they were
 * never told.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();

            // Nullable — a platform user receives notifications too (billing
            // failures, tenant health), and has no tenant. As in Wave 3, the
            // composite key is unchecked on those rows and harmlessly so: the row
            // grants nothing.
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->uuid('uuid');

            // NOT NULL — a notification with no recipient cannot be delivered or
            // listed. Broadcast to a role is expanded into one row per user by
            // the dispatching Action, not represented as a NULL here, so that
            // read state and delivery outcome are per-person.
            $table->unsignedBigInteger('user_id');

            // The event type, e.g. `production.batch.qc_failed`. Drives grouping,
            // the preference lookup in `notification_preferences`, and the
            // translation key namespace.
            $table->string('type', 64);

            // in_app | email | sms | push (§3). ADR-019: only the in-app/web-push
            // driver is implemented now; the rest are stubs behind the same
            // interface, so rows for them are legitimate and will simply sit
            // unsent rather than being rejected.
            $table->string('channel', 32);

            // ADR-018 — translation keys, never rendered text. See the DESIGN note.
            $table->string('title_key', 191);
            $table->string('body_key', 191);
            $table->json('params')->nullable();

            // Deep link to the record that caused it. Relative, never absolute:
            // an absolute URL would bake in the tenant's current domain.
            $table->string('action_url', 512)->nullable();

            // info | success | warning | danger — the four status colours the
            // design system actually has (UI_SYSTEM §5). A fifth value here would
            // have no colour to render in.
            $table->string('severity', 16)->default('info');

            // All three nullable with no default — see the DESIGN note.
            $table->timestamp('read_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();

            // The driver's failure reason, kept for the retry decision and for
            // support. Never shown raw to the recipient (ADR-025).
            $table->text('error')->nullable();

            $table->timestamps();

            $table->unique('uuid', 'uq_notifications_uuid');

            $table->foreign('tenant_id', 'fk_notifications_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            // CASCADE — §1.3's child with no independent meaning. A deleted
            // user's inbox is not evidence of anything; `audit_logs` holds the
            // record that the notification was dispatched.
            $table->foreign(['tenant_id', 'user_id'], 'fk_notifications_tenant_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->cascadeOnDelete();

            // The bell menu: this user's newest notifications. Includes
            // `read_at` because the unread badge count is the same query with one
            // more predicate, and it is run on every page load.
            $table->index(['tenant_id', 'user_id', 'read_at', 'created_at'], 'ix_notifications_tenant_user_read');

            // The delivery worker's queue: everything not yet sent and not yet
            // failed, oldest first.
            $table->index(['channel', 'sent_at', 'failed_at'], 'ix_notifications_channel_pending');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
