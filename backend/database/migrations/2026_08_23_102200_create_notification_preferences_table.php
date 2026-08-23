<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 4 — infrastructure. DATABASE_DESIGN §3 `notification_preferences`, ADR-019.
 *
 * One row per user per (type, channel), holding whether that combination is
 * wanted. §13.3's resolution order does not apply — this is a per-user opt-out
 * table, not a settings cascade — but the same principle does: a missing row
 * must resolve to a documented default, never to null. The absence of a row
 * means "use the type's default", which the notification dispatcher owns, so
 * this table only ever records a **deliberate** user choice. That is why
 * `enabled` has no default: a row exists precisely because someone set it, and a
 * defaulted row would be indistinguishable from a choice nobody made.
 *
 * DESIGN — `tenant_id` is **NOT NULL**, deliberately unlike `notifications` in
 * this same wave, and the asymmetry is not an oversight. Preferences are edited
 * inside a tenant's settings UI and scoped by tenant permissions; a platform
 * user's preference row would have no tenant-scoped screen to be edited from and
 * no tenant policy to authorise the edit. Following §1.3 rule 1 — prefer NOT
 * NULL wherever a row *grants* or *suppresses* something — keeps the composite
 * key to `users` always checked, so a preference cannot be attached to a user
 * from another tenant. The cost is that a platform user cannot yet opt out of
 * anything, which is correct until platform-level preferences are designed
 * rather than inherited by accident.
 *
 * DESIGN — no soft delete. Turning a preference back on is an update, and a
 * soft-deleted row would silently shadow the default it was supposed to have
 * released, reintroducing the §13.3 poisoning problem Wave 1 already found in
 * `settings`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table): void {
            $table->id();

            // NOT NULL — see the DESIGN note above.
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('user_id');

            // Matches `notifications.type` and `notifications.channel`. No FK:
            // both vocabularies are code-owned PHP enums (§1), not tables.
            $table->string('type', 64);
            $table->string('channel', 32);

            // No default — see the class note. A row means a decision.
            $table->boolean('enabled');

            $table->timestamps();

            $table->unique('uuid', 'uq_notification_preferences_uuid');

            // One decision per user per type per channel. All three columns are
            // NOT NULL, so this key fires on every row with no sentinel.
            $table->unique(['user_id', 'type', 'channel'], 'uq_notification_preferences_user_type_channel');

            $table->foreign('tenant_id', 'fk_notification_preferences_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            // CASCADE — a preference without its user is meaningless (§1.3).
            $table->foreign(['tenant_id', 'user_id'], 'fk_notification_preferences_tenant_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->cascadeOnDelete();

            // The dispatcher's read: every preference this user has set, fetched
            // once and applied across the fan-out.
            $table->index(['tenant_id', 'user_id'], 'ix_notification_preferences_tenant_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
