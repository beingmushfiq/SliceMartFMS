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
        Schema::create('stock_transfers', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('transfer_number', 64);
            $table->unsignedBigInteger('from_warehouse_id');
            $table->unsignedBigInteger('to_warehouse_id');
            $table->date('transfer_date');

            $table->string('status', 32)->default('draft'); // draft, in_transit, partially_received, received, cancelled
            $table->unsignedBigInteger('dispatched_by')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->unsignedBigInteger('received_by')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_stock_transfers_tenant_id');
            $table->unique(['tenant_id', 'transfer_number'], 'uq_stock_transfers_number');
            $table->index(['tenant_id', 'from_warehouse_id'], 'ix_stock_transfers_from');
            $table->index(['tenant_id', 'to_warehouse_id'], 'ix_stock_transfers_to');
            $table->index(['tenant_id', 'transfer_date'], 'ix_stock_transfers_date');

            $table->foreign(['tenant_id', 'from_warehouse_id'], 'fk_stock_transfers_from_wh')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'to_warehouse_id'], 'fk_stock_transfers_to_wh')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign('dispatched_by', 'fk_stock_transfers_dispatched_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('received_by', 'fk_stock_transfers_received_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_stock_transfers_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_stock_transfers_updated_by')
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
        Schema::dropIfExists('stock_transfers');
    }
};
