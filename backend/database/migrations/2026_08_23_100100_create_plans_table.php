<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 1 — platform. DATABASE_DESIGN §2 `plans`.
 *
 * Platform-owned, so explicitly exempt from the universal `tenant_id` rule
 * (§1). `code` is therefore globally unique rather than tenant-scoped; §1.1
 * does not apply to a table that has no tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid');
            $table->string('code', 64);
            $table->string('name', 191);

            // §1 money is DECIMAL(18,4) — never FLOAT, never a string.
            $table->decimal('price', 18, 4);

            // §1 enums are VARCHAR(32) validated by a PHP enum, never MySQL ENUM.
            $table->string('billing_period', 32);

            // Quotas (users, warehouses, monthly documents, storage) and feature
            // switches. Nullable because MySQL forbids a DEFAULT on a JSON column.
            $table->json('limits')->nullable();
            $table->json('features')->nullable();

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Master data, so §1 permits a soft delete. §1.3 still expects plans
            // to be deactivated rather than removed.
            $table->softDeletes();

            $table->unique('uuid', 'uq_plans_uuid');
            $table->unique('code', 'uq_plans_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
