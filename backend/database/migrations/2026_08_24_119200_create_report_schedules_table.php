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
        Schema::create('report_schedules', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('report_definition_id');
            $table->unsignedBigInteger('report_saved_view_id')->nullable();
            $table->string('name', 255);

            $table->string('frequency', 32); // daily, weekly, monthly
            $table->time('run_at_time');
            $table->unsignedTinyInteger('day_of_week')->nullable();
            $table->unsignedTinyInteger('day_of_month')->nullable();

            $table->string('format', 16)->default('pdf'); // pdf, xlsx, csv
            $table->json('recipients');

            $table->timestamp('last_run_at')->nullable();
            $table->string('last_status', 32)->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_report_schedules_tenant_id');
            $table->index(['tenant_id', 'next_run_at', 'is_active'], 'ix_report_schedules_next');

            $table->foreign('report_definition_id', 'fk_report_schedules_def')
                ->references('id')
                ->on('report_definitions')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'report_saved_view_id'], 'fk_report_schedules_view')
                ->references(['tenant_id', 'id'])
                ->on('report_saved_views')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_report_schedules_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_report_schedules_updated_by')
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
        Schema::dropIfExists('report_schedules');
    }
};
