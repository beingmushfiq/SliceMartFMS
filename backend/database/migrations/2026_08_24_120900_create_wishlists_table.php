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
        Schema::create('wishlists', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('storefront_id');
            $table->unsignedBigInteger('customer_party_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();

            $table->unsignedBigInteger('variant_key')->virtualAs('COALESCE(variant_id, 0)');
            $table->timestamp('added_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_wishlists_tenant_id');
            $table->unique(['tenant_id', 'storefront_id', 'customer_party_id', 'product_id', 'variant_key'], 'uq_wishlists_slot');

            $table->foreign(['tenant_id', 'storefront_id'], 'fk_wishlists_storefront')
                ->references(['tenant_id', 'id'])
                ->on('storefronts')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'customer_party_id'], 'fk_wishlists_customer')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_wishlists_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'variant_id'], 'fk_wishlists_variant')
                ->references(['tenant_id', 'id'])
                ->on('product_variants')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishlists');
    }
};
