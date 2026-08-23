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
        Schema::create('purchase_return_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('purchase_return_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->string('batch_code', 64)->nullable();

            $table->decimal('quantity', 18, 4);
            $table->unsignedBigInteger('unit_id');
            $table->decimal('unit_cost', 18, 4)->default('0.0000');
            $table->decimal('line_total', 18, 4);

            $table->unsignedBigInteger('stock_movement_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_purchase_return_items_tenant_id');
            $table->index(['tenant_id', 'purchase_return_id'], 'ix_purchase_return_items_return');
            $table->index(['tenant_id', 'product_id'], 'ix_purchase_return_items_product');

            $table->foreign(['tenant_id', 'purchase_return_id'], 'fk_purchase_return_items_return')
                ->references(['tenant_id', 'id'])
                ->on('purchase_returns')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_purchase_return_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_purchase_return_items_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_purchase_return_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'stock_movement_id'], 'fk_purchase_return_items_mov')
                ->references(['tenant_id', 'id'])
                ->on('stock_movements')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_purchase_return_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_purchase_return_items_updated_by')
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
        Schema::dropIfExists('purchase_return_items');
    }
};
