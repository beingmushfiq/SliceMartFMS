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
        Schema::create('document_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('document_type', 64);
            $table->unsignedBigInteger('document_id'); // Polymorphic ID (e.g. invoice id, po id)
            $table->string('document_number', 128);

            $table->unsignedBigInteger('template_id')->nullable();
            $table->unsignedBigInteger('template_version_id')->nullable();
            $table->unsignedBigInteger('print_profile_id')->nullable();

            $table->json('data_payload'); // Complete authoritative freeze of document data
            $table->json('layout_snapshot'); // Complete freeze of template layout config used
            $table->string('checksum', 64)->nullable(); // SHA-256 hash of payload

            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_document_snapshots_tenant_id');
            $table->index(['tenant_id', 'document_type', 'document_id'], 'ix_doc_snapshots_lookup');
            $table->index(['tenant_id', 'document_number'], 'ix_doc_snapshots_number');

            $table->foreign('tenant_id', 'fk_document_snapshots_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            $table->foreign('template_id', 'fk_document_snapshots_template')
                ->references('id')
                ->on('document_templates')
                ->nullOnDelete();

            $table->foreign('template_version_id', 'fk_document_snapshots_version')
                ->references('id')
                ->on('document_template_versions')
                ->nullOnDelete();

            $table->foreign('print_profile_id', 'fk_document_snapshots_profile')
                ->references('id')
                ->on('print_profiles')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_document_snapshots_created_by')
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
        Schema::dropIfExists('document_snapshots');
    }
};
