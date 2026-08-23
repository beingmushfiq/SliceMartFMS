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
        Schema::create('purchase_returns', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('return_number', 64);
            $table->unsignedBigInteger('party_id');
            $table->unsignedBigInteger('goods_receipt_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');

            $table->date('return_date');
            $table->unsignedBigInteger('reason_code_id');

            $table->decimal('subtotal', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('total_amount', 18, 4)->default('0.0000');

            $table->string('status', 32)->default('draft'); // draft, posted, credited, cancelled
            $table->string('debit_note_number', 64)->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_purchase_returns_tenant_id');
            $table->unique(['tenant_id', 'return_number'], 'uq_purchase_returns_number');
            $table->index(['tenant_id', 'party_id'], 'ix_purchase_returns_party');
            $table->index(['tenant_id', 'warehouse_id'], 'ix_purchase_returns_wh');
            $table->index(['tenant_id', 'return_date'], 'ix_purchase_returns_date');

            $table->foreign(['tenant_id', 'party_id'], 'fk_purchase_returns_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'goods_receipt_id'], 'fk_purchase_returns_grn')
                ->references(['tenant_id', 'id'])
                ->on('goods_receipts')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_purchase_returns_wh')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'reason_code_id'], 'fk_purchase_returns_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_purchase_returns_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_purchase_returns_updated_by')
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
        Schema::dropIfExists('purchase_returns');
    }
};
