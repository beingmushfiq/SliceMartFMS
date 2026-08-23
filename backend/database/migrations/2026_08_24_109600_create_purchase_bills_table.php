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
        Schema::create('purchase_bills', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('bill_number', 64);
            $table->string('supplier_bill_number', 64)->nullable();
            $table->unsignedBigInteger('party_id');
            $table->unsignedBigInteger('purchase_order_id')->nullable();
            $table->unsignedBigInteger('goods_receipt_id')->nullable();

            $table->date('bill_date');
            $table->date('due_date')->nullable();

            $table->decimal('subtotal', 18, 4)->default('0.0000');
            $table->decimal('discount_amount', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('other_charges', 18, 4)->default('0.0000');
            $table->decimal('total_amount', 18, 4)->default('0.0000');
            $table->decimal('paid_amount', 18, 4)->default('0.0000');

            $table->string('status', 32)->default('draft'); // draft, posted, partially_paid, paid, cancelled
            $table->unsignedBigInteger('posted_by')->nullable();
            $table->timestamp('posted_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_purchase_bills_tenant_id');
            $table->unique(['tenant_id', 'bill_number'], 'uq_purchase_bills_number');
            $table->index(['tenant_id', 'party_id'], 'ix_purchase_bills_party');
            $table->index(['tenant_id', 'bill_date'], 'ix_purchase_bills_date');

            $table->foreign(['tenant_id', 'party_id'], 'fk_purchase_bills_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'purchase_order_id'], 'fk_purchase_bills_po')
                ->references(['tenant_id', 'id'])
                ->on('purchase_orders')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'goods_receipt_id'], 'fk_purchase_bills_grn')
                ->references(['tenant_id', 'id'])
                ->on('goods_receipts')
                ->restrictOnDelete();

            $table->foreign('posted_by', 'fk_purchase_bills_posted_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_purchase_bills_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_purchase_bills_updated_by')
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
        Schema::dropIfExists('purchase_bills');
    }
};
