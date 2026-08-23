<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 8 — HR identity: designations.
 *
 * A designation is a job title / grade label that an employee holds
 * (e.g. "Senior Production Operator", "HR Manager"). Designations are
 * tenant-scoped, not company-scoped — the same title exists across all
 * companies of a tenant.
 *
 * `grade` is a tenant-defined string (nullable): 'L1', 'M2', 'Band A', etc.
 * It is VARCHAR(32), not an enum, because grade schemes differ per tenant.
 *
 * FK strategy: designations is a leaf catalogue — no FK dependencies except
 * the tenant root.
 *
 * Soft delete: YES — designations is master data (DATABASE_DESIGN §1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('designations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->string('code', 32);
            $table->string('name', 191);

            // Tenant-defined grade string: 'L1', 'M2', 'Band A', etc.
            $table->string('grade', 32)->nullable();

            $table->tinyInteger('is_active')->default(1);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_designations_uuid');

            // Code unique within a tenant.
            $table->unique(['tenant_id', 'code'], 'uq_designations_tenant_code');

            // Required so child tables (employees) can declare composite FKs.
            $table->unique(['tenant_id', 'id'], 'uq_designations_tenant_id');

            // ── Performance indexes (§1.2) ──────────────────────────────────
            $table->index(['tenant_id', 'is_active'], 'ix_designations_tenant_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('designations');
    }
};
