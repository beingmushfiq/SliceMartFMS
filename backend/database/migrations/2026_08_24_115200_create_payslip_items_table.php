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
        Schema::create('payslip_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('payslip_id');
            $table->unsignedBigInteger('salary_component_id');
            $table->string('component_code', 64); // snapshotted label per ADR-019
            $table->string('component_type', 32); // snapshotted type per ADR-019
            $table->json('calculation_basis')->nullable(); // snapshotted basis per ADR-019

            $table->decimal('quantity', 18, 4)->nullable();
            $table->decimal('rate', 18, 4)->nullable();
            $table->decimal('amount', 18, 4);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_payslip_items_tenant_id');
            $table->index(['tenant_id', 'payslip_id'], 'ix_payslip_items_payslip');

            $table->foreign(['tenant_id', 'payslip_id'], 'fk_payslip_items_payslip')
                ->references(['tenant_id', 'id'])
                ->on('payslips')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'salary_component_id'], 'fk_payslip_items_component')
                ->references(['tenant_id', 'id'])
                ->on('salary_components')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_payslip_items_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_payslip_items_updated_by')
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
        Schema::dropIfExists('payslip_items');
    }
};
