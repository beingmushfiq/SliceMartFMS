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
        Schema::create('qc_defects', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('qc_inspection_id');
            $table->unsignedBigInteger('defect_reason_id');
            $table->decimal('quantity', 18, 4);
            $table->string('severity', 32)->default('minor'); // minor, major, critical
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_qc_defects_tenant_id');
            $table->index(['tenant_id', 'qc_inspection_id'], 'ix_qc_defects_inspection');
            $table->index(['tenant_id', 'defect_reason_id'], 'ix_qc_defects_reason');

            $table->foreign(['tenant_id', 'qc_inspection_id'], 'fk_qc_defects_inspection')
                ->references(['tenant_id', 'id'])
                ->on('qc_inspections')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'defect_reason_id'], 'fk_qc_defects_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_qc_defects_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_qc_defects_updated_by')
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
        Schema::dropIfExists('qc_defects');
    }
};
