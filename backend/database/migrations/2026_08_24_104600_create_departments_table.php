<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 8 — HR identity: departments.
 *
 * A department is the organizational unit through which payroll cost centres,
 * approval hierarchies, and attendance aggregations are scoped. Departments
 * are scoped to a company — the `unique (tenant_id, company_id, code)` key
 * means the same department code can exist in two different companies of the
 * same tenant.
 *
 * Self-referential tree:
 *   `(tenant_id, parent_id) → departments(tenant_id, id)` — RESTRICT.
 *   A NULL parent_id is a root department (MATCH SIMPLE skips the check).
 *
 * Circular FK — deferred to Wave 9:
 *   `head_employee_id` is a nullable FK to `employees`. Since `employees` is
 *   created after `departments` in Wave 8, this FK is added by the Wave 9
 *   closure migration, after both tables exist. The column is created here;
 *   no FK is declared.
 *
 * FK strategy:
 *   - (tenant_id, company_id) → companies: RESTRICT.
 *
 * Soft delete: YES — departments is master data (DATABASE_DESIGN §1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->foreignId('company_id');

            // Self-referential: parent department (NULL = root).
            $table->foreignId('parent_id')->nullable();

            $table->string('code', 32);
            $table->string('name', 191);

            // Optional cost centre code for finance integration.
            $table->string('cost_center_code', 32)->nullable();

            // head_employee_id: circular FK to employees.
            // Column created here; FK added by Wave 9 closure (104700).
            $table->foreignId('head_employee_id')->nullable();

            $table->tinyInteger('is_active')->default(1);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_departments_uuid');

            // Code unique within a company (not just a tenant).
            $table->unique(['tenant_id', 'company_id', 'code'], 'uq_departments_tenant_company_code');

            // Required so child tables (employees, Wave 9 closure) can declare
            // composite FKs.
            $table->unique(['tenant_id', 'id'], 'uq_departments_tenant_id');

            // ── Composite foreign keys (§1.3) ──────────────────────────────
            $table->foreign(['tenant_id', 'company_id'], 'fk_departments_tenant_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            // Self-referential tree FK. NULL parent_id = root (MATCH SIMPLE).
            $table->foreign(['tenant_id', 'parent_id'], 'fk_departments_tenant_parent')
                ->references(['tenant_id', 'id'])
                ->on('departments')
                ->restrictOnDelete();

            // NOTE: fk_departments_tenant_head_employee is intentionally
            // OMITTED here. It is a circular FK to employees (Wave 8, created
            // after departments). Added by the Wave 9 closure at 104700.

            // ── Performance indexes (§1.2) ──────────────────────────────────
            $table->index(['tenant_id', 'company_id', 'is_active'], 'ix_departments_tenant_company_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
