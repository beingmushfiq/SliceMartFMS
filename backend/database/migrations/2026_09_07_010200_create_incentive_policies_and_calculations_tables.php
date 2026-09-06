<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incentive_policies', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('name', 128);
            $table->string('code', 32);
            $table->text('description')->nullable();
            $table->string('basis', 32)->default('total_revenue'); // total_revenue, profit, collection
            $table->decimal('min_achievement_pct', 8, 2)->default('80.00'); // Minimum target achievement required
            $table->boolean('is_active')->default(true);

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'code'], 'uq_incentive_policies_code');
            $table->foreign('created_by', 'fk_incentive_policies_created_by')
                ->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by', 'fk_incentive_policies_updated_by')
                ->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('incentive_policy_rules', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('incentive_policy_id');

            $table->decimal('min_pct', 8, 2); // e.g. 80.00%
            $table->decimal('max_pct', 8, 2); // e.g. 100.00%
            $table->string('incentive_type', 32)->default('percentage'); // percentage or fixed
            $table->decimal('incentive_value', 18, 4); // e.g. 2.50 (%) or 5000.00 (fixed)

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('incentive_policy_id', 'fk_policy_rules_policy')
                ->references('id')->on('incentive_policies')
                ->cascadeOnDelete();
        });

        Schema::create('incentive_calculations', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('salesman_target_id')->nullable();
            $table->unsignedBigInteger('incentive_policy_id')->nullable();
            $table->string('period_month', 7); // YYYY-MM

            $table->decimal('target_amount', 18, 4)->default('0.0000');
            $table->decimal('achieved_amount', 18, 4)->default('0.0000');
            $table->decimal('achievement_pct', 8, 2)->default('0.00');

            $table->decimal('calculated_amount', 18, 4)->default('0.0000');
            $table->decimal('approved_amount', 18, 4)->default('0.0000');
            $table->string('status', 32)->default('draft'); // draft, approved, paid, rejected

            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['tenant_id', 'employee_id', 'period_month'], 'uq_incentive_calc_period');
            $table->index(['tenant_id', 'period_month'], 'ix_incentive_calc_month');

            $table->foreign(['tenant_id', 'employee_id'], 'fk_incentive_calc_emp')
                ->references(['tenant_id', 'id'])->on('employees')
                ->cascadeOnDelete();

            $table->foreign('salesman_target_id', 'fk_incentive_calc_target')
                ->references('id')->on('salesman_targets')
                ->nullOnDelete();

            $table->foreign('incentive_policy_id', 'fk_incentive_calc_policy')
                ->references('id')->on('incentive_policies')
                ->nullOnDelete();

            $table->foreign('approved_by', 'fk_incentive_calc_approved_by')
                ->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incentive_calculations');
        Schema::dropIfExists('incentive_policy_rules');
        Schema::dropIfExists('incentive_policies');
    }
};
