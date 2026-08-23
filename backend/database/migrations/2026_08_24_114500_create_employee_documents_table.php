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
        Schema::create('employee_documents', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('employee_id');
            $table->string('document_type', 32); // nid, contract, certificate, photo, other
            $table->unsignedBigInteger('attachment_id');

            $table->date('issued_on')->nullable();
            $table->date('expires_on')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_employee_documents_tenant_id');
            $table->index(['tenant_id', 'employee_id'], 'ix_employee_documents_emp');

            $table->foreign(['tenant_id', 'employee_id'], 'fk_employee_documents_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'attachment_id'], 'fk_employee_documents_attachment')
                ->references(['tenant_id', 'id'])
                ->on('attachments')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_employee_documents_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_employee_documents_updated_by')
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
        Schema::dropIfExists('employee_documents');
    }
};
