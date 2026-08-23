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
        Schema::create('report_exports', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('report_definition_id');
            $table->unsignedBigInteger('requested_by');

            $table->json('filters')->nullable();
            $table->string('format', 16); // pdf, xlsx, csv
            $table->unsignedInteger('row_count')->nullable();

            $table->string('file_path', 512)->nullable();
            $table->unsignedBigInteger('file_size_bytes')->nullable();

            $table->string('status', 32)->default('queued'); // queued, processing, completed, failed, expired
            $table->text('error_message')->nullable();

            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('downloaded_count')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_report_exports_tenant_id');
            $table->index(['tenant_id', 'requested_by', 'created_at'], 'ix_report_exports_req_time');

            $table->foreign('report_definition_id', 'fk_report_exports_def')
                ->references('id')
                ->on('report_definitions')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'requested_by'], 'fk_report_exports_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_report_exports_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_report_exports_updated_by')
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
        Schema::dropIfExists('report_exports');
    }
};
