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
        Schema::create('summary_monthly_payroll', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id');
            $table->unsignedSmallInteger('period_year');
            $table->unsignedTinyInteger('period_month');

            $table->unsignedInteger('employee_count')->default(0);
            $table->decimal('gross_amount', 18, 4)->default('0.0000');
            $table->decimal('deductions_amount', 18, 4)->default('0.0000');
            $table->decimal('net_amount', 18, 4)->default('0.0000');
            $table->unsignedInteger('overtime_minutes')->default(0);

            $table->timestamp('refreshed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_sum_monthly_pay_tenant_id');
            $table->unique(['tenant_id', 'company_id', 'period_year', 'period_month'], 'uq_sum_monthly_pay_slot');

            $table->foreign(['tenant_id', 'company_id'], 'fk_sum_monthly_pay_comp')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('summary_monthly_payroll');
    }
};
