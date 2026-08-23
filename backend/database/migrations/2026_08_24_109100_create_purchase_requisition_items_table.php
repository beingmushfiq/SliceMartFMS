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
        Schema::create('purchase_requisition_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('purchase_requisition_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();

            $table->decimal('quantity', 18, 4);
            $table->unsignedBigInteger('unit_id');
            $table->decimal('ordered_quantity', 18, 4)->default('0.0000');
            $table->decimal('estimated_unit_cost', 18, 4)->default('0.0000');
            $table->text('notes')->nullable();
            $table->integer('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_purchase_requisition_items_tenant_id');
            $table->index(['tenant_id', 'purchase_requisition_id'], 'ix_purchase_req_items_req');
            $table->index(['tenant_id', 'product_id'], 'ix_purchase_req_items_product');

            $table->foreign(['tenant_id', 'purchase_requisition_id'], 'fk_purchase_req_items_req')
                ->references(['tenant_id', 'id'])
                ->on('purchase_requisitions')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_purchase_req_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_purchase_req_items_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_purchase_req_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_purchase_req_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_purchase_req_items_updated_by')
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
        Schema::dropIfExists('purchase_requisition_items');
    }
};
