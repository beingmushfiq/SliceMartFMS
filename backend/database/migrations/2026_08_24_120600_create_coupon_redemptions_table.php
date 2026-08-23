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
        Schema::create('coupon_redemptions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('coupon_id');
            $table->unsignedBigInteger('sales_order_id');
            $table->unsignedBigInteger('customer_party_id')->nullable();

            $table->decimal('discount_amount', 18, 4);
            $table->timestamp('redeemed_at')->useCurrent();

            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_coupon_redemptions_tenant_id');
            $table->unique(['tenant_id', 'coupon_id', 'sales_order_id'], 'uq_coupon_redemptions_slot');

            $table->foreign(['tenant_id', 'coupon_id'], 'fk_coupon_redemptions_coupon')
                ->references(['tenant_id', 'id'])
                ->on('coupons')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'sales_order_id'], 'fk_coupon_redemptions_order')
                ->references(['tenant_id', 'id'])
                ->on('sales_orders')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'customer_party_id'], 'fk_coupon_redemptions_customer')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupon_redemptions');
    }
};
