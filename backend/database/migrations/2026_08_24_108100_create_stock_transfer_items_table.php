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
        Schema::create('stock_transfer_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('stock_transfer_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->string('batch_code', 64)->nullable();

            $table->decimal('sent_quantity', 18, 4);
            $table->decimal('received_quantity', 18, 4)->default('0.0000');
            $table->decimal('damaged_quantity', 18, 4)->default('0.0000');
            $table->unsignedBigInteger('unit_id');

            $table->unsignedBigInteger('out_movement_id')->nullable();
            $table->unsignedBigInteger('in_movement_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_stock_transfer_items_tenant_id');
            $table->index(['tenant_id', 'stock_transfer_id'], 'ix_stock_transfer_items_transfer');
            $table->index(['tenant_id', 'product_id'], 'ix_stock_transfer_items_product');

            $table->foreign(['tenant_id', 'stock_transfer_id'], 'fk_stock_transfer_items_transfer')
                ->references(['tenant_id', 'id'])
                ->on('stock_transfers')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_stock_transfer_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_stock_transfer_items_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_stock_transfer_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'out_movement_id'], 'fk_stock_transfer_items_out_mov')
                ->references(['tenant_id', 'id'])
                ->on('stock_movements')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'in_movement_id'], 'fk_stock_transfer_items_in_mov')
                ->references(['tenant_id', 'id'])
                ->on('stock_movements')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_stock_transfer_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_stock_transfer_items_updated_by')
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
        Schema::dropIfExists('stock_transfer_items');
    }
};
