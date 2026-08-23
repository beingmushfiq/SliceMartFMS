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
        Schema::create('maintenance_order_parts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('maintenance_order_id');
            $table->unsignedBigInteger('product_id'); // spare part product
            $table->unsignedBigInteger('warehouse_id');

            $table->decimal('quantity', 18, 4);
            $table->unsignedBigInteger('unit_id');
            $table->decimal('unit_cost', 18, 4);
            $table->decimal('line_cost', 18, 4);

            $table->unsignedBigInteger('stock_movement_id')->nullable(); // set once issued

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_maint_order_parts_tenant_id');
            $table->index(['tenant_id', 'maintenance_order_id'], 'ix_maint_order_parts_order');

            $table->foreign(['tenant_id', 'maintenance_order_id'], 'fk_maint_order_parts_order')
                ->references(['tenant_id', 'id'])
                ->on('maintenance_orders')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_maint_order_parts_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_maint_order_parts_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_maint_order_parts_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'stock_movement_id'], 'fk_maint_order_parts_movement')
                ->references(['tenant_id', 'id'])
                ->on('stock_movements')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_maint_order_parts_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_maint_order_parts_updated_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_order_parts');
    }
};
