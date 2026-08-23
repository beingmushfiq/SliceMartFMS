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
        Schema::create('maintenance_schedules', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('asset_id');
            $table->string('code', 64);
            $table->string('name', 255);

            $table->string('trigger_type', 32)->default('time_interval'); // time_interval, meter_reading, both
            $table->unsignedInteger('interval_days')->nullable();
            $table->decimal('interval_meter_units', 18, 4)->nullable();

            $table->date('last_performed_on')->nullable();
            $table->decimal('last_meter_reading', 18, 4)->nullable();
            $table->date('next_due_on')->nullable();
            $table->decimal('next_due_meter', 18, 4)->nullable();

            $table->json('checklist')->nullable();
            $table->string('assigned_team', 128)->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_maintenance_schedules_tenant_id');
            $table->unique(['tenant_id', 'code'], 'uq_maintenance_schedules_code');
            $table->index(['tenant_id', 'next_due_on'], 'ix_maintenance_sched_due');

            $table->foreign(['tenant_id', 'asset_id'], 'fk_maint_schedules_asset')
                ->references(['tenant_id', 'id'])
                ->on('assets')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_maint_schedules_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_maint_schedules_updated_by')
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
        Schema::dropIfExists('maintenance_schedules');
    }
};
