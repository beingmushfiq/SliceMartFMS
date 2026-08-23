<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 1 — platform. DATABASE_DESIGN §2 `tenants`.
 *
 * Exempt from `tenant_id` because it *is* the tenant. `slug` is globally
 * unique because it resolves the subdomain before any tenant context exists.
 *
 * `locale`, `timezone`, `currency_code`, `date_format` and `number_format` are
 * NOT NULL with no default on purpose: ADR-002 forbids a hardcoded currency or
 * locale, so the provisioning Action must resolve each one from the platform
 * defaults in `settings` (§13.3) and write it explicitly.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid');
            $table->string('name', 191);
            $table->string('slug', 64);

            $table->foreignId('plan_id')->constrained('plans')->restrictOnDelete();

            // trial | active | past_due | suspended | cancelled.
            // ARCHITECTURE §3.2: past_due and suspended are read-only access,
            // not a blank screen, so this is never treated as a hard gate.
            $table->string('status', 32);
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('suspended_at')->nullable();

            $table->string('locale', 10)->default('en');
            $table->string('timezone', 64);
            $table->char('currency_code', 3);
            $table->string('date_format', 32);
            $table->string('number_format', 32);

            // Feature toggles, workflow options, terminology overrides.
            $table->json('settings')->nullable();
            // Logo path plus whitelisted semantic token overrides (ADR-020).
            $table->json('branding')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_tenants_uuid');
            $table->unique('slug', 'uq_tenants_slug');

            // §1.2 — the platform tenant list filters on status and sorts newest
            // first. `tenants` has no tenant_id to lead with.
            $table->index(['status', 'created_at'], 'ix_tenants_status_created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
