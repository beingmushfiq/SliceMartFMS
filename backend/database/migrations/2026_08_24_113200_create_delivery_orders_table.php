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
        Schema::create('delivery_orders', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('delivery_number', 64);
            $table->unsignedBigInteger('sales_order_id');
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->unsignedBigInteger('party_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('delivery_address_id')->nullable();

            $table->string('recipient_name', 255);
            $table->string('recipient_phone', 64);
            $table->string('delivery_type', 32)->default('own_delivery'); // own_delivery, courier, pickup
            $table->unsignedBigInteger('courier_provider_id')->nullable();
            $table->unsignedBigInteger('courier_shipment_id')->nullable(); // linked when shipment generated
            $table->unsignedBigInteger('run_sheet_id')->nullable();
            $table->unsignedBigInteger('rider_id')->nullable();

            $table->date('scheduled_date')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->string('status', 32)->default('pending'); // pending, assigned, picked_up, in_transit, out_for_delivery, delivered, failed, rescheduled, returned, cancelled, on_hold

            $table->decimal('cod_amount', 18, 4)->default('0.0000');
            $table->decimal('cod_collected_amount', 18, 4)->default('0.0000');
            $table->string('cod_status', 32)->default('not_applicable'); // not_applicable, pending, collected, deposited, reconciled

            $table->decimal('delivery_charge', 18, 4)->default('0.0000');
            $table->decimal('weight', 18, 4)->nullable();
            $table->unsignedInteger('package_count')->default(1);
            $table->text('special_instructions')->nullable();

            $table->unsignedInteger('attempt_count')->default(0);
            $table->unsignedBigInteger('failure_reason_id')->nullable();
            $table->string('pod_signature_path', 500)->nullable();
            $table->string('pod_photo_path', 500)->nullable();
            $table->string('pod_received_by', 255)->nullable();
            $table->unsignedBigInteger('stock_movement_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_delivery_orders_tenant_id');
            $table->unique(['tenant_id', 'delivery_number'], 'uq_delivery_orders_number');
            $table->index(['tenant_id', 'sales_order_id'], 'ix_delivery_orders_so');
            $table->index(['tenant_id', 'status'], 'ix_delivery_orders_status');
            $table->index(['tenant_id', 'run_sheet_id'], 'ix_delivery_orders_run_sheet');

            $table->foreign(['tenant_id', 'sales_order_id'], 'fk_delivery_orders_so')
                ->references(['tenant_id', 'id'])
                ->on('sales_orders')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'invoice_id'], 'fk_delivery_orders_invoice')
                ->references(['tenant_id', 'id'])
                ->on('invoices')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'party_id'], 'fk_delivery_orders_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_delivery_orders_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'delivery_address_id'], 'fk_delivery_orders_address')
                ->references(['tenant_id', 'id'])
                ->on('party_addresses')
                ->restrictOnDelete();

            $table->foreign('courier_provider_id', 'fk_delivery_orders_courier')
                ->references('id')
                ->on('courier_providers')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'run_sheet_id'], 'fk_delivery_orders_run_sheet')
                ->references(['tenant_id', 'id'])
                ->on('run_sheets')
                ->restrictOnDelete();

            $table->foreign('rider_id', 'fk_delivery_orders_rider')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign(['tenant_id', 'failure_reason_id'], 'fk_delivery_orders_failure_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'stock_movement_id'], 'fk_delivery_orders_stock_movement')
                ->references(['tenant_id', 'id'])
                ->on('stock_movements')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_delivery_orders_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_delivery_orders_updated_by')
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
        Schema::dropIfExists('delivery_orders');
    }
};
