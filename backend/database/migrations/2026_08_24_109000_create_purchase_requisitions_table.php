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
        Schema::create('purchase_requisitions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('requisition_number', 64);
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->date('required_by_date');

            $table->string('status', 32)->default('draft'); // draft, pending_approval, approved, rejected, partially_ordered, ordered, cancelled
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_purchase_requisitions_tenant_id');
            $table->unique(['tenant_id', 'requisition_number'], 'uq_purchase_requisitions_number');
            $table->index(['tenant_id', 'branch_id'], 'ix_purchase_requisitions_branch');
            $table->index(['tenant_id', 'warehouse_id'], 'ix_purchase_requisitions_wh');
            $table->index(['tenant_id', 'required_by_date'], 'ix_purchase_requisitions_req_date');

            $table->foreign(['tenant_id', 'branch_id'], 'fk_purchase_requisitions_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_purchase_requisitions_wh')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign('requested_by', 'fk_purchase_requisitions_requested_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('approved_by', 'fk_purchase_requisitions_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_purchase_requisitions_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_purchase_requisitions_updated_by')
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
        Schema::dropIfExists('purchase_requisitions');
    }
};
