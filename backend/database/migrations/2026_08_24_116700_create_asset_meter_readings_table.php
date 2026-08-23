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
        Schema::create('asset_meter_readings', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('asset_id');
            $table->timestamp('reading_at')->useCurrent();
            $table->string('meter_type', 32); // hours, kilometres, cycles, units_produced
            $table->decimal('reading_value', 18, 4);

            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_asset_meter_readings_tenant_id');
            $table->index(['tenant_id', 'asset_id', 'reading_at'], 'ix_asset_meter_readings_time');

            $table->foreign(['tenant_id', 'asset_id'], 'fk_asset_meter_readings_asset')
                ->references(['tenant_id', 'id'])
                ->on('assets')
                ->restrictOnDelete();

            $table->foreign('recorded_by', 'fk_asset_meter_readings_recorder')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_asset_meter_readings_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_asset_meter_readings_updated_by')
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
        Schema::dropIfExists('asset_meter_readings');
    }
};
