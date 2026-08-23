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
        Schema::create('payment_allocations', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('payment_id');
            $table->string('allocatable_type', 32); // invoice, purchase_bill, sales_return, purchase_return
            $table->unsignedBigInteger('allocatable_id');
            $table->decimal('amount', 18, 4);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_payment_allocations_tenant_id');
            $table->index(['tenant_id', 'payment_id'], 'ix_payment_allocations_payment');
            $table->index(['tenant_id', 'allocatable_type', 'allocatable_id'], 'ix_payment_allocations_target');

            $table->foreign(['tenant_id', 'payment_id'], 'fk_payment_allocations_payment')
                ->references(['tenant_id', 'id'])
                ->on('payments')
                ->cascadeOnDelete();

            $table->foreign('created_by', 'fk_payment_allocations_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_payment_allocations_updated_by')
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
        Schema::dropIfExists('payment_allocations');
    }
};
