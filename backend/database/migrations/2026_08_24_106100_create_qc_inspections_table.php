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
        Schema::create('qc_inspections', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('inspection_number', 64);
            $table->unsignedBigInteger('production_batch_id')->nullable();
            $table->unsignedBigInteger('production_output_id')->nullable();
            $table->unsignedBigInteger('goods_receipt_id')->nullable(); // deferred Wave 14
            $table->date('inspection_date');
            $table->unsignedBigInteger('inspector_id');

            $table->decimal('sample_size', 18, 4)->default('0.0000');
            $table->decimal('inspected_quantity', 18, 4)->default('0.0000');
            $table->decimal('passed_quantity', 18, 4)->default('0.0000');
            $table->decimal('failed_quantity', 18, 4)->default('0.0000');
            $table->decimal('rework_quantity', 18, 4)->default('0.0000');
            $table->decimal('scrap_quantity', 18, 4)->default('0.0000');

            $table->string('result', 32)->default('hold'); // pass, fail, partial, hold
            $table->string('status', 32)->default('draft'); // draft, submitted, approved, rejected
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_qc_inspections_tenant_id');
            $table->unique(['tenant_id', 'inspection_number'], 'uq_qc_inspections_number');
            $table->index(['tenant_id', 'production_batch_id'], 'ix_qc_inspections_batch');
            $table->index(['tenant_id', 'inspector_id'], 'ix_qc_inspections_inspector');
            $table->index(['tenant_id', 'inspection_date'], 'ix_qc_inspections_date');

            $table->foreign(['tenant_id', 'production_batch_id'], 'fk_qc_inspections_batch')
                ->references(['tenant_id', 'id'])
                ->on('production_batches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'production_output_id'], 'fk_qc_inspections_output')
                ->references(['tenant_id', 'id'])
                ->on('production_outputs')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'inspector_id'], 'fk_qc_inspections_inspector')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign('approved_by', 'fk_qc_inspections_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_qc_inspections_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_qc_inspections_updated_by')
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
        Schema::dropIfExists('qc_inspections');
    }
};
