<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Wave 10 — Production Batch Inputs
     * Implements ADR-011 / DATABASE_DESIGN.md §5 Group D.
     */
    public function up(): void
    {
        Schema::create('production_batch_inputs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');
            $table->foreignId('production_batch_id');
            $table->foreignId('product_id');
            $table->decimal('quantity', 18, 4);
            $table->foreignId('unit_id');
            $table->string('source', 32); // material_issue, manual_count, weighbridge, carry_forward
            $table->foreignId('material_issue_item_id')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('recorded_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_prod_batch_inputs_uuid');
            $table->unique(['tenant_id', 'id'], 'uq_prod_batch_inputs_tenant_id');

            $table->foreign(['tenant_id', 'production_batch_id'], 'fk_prod_batch_inputs_batch')
                ->references(['tenant_id', 'id'])
                ->on('production_batches')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_prod_batch_inputs_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_prod_batch_inputs_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'material_issue_item_id'], 'fk_prod_batch_inputs_issue_item')
                ->references(['tenant_id', 'id'])
                ->on('material_issue_items')
                ->restrictOnDelete();

            $table->index(['tenant_id', 'production_batch_id'], 'ix_prod_batch_inputs_tenant_batch');
            $table->index(['tenant_id', 'product_id'], 'ix_prod_batch_inputs_tenant_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_batch_inputs');
    }
};
