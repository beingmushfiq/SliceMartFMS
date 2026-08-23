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
        Schema::create('webhook_deliveries', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('webhook_endpoint_id');
            $table->string('event_type', 128);
            $table->json('payload');

            $table->unsignedInteger('attempt_count')->default(0);
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->text('response_body')->nullable();

            $table->string('status', 32)->default('pending'); // pending, delivered, failed, abandoned
            $table->timestamp('next_retry_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_webhook_deliveries_tenant_id');
            $table->index(['tenant_id', 'status', 'next_retry_at'], 'ix_webhook_deliv_status_retry');

            $table->foreign(['tenant_id', 'webhook_endpoint_id'], 'fk_webhook_deliv_endpoint')
                ->references(['tenant_id', 'id'])
                ->on('webhook_endpoints')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_deliveries');
    }
};
