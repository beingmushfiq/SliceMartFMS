<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 8 — HR identity: shifts.
 *
 * A shift defines a named work schedule: start/end time, break, grace periods,
 * half-day threshold, and the critical `crosses_midnight` flag.
 *
 * DATABASE_DESIGN invariant:
 *   When `crosses_midnight = 1`, `end_time < start_time` and the attendance
 *   engine attributes the shift to the **start** date. Every attendance
 *   calculation reads this flag; comparing raw times without it is a defect.
 *
 * Time columns: TIME (not DATETIME) because a shift is a daily cycle, not a
 * single instant. The PHP attendance engine combines the shift date + start_time
 * to build the full DATETIME for calculations.
 *
 * Duration columns: SMALLINT (minutes). Max possible: 1440 minutes in a day;
 * SMALLINT (0–32767) is more than sufficient and avoids TINYINT overflow on
 * long shifts.
 *
 * Soft delete: YES — shifts is master data (DATABASE_DESIGN §1).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->string('code', 32);
            $table->string('name', 191);

            // TIME columns — attendance engine combines with the shift date.
            $table->time('start_time');
            $table->time('end_time');

            // DATABASE_DESIGN invariant: when 1, end_time < start_time and the
            // attendance row is attributed to the start date.
            $table->tinyInteger('crosses_midnight')->default(0);

            // All durations in minutes (SMALLINT — max 32767 > max 1440).
            $table->unsignedSmallInteger('break_minutes')->default(0);
            $table->unsignedSmallInteger('grace_in_minutes')->default(0);
            $table->unsignedSmallInteger('grace_out_minutes')->default(0);
            $table->unsignedSmallInteger('half_day_threshold_minutes')->default(0);

            $table->tinyInteger('is_active')->default(1);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique keys ────────────────────────────────────────────────
            $table->unique('uuid', 'uq_shifts_uuid');

            // Code unique within a tenant.
            $table->unique(['tenant_id', 'code'], 'uq_shifts_tenant_code');

            // Required so employees.default_shift_id composite FK (Wave 9)
            // and shift_assignments (Wave 19) can reference this table.
            $table->unique(['tenant_id', 'id'], 'uq_shifts_tenant_id');

            // ── Performance indexes (§1.2) ──────────────────────────────────
            $table->index(['tenant_id', 'is_active'], 'ix_shifts_tenant_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
