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
        Schema::create('summary_daily_worker_output', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('product_id');
            $table->date('summary_date');

            $table->decimal('produced_quantity', 18, 4)->default('0.0000');
            $table->decimal('rejected_quantity', 18, 4)->default('0.0000');
            $table->decimal('hours_worked', 8, 4)->default('0.0000');
            $table->decimal('piece_amount', 18, 4)->default('0.0000');

            $table->timestamp('refreshed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_sum_daily_worker_tenant_id');
            $table->unique(['tenant_id', 'employee_id', 'product_id', 'summary_date'], 'uq_sum_daily_worker_slot');

            $table->foreign(['tenant_id', 'employee_id'], 'fk_sum_daily_worker_emp')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_sum_daily_worker_prod')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('summary_daily_worker_output');
    }
};
