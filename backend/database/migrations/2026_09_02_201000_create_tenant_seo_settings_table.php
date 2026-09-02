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
        Schema::create('tenant_seo_settings', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');
            $table->unsignedBigInteger('storefront_id')->nullable();

            // Brand & Meta Defaults
            $table->string('meta_title_template', 255)->default('{title} | {brand}');
            $table->string('product_title_template', 255)->default('{product_name} | {brand}');
            $table->string('category_title_template', 255)->default('Buy {category_name} Online | {brand}');
            $table->string('default_meta_title', 255)->nullable();
            $table->text('default_meta_description')->nullable();
            $table->string('default_og_image', 512)->nullable();
            $table->string('twitter_card_type', 32)->default('summary_large_image');
            $table->string('twitter_handle', 64)->nullable();

            // Robots & Indexing
            $table->boolean('indexing_enabled')->default(true);
            $table->boolean('allow_ai_search_crawlers')->default(true); // GPTBot, PerplexityBot, ClaudeBot
            $table->boolean('allow_ai_training_crawlers')->default(true); // CCBot, Google-Extended
            $table->text('custom_robots_txt_append')->nullable();

            // Sitemaps
            $table->boolean('sitemap_enabled')->default(true);
            $table->boolean('sitemap_include_images')->default(true);
            $table->string('sitemap_changefreq_products', 32)->default('daily');
            $table->string('sitemap_changefreq_pages', 32)->default('weekly');

            // Structured Data & LocalBusiness (AEO / GEO / Entity consistency)
            $table->string('business_type', 64)->default('Organization'); // Organization, LocalBusiness, Store, Factory
            $table->string('legal_name', 255)->nullable();
            $table->string('brand_name', 255)->nullable();
            $table->string('logo_url', 512)->nullable();
            $table->string('telephone', 64)->nullable();
            $table->string('email', 128)->nullable();
            $table->string('street_address', 255)->nullable();
            $table->string('address_locality', 128)->nullable(); // City
            $table->string('address_region', 128)->nullable(); // State / Division
            $table->string('postal_code', 32)->nullable();
            $table->string('address_country', 32)->default('BD');
            $table->decimal('geo_latitude', 10, 7)->nullable();
            $table->decimal('geo_longitude', 10, 7)->nullable();
            $table->json('opening_hours')->nullable(); // [{"days":["Monday","Tuesday"],"opens":"09:00","closes":"18:00"}]
            $table->string('price_range', 16)->default('$$');

            // Social Entity sameAs links
            $table->json('social_profiles')->nullable(); // {"facebook":"","instagram":"","linkedin":"","youtube":"","tiktok":"","x":"","whatsapp":""}

            // Webmaster & Search Engine Verification
            $table->string('google_site_verification', 255)->nullable();
            $table->string('bing_site_verification', 255)->nullable();
            $table->string('google_analytics_id', 64)->nullable(); // G-XXXXXXXXXX
            $table->string('google_tag_manager_id', 64)->nullable(); // GTM-XXXXXXX
            $table->string('indexnow_api_key', 128)->nullable();

            // International / Multilingual
            $table->string('default_locale', 16)->default('en_US');
            $table->json('supported_locales')->nullable(); // ["en_US", "bn_BD"]

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id'], 'uq_tenant_seo_settings_tenant');

            $table->foreign('tenant_id', 'fk_tenant_seo_settings_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_seo_settings');
    }
};
