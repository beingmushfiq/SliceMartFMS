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
        Schema::create('summary_taxes', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('tax_profile_id');
            $table->unsignedSmallInteger('period_year');
            $table->unsignedTinyInteger('period_month');

            $table->decimal('taxable_amount', 18, 4)->default('0.0000');
            $table->decimal('tax_collected', 18, 4)->default('0.0000');
            $table->decimal('tax_paid', 18, 4)->default('0.0000');
            $table->decimal('net_tax', 18, 4)->default('0.0000');

            $table->timestamp('refreshed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_sum_taxes_tenant_id');
            $table->unique(['tenant_id', 'company_id', 'tax_profile_id', 'period_year', 'period_month'], 'uq_sum_taxes_slot');

            $table->foreign(['tenant_id', 'company_id'], 'fk_sum_taxes_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'tax_profile_id'], 'fk_sum_taxes_tax_prof')
                ->references(['tenant_id', 'id'])
                ->on('tax_profiles')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('summary_taxes');
    }
};
