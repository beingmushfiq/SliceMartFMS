<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchanges', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('exchange_number', 64);
            $table->unsignedBigInteger('original_invoice_id')->nullable();
            $table->unsignedBigInteger('original_sales_order_id')->nullable();
            $table->unsignedBigInteger('party_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('pos_session_id')->nullable(); // POS support

            $table->date('exchange_date');
            $table->unsignedBigInteger('reason_code_id');

            // exchange_type: like_for_like | upgrade | downgrade
            $table->string('exchange_type', 32)->default('like_for_like');

            $table->decimal('return_subtotal', 18, 4)->default('0.0000');
            $table->decimal('replacement_subtotal', 18, 4)->default('0.0000');
            // positive = customer owes top-up, negative = customer gets refund
            $table->decimal('difference_amount', 18, 4)->default('0.0000');
            // none | top_up | refund
            $table->string('difference_settlement', 32)->default('none');

            // draft | approved | completed | cancelled
            $table->string('status', 32)->default('draft');
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_exchanges_tenant_id');
            $table->unique(['tenant_id', 'exchange_number'], 'uq_exchanges_number');
            $table->index(['tenant_id', 'party_id', 'exchange_date'], 'ix_exchanges_party_date');
            $table->index(['tenant_id', 'warehouse_id'], 'ix_exchanges_warehouse');
            $table->index(['tenant_id', 'status'], 'ix_exchanges_status');

            $table->foreign(['tenant_id', 'original_invoice_id'], 'fk_exchanges_invoice')
                ->references(['tenant_id', 'id'])
                ->on('invoices')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'original_sales_order_id'], 'fk_exchanges_so')
                ->references(['tenant_id', 'id'])
                ->on('sales_orders')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'party_id'], 'fk_exchanges_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_exchanges_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'reason_code_id'], 'fk_exchanges_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign('approved_by', 'fk_exchanges_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_exchanges_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_exchanges_updated_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchanges');
    }
};
