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
        Schema::create('document_template_versions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('template_id');
            $table->unsignedInteger('version');
            $table->string('status', 32)->default('active'); // active, draft, archived
            $table->string('change_summary', 255)->nullable();
            $table->json('layout_config'); // Structured visual configuration: sections, fields, columns, typography, margins, signatures, terms

            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'template_id', 'version'], 'uq_doc_template_versions_unique');
            $table->index(['tenant_id', 'template_id', 'status'], 'ix_doc_template_versions_status');

            $table->foreign('tenant_id', 'fk_doc_template_versions_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            $table->foreign('template_id', 'fk_doc_template_versions_template')
                ->references('id')
                ->on('document_templates')
                ->cascadeOnDelete();

            $table->foreign('created_by', 'fk_doc_template_versions_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_doc_template_versions_updated_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });

        // Add deferred foreign key from document_templates to document_template_versions
        Schema::table('document_templates', function (Blueprint $table): void {
            $table->foreign('active_version_id', 'fk_doc_templates_active_version')
                ->references('id')
                ->on('document_template_versions')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table): void {
            $table->dropForeign('fk_doc_templates_active_version');
        });

        Schema::dropIfExists('document_template_versions');
    }
};
