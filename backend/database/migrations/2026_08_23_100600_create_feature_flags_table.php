<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 1 — platform. DATABASE_DESIGN §13.3 `feature_flags`.
 *
 * Same nullable-uniqueness finding as `settings`: the documented unique key
 * `(tenant_id, key)` cannot protect the global row, because `tenant_id` is
 * NULL there and NULLs do not collide in a UNIQUE index. `tenant_key` folds
 * NULL to 0 so the global flag is genuinely unique, while `tenant_id` stays
 * nullable exactly as documented.
 *
 * §13.3 design note: flags gate incomplete work, not business options. A
 * business option belongs in `settings`. Flags are short-lived and reviewed at
 * every phase exit gate — hence no soft delete, they are deleted on removal.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_flags', function (Blueprint $table): void {
            $table->id();

            // Nullable by design — NULL marks a global flag (§13.3).
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->uuid('uuid');

            $table->string('key', 128);
            $table->boolean('enabled')->default(false);

            // §1 percentages are DECIMAL(8,4). NULL = not a staged rollout, so
            // `enabled` decides outright.
            $table->decimal('rollout_percentage', 8, 4)->nullable();

            // Additional targeting predicates evaluated after the percentage.
            $table->json('conditions')->nullable();

            // Why the flag exists and when it should be gone. Required, because
            // an undescribed flag is the one nobody dares delete.
            $table->string('description', 255);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Uniqueness sentinel. Never written by application code.
            $table->unsignedBigInteger('tenant_key')->storedAs('coalesce(tenant_id, 0)');

            $table->unique('uuid', 'uq_feature_flags_uuid');
            $table->unique(['tenant_key', 'key'], 'uq_feature_flags_tenant_key');

            // Resolution reads the tenant override and the global row together.
            $table->index(['key', 'tenant_id'], 'ix_feature_flags_key_tenant');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
    }
};
