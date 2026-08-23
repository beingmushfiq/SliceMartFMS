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
        Schema::create('wastage_records', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('wastage_number', 64);
            $table->unsignedBigInteger('production_batch_id')->nullable();
            $table->unsignedBigInteger('product_id');
            $table->string('stage', 32); // input, in_process, output, qc, storage, transit
            $table->decimal('quantity', 18, 4);
            $table->unsignedBigInteger('unit_id');
            $table->unsignedBigInteger('reason_code_id');
            $table->decimal('estimated_cost', 18, 4)->nullable();
            $table->tinyInteger('is_recoverable')->default(0);
            $table->decimal('recovered_quantity', 18, 4)->default('0.0000');
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->unsignedBigInteger('stock_movement_id')->nullable(); // deferred Wave 12

            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->timestamp('recorded_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_wastage_records_tenant_id');
            $table->unique(['tenant_id', 'wastage_number'], 'uq_wastage_records_number');
            $table->index(['tenant_id', 'production_batch_id'], 'ix_wastage_records_batch');
            $table->index(['tenant_id', 'product_id'], 'ix_wastage_records_product');
            $table->index(['tenant_id', 'reason_code_id'], 'ix_wastage_records_reason');

            $table->foreign(['tenant_id', 'production_batch_id'], 'fk_wastage_records_batch')
                ->references(['tenant_id', 'id'])
                ->on('production_batches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_wastage_records_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_wastage_records_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'reason_code_id'], 'fk_wastage_records_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_wastage_records_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign('recorded_by', 'fk_wastage_records_recorded_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_wastage_records_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_wastage_records_updated_by')
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
        Schema::dropIfExists('wastage_records');
    }
};
