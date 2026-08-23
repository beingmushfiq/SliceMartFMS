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
     * Wave 10 — Production Batches
     * Implements ADR-011, ADR-012 / DATABASE_DESIGN.md §5 Group D.
     */
    public function up(): void
    {
        Schema::create('production_batches', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');
            $table->string('batch_number', 64);
            $table->foreignId('production_plan_item_id')->nullable();
            $table->foreignId('factory_id');
            $table->foreignId('production_line_id')->nullable();
            $table->foreignId('product_id');
            $table->foreignId('bill_of_material_id');
            $table->foreignId('shift_id')->nullable();
            $table->date('batch_date');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('planned_quantity', 18, 4);
            $table->foreignId('output_unit_id');
            $table->string('status', 32)->default('draft');
            $table->string('context_completeness', 32)->default('draft');
            $table->decimal('total_input_quantity', 18, 4)->default(0);
            $table->decimal('total_output_quantity', 18, 4)->default(0);
            $table->decimal('worker_reported_quantity', 18, 4)->default(0);

            // Invariant (ADR-012): NULL until context_completeness is context_complete.
            // A migration default of 0 is a defect.
            $table->decimal('yield_percentage', 8, 4)->nullable();
            $table->decimal('variance_quantity', 18, 4)->nullable();
            $table->decimal('variance_percentage', 8, 4)->nullable();
            $table->json('analysis')->nullable();

            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_production_batches_uuid');
            $table->unique(['tenant_id', 'batch_number'], 'uq_production_batches_tenant_number');
            $table->unique(['tenant_id', 'id'], 'uq_production_batches_tenant_id');

            $table->foreign(['tenant_id', 'production_plan_item_id'], 'fk_production_batches_plan_item')
                ->references(['tenant_id', 'id'])
                ->on('production_plan_items')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'factory_id'], 'fk_production_batches_factory')
                ->references(['tenant_id', 'id'])
                ->on('factories')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'production_line_id'], 'fk_production_batches_line')
                ->references(['tenant_id', 'id'])
                ->on('production_lines')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_production_batches_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'bill_of_material_id'], 'fk_production_batches_bom')
                ->references(['tenant_id', 'id'])
                ->on('bill_of_materials')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'shift_id'], 'fk_production_batches_shift')
                ->references(['tenant_id', 'id'])
                ->on('shifts')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'output_unit_id'], 'fk_production_batches_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->index(['tenant_id', 'batch_date'], 'ix_production_batches_tenant_date');
            $table->index(['tenant_id', 'status'], 'ix_production_batches_tenant_status');
            $table->index(['tenant_id', 'production_line_id', 'batch_date'], 'ix_production_batches_tenant_line_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_batches');
    }
};
