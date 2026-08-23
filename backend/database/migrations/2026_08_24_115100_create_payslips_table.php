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
        Schema::create('payslips', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('payroll_period_id');
            $table->unsignedBigInteger('employee_id');
            $table->string('payslip_number', 64);

            $table->decimal('gross_amount', 18, 4);
            $table->decimal('total_earnings', 18, 4);
            $table->decimal('total_deductions', 18, 4);
            $table->decimal('net_amount', 18, 4);

            $table->decimal('paid_days', 8, 4)->default('0.0000');
            $table->decimal('absent_days', 8, 4)->default('0.0000');
            $table->decimal('leave_days', 8, 4)->default('0.0000');
            $table->unsignedInteger('overtime_minutes')->default(0);
            $table->decimal('produced_quantity', 18, 4)->nullable(); // for piece-rate workers

            $table->string('payment_method', 32)->default('bank'); // cash, bank, mobile_wallet
            $table->string('payment_status', 32)->default('unpaid'); // unpaid, paid, partially_paid, on_hold
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_reference', 128)->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_payslips_tenant_id');
            $table->unique(['tenant_id', 'payroll_period_id', 'employee_id'], 'uq_payslips_period_emp');
            $table->unique(['tenant_id', 'payslip_number'], 'uq_payslips_number');

            $table->foreign(['tenant_id', 'payroll_period_id'], 'fk_payslips_period')
                ->references(['tenant_id', 'id'])
                ->on('payroll_periods')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'employee_id'], 'fk_payslips_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_payslips_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_payslips_updated_by')
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
        Schema::dropIfExists('payslips');
    }
};
