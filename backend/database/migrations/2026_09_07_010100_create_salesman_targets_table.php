<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salesman_targets', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('employee_id');
            $table->string('period_month', 7); // Format: YYYY-MM
            $table->string('target_name', 128)->nullable();

            $table->decimal('target_amount', 18, 4)->default('0.0000');
            $table->decimal('achieved_amount', 18, 4)->default('0.0000');
            $table->decimal('achievement_percentage', 8, 2)->default('0.00');

            $table->integer('total_leads')->default(0);
            $table->integer('valid_leads')->default(0);
            $table->integer('fake_leads')->default(0);
            $table->integer('converted_leads')->default(0);

            $table->decimal('profit_generated', 18, 4)->default('0.0000');
            $table->string('status', 32)->default('active'); // active, completed, cancelled
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'employee_id', 'period_month'], 'uq_salesman_target_period');
            $table->index(['tenant_id', 'period_month'], 'ix_salesman_targets_month');
            $table->index(['tenant_id', 'employee_id'], 'ix_salesman_targets_emp');

            $table->foreign(['tenant_id', 'employee_id'], 'fk_salesman_targets_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->cascadeOnDelete();

            $table->foreign('created_by', 'fk_salesman_targets_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_salesman_targets_updated_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salesman_targets');
    }
};
