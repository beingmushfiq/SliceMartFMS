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
        Schema::create('invoice_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('sales_order_item_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable(); // nullable for custom lines

            $table->text('description')->nullable();
            $table->decimal('quantity', 18, 4);
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->decimal('unit_price', 18, 4);

            $table->decimal('discount_amount', 18, 4)->default('0.0000');
            $table->unsignedBigInteger('tax_profile_id')->nullable();
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('line_total', 18, 4);
            $table->integer('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_invoice_items_tenant_id');
            $table->index(['tenant_id', 'invoice_id'], 'ix_invoice_items_invoice');
            $table->index(['tenant_id', 'product_id'], 'ix_invoice_items_product');

            $table->foreign(['tenant_id', 'invoice_id'], 'fk_invoice_items_invoice')
                ->references(['tenant_id', 'id'])
                ->on('invoices')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'sales_order_item_id'], 'fk_invoice_items_so_item')
                ->references(['tenant_id', 'id'])
                ->on('sales_order_items')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_invoice_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_invoice_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'tax_profile_id'], 'fk_invoice_items_tax')
                ->references(['tenant_id', 'id'])
                ->on('tax_profiles')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_invoice_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_invoice_items_updated_by')
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
        Schema::dropIfExists('invoice_items');
    }
};
