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
        Schema::create('courier_shipments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('delivery_order_id');
            $table->unsignedBigInteger('courier_provider_id');
            $table->string('consignment_id', 128)->nullable();
            $table->string('awb_number', 128)->nullable();

            $table->string('label_path', 500)->nullable();
            $table->string('tracking_url', 500)->nullable();
            $table->string('status', 32)->default('draft');
            $table->string('provider_status_raw', 128)->nullable();

            $table->decimal('charge_amount', 18, 4)->default('0.0000');
            $table->decimal('cod_amount', 18, 4)->default('0.0000');

            $table->timestamp('requested_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();

            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('retry_count')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_courier_shipments_tenant_id');
            $table->unique(['tenant_id', 'courier_provider_id', 'consignment_id'], 'uq_courier_shipments_consignment');
            $table->index(['tenant_id', 'delivery_order_id'], 'ix_courier_shipments_order');
            $table->index(['tenant_id', 'status'], 'ix_courier_shipments_status');

            $table->foreign(['tenant_id', 'delivery_order_id'], 'fk_courier_shipments_order')
                ->references(['tenant_id', 'id'])
                ->on('delivery_orders')
                ->cascadeOnDelete();

            $table->foreign('courier_provider_id', 'fk_courier_shipments_provider')
                ->references('id')
                ->on('courier_providers')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_courier_shipments_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_courier_shipments_updated_by')
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
        Schema::dropIfExists('courier_shipments');
    }
};
