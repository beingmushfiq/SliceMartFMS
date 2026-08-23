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
        Schema::create('maintenance_orders', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('order_number', 64);
            $table->unsignedBigInteger('asset_id');
            $table->unsignedBigInteger('maintenance_schedule_id')->nullable();

            $table->string('maintenance_type', 32); // preventive, corrective, breakdown, inspection, calibration
            $table->string('priority', 32)->default('normal'); // low, normal, high, critical

            $table->unsignedBigInteger('reported_by')->nullable();
            $table->timestamp('reported_at')->useCurrent();
            $table->text('problem_description')->nullable();
            $table->text('diagnosis')->nullable();

            $table->timestamp('scheduled_start')->nullable();
            $table->timestamp('scheduled_end')->nullable();
            $table->timestamp('actual_start')->nullable();
            $table->timestamp('actual_end')->nullable();
            $table->unsignedInteger('downtime_minutes')->nullable();

            $table->string('status', 32)->default('requested'); // requested, approved, scheduled, in_progress, on_hold, completed, cancelled
            $table->unsignedBigInteger('performed_by_employee_id')->nullable();
            $table->unsignedBigInteger('vendor_party_id')->nullable();

            $table->decimal('labour_cost', 18, 4)->default('0.0000');
            $table->decimal('parts_cost', 18, 4)->default('0.0000');
            $table->decimal('external_cost', 18, 4)->default('0.0000');
            $table->decimal('total_cost', 18, 4)->default('0.0000');

            $table->text('completion_notes')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_maintenance_orders_tenant_id');
            $table->unique(['tenant_id', 'order_number'], 'uq_maintenance_orders_number');
            $table->index(['tenant_id', 'asset_id', 'status'], 'ix_maintenance_orders_asset_status');

            $table->foreign(['tenant_id', 'asset_id'], 'fk_maint_orders_asset')
                ->references(['tenant_id', 'id'])
                ->on('assets')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'maintenance_schedule_id'], 'fk_maint_orders_schedule')
                ->references(['tenant_id', 'id'])
                ->on('maintenance_schedules')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'performed_by_employee_id'], 'fk_maint_orders_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'vendor_party_id'], 'fk_maint_orders_vendor')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign('reported_by', 'fk_maint_orders_reported_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('approved_by', 'fk_maint_orders_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_maint_orders_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_maint_orders_updated_by')
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
        Schema::dropIfExists('maintenance_orders');
    }
};
