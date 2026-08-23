<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('employee_id');
            $table->date('attendance_date');
            $table->unsignedBigInteger('shift_id')->nullable();

            $table->timestamp('check_in_at')->nullable();
            $table->timestamp('check_out_at')->nullable();
            $table->string('check_in_source', 32)->default('manual'); // manual, biometric, mobile, import
            $table->string('check_out_source', 32)->nullable();

            $table->unsignedInteger('worked_minutes')->nullable();
            $table->unsignedInteger('late_minutes')->nullable();
            $table->unsignedInteger('early_leave_minutes')->nullable();
            $table->unsignedInteger('overtime_minutes')->nullable();

            $table->string('status', 32)->default('present'); // present, absent, late, half_day, on_leave, holiday, weekly_off
            $table->unsignedBigInteger('leave_request_id')->nullable();
            $table->text('remarks')->nullable();

            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('payroll_period_id')->nullable(); // frozen when stamped

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_attendances_tenant_id');
            $table->unique(['tenant_id', 'employee_id', 'attendance_date'], 'uq_attendances_emp_date');
            $table->index(['tenant_id', 'attendance_date', 'status'], 'ix_attendances_date_status');

            $table->foreign(['tenant_id', 'employee_id'], 'fk_attendances_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'shift_id'], 'fk_attendances_shift')
                ->references(['tenant_id', 'id'])
                ->on('shifts')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'leave_request_id'], 'fk_attendances_leave_req')
                ->references(['tenant_id', 'id'])
                ->on('leave_requests')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'payroll_period_id'], 'fk_attendances_payroll_period')
                ->references(['tenant_id', 'id'])
                ->on('payroll_periods')
                ->restrictOnDelete();

            $table->foreign('approved_by', 'fk_attendances_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_attendances_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_attendances_updated_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
