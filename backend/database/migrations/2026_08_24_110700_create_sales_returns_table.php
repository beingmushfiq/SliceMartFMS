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
        Schema::create('sales_returns', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('return_number', 64);
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->unsignedBigInteger('sales_order_id')->nullable();
            $table->unsignedBigInteger('party_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');

            $table->date('return_date');
            $table->unsignedBigInteger('reason_code_id');
            $table->boolean('restock')->default(true);

            $table->decimal('subtotal', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('total_amount', 18, 4)->default('0.0000');

            $table->string('refund_method', 32)->default('credit_note'); // cash, bank, credit_note, exchange
            $table->string('credit_note_number', 64)->nullable();
            $table->string('status', 32)->default('draft'); // draft, approved, posted, cancelled

            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_sales_returns_tenant_id');
            $table->unique(['tenant_id', 'return_number'], 'uq_sales_returns_number');
            $table->index(['tenant_id', 'party_id', 'return_date'], 'ix_sales_returns_party_date');
            $table->index(['tenant_id', 'warehouse_id'], 'ix_sales_returns_warehouse');

            $table->foreign(['tenant_id', 'invoice_id'], 'fk_sales_returns_invoice')
                ->references(['tenant_id', 'id'])
                ->on('invoices')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'sales_order_id'], 'fk_sales_returns_so')
                ->references(['tenant_id', 'id'])
                ->on('sales_orders')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'party_id'], 'fk_sales_returns_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_sales_returns_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'reason_code_id'], 'fk_sales_returns_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign('approved_by', 'fk_sales_returns_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_sales_returns_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_sales_returns_updated_by')
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
        Schema::dropIfExists('sales_returns');
    }
};
