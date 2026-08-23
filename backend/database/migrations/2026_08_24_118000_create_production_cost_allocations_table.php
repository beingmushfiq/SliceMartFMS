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
        Schema::create('production_cost_allocations', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('production_batch_id');
            $table->string('cost_type', 32); // material, labour, machine, utility, overhead, wastage

            $table->string('source_reference_type', 64)->nullable();
            $table->unsignedBigInteger('source_reference_id')->nullable();

            $table->decimal('amount', 18, 4);
            $table->string('allocation_basis', 32); // actual, per_unit, per_hour, percentage_of_material

            $table->timestamp('allocated_at')->useCurrent();
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_prod_cost_alloc_tenant_id');
            $table->index(['tenant_id', 'production_batch_id'], 'ix_prod_cost_alloc_batch');

            $table->foreign(['tenant_id', 'production_batch_id'], 'fk_prod_cost_alloc_batch')
                ->references(['tenant_id', 'id'])
                ->on('production_batches')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_prod_cost_alloc_created_by')
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
        Schema::dropIfExists('production_cost_allocations');
    }
};
