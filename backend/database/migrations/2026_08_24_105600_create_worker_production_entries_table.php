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
     * Wave 10 — Worker Production Entries
     * Implements ADR-013 / DATABASE_DESIGN.md §5 Group D.
     */
    public function up(): void
    {
        Schema::create('worker_production_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');
            $table->foreignId('production_batch_id');
            $table->foreignId('employee_id');
            $table->foreignId('product_id');
            $table->foreignId('production_line_id')->nullable();
            $table->foreignId('shift_id')->nullable();
            $table->date('work_date');
            $table->string('measure_type', 32); // piece, weight, volume, unit
            $table->decimal('quantity', 18, 4);
            $table->foreignId('unit_id');
            $table->decimal('rework_quantity', 18, 4)->default(0);
            $table->decimal('rejected_quantity', 18, 4)->default(0);
            $table->decimal('hours_worked', 8, 4)->nullable();
            $table->string('rate_type', 32)->default('piece_rate'); // piece_rate, hourly, fixed, none
            $table->decimal('rate', 18, 4)->nullable();
            $table->decimal('incentive_amount', 18, 4)->nullable();

            // Deferred FK to payroll_periods (Wave 19 table, resolved in Wave 25)
            $table->unsignedBigInteger('payroll_period_id')->nullable();

            $table->foreignId('entered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->string('status', 32)->default('draft'); // draft, submitted, verified, locked
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_worker_prod_entries_uuid');
            $table->unique(
                ['tenant_id', 'production_batch_id', 'employee_id', 'product_id', 'work_date', 'shift_id'],
                'uq_worker_prod_entries_batch_emp_prod_date_shift'
            );
            $table->unique(['tenant_id', 'id'], 'uq_worker_prod_entries_tenant_id');

            $table->foreign(['tenant_id', 'production_batch_id'], 'fk_worker_prod_entries_batch')
                ->references(['tenant_id', 'id'])
                ->on('production_batches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'employee_id'], 'fk_worker_prod_entries_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_worker_prod_entries_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'production_line_id'], 'fk_worker_prod_entries_line')
                ->references(['tenant_id', 'id'])
                ->on('production_lines')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'shift_id'], 'fk_worker_prod_entries_shift')
                ->references(['tenant_id', 'id'])
                ->on('shifts')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_worker_prod_entries_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->index(['tenant_id', 'employee_id', 'work_date'], 'ix_worker_prod_entries_tenant_emp_date');
            $table->index(['tenant_id', 'production_batch_id'], 'ix_worker_prod_entries_tenant_batch');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worker_production_entries');
    }
};
