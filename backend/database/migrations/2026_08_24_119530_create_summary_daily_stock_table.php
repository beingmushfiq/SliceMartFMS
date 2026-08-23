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
        Schema::create('summary_daily_stock', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('product_id');
            $table->date('summary_date');

            $table->decimal('opening_quantity', 18, 4)->default('0.0000');
            $table->decimal('in_quantity', 18, 4)->default('0.0000');
            $table->decimal('out_quantity', 18, 4)->default('0.0000');
            $table->decimal('closing_quantity', 18, 4)->default('0.0000');
            $table->decimal('closing_value', 18, 4)->default('0.0000');

            $table->timestamp('refreshed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_sum_daily_stock_tenant_id');
            $table->unique(['tenant_id', 'warehouse_id', 'product_id', 'summary_date'], 'uq_sum_daily_stock_slot');

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_sum_daily_stock_wh')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_sum_daily_stock_prod')
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
        Schema::dropIfExists('summary_daily_stock');
    }
};
