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
        Schema::create('product_reviews', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('storefront_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('customer_party_id')->nullable();
            $table->unsignedBigInteger('sales_order_id')->nullable(); // set = verified purchase

            $table->string('reviewer_name', 255);
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->string('title', 255)->nullable();
            $table->text('body');

            $table->string('status', 32)->default('pending'); // pending, approved, rejected, spam
            $table->unsignedBigInteger('moderated_by')->nullable();
            $table->timestamp('moderated_at')->nullable();

            $table->unsignedInteger('helpful_count')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_product_reviews_tenant_id');
            $table->index(['tenant_id', 'product_id', 'status'], 'ix_reviews_prod_status');

            $table->foreign(['tenant_id', 'storefront_id'], 'fk_reviews_storefront')
                ->references(['tenant_id', 'id'])
                ->on('storefronts')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_reviews_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'customer_party_id'], 'fk_reviews_customer')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'sales_order_id'], 'fk_reviews_order')
                ->references(['tenant_id', 'id'])
                ->on('sales_orders')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'moderated_by'], 'fk_reviews_moderator')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_reviews_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_reviews_updated_by')
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
        Schema::dropIfExists('product_reviews');
    }
};
