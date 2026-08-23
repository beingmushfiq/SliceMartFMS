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
        Schema::create('sales_orders', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('order_number', 64);
            $table->string('channel', 32)->default('counter'); // counter, dealer, phone, field, online - ADR-015

            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->unsignedBigInteger('party_id')->nullable(); // nullable for walk-in POS customers

            $table->string('customer_name', 255)->nullable();
            $table->string('customer_phone', 64)->nullable();
            $table->unsignedBigInteger('pos_session_id')->nullable();

            $table->date('order_date');
            $table->date('required_date')->nullable();
            $table->unsignedBigInteger('price_list_id')->nullable();
            $table->string('currency_code', 3)->default('USD');

            $table->decimal('subtotal', 18, 4)->default('0.0000');
            $table->decimal('discount_amount', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('shipping_amount', 18, 4)->default('0.0000');
            $table->decimal('round_off', 18, 4)->default('0.0000');
            $table->decimal('total_amount', 18, 4)->default('0.0000');

            $table->decimal('paid_amount', 18, 4)->default('0.0000');
            $table->decimal('due_amount', 18, 4)->default('0.0000');

            $table->string('delivery_type', 32)->default('pickup'); // pickup, own_delivery, courier
            $table->string('status', 32)->default('draft'); // draft, confirmed, partially_delivered, delivered, completed, cancelled
            $table->string('payment_status', 32)->default('unpaid'); // unpaid, partial, paid, refunded

            $table->unsignedBigInteger('salesperson_id')->nullable();
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();

            $table->unsignedBigInteger('confirmed_by')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->unsignedBigInteger('cancelled_by')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->unsignedBigInteger('cancellation_reason_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_sales_orders_tenant_id');
            $table->unique(['tenant_id', 'order_number'], 'uq_sales_orders_number');
            $table->index(['tenant_id', 'channel', 'order_date'], 'ix_sales_orders_channel_date');
            $table->index(['tenant_id', 'party_id', 'order_date'], 'ix_sales_orders_party_date');
            $table->index(['tenant_id', 'status'], 'ix_sales_orders_status');

            $table->foreign(['tenant_id', 'company_id'], 'fk_sales_orders_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_sales_orders_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_sales_orders_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'party_id'], 'fk_sales_orders_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'price_list_id'], 'fk_sales_orders_price_list')
                ->references(['tenant_id', 'id'])
                ->on('price_lists')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'cancellation_reason_id'], 'fk_sales_orders_cancel_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign('salesperson_id', 'fk_sales_orders_salesperson')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('confirmed_by', 'fk_sales_orders_confirmed_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('cancelled_by', 'fk_sales_orders_cancelled_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_sales_orders_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_sales_orders_updated_by')
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
        Schema::dropIfExists('sales_orders');
    }
};
