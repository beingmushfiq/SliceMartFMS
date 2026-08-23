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
        Schema::create('sales_order_payments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('sales_order_id');
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->string('method', 32); // cash, bank_transfer, cheque, card, mobile_banking, credit_adjustment
            $table->decimal('amount', 18, 4);
            $table->decimal('change_given', 18, 4)->default('0.0000');
            $table->string('reference', 128)->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_sales_order_payments_tenant_id');
            $table->index(['tenant_id', 'sales_order_id'], 'ix_sales_order_payments_so');
            $table->index(['tenant_id', 'payment_id'], 'ix_sales_order_payments_payment');

            $table->foreign(['tenant_id', 'sales_order_id'], 'fk_sales_order_payments_so')
                ->references(['tenant_id', 'id'])
                ->on('sales_orders')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'payment_id'], 'fk_sales_order_payments_payment')
                ->references(['tenant_id', 'id'])
                ->on('payments')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_sales_order_payments_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_sales_order_payments_updated_by')
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
        Schema::dropIfExists('sales_order_payments');
    }
};
