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
        Schema::create('purchase_orders', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('po_number', 64);
            $table->unsignedBigInteger('party_id'); // Supplier
            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->unsignedBigInteger('purchase_requisition_id')->nullable();

            $table->date('order_date');
            $table->date('expected_date')->nullable();
            $table->string('currency_code', 3)->default('USD');

            $table->decimal('subtotal', 18, 4)->default('0.0000');
            $table->decimal('discount_amount', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('shipping_amount', 18, 4)->default('0.0000');
            $table->decimal('total_amount', 18, 4)->default('0.0000');
            $table->decimal('received_value', 18, 4)->default('0.0000');
            $table->decimal('billed_value', 18, 4)->default('0.0000');

            $table->string('payment_terms', 64)->nullable();
            $table->string('status', 32)->default('draft'); // draft, pending_approval, approved, sent, partially_received, received, closed, cancelled
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_purchase_orders_tenant_id');
            $table->unique(['tenant_id', 'po_number'], 'uq_purchase_orders_number');
            $table->index(['tenant_id', 'party_id'], 'ix_purchase_orders_party');
            $table->index(['tenant_id', 'order_date'], 'ix_purchase_orders_date');

            $table->foreign(['tenant_id', 'party_id'], 'fk_purchase_orders_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'company_id'], 'fk_purchase_orders_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_purchase_orders_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_purchase_orders_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'purchase_requisition_id'], 'fk_purchase_orders_req')
                ->references(['tenant_id', 'id'])
                ->on('purchase_requisitions')
                ->restrictOnDelete();

            $table->foreign('approved_by', 'fk_purchase_orders_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_purchase_orders_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_purchase_orders_updated_by')
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
        Schema::dropIfExists('purchase_orders');
    }
};
