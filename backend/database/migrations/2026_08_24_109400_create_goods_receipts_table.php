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
        Schema::create('goods_receipts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('grn_number', 64);
            $table->unsignedBigInteger('purchase_order_id')->nullable(); // Direct receipts are legal
            $table->unsignedBigInteger('party_id');
            $table->unsignedBigInteger('warehouse_id');

            $table->date('receipt_date');
            $table->string('supplier_document_number', 64)->nullable();
            $table->string('status', 32)->default('draft'); // draft, received, qc_pending, completed, cancelled
            $table->unsignedBigInteger('received_by')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_goods_receipts_tenant_id');
            $table->unique(['tenant_id', 'grn_number'], 'uq_goods_receipts_number');
            $table->index(['tenant_id', 'party_id'], 'ix_goods_receipts_party');
            $table->index(['tenant_id', 'warehouse_id'], 'ix_goods_receipts_wh');
            $table->index(['tenant_id', 'receipt_date'], 'ix_goods_receipts_date');

            $table->foreign(['tenant_id', 'purchase_order_id'], 'fk_goods_receipts_po')
                ->references(['tenant_id', 'id'])
                ->on('purchase_orders')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'party_id'], 'fk_goods_receipts_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_goods_receipts_wh')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign('received_by', 'fk_goods_receipts_received_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_goods_receipts_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_goods_receipts_updated_by')
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
        Schema::dropIfExists('goods_receipts');
    }
};
