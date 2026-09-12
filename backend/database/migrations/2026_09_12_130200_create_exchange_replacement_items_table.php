<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_replacement_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('exchange_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->decimal('quantity', 15, 4);
            $table->unsignedBigInteger('unit_id');
            $table->decimal('unit_price', 15, 4)->default('0.0000');
            $table->decimal('line_total', 15, 4)->default('0.0000');
            $table->string('batch_code', 64)->nullable();
            // set after approval when stock movement is recorded
            $table->unsignedBigInteger('stock_movement_id')->nullable();

            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();

            $table->index(['tenant_id', 'exchange_id'], 'ix_ex_replacement_items_exchange');
            $table->index(['tenant_id', 'product_id'], 'ix_ex_replacement_items_product');

            $table->foreign(['tenant_id', 'exchange_id'], 'fk_ex_replacement_items_exchange')
                ->references(['tenant_id', 'id'])
                ->on('exchanges')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_ex_replacement_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign('unit_id', 'fk_ex_replacement_items_unit')
                ->references('id')
                ->on('units')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_ex_replacement_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_replacement_items');
    }
};
