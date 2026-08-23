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
        Schema::create('goods_receipt_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('goods_receipt_id');
            $table->unsignedBigInteger('purchase_order_item_id')->nullable();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();

            $table->decimal('ordered_quantity', 18, 4)->default('0.0000');
            $table->decimal('received_quantity', 18, 4);
            $table->decimal('accepted_quantity', 18, 4)->default('0.0000');
            $table->decimal('rejected_quantity', 18, 4)->default('0.0000');

            $table->unsignedBigInteger('unit_id');
            $table->decimal('unit_cost', 18, 4)->default('0.0000');
            $table->string('batch_code', 64)->nullable();
            $table->date('expiry_date')->nullable();

            $table->unsignedBigInteger('warehouse_location_id')->nullable();
            $table->unsignedBigInteger('stock_movement_id')->nullable();
            $table->unsignedBigInteger('reason_code_id')->nullable(); // Required when rejecting

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_goods_receipt_items_tenant_id');
            $table->index(['tenant_id', 'goods_receipt_id'], 'ix_goods_receipt_items_grn');
            $table->index(['tenant_id', 'product_id'], 'ix_goods_receipt_items_product');

            $table->foreign(['tenant_id', 'goods_receipt_id'], 'fk_goods_receipt_items_grn')
                ->references(['tenant_id', 'id'])
                ->on('goods_receipts')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'purchase_order_item_id'], 'fk_goods_receipt_items_po_item')
                ->references(['tenant_id', 'id'])
                ->on('purchase_order_items')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_goods_receipt_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_goods_receipt_items_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_goods_receipt_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_location_id'], 'fk_goods_receipt_items_loc')
                ->references(['tenant_id', 'id'])
                ->on('warehouse_locations')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'stock_movement_id'], 'fk_goods_receipt_items_mov')
                ->references(['tenant_id', 'id'])
                ->on('stock_movements')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'reason_code_id'], 'fk_goods_receipt_items_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_goods_receipt_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_goods_receipt_items_updated_by')
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
        Schema::dropIfExists('goods_receipt_items');
    }
};
