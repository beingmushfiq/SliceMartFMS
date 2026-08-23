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
        Schema::create('delivery_order_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('delivery_order_id');
            $table->unsignedBigInteger('sales_order_item_id')->nullable();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->string('batch_code', 64)->nullable();

            $table->decimal('quantity', 18, 4);
            $table->decimal('delivered_quantity', 18, 4)->default('0.0000');
            $table->decimal('returned_quantity', 18, 4)->default('0.0000');
            $table->unsignedBigInteger('unit_id');

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_delivery_order_items_tenant_id');
            $table->index(['tenant_id', 'delivery_order_id'], 'ix_delivery_order_items_order');
            $table->index(['tenant_id', 'product_id'], 'ix_delivery_order_items_product');

            $table->foreign(['tenant_id', 'delivery_order_id'], 'fk_delivery_order_items_order')
                ->references(['tenant_id', 'id'])
                ->on('delivery_orders')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'sales_order_item_id'], 'fk_delivery_order_items_so_item')
                ->references(['tenant_id', 'id'])
                ->on('sales_order_items')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_delivery_order_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_delivery_order_items_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_delivery_order_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_delivery_order_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_delivery_order_items_updated_by')
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
        Schema::dropIfExists('delivery_order_items');
    }
};
