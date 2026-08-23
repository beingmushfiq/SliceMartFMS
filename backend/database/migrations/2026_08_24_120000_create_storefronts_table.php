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
        Schema::create('storefronts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('code', 64);
            $table->string('name', 255);
            $table->string('domain', 255)->nullable()->unique('uq_storefronts_domain');
            $table->string('subdomain', 64)->unique('uq_storefronts_subdomain');

            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('default_branch_id');
            $table->unsignedBigInteger('default_warehouse_id');
            $table->unsignedBigInteger('price_list_id')->nullable();

            $table->string('currency', 3)->default('BDT');
            $table->string('locale', 8)->default('en'); // en, bn

            $table->json('theme')->nullable();
            $table->unsignedBigInteger('logo_attachment_id')->nullable();
            $table->unsignedBigInteger('favicon_attachment_id')->nullable();

            $table->string('meta_title', 255)->nullable();
            $table->text('meta_description')->nullable();

            $table->boolean('guest_checkout_enabled')->default(true);
            $table->boolean('cod_enabled')->default(true);
            $table->boolean('online_payment_enabled')->default(true);
            $table->decimal('min_order_amount', 18, 4)->nullable();

            $table->string('status', 32)->default('draft'); // draft, live, maintenance, suspended
            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'code'], 'uq_storefronts_code');
            $table->unique(['tenant_id', 'id'], 'uq_storefronts_tenant_id');

            $table->foreign(['tenant_id', 'company_id'], 'fk_storefronts_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'default_branch_id'], 'fk_storefronts_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'default_warehouse_id'], 'fk_storefronts_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'price_list_id'], 'fk_storefronts_price_list')
                ->references(['tenant_id', 'id'])
                ->on('price_lists')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'logo_attachment_id'], 'fk_storefronts_logo')
                ->references(['tenant_id', 'id'])
                ->on('attachments')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'favicon_attachment_id'], 'fk_storefronts_favicon')
                ->references(['tenant_id', 'id'])
                ->on('attachments')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_storefronts_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_storefronts_updated_by')
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
        Schema::dropIfExists('storefronts');
    }
};
