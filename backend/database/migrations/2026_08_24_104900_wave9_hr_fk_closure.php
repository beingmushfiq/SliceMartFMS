<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 9 — FK closure: HR circular references.
 *
 * DATABASE_DESIGN §16 lists Wave 9 as the closure wave for the three circular
 * FKs introduced in Wave 8:
 *
 *   1. departments.head_employee_id  → employees(tenant_id, id)   RESTRICT
 *      A department's head must be an employee of the same tenant. Nullable —
 *      a department without a head is permitted.
 *
 *   2. employees.reports_to_employee_id → employees(tenant_id, id) RESTRICT
 *      Self-referential reporting chain. NULL = top of the tree (MATCH SIMPLE
 *      skips the FK check). RESTRICT — an employee cannot be deleted while
 *      they are listed as another employee's manager.
 *
 *   3. employees.default_shift_id → shifts(tenant_id, id) RESTRICT
 *      Although shifts (104700) is created BEFORE employees (104750), this FK
 *      is deferred here so that all Wave 8 circular closures live in one place
 *      and are easy to reason about together.
 *
 *   4. employees.salary_structure_id → salary_structures(tenant_id, id)
 *      salary_structures is a Wave 19 table. The FK is added here in Wave 9
 *      because the column already exists on employees and this is the logical
 *      closure wave. (Wave 9's job is to close all HR circular/forward refs.)
 *      NOTE: salary_structures does not exist until Wave 19. This FK is
 *      therefore itself deferred — it must be placed in the Wave 25 closure
 *      migration, not here. The column exists on employees; the FK waits.
 *
 * CORRECTION from planning: salary_structure_id → salary_structures cannot be
 * added here because salary_structures does not exist until Wave 19. Wave 9
 * adds only the three FKs that CAN be satisfied:
 *   - departments.head_employee_id → employees
 *   - employees.reports_to_employee_id → employees
 *   - employees.default_shift_id → shifts
 *
 * The salary_structure FK is added in Wave 25 (the second closure wave).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. departments.head_employee_id → employees ────────────────────
        Schema::table('departments', function (Blueprint $table): void {
            $table->foreign(['tenant_id', 'head_employee_id'], 'fk_departments_tenant_head_emp')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();
        });

        // ── 2 & 3. employees: self-ref + shift ────────────────────────────
        Schema::table('employees', function (Blueprint $table): void {
            // Self-referential reporting chain.
            $table->foreign(['tenant_id', 'reports_to_employee_id'], 'fk_employees_tenant_reports_to')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            // Default shift.
            $table->foreign(['tenant_id', 'default_shift_id'], 'fk_employees_tenant_shift')
                ->references(['tenant_id', 'id'])
                ->on('shifts')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table): void {
            $table->dropForeign('fk_employees_tenant_shift');
            $table->dropForeign('fk_employees_tenant_reports_to');
        });

        Schema::table('departments', function (Blueprint $table): void {
            $table->dropForeign('fk_departments_tenant_head_emp');
        });
    }
};
