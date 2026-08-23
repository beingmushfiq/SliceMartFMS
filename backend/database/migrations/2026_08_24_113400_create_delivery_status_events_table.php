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
        Schema::create('delivery_status_events', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('delivery_order_id');
            $table->string('status', 32);
            $table->string('source', 32)->default('system'); // system, rider, courier_webhook, manual
            $table->string('courier_event_id', 128)->nullable();

            $table->timestamp('occurred_at');
            $table->string('location', 255)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('notes')->nullable();
            $table->json('raw_payload')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at');

            $table->unique(['tenant_id', 'id'], 'uq_delivery_status_events_tenant_id');
            // Webhook idempotency guard per ADR-017
            $table->unique(['tenant_id', 'delivery_order_id', 'courier_event_id'], 'uq_delivery_status_events_idemp');
            $table->index(['tenant_id', 'delivery_order_id', 'occurred_at'], 'ix_delivery_events_order_time');

            $table->foreign(['tenant_id', 'delivery_order_id'], 'fk_delivery_status_events_order')
                ->references(['tenant_id', 'id'])
                ->on('delivery_orders')
                ->cascadeOnDelete();

            $table->foreign('created_by', 'fk_delivery_status_events_created_by')
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
        Schema::dropIfExists('delivery_status_events');
    }
};
