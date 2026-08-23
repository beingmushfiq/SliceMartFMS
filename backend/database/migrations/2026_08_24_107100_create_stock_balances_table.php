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
        Schema::create('stock_balances', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('warehouse_location_id')->nullable();
            $table->string('batch_code', 64)->nullable();
            $table->string('stock_state', 32)->default('available'); // available, reserved, in_transit, quarantine, damaged

            $table->decimal('quantity', 18, 4)->default('0.0000');
            $table->decimal('average_cost', 18, 4)->default('0.0000');
            $table->decimal('total_value', 18, 4)->default('0.0000');

            $table->unsignedBigInteger('last_movement_id')->nullable();
            $table->timestamp('last_movement_at')->nullable();

            $table->timestamps();

            // Stored generated sentinels to guarantee exact 1:1 cache slots without NULL collision holes
            $table->unsignedBigInteger('variant_key')->storedAs('coalesce(variant_id, 0)');
            $table->unsignedBigInteger('location_key')->storedAs('coalesce(warehouse_location_id, 0)');
            $table->string('batch_key', 64)->storedAs("coalesce(batch_code, '')");

            $table->unique(['tenant_id', 'id'], 'uq_stock_balances_tenant_id');
            $table->unique(
                ['tenant_id', 'product_id', 'variant_key', 'warehouse_id', 'location_key', 'batch_key', 'stock_state'],
                'uq_stock_balances_slot'
            );

            $table->index(['tenant_id', 'warehouse_id', 'stock_state'], 'ix_stock_balances_wh_state');
            $table->index(['tenant_id', 'product_id', 'warehouse_id'], 'ix_stock_balances_prod_wh');

            $table->foreign(['tenant_id', 'product_id'], 'fk_stock_balances_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_stock_balances_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_stock_balances_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_location_id'], 'fk_stock_balances_location')
                ->references(['tenant_id', 'id'])
                ->on('warehouse_locations')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'last_movement_id'], 'fk_stock_balances_last_movement')
                ->references(['tenant_id', 'id'])
                ->on('stock_movements')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_balances');
    }
};
