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
        Schema::create('cod_reconciliations', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('reconciliation_number', 64);
            $table->string('source_type', 32); // run_sheet, courier_provider
            $table->unsignedBigInteger('source_id');

            $table->date('period_start');
            $table->date('period_end');

            $table->decimal('expected_amount', 18, 4);
            $table->decimal('received_amount', 18, 4);
            $table->decimal('variance_amount', 18, 4)->default('0.0000');

            $table->unsignedBigInteger('bank_account_id')->nullable(); // deferred FK to Wave 21
            $table->string('status', 32)->default('draft'); // draft, reconciled, disputed

            $table->unsignedBigInteger('reconciled_by')->nullable();
            $table->timestamp('reconciled_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_cod_reconciliations_tenant_id');
            $table->unique(['tenant_id', 'reconciliation_number'], 'uq_cod_reconciliations_number');
            $table->index(['tenant_id', 'source_type', 'source_id'], 'ix_cod_reconciliations_source');

            $table->foreign('reconciled_by', 'fk_cod_reconciliations_reconciled_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_cod_reconciliations_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_cod_reconciliations_updated_by')
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
        Schema::dropIfExists('cod_reconciliations');
    }
};
