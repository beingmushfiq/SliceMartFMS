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
        Schema::create('purchase_bill_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('purchase_bill_id');
            $table->unsignedBigInteger('goods_receipt_item_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->text('description')->nullable();

            $table->decimal('quantity', 18, 4);
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->decimal('unit_price', 18, 4);

            $table->unsignedBigInteger('tax_profile_id')->nullable();
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('line_total', 18, 4);
            $table->unsignedBigInteger('expense_account_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_purchase_bill_items_tenant_id');
            $table->index(['tenant_id', 'purchase_bill_id'], 'ix_purchase_bill_items_bill');
            $table->index(['tenant_id', 'product_id'], 'ix_purchase_bill_items_product');

            $table->foreign(['tenant_id', 'purchase_bill_id'], 'fk_purchase_bill_items_bill')
                ->references(['tenant_id', 'id'])
                ->on('purchase_bills')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'goods_receipt_item_id'], 'fk_purchase_bill_items_grn_item')
                ->references(['tenant_id', 'id'])
                ->on('goods_receipt_items')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_purchase_bill_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_purchase_bill_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'tax_profile_id'], 'fk_purchase_bill_items_tax')
                ->references(['tenant_id', 'id'])
                ->on('tax_profiles')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_purchase_bill_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_purchase_bill_items_updated_by')
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
        Schema::dropIfExists('purchase_bill_items');
    }
};
