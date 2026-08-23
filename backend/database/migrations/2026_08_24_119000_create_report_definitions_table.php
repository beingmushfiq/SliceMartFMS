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
        Schema::create('report_definitions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable(); // null = platform-provided definition
            $table->uuid('uuid');

            $table->string('code', 64);
            $table->string('name', 255);
            $table->string('module', 64);
            $table->string('category', 32); // operational, analytical, compliance, financial
            $table->text('description')->nullable();

            $table->json('default_filters')->nullable();
            $table->json('available_columns')->nullable();
            $table->string('required_permission', 128);

            $table->boolean('supports_export')->default(true);
            $table->string('tier', 32)->default('live'); // live, summary
            $table->string('summary_table', 64)->nullable();
            $table->boolean('is_active')->default(true);

            $table->unsignedBigInteger('tenant_key')->virtualAs('COALESCE(tenant_id, 0)');

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_key', 'code'], 'uq_report_definitions_code');
            $table->unique(['tenant_key', 'id'], 'uq_report_definitions_tenant_id');

            $table->foreign('created_by', 'fk_report_def_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_report_def_updated_by')
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
        Schema::dropIfExists('report_definitions');
    }
};
