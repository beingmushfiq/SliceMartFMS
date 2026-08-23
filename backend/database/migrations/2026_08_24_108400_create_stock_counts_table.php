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
        Schema::create('stock_counts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('count_number', 64);
            $table->unsignedBigInteger('warehouse_id');
            $table->date('count_date');

            $table->string('type', 32); // full, cycle, spot
            $table->string('status', 32)->default('draft'); // draft, counting, review, reconciled, cancelled
            $table->tinyInteger('freeze_stock')->default(0);

            $table->unsignedBigInteger('counted_by')->nullable();
            $table->unsignedBigInteger('reconciled_by')->nullable();
            $table->timestamp('reconciled_at')->nullable();
            $table->unsignedBigInteger('stock_adjustment_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_stock_counts_tenant_id');
            $table->unique(['tenant_id', 'count_number'], 'uq_stock_counts_number');
            $table->index(['tenant_id', 'warehouse_id'], 'ix_stock_counts_wh');
            $table->index(['tenant_id', 'count_date'], 'ix_stock_counts_date');

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_stock_counts_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'stock_adjustment_id'], 'fk_stock_counts_adjustment')
                ->references(['tenant_id', 'id'])
                ->on('stock_adjustments')
                ->restrictOnDelete();

            $table->foreign('counted_by', 'fk_stock_counts_counted_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('reconciled_by', 'fk_stock_counts_reconciled_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_stock_counts_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_stock_counts_updated_by')
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
        Schema::dropIfExists('stock_counts');
    }
};
