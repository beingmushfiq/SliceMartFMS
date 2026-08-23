<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Wave 10 — Production Outputs
     * Implements ADR-011 / DATABASE_DESIGN.md §5 Group D.
     */
    public function up(): void
    {
        Schema::create('production_outputs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');
            $table->foreignId('production_batch_id');
            $table->foreignId('product_id');
            $table->foreignId('variant_id')->nullable();
            $table->decimal('quantity', 18, 4);
            $table->foreignId('unit_id');
            $table->string('output_type', 32); // primary, by_product, semi_finished
            $table->string('batch_code', 64)->nullable(); // traceability lot
            $table->date('expiry_date')->nullable();
            $table->foreignId('target_warehouse_id');
            $table->boolean('qc_required')->default(true);
            $table->string('qc_status', 32)->default('pending'); // pending, passed, failed, partial, not_required

            // Deferred FK to stock_movements (Wave 12 table, resolved in Wave 25)
            $table->unsignedBigInteger('stock_movement_id')->nullable();

            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('recorded_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_production_outputs_uuid');
            $table->unique(['tenant_id', 'id'], 'uq_production_outputs_tenant_id');

            $table->foreign(['tenant_id', 'production_batch_id'], 'fk_production_outputs_batch')
                ->references(['tenant_id', 'id'])
                ->on('production_batches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_production_outputs_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_production_outputs_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_production_outputs_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'target_warehouse_id'], 'fk_production_outputs_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->index(['tenant_id', 'production_batch_id'], 'ix_prod_outputs_tenant_batch');
            $table->index(['tenant_id', 'product_id'], 'ix_prod_outputs_tenant_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_outputs');
    }
};
