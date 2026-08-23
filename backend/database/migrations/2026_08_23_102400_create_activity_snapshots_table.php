<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 4 — infrastructure. DATABASE_DESIGN §13.3 `activity_snapshots`.
 *
 * One row per tenant per day, holding counts that would otherwise require
 * scanning every tenant's transactional tables. §13.3's purpose is twofold:
 * feed `tenant_usage_counters` (§2) for plan-limit enforcement, and give the
 * platform a health signal per tenant. Both readers need yesterday's totals in
 * a single indexed read, not an aggregate over `sales_orders` joined to
 * `invoices` joined to `deliveries` across 159 tables.
 *
 * DESIGN — this table is a **cache**, in §18's sense, and is the one Wave 4
 * table that is deliberately recomputable. Every column is derived from rows
 * that already exist elsewhere, so a snapshot can be rebuilt from source at any
 * time and a backfill re-run is an upsert onto the unique key rather than a
 * second row. That is the whole reason it carries `updated_at`, and the exact
 * opposite of `audit_logs` in this same wave: an audit row is evidence and can
 * never be rewritten, a snapshot row is arithmetic and must be.
 *
 * DESIGN — `snapshot_date` is a DATE, and the day it names is the **tenant's**
 * local day, not UTC. A tenant in Asia/Dhaka closes its books at a different
 * instant than one in Europe/London, so a UTC-bucketed "day" would split one
 * tenant's trading day across two rows and make a plan limit enforceable at the
 * wrong boundary. The snapshot job resolves each tenant's timezone before
 * choosing the window it sums. The consequence, recorded here so nobody
 * rediscovers it in a report: rows for the same `snapshot_date` across different
 * tenants do not describe the same wall-clock interval, so a platform-wide
 * cross-tenant sum for a single date is an approximation and must be labelled as
 * one.
 *
 * DESIGN — no `created_by` / `updated_by`. §1 makes them nullable, and the only
 * writer here is the scheduled job, so both columns would be NULL on every row
 * forever. An always-NULL column is not an audit trail, it is noise that implies
 * an actor exists. The job's own run is audited in `audit_logs` with `user_id`
 * NULL, which is where a system action belongs.
 *
 * DESIGN — no `deleted_at`. §1 restricts soft deletes to master data, and this
 * is derived data: hiding a snapshot would not preserve anything, because the
 * source rows it summarises are still there. Retention is a hard delete of rows
 * older than the platform's retention window.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_snapshots', function (Blueprint $table): void {
            $table->id();

            // NOT NULL — a snapshot with no tenant has nothing to summarise.
            // CASCADE is the §1.3 case: these rows have no independent meaning.
            // In practice a tenant that has done anything can never be hard
            // deleted, because `audit_logs` holds a RESTRICT reference to it, so
            // this cascade declares intent more than it will ever fire.
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->uuid('uuid');

            // The tenant's local day. See the DESIGN note on timezones.
            $table->date('snapshot_date');

            // Counts, all NOT NULL with **no default**. §18 reserves "nullable,
            // no default" for values that must be unknown; none of these is
            // unknown, because the job computes every metric in one pass over one
            // day's data. Omitting a default is the point: a writer that adds a
            // metric and forgets to populate it fails loudly at insert, instead
            // of recording a silent zero that reads as "nothing happened" and
            // would then be enforced as a plan limit or shown as tenant health.
            //
            // A metric added in a later migration is a different case: existing
            // rows genuinely were never measured for it, so that column must be
            // added nullable, and NULL there means "not measured", never zero.

            // Distinct users with at least one authenticated request that day.
            $table->unsignedInteger('active_users');

            $table->unsignedInteger('orders_created');
            $table->unsignedInteger('invoices_posted');
            $table->unsignedInteger('batches_closed');
            $table->unsignedInteger('deliveries_completed');

            // BIGINT, unlike the five counts above: request volume and stored
            // bytes both pass 4.29 billion in normal operation, the event counts
            // do not.
            $table->unsignedBigInteger('api_requests');
            $table->unsignedBigInteger('storage_bytes');

            $table->timestamps();

            $table->unique('uuid', 'uq_activity_snapshots_uuid');

            // §13.3's key. Both columns are NOT NULL, so it fires on every row
            // and needs no sentinel — unlike `document_sequences` in this wave.
            // It is also the tenant time-series read path (one tenant, a date
            // range), so that query needs no further index.
            $table->unique(['tenant_id', 'snapshot_date'], 'uq_activity_snapshots_tenant_date');

            // The platform read is the other way round: every tenant on one day.
            // The unique key above is led by `tenant_id` and cannot serve it.
            $table->index('snapshot_date', 'ix_activity_snapshots_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_snapshots');
    }
};
