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
        Schema::create('carts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid'); // public cart token

            $table->unsignedBigInteger('storefront_id');
            $table->unsignedBigInteger('customer_party_id')->nullable(); // null = guest

            $table->string('session_token', 128);
            $table->string('email', 255)->nullable();
            $table->string('phone', 32)->nullable();

            $table->unsignedInteger('item_count')->default(0);
            $table->decimal('subtotal', 18, 4)->default('0.0000');
            $table->decimal('discount_amount', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('shipping_amount', 18, 4)->default('0.0000');
            $table->decimal('total_amount', 18, 4)->default('0.0000');

            $table->string('coupon_code', 64)->nullable();
            $table->unsignedBigInteger('price_list_id')->nullable();

            $table->string('status', 32)->default('active'); // active, converted, abandoned, expired
            $table->unsignedBigInteger('converted_sales_order_id')->nullable();

            $table->timestamp('abandoned_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_carts_tenant_id');
            $table->index(['tenant_id', 'storefront_id', 'status', 'last_activity_at'], 'ix_carts_sf_status_activity');

            $table->foreign(['tenant_id', 'storefront_id'], 'fk_carts_storefront')
                ->references(['tenant_id', 'id'])
                ->on('storefronts')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'customer_party_id'], 'fk_carts_customer')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'price_list_id'], 'fk_carts_price_list')
                ->references(['tenant_id', 'id'])
                ->on('price_lists')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'converted_sales_order_id'], 'fk_carts_sales_order')
                ->references(['tenant_id', 'id'])
                ->on('sales_orders')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_carts_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_carts_updated_by')
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
        Schema::dropIfExists('carts');
    }
};
