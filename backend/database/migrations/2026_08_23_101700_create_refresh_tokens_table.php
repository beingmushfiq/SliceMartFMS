<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 3 — identity. DATABASE_DESIGN §3 `refresh_tokens`, ADR-007.
 *
 * One row per issued refresh token. Rotation appends a row and marks the old one
 * revoked; reuse of a revoked token invalidates the entire `family_id` and
 * forces re-login (API_CONTRACT §8.2). The family is the stolen-token detector,
 * so the *history* is the mechanism — a design that overwrote rows in place
 * would have nothing left to detect reuse against.
 *
 * DESIGN — `token_hash` is **globally unique**, a deliberate exception to §1.1.
 * §8.2 makes the cookie the only credential and sends an empty body, so the
 * lookup runs *before* any tenant context exists and must therefore be keyed on
 * the hash alone. A tenant-scoped key could not be used by the one query this
 * table exists to serve. The same reasoning as `tenants.slug`, which resolves
 * the subdomain before a tenant is known.
 *
 * Only the hash is stored, never the token. A leaked database must not yield
 * usable sessions — this is why the column is not merely indexed but is the
 * sole credential surface. 64 characters is SHA-256 in hex.
 *
 * DESIGN — no soft delete, and `revoked_at` is not one. §1 permits `deleted_at`
 * on master data only, and this is a security ledger: a row must remain
 * readable after revocation or reuse detection cannot compare against it, and a
 * `deleted_at` would let a careless global scope hide exactly the evidence the
 * detector needs.
 *
 * FINDING — `replaced_by_id` inverts the direction of the delete rules. The
 * predecessor is the *referencing* row and its successor is the *referenced*
 * one, so a constraint on "deleting the parent" acts on the newer token, not the
 * older. Under RESTRICT, a bulk `delete where expires_at < ?` would fail
 * whenever the driver happened to reach a successor before its predecessor —
 * nondeterministically, which is the worst kind of purge job. CASCADE is
 * therefore both correct and required: deleting a token removes the ancestors
 * that led to it, which prunes a family as the single unit of meaning it is.
 * Pinned by `Wave3IdentitySchemaTest::test_pruning_a_rotation_chain_takes_its_ancestors`,
 * because the direction is unintuitive enough to be "corrected" later by someone
 * reading the column name alone.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refresh_tokens', function (Blueprint $table): void {
            $table->id();

            // Nullable — a platform user holds refresh tokens too, and has no
            // tenant (§3). As in `role_user`, the composite key below is
            // unchecked on those rows; unlike `role_user` that is harmless here,
            // because the token is issued to the user the row already names and
            // confers no authority of its own.
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->uuid('uuid');

            $table->unsignedBigInteger('user_id');

            // Constant across a rotation chain. Revoking a family is a single
            // UPDATE on this column, which is what makes reuse detection cheap
            // enough to run on every refresh.
            $table->uuid('family_id');

            $table->char('token_hash', 64);

            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();

            // The token issued when this one was rotated. NULL means this is the
            // live end of the chain. See the FINDING above for the delete rule.
            $table->unsignedBigInteger('replaced_by_id')->nullable();

            // Recorded at issue time and surfaced in the active-sessions list, so
            // a user can recognise a session they do not own.
            $table->string('user_agent', 512)->nullable();
            $table->string('ip', 45)->nullable();

            $table->timestamps();

            $table->unique('uuid', 'uq_refresh_tokens_uuid');
            // See the DESIGN note — global, not tenant-scoped.
            $table->unique('token_hash', 'uq_refresh_tokens_token_hash');

            // Composite target for the self-reference below.
            $table->unique(['tenant_id', 'id'], 'uq_refresh_tokens_tenant_id');

            $table->foreign(['tenant_id', 'user_id'], 'fk_refresh_tokens_tenant_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'replaced_by_id'], 'fk_refresh_tokens_replaced_by')
                ->references(['tenant_id', 'id'])
                ->on('refresh_tokens')
                ->cascadeOnDelete();

            // §3 — the rotation and family-revocation read path.
            $table->index(['user_id', 'family_id'], 'ix_refresh_tokens_user_family');

            // The purge job's driving query (ADR-007: 14-day lifetime).
            $table->index('expires_at', 'ix_refresh_tokens_expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refresh_tokens');
    }
};
