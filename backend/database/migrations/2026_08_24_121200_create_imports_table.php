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
        Schema::create('imports', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('import_type', 32); // products, parties, employees, opening_stock, price_list, attendance
            $table->string('file_path', 512);
            $table->string('original_filename', 255);

            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('processed_rows')->default(0);
            $table->unsignedInteger('success_rows')->default(0);
            $table->unsignedInteger('failed_rows')->default(0);

            $table->string('status', 32)->default('uploaded'); // uploaded, validating, validated, importing, completed, completed_with_errors, failed, cancelled
            $table->string('error_report_path', 512)->nullable();
            $table->json('mapping')->nullable();

            $table->boolean('dry_run')->default(false);
            $table->unsignedBigInteger('requested_by');

            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_imports_tenant_id');

            $table->foreign(['tenant_id', 'requested_by'], 'fk_imports_requested_by')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_imports_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_imports_updated_by')
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
        Schema::dropIfExists('imports');
    }
};
