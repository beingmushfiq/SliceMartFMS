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
        Schema::create('storefront_products', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('storefront_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();

            $table->string('display_name_override', 255)->nullable();
            $table->text('description_override')->nullable();
            $table->decimal('price_override', 18, 4)->nullable();
            $table->decimal('compare_at_price', 18, 4)->nullable();

            $table->boolean('is_featured')->default(false);
            $table->boolean('is_available')->default(true);
            $table->string('sold_out_behaviour', 32)->default('show_sold_out'); // hide, show_sold_out, allow_backorder

            $table->string('seo_slug', 128);
            $table->unsignedInteger('sort_order')->default(0);

            $table->unsignedBigInteger('variant_key')->virtualAs('COALESCE(variant_id, 0)');

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_storefront_products_tenant_id');
            $table->unique(['tenant_id', 'storefront_id', 'product_id', 'variant_key'], 'uq_sf_products_slot');
            $table->unique(['tenant_id', 'storefront_id', 'seo_slug'], 'uq_sf_products_seo_slug');

            $table->foreign(['tenant_id', 'storefront_id'], 'fk_sf_products_storefront')
                ->references(['tenant_id', 'id'])
                ->on('storefronts')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_sf_products_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_sf_products_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_sf_products_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_sf_products_updated_by')
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
        Schema::dropIfExists('storefront_products');
    }
};
