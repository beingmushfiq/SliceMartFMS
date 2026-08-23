<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 1 — platform. DATABASE_DESIGN §2 `tenant_subscriptions`.
 *
 * A billing record, not master data, so it carries no `deleted_at` (§1) — a
 * subscription that ends is closed by `status` and `ends_at`, never removed.
 * The tenant FK is RESTRICT (§1.3 default) because the row is financial
 * history that must outlive any attempt to purge the tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_subscriptions', function (Blueprint $table): void {
            $table->id();
            // §1 — tenant_id is the first column after id.
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->foreignId('plan_id')->constrained('plans')->restrictOnDelete();

            $table->timestamp('starts_at');
            // NULL = open-ended; the current subscription has no end date yet.
            $table->timestamp('ends_at')->nullable();

            // trial | active | past_due | cancelled | expired.
            $table->string('status', 32);

            // §1 money is DECIMAL(18,4). The amount is snapshotted here rather
            // than read from `plans` so a later price change cannot rewrite
            // billing history.
            $table->decimal('amount', 18, 4);

            // Payment-provider identifier (ADR: no provider chosen yet), so it
            // is a plain nullable string rather than a typed column.
            $table->string('external_reference', 191)->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique('uuid', 'uq_tenant_subscriptions_uuid');

            // §1.2 — the billing screen filters by status and sorts by start
            // date, and the composite is led by tenant_id.
            $table->index(['tenant_id', 'status', 'starts_at'], 'ix_tenant_subs_tenant_status_starts');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_subscriptions');
    }
};
