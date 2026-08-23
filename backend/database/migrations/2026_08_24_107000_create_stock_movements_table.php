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
        Schema::create('stock_movements', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('movement_number', 64);
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('warehouse_location_id')->nullable();

            $table->string('batch_code', 64)->nullable();
            $table->string('serial_number', 64)->nullable();
            $table->date('expiry_date')->nullable();

            // 15 movement types per DATABASE_DESIGN §6
            $table->string('movement_type', 32);
            $table->string('direction', 8); // in, out
            $table->string('stock_state', 32)->default('available'); // available, reserved, in_transit, quarantine, damaged

            $table->decimal('quantity', 18, 4); // always positive, direction carries sign
            $table->unsignedBigInteger('unit_id');
            $table->decimal('unit_cost', 18, 4)->default('0.0000');
            $table->decimal('total_cost', 18, 4)->default('0.0000');
            $table->decimal('balance_after', 18, 4)->default('0.0000');

            $table->string('reference_type', 64)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();

            $table->unsignedBigInteger('related_movement_id')->nullable();
            $table->unsignedBigInteger('reason_code_id')->nullable();

            $table->timestamp('moved_at');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Append-only ledger — no updated_at and NO soft deletes (DATABASE_DESIGN §1.1 & §6)
            $table->unique(['tenant_id', 'id'], 'uq_stock_movements_tenant_id');
            $table->unique(['tenant_id', 'movement_number'], 'uq_stock_movements_number');

            $table->index(['tenant_id', 'product_id', 'warehouse_id', 'moved_at'], 'ix_stock_movements_prod_wh_moved');
            $table->index(['tenant_id', 'movement_type', 'moved_at'], 'ix_stock_movements_type_moved');
            $table->index(['tenant_id', 'reference_type', 'reference_id'], 'ix_stock_movements_ref');
            $table->index(['tenant_id', 'related_movement_id'], 'ix_stock_movements_related');

            $table->foreign(['tenant_id', 'product_id'], 'fk_stock_movements_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_stock_movements_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_stock_movements_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_location_id'], 'fk_stock_movements_location')
                ->references(['tenant_id', 'id'])
                ->on('warehouse_locations')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_stock_movements_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'related_movement_id'], 'fk_stock_movements_related')
                ->references(['tenant_id', 'id'])
                ->on('stock_movements')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'reason_code_id'], 'fk_stock_movements_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_stock_movements_created_by')
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
        Schema::dropIfExists('stock_movements');
    }
};
