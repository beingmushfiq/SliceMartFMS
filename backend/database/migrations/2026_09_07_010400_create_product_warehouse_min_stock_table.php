<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_warehouse_min_stocks', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');

            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('warehouse_id');

            $table->decimal('min_stock_alert', 18, 4)->default('10.0000');
            $table->decimal('reorder_quantity', 18, 4)->default('50.0000');
            $table->decimal('max_stock_level', 18, 4)->nullable();

            $table->timestamps();

            $table->unique(['tenant_id', 'product_id', 'warehouse_id'], 'uq_prod_wh_min_stock');

            $table->foreign(['tenant_id', 'product_id'], 'fk_prod_wh_stock_prod')
                ->references(['tenant_id', 'id'])->on('products')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_prod_wh_stock_wh')
                ->references(['tenant_id', 'id'])->on('warehouses')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_warehouse_min_stocks');
    }
};
