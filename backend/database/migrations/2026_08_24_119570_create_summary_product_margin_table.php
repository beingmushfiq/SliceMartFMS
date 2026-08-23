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
        Schema::create('summary_product_margin', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('product_id');
            $table->unsignedSmallInteger('period_year');
            $table->unsignedTinyInteger('period_month');

            $table->decimal('quantity_sold', 18, 4)->default('0.0000');
            $table->decimal('revenue', 18, 4)->default('0.0000');
            $table->decimal('cost', 18, 4)->default('0.0000');
            $table->decimal('gross_margin', 18, 4)->default('0.0000');
            $table->decimal('margin_percentage', 8, 4)->default('0.0000');

            $table->timestamp('refreshed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_sum_prod_margin_tenant_id');
            $table->unique(['tenant_id', 'product_id', 'period_year', 'period_month'], 'uq_sum_prod_margin_slot');

            $table->foreign(['tenant_id', 'product_id'], 'fk_sum_prod_margin_prod')
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
        Schema::dropIfExists('summary_product_margin');
    }
};
