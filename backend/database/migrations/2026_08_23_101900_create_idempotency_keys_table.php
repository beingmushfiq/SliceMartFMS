<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 4 — infrastructure. DATABASE_DESIGN §3 `idempotency_keys`, ADR-028.
 *
 * FINDING — two rank-4 documents specify different unique keys for this table,
 * and the difference is not cosmetic. §3 says unique `(tenant_id, key)`;
 * API_CONTRACT §6.2 says the scope is `(tenant_id, user_id, route, key)`.
 * README §2 makes rank 4 a tie, so this is escalated here rather than decided by
 * whichever document was read first.
 *
 * `(tenant_id, key)` is wrong, and demonstrably so from §6.3's own table. That
 * table distinguishes "replay, same body hash" from "replay, different body
 * hash → `409 IDEMPOTENT_KEY_CONFLICT`", a distinction that only makes sense
 * *within one intent*. Under the narrower key, two users of the same tenant who
 * happen to generate the same UUID — or far more likely, one user whose client
 * reuses a key across two different routes — collide as a conflict on unrelated
 * work. Worse, the first row's stored response would be replayed verbatim to the
 * second caller under §6.3's "same body hash" branch: one user receiving
 * another's response body. The wider key cannot do this, because the route and
 * the user are part of the identity.
 *
 * Resolved in favour of API_CONTRACT §6.2, the wider key, on the grounds that it
 * is a superset — every guarantee §3 intended still holds — and that the
 * narrower one is the only version with a cross-user data-exposure path. §3 is
 * read as naming the tenant scope, not enumerating the key. Recorded in
 * DEVELOPMENT_STATUS.md; DATABASE_DESIGN §3 needs the one-line correction.
 *
 * DESIGN — `user_id` is **NOT NULL**, unlike everywhere else in this wave, and
 * `tenant_id` is NOT NULL too. §6.1 requires the header on eleven business
 * routes, every one of which is an authenticated tenant action; §14.1 keys
 * webhooks on `provider_event_id` in `webhook_deliveries` (Wave 24) instead,
 * precisely so that an unauthenticated caller never writes here. NOT NULL is
 * therefore not a restriction but the enforcement of that split — and it keeps
 * the unique key working as documented, since a nullable column in a unique key
 * admits unlimited duplicates among its NULL rows (§1.1).
 *
 * DESIGN — no soft delete and no `uuid`. §6.2 purges rows after 24 hours, so a
 * soft-deleted key would keep answering replays it was supposed to have released
 * while looking deleted, and an external identifier for a row that is itself an
 * external identifier is redundant. The `uuid` omission is a deliberate
 * exception to §1's universal rule, on the same grounds as `role_permission`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('idempotency_keys', function (Blueprint $table): void {
            $table->id();

            // NOT NULL — see the DESIGN note above.
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('user_id');

            // §6.2 — client-generated UUID v4, one per user *intent*, reused
            // across every retry of that intent. Sized to 191 rather than 36
            // because the server must not assume a well-formed UUID from an
            // untrusted header; validation rejects a malformed one with a clear
            // error, which a truncating column could not do.
            $table->string('key', 191);

            // The route, per §6.2's scope. `endpoint` is §3's column name; it
            // holds the route name, not the request URI, so a change of URL
            // prefix does not silently orphan every in-flight key.
            $table->string('endpoint', 191);

            // §6.3 — SHA-256 of the canonicalised request body. The column that
            // separates a legitimate replay from `409 IDEMPOTENT_KEY_CONFLICT`.
            $table->char('request_hash', 64);

            // §6.3 — nullable while the original is still running. A replay
            // arriving in that window gets `409 LOCKED` with `Retry-After: 1`,
            // and NULL is how the server knows which of the two it is looking
            // at. A default of 0 or 202 would make an in-flight request
            // indistinguishable from a finished one.
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->json('response_body')->nullable();

            // §6.2 — 24 hours after the first use. Driven by the purge job, and
            // read on every lookup so an expired key is treated as new rather
            // than replayed.
            $table->timestamp('expires_at');

            $table->timestamps();

            // API_CONTRACT §6.2 — see the FINDING above. Every column is NOT
            // NULL, so this key fires on every row with no sentinel needed.
            $table->unique(['tenant_id', 'user_id', 'endpoint', 'key'], 'uq_idempotency_keys_scope');

            $table->foreign('tenant_id', 'fk_idempotency_keys_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            // CASCADE — §1.3's "child with no independent meaning" fits exactly.
            // A stored response for a deleted user can never be replayed to
            // anyone, and unlike `audit_logs` this row is not evidence.
            $table->foreign(['tenant_id', 'user_id'], 'fk_idempotency_keys_tenant_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->cascadeOnDelete();

            // The purge job's driving query (§6.2).
            $table->index('expires_at', 'ix_idempotency_keys_expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');
    }
};
