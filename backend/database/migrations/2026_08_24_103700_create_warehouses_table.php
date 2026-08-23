<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 7 — master data C: warehouses.
 *
 * A warehouse is a physical storage location owned by a tenant. It may be
 * scoped to a company, branch, or factory — all optional (NULL = tenant-wide).
 * Type is one of: raw_material | finished_goods | packaging | quarantine |
 * scrap | transit | general. Count is unlimited per tenant (C4 in the plan
 * limits — the plan's `limits.warehouses` value is enforced by the tenancy
 * runtime, not by the schema).
 *
 * Column conventions (DATABASE_DESIGN §1):
 *   - Booleans: TINYINT(1) with explicit default.
 *   - Enums:    VARCHAR(32), validated in PHP.
 *
 * FK strategy:
 *   - company_id, branch_id, factory_id — nullable composite FKs so an
 *     unscoped (tenant-wide) warehouse uses NULL and is not checked (MATCH
 *     SIMPLE). All RESTRICT — a warehouse belonging to a company/branch/
 *     factory cannot survive that parent's deletion (which is deactivation
 *     in practice, not a hard delete).
 *
 * Soft delete: YES — warehouses is master data (DATABASE_DESIGN §1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            // Optional org-scope columns. NULL = tenant-wide warehouse.
            $table->foreignId('company_id')->nullable();
            $table->foreignId('branch_id')->nullable();
            $table->foreignId('factory_id')->nullable();

            $table->string('code', 32);
            $table->string('name', 191);

            // raw_material | finished_goods | packaging | quarantine | scrap | transit | general
            $table->string('type', 32)->default('general');

            $table->text('address')->nullable();

            $table->tinyInteger('is_default')->default(0);
            $table->tinyInteger('allows_negative_stock')->default(0);
            $table->tinyInteger('is_active')->default(1);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_warehouses_uuid');

            // Code is unique within a tenant.
            $table->unique(['tenant_id', 'code'], 'uq_warehouses_tenant_code');

            // Required so child tables (warehouse_locations, stock_balances, etc.)
            // can declare composite FKs.
            $table->unique(['tenant_id', 'id'], 'uq_warehouses_tenant_id');

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            $table->foreign(['tenant_id', 'company_id'], 'fk_warehouses_tenant_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_warehouses_tenant_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'factory_id'], 'fk_warehouses_tenant_factory')
                ->references(['tenant_id', 'id'])
                ->on('factories')
                ->restrictOnDelete();

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // List screens filter by tenant + active status.
            $table->index(['tenant_id', 'is_active', 'type'], 'ix_warehouses_tenant_active_type');

            // Scope-based lookups (e.g. "all warehouses for branch X").
            $table->index(['tenant_id', 'company_id', 'is_active'], 'ix_warehouses_tenant_company');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
