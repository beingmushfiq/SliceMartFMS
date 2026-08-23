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
        Schema::create('coupons', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('storefront_id')->nullable(); // null = all storefronts
            $table->string('code', 64);
            $table->string('name', 255);

            $table->string('discount_type', 32); // percentage, fixed, free_shipping
            $table->decimal('discount_value', 18, 4);
            $table->decimal('min_order_amount', 18, 4)->nullable();
            $table->decimal('max_discount_amount', 18, 4)->nullable();

            $table->string('applies_to', 32)->default('order'); // order, product, category
            $table->json('applies_to_ids')->nullable();

            $table->unsignedInteger('usage_limit_total')->nullable();
            $table->unsignedInteger('usage_limit_per_customer')->nullable();
            $table->unsignedInteger('used_count')->default(0);

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'code'], 'uq_coupons_code');
            $table->unique(['tenant_id', 'id'], 'uq_coupons_tenant_id');

            $table->foreign(['tenant_id', 'storefront_id'], 'fk_coupons_storefront')
                ->references(['tenant_id', 'id'])
                ->on('storefronts')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_coupons_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_coupons_updated_by')
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
        Schema::dropIfExists('coupons');
    }
};
