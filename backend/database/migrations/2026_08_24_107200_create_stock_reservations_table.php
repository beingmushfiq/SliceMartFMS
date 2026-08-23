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
        Schema::create('stock_reservations', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');
            $table->decimal('quantity', 18, 4);
            $table->unsignedBigInteger('unit_id');

            $table->string('reference_type', 64)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('status', 32)->default('active'); // active, consumed, released, expired

            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'id'], 'uq_stock_reservations_tenant_id');
            $table->index(['tenant_id', 'product_id', 'warehouse_id', 'status'], 'ix_stock_reservations_prod_wh_status');
            $table->index(['tenant_id', 'reference_type', 'reference_id'], 'ix_stock_reservations_ref');
            $table->index(['tenant_id', 'expires_at'], 'ix_stock_reservations_expires');

            $table->foreign(['tenant_id', 'product_id'], 'fk_stock_reservations_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_stock_reservations_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_stock_reservations_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_stock_reservations_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_stock_reservations_created_by')
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
        Schema::dropIfExists('stock_reservations');
    }
};
