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
        Schema::create('payroll_advances', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('employee_id');
            $table->string('advance_number', 64);

            $table->decimal('amount', 18, 4);
            $table->date('issued_on');
            $table->unsignedBigInteger('recovery_start_period_id')->nullable();
            $table->decimal('installment_amount', 18, 4);
            $table->decimal('recovered_amount', 18, 4)->default('0.0000');

            $table->string('status', 32)->default('active'); // active, recovered, written_off
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_payroll_advances_tenant_id');
            $table->unique(['tenant_id', 'advance_number'], 'uq_payroll_advances_number');
            $table->index(['tenant_id', 'employee_id', 'status'], 'ix_payroll_advances_emp_status');

            $table->foreign(['tenant_id', 'employee_id'], 'fk_payroll_advances_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'recovery_start_period_id'], 'fk_payroll_advances_period')
                ->references(['tenant_id', 'id'])
                ->on('payroll_periods')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_payroll_advances_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_payroll_advances_updated_by')
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
        Schema::dropIfExists('payroll_advances');
    }
};
