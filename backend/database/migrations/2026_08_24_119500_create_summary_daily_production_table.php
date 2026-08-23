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
        Schema::create('summary_daily_production', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('factory_id');
            $table->unsignedBigInteger('production_line_id');
            $table->unsignedBigInteger('product_id');
            $table->date('summary_date');

            $table->decimal('input_quantity', 18, 4)->default('0.0000');
            $table->decimal('output_quantity', 18, 4)->default('0.0000');
            $table->decimal('yield_percentage', 8, 4)->default('0.0000');
            $table->decimal('wastage_quantity', 18, 4)->default('0.0000');
            $table->decimal('rework_quantity', 18, 4)->default('0.0000');
            $table->decimal('scrap_quantity', 18, 4)->default('0.0000');
            $table->unsignedInteger('batch_count')->default(0);

            $table->timestamp('refreshed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_sum_daily_prod_tenant_id');
            $table->unique(['tenant_id', 'factory_id', 'production_line_id', 'product_id', 'summary_date'], 'uq_sum_daily_prod_slot');

            $table->foreign(['tenant_id', 'factory_id'], 'fk_sum_daily_prod_factory')
                ->references(['tenant_id', 'id'])
                ->on('factories')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'production_line_id'], 'fk_sum_daily_prod_line')
                ->references(['tenant_id', 'id'])
                ->on('production_lines')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_sum_daily_prod_product')
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
        Schema::dropIfExists('summary_daily_production');
    }
};
