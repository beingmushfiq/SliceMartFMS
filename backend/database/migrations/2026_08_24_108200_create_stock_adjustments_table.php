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
        Schema::create('stock_adjustments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('adjustment_number', 64);
            $table->unsignedBigInteger('warehouse_id');
            $table->date('adjustment_date');

            $table->string('type', 32); // increase, decrease, revaluation
            $table->unsignedBigInteger('reason_code_id');
            $table->string('status', 32)->default('draft'); // draft, pending_approval, approved, rejected

            $table->decimal('total_value_impact', 18, 4)->default('0.0000');
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_stock_adjustments_tenant_id');
            $table->unique(['tenant_id', 'adjustment_number'], 'uq_stock_adjustments_number');
            $table->index(['tenant_id', 'warehouse_id'], 'ix_stock_adjustments_wh');
            $table->index(['tenant_id', 'reason_code_id'], 'ix_stock_adjustments_reason');
            $table->index(['tenant_id', 'adjustment_date'], 'ix_stock_adjustments_date');

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_stock_adjustments_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'reason_code_id'], 'fk_stock_adjustments_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign('requested_by', 'fk_stock_adjustments_requested_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('approved_by', 'fk_stock_adjustments_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_stock_adjustments_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_stock_adjustments_updated_by')
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
        Schema::dropIfExists('stock_adjustments');
    }
};
