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
        Schema::create('asset_assignments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('asset_id');
            $table->string('assigned_to_type', 32); // employee, branch, factory, production_line, vehicle
            $table->unsignedBigInteger('assigned_to_id');

            $table->date('assigned_from');
            $table->date('assigned_to_date')->nullable();
            $table->unsignedBigInteger('assigned_by')->nullable();

            $table->timestamp('returned_at')->nullable();
            $table->string('condition_on_return', 32)->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_asset_assignments_tenant_id');
            $table->index(['tenant_id', 'asset_id', 'assigned_from'], 'ix_asset_assign_asset_date');

            $table->foreign(['tenant_id', 'asset_id'], 'fk_asset_assignments_asset')
                ->references(['tenant_id', 'id'])
                ->on('assets')
                ->restrictOnDelete();

            $table->foreign('assigned_by', 'fk_asset_assignments_assigned_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_asset_assignments_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_asset_assignments_updated_by')
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
        Schema::dropIfExists('asset_assignments');
    }
};
