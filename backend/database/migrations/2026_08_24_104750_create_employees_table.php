<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 8 — HR identity: employees.
 *
 * The workforce record. Distinct from `users` (the login record) by design —
 * conflating them was a legacy fault (DECISIONS C18). Not every employee logs
 * in: a floor worker recorded by a supervisor has no `users` row.
 *
 * DATABASE_DESIGN invariants:
 *   - `employment_type = piece_rate` makes a `worker_production_entries` row
 *     payable per unit. A `permanent` worker may still have entries (used for
 *     productivity reporting) but they are NOT multiplied by a piece rate.
 *   - `user_id` is nullable and unique-when-set: one user account per employee,
 *     but many employees have no account.
 *
 * Circular FKs — deferred to Wave 9 (104900):
 *   - `reports_to_employee_id` → employees(tenant_id, id): self-referential.
 *   - `default_shift_id`       → shifts(tenant_id, id):    shifts created at
 *     104700, which is BEFORE employees (104750), so this FK could be declared
 *     inline. However, `salary_structure_id` → salary_structures does NOT exist
 *     yet (Wave 19). To keep all three Wave-9 deferred FKs in one closure
 *     migration, default_shift_id is also deferred.
 *
 * NOTE: `department_id` and `designation_id` composite FKs ARE declared inline
 * because both tables (departments 104600, designations 104650) are created
 * before this migration (104750).
 *
 * FK strategy (inline, Wave 8):
 *   - (tenant_id, company_id)        → companies: RESTRICT.
 *   - (tenant_id, branch_id)         → branches:  RESTRICT (nullable).
 *   - (tenant_id, factory_id)        → factories:  RESTRICT (nullable).
 *   - (tenant_id, production_line_id)→ production_lines: RESTRICT (nullable).
 *   - (tenant_id, department_id)     → departments: RESTRICT (nullable).
 *   - (tenant_id, designation_id)    → designations: RESTRICT (nullable).
 *   - user_id                        → users: SET NULL (simple FK — a user
 *     being deactivated should not remove the employee record).
 *
 * FK strategy (deferred, Wave 9):
 *   - (tenant_id, reports_to_employee_id) → employees: RESTRICT.
 *   - (tenant_id, default_shift_id)       → shifts:    RESTRICT.
 *   - departments.head_employee_id        → employees: RESTRICT (other table).
 *   - (tenant_id, salary_structure_id)    → salary_structures: RESTRICT.
 *
 * Soft delete: YES — employees is master data (DATABASE_DESIGN §1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            // Unique employee code per tenant (HR number / badge number).
            $table->string('employee_code', 32);

            // Optional login account — not every employee logs in.
            // nullOnDelete: deactivating a user does not remove the employee.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Org scope — company is required; branch/factory/line optional.
            $table->foreignId('company_id');
            $table->foreignId('branch_id')->nullable();
            $table->foreignId('factory_id')->nullable();
            $table->foreignId('production_line_id')->nullable();

            // HR classification — all nullable (an employee may be unassigned).
            $table->foreignId('department_id')->nullable();
            $table->foreignId('designation_id')->nullable();

            // Self-referential reporting chain — deferred to Wave 9 (circular).
            $table->foreignId('reports_to_employee_id')->nullable();

            // Personal details.
            $table->string('first_name', 100);
            $table->string('last_name', 100)->nullable();
            $table->string('display_name', 191);

            // male | female | other — VARCHAR(16), not ENUM.
            $table->string('gender', 16)->nullable();

            $table->date('date_of_birth')->nullable();
            $table->string('national_id', 64)->nullable();
            $table->string('phone', 32);
            $table->string('email', 191)->nullable();

            // Address.
            $table->string('address_line1', 191)->nullable();
            $table->string('address_line2', 191)->nullable();
            $table->string('city', 100)->nullable();

            // Photo stored in the attachments table; path cached here.
            $table->string('photo_path', 500)->nullable();

            // Employment dates.
            $table->date('date_of_joining');
            $table->date('date_of_leaving')->nullable();

            // permanent | contract | daily_wage | piece_rate | probation
            // VARCHAR(32) — not ENUM (DATABASE_DESIGN §1).
            $table->string('employment_type', 32)->default('permanent');

            // active | on_leave | suspended | resigned | terminated
            $table->string('employment_status', 32)->default('active');

            // Default shift & salary structure — both deferred FKs (Wave 9).
            $table->foreignId('default_shift_id')->nullable();
            $table->foreignId('salary_structure_id')->nullable();

            // Banking / payout details.
            $table->string('bank_name', 100)->nullable();
            $table->string('bank_account_number', 64)->nullable();
            $table->string('mobile_wallet_number', 32)->nullable();

            $table->tinyInteger('is_active')->default(1);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_employees_uuid');

            // Employee code unique within a tenant.
            $table->unique(['tenant_id', 'employee_code'], 'uq_employees_tenant_code');

            // user_id unique when set (one account per employee).
            // NULL values are excluded from uniqueness by database convention
            // (NULL ≠ NULL — same documented hole as price_list_items.variant_id).
            $table->unique(['tenant_id', 'user_id'], 'uq_employees_tenant_user');

            // Required so self-referential composite FK (reports_to_employee_id,
            // Wave 9) and child tables (attendances, payslips, Wave 19) can
            // reference this table.
            $table->unique(['tenant_id', 'id'], 'uq_employees_tenant_id');

            // ── Composite foreign keys (§1.3 — inline, Week 8) ────────────
            $table->foreign(['tenant_id', 'company_id'], 'fk_employees_tenant_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_employees_tenant_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'factory_id'], 'fk_employees_tenant_factory')
                ->references(['tenant_id', 'id'])
                ->on('factories')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'production_line_id'], 'fk_employees_tenant_pline')
                ->references(['tenant_id', 'id'])
                ->on('production_lines')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'department_id'], 'fk_employees_tenant_dept')
                ->references(['tenant_id', 'id'])
                ->on('departments')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'designation_id'], 'fk_employees_tenant_desig')
                ->references(['tenant_id', 'id'])
                ->on('designations')
                ->restrictOnDelete();

            // NOTE: the following are intentionally OMITTED here and added by
            // the Wave 9 closure (104900) after all tables exist:
            //   fk_employees_tenant_reports_to → employees(tenant_id, id)
            //   fk_employees_tenant_shift       → shifts(tenant_id, id)
            //   fk_employees_tenant_sal_struct  → salary_structures(tenant_id, id)
            //   fk_departments_tenant_head_emp  → employees(tenant_id, id)

            // ── Performance indexes (§1.2) ──────────────────────────────────
            // HR list: active employees per company / department.
            $table->index(
                ['tenant_id', 'company_id', 'employment_status'],
                'ix_employees_tenant_company_status'
            );
            $table->index(
                ['tenant_id', 'department_id', 'is_active'],
                'ix_employees_tenant_dept_active'
            );
            // Payroll engine: all active piece-rate workers for a tenant.
            $table->index(
                ['tenant_id', 'employment_type', 'is_active'],
                'ix_employees_tenant_type_active'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
