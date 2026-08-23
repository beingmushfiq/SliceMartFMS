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
        Schema::create('shipping_zones', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('storefront_id');
            $table->string('name', 255);

            $table->string('match_type', 32); // district, city, postcode, country, catch_all
            $table->json('match_values')->nullable();

            $table->string('rate_type', 32); // flat, per_kg, per_item, free_over_amount, courier_quote
            $table->decimal('base_rate', 18, 4);
            $table->decimal('per_unit_rate', 18, 4)->nullable();
            $table->decimal('free_over_amount', 18, 4)->nullable();

            $table->unsignedBigInteger('courier_provider_id')->nullable();

            $table->unsignedSmallInteger('estimated_days_min')->nullable();
            $table->unsignedSmallInteger('estimated_days_max')->nullable();

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_shipping_zones_tenant_id');
            $table->index(['tenant_id', 'storefront_id', 'sort_order'], 'ix_shipping_zones_sf_sort');

            $table->foreign(['tenant_id', 'storefront_id'], 'fk_shipping_zones_storefront')
                ->references(['tenant_id', 'id'])
                ->on('storefronts')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'courier_provider_id'], 'fk_shipping_zones_courier')
                ->references(['tenant_id', 'id'])
                ->on('courier_providers')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_shipping_zones_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_shipping_zones_updated_by')
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
        Schema::dropIfExists('shipping_zones');
    }
};
