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
        Schema::create('qc_inspection_results', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('qc_inspection_id');
            $table->unsignedBigInteger('qc_parameter_id');

            $table->decimal('value_numeric', 18, 4)->nullable();
            $table->tinyInteger('value_boolean')->nullable();
            $table->text('value_text')->nullable();
            $table->tinyInteger('is_within_spec')->default(1);
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_qc_inspection_results_tenant_id');
            $table->unique(
                ['tenant_id', 'qc_inspection_id', 'qc_parameter_id'],
                'uq_qc_inspection_results_param'
            );

            $table->foreign(['tenant_id', 'qc_inspection_id'], 'fk_qc_inspection_results_inspection')
                ->references(['tenant_id', 'id'])
                ->on('qc_inspections')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'qc_parameter_id'], 'fk_qc_inspection_results_param')
                ->references(['tenant_id', 'id'])
                ->on('qc_parameters')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_qc_inspection_results_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_qc_inspection_results_updated_by')
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
        Schema::dropIfExists('qc_inspection_results');
    }
};
