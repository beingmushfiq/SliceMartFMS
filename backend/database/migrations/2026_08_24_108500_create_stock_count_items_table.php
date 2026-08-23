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
        Schema::create('stock_count_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('stock_count_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->unsignedBigInteger('warehouse_location_id')->nullable();
            $table->string('batch_code', 64)->nullable();

            $table->decimal('system_quantity', 18, 4)->default('0.0000'); // snapshotted at freeze
            $table->decimal('counted_quantity', 18, 4)->nullable();
            $table->decimal('variance_quantity', 18, 4)->nullable();
            $table->decimal('recount_quantity', 18, 4)->nullable();

            $table->string('status', 32)->default('pending'); // pending, counted, variance, accepted
            $table->unsignedBigInteger('counted_by')->nullable();
            $table->timestamp('counted_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_stock_count_items_tenant_id');
            $table->index(['tenant_id', 'stock_count_id'], 'ix_stock_count_items_count');
            $table->index(['tenant_id', 'product_id'], 'ix_stock_count_items_product');

            $table->foreign(['tenant_id', 'stock_count_id'], 'fk_stock_count_items_count')
                ->references(['tenant_id', 'id'])
                ->on('stock_counts')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_stock_count_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_stock_count_items_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_location_id'], 'fk_stock_count_items_location')
                ->references(['tenant_id', 'id'])
                ->on('warehouse_locations')
                ->restrictOnDelete();

            $table->foreign('counted_by', 'fk_stock_count_items_counted_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_stock_count_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_stock_count_items_updated_by')
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
        Schema::dropIfExists('stock_count_items');
    }
};
