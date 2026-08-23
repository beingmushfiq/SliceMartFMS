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
        Schema::create('courier_webhook_events', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable(); // nullable until payload resolved to tenant

            $table->unsignedBigInteger('courier_provider_id');
            $table->string('provider_event_id', 128);
            $table->boolean('signature_valid')->default(true);

            $table->json('payload');
            $table->timestamp('processed_at')->nullable();
            $table->string('status', 32)->default('received'); // received, processed, duplicate, invalid_signature, failed
            $table->text('error_message')->nullable();

            $table->timestamps();

            $table->unique(['courier_provider_id', 'provider_event_id'], 'uq_courier_webhook_events_prov_evt');
            $table->index(['tenant_id', 'status'], 'ix_courier_webhook_events_tenant_status');

            $table->foreign('courier_provider_id', 'fk_courier_webhook_events_provider')
                ->references('id')
                ->on('courier_providers')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courier_webhook_events');
    }
};
