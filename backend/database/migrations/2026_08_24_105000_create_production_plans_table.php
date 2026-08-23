<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Wave 10 — Production Plans
     * Implements ADR-011 / DATABASE_DESIGN.md §5 Group D.
     */
    public function up(): void
    {
        Schema::create('production_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');
            $table->foreignId('company_id');
            $table->foreignId('factory_id');
            $table->string('plan_number', 64);
            $table->date('plan_date');
            $table->date('period_start');
            $table->date('period_end');
            $table->string('source', 32);
            $table->string('status', 32)->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_production_plans_uuid');
            $table->unique(['tenant_id', 'plan_number'], 'uq_production_plans_tenant_number');
            $table->unique(['tenant_id', 'id'], 'uq_production_plans_tenant_id');

            $table->foreign(['tenant_id', 'company_id'], 'fk_production_plans_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'factory_id'], 'fk_production_plans_factory')
                ->references(['tenant_id', 'id'])
                ->on('factories')
                ->restrictOnDelete();

            $table->index(['tenant_id', 'status'], 'ix_production_plans_tenant_status');
            $table->index(['tenant_id', 'plan_date'], 'ix_production_plans_tenant_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_plans');
    }
};
