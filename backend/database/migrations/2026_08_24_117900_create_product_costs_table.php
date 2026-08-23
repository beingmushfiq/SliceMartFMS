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
        Schema::create('product_costs', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->unsignedBigInteger('warehouse_id')->nullable(); // null = tenant-wide

            $table->string('costing_method', 32)->default('weighted_average'); // weighted_average, fifo, standard, last_purchase
            $table->decimal('material_cost', 18, 4)->default('0.0000');
            $table->decimal('labour_cost', 18, 4)->default('0.0000');
            $table->decimal('overhead_cost', 18, 4)->default('0.0000');
            $table->decimal('total_cost', 18, 4)->default('0.0000');

            $table->decimal('standard_cost', 18, 4)->nullable();
            $table->decimal('last_purchase_cost', 18, 4)->nullable();

            $table->date('effective_from');
            $table->date('effective_to')->nullable();

            $table->string('source', 32)->default('manual'); // purchase, production, manual, recalculation
            $table->string('source_reference_type', 64)->nullable();
            $table->unsignedBigInteger('source_reference_id')->nullable();

            $table->timestamp('calculated_at')->useCurrent();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_product_costs_tenant_id');
            $table->index(['tenant_id', 'product_id', 'effective_from'], 'ix_product_costs_effective');

            $table->foreign(['tenant_id', 'product_id'], 'fk_product_costs_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_product_costs_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_product_costs_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_product_costs_created_by')
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
        Schema::dropIfExists('product_costs');
    }
};
