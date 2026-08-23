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
        Schema::create('summary_monthly_finance', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('chart_of_account_id');
            $table->unsignedSmallInteger('period_year');
            $table->unsignedTinyInteger('period_month');

            $table->decimal('debit_total', 18, 4)->default('0.0000');
            $table->decimal('credit_total', 18, 4)->default('0.0000');
            $table->decimal('net_movement', 18, 4)->default('0.0000');
            $table->decimal('closing_balance', 18, 4)->default('0.0000');

            $table->timestamp('refreshed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_sum_monthly_fin_tenant_id');
            $table->unique(['tenant_id', 'company_id', 'chart_of_account_id', 'period_year', 'period_month'], 'uq_sum_monthly_fin_slot');

            $table->foreign(['tenant_id', 'company_id'], 'fk_sum_monthly_fin_comp')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'chart_of_account_id'], 'fk_sum_monthly_fin_coa')
                ->references(['tenant_id', 'id'])
                ->on('chart_of_accounts')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('summary_monthly_finance');
    }
};
