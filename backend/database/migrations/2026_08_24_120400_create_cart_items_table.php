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
        Schema::create('cart_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('cart_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();

            $table->string('product_name', 255); // snapshot at add time
            $table->decimal('quantity', 18, 4);
            $table->unsignedBigInteger('unit_id');

            $table->decimal('unit_price', 18, 4); // snapshot at add time
            $table->decimal('line_discount', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('line_total', 18, 4);

            $table->boolean('price_stale')->default(false);
            $table->timestamp('added_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_cart_items_tenant_id');

            $table->foreign(['tenant_id', 'cart_id'], 'fk_cart_items_cart')
                ->references(['tenant_id', 'id'])
                ->on('carts')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_cart_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_cart_items_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_cart_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
