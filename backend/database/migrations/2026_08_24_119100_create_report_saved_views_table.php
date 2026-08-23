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
        Schema::create('report_saved_views', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('report_definition_id');
            $table->unsignedBigInteger('user_id');
            $table->string('name', 255);

            $table->json('filters')->nullable();
            $table->json('columns')->nullable();
            $table->json('sort')->nullable();

            $table->boolean('is_shared')->default(false);
            $table->boolean('is_default')->default(false);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_report_saved_views_tenant_id');
            $table->index(['tenant_id', 'user_id', 'report_definition_id'], 'ix_report_views_user_def');

            $table->foreign('report_definition_id', 'fk_report_views_def')
                ->references('id')
                ->on('report_definitions')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'user_id'], 'fk_report_views_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_report_views_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_report_views_updated_by')
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
        Schema::dropIfExists('report_saved_views');
    }
};
