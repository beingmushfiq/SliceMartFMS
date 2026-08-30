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
        Schema::create('document_print_histories', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('document_type', 64);
            $table->unsignedBigInteger('document_id');
            $table->string('document_number', 128);

            $table->unsignedBigInteger('template_id')->nullable();
            $table->unsignedInteger('template_version')->default(1);
            $table->unsignedBigInteger('print_profile_id')->nullable();

            $table->string('action', 32)->default('print'); // print, pdf, reprint
            $table->unsignedSmallInteger('copies')->default(1);

            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['tenant_id', 'document_type', 'document_id'], 'ix_print_hist_doc');
            $table->index(['tenant_id', 'created_at'], 'ix_print_hist_tenant_created');

            $table->foreign('tenant_id', 'fk_print_hist_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            $table->foreign('template_id', 'fk_print_hist_template')
                ->references('id')
                ->on('document_templates')
                ->nullOnDelete();

            $table->foreign('print_profile_id', 'fk_print_hist_profile')
                ->references('id')
                ->on('print_profiles')
                ->nullOnDelete();

            $table->foreign('user_id', 'fk_print_hist_user')
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
        Schema::dropIfExists('document_print_histories');
    }
};
