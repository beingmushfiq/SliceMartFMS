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
     * Wave 10 — Material Issues
     * Implements ADR-011 / DATABASE_DESIGN.md §5 Group D.
     */
    public function up(): void
    {
        Schema::create('material_issues', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');
            $table->string('issue_number', 64);
            $table->foreignId('production_batch_id');
            $table->foreignId('warehouse_id');
            $table->date('issue_date');
            $table->string('status', 32)->default('draft');
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_material_issues_uuid');
            $table->unique(['tenant_id', 'issue_number'], 'uq_material_issues_tenant_number');
            $table->unique(['tenant_id', 'id'], 'uq_material_issues_tenant_id');

            $table->foreign(['tenant_id', 'production_batch_id'], 'fk_material_issues_batch')
                ->references(['tenant_id', 'id'])
                ->on('production_batches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_material_issues_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->index(['tenant_id', 'production_batch_id'], 'ix_material_issues_tenant_batch');
            $table->index(['tenant_id', 'issue_date'], 'ix_material_issues_tenant_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_issues');
    }
};
