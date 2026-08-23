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
        Schema::create('rework_orders', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('rework_number', 64);
            $table->unsignedBigInteger('source_batch_id');
            $table->unsignedBigInteger('qc_inspection_id')->nullable();
            $table->unsignedBigInteger('product_id');
            $table->decimal('quantity', 18, 4);
            $table->unsignedBigInteger('unit_id');
            $table->unsignedBigInteger('target_batch_id')->nullable();
            $table->unsignedInteger('cycle_number')->default(1);
            $table->string('status', 32)->default('pending'); // pending, in_progress, completed, scrapped
            $table->decimal('cost_incurred', 18, 4)->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_rework_orders_tenant_id');
            $table->unique(['tenant_id', 'rework_number'], 'uq_rework_orders_number');
            $table->index(['tenant_id', 'source_batch_id'], 'ix_rework_orders_source_batch');
            $table->index(['tenant_id', 'target_batch_id'], 'ix_rework_orders_target_batch');
            $table->index(['tenant_id', 'qc_inspection_id'], 'ix_rework_orders_qc_inspection');

            $table->foreign(['tenant_id', 'source_batch_id'], 'fk_rework_orders_source_batch')
                ->references(['tenant_id', 'id'])
                ->on('production_batches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'qc_inspection_id'], 'fk_rework_orders_qc_inspection')
                ->references(['tenant_id', 'id'])
                ->on('qc_inspections')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_rework_orders_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_rework_orders_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'target_batch_id'], 'fk_rework_orders_target_batch')
                ->references(['tenant_id', 'id'])
                ->on('production_batches')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_rework_orders_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_rework_orders_updated_by')
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
        Schema::dropIfExists('rework_orders');
    }
};
