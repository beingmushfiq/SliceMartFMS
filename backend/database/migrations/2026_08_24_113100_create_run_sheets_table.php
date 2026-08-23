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
        Schema::create('run_sheets', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('run_sheet_number', 64);
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('rider_id')->nullable();
            $table->unsignedBigInteger('vehicle_id')->nullable(); // deferred FK to assets (Wave 20)

            $table->date('run_date');
            $table->string('status', 32)->default('draft'); // draft, dispatched, in_progress, completed, reconciled

            $table->unsignedInteger('total_stops')->default(0);
            $table->unsignedInteger('completed_stops')->default(0);
            $table->decimal('total_cod_expected', 18, 4)->default('0.0000');
            $table->decimal('total_cod_collected', 18, 4)->default('0.0000');

            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->unsignedBigInteger('reconciled_by')->nullable();
            $table->timestamp('reconciled_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_run_sheets_tenant_id');
            $table->unique(['tenant_id', 'run_sheet_number'], 'uq_run_sheets_number');
            $table->index(['tenant_id', 'branch_id', 'run_date'], 'ix_run_sheets_branch_date');

            $table->foreign(['tenant_id', 'branch_id'], 'fk_run_sheets_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign('rider_id', 'fk_run_sheets_rider')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('reconciled_by', 'fk_run_sheets_reconciled_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_run_sheets_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_run_sheets_updated_by')
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
        Schema::dropIfExists('run_sheets');
    }
};
