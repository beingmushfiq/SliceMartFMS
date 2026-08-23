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
        Schema::create('payroll_periods', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id');
            $table->string('period_code', 64);
            $table->string('pay_frequency', 32); // monthly, weekly, daily, piece_rate

            $table->date('period_start');
            $table->date('period_end');
            $table->date('payment_date');

            $table->string('status', 32)->default('open'); // open, calculating, calculated, approved, paid, closed
            $table->decimal('total_gross', 18, 4)->default('0.0000');
            $table->decimal('total_deductions', 18, 4)->default('0.0000');
            $table->decimal('total_net', 18, 4)->default('0.0000');
            $table->unsignedInteger('employee_count')->default(0);

            $table->unsignedBigInteger('calculated_by')->nullable();
            $table->timestamp('calculated_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('locked_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_payroll_periods_tenant_id');
            $table->unique(['tenant_id', 'company_id', 'period_code'], 'uq_payroll_periods_code');

            $table->foreign(['tenant_id', 'company_id'], 'fk_payroll_periods_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign('calculated_by', 'fk_payroll_periods_calc_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('approved_by', 'fk_payroll_periods_appr_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_payroll_periods_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_payroll_periods_updated_by')
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
        Schema::dropIfExists('payroll_periods');
    }
};
