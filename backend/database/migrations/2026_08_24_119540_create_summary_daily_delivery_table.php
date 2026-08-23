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
        Schema::create('summary_daily_delivery', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('courier_provider_id')->nullable();
            $table->date('summary_date');

            $table->unsignedInteger('dispatched_count')->default(0);
            $table->unsignedInteger('delivered_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->unsignedInteger('returned_count')->default(0);
            $table->decimal('cod_expected', 18, 4)->default('0.0000');
            $table->decimal('cod_received', 18, 4)->default('0.0000');

            $table->unsignedBigInteger('courier_key')->virtualAs('COALESCE(courier_provider_id, 0)');

            $table->timestamp('refreshed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_sum_daily_deliv_tenant_id');
            $table->unique(['tenant_id', 'branch_id', 'courier_key', 'summary_date'], 'uq_sum_daily_deliv_slot');

            $table->foreign(['tenant_id', 'branch_id'], 'fk_sum_daily_deliv_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'courier_provider_id'], 'fk_sum_daily_deliv_courier')
                ->references(['tenant_id', 'id'])
                ->on('courier_providers')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('summary_daily_delivery');
    }
};
