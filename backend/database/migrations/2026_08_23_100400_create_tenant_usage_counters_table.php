<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 1 — platform. DATABASE_DESIGN §2 `tenant_usage_counters`.
 *
 * Exists so plan quotas can be enforced without scanning whole tables. Rows
 * have no meaning without their tenant, which is the one case §1.3 permits
 * CASCADE.
 *
 * `value` is an unsigned integer rather than the §1 DECIMAL(18,4) quantity
 * type: these are discrete counts (users, warehouses, documents, bytes)
 * mutated by atomic increments, and a fractional quota would be meaningless.
 * Flagged here because it is a deliberate reading of §1, not an oversight.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_usage_counters', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->uuid('uuid');

            // users | warehouses | documents_created | storage_bytes | …
            $table->string('metric', 64);

            // Billing window the count belongs to: `YYYY-MM` for periodic
            // metrics, `lifetime` for cumulative ones. A string because the
            // granularity differs per metric.
            $table->string('period', 16);

            $table->unsignedBigInteger('value')->default(0);

            $table->timestamps();

            $table->unique('uuid', 'uq_tenant_usage_counters_uuid');

            // The documented unique key. It is also the read path — quota checks
            // look up exactly (tenant, metric, period) — so no extra index.
            $table->unique(['tenant_id', 'metric', 'period'], 'uq_usage_tenant_metric_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_usage_counters');
    }
};
