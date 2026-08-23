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
        Schema::create('storefront_pages', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('storefront_id');
            $table->string('slug', 128);
            $table->string('title', 255);
            $table->string('page_type', 32)->default('content'); // home, category, content, policy, contact, custom

            $table->json('blocks')->nullable();
            $table->string('meta_title', 255)->nullable();
            $table->text('meta_description')->nullable();

            $table->string('status', 32)->default('draft'); // draft, published
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'storefront_id', 'slug'], 'uq_sf_pages_slug');
            $table->unique(['tenant_id', 'id'], 'uq_storefront_pages_tenant_id');

            $table->foreign(['tenant_id', 'storefront_id'], 'fk_sf_pages_storefront')
                ->references(['tenant_id', 'id'])
                ->on('storefronts')
                ->cascadeOnDelete();

            $table->foreign('created_by', 'fk_sf_pages_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_sf_pages_updated_by')
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
        Schema::dropIfExists('storefront_pages');
    }
};
