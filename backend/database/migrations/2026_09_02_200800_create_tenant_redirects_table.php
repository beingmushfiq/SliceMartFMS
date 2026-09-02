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
        Schema::create('tenant_redirects', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');
            $table->unsignedBigInteger('storefront_id')->nullable();

            $table->string('source_path', 512); // e.g. /old-product-slug or /collections/old-category
            $table->string('target_path', 512); // e.g. /products/new-product-slug
            $table->unsignedSmallInteger('status_code')->default(301); // 301, 302, 307, 308
            $table->boolean('is_active')->default(true);
            $table->string('match_type', 32)->default('exact'); // exact, prefix, regex
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('hit_count')->default(0);
            $table->timestamp('last_hit_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->index(['tenant_id', 'source_path'], 'ix_tenant_redirects_source');
            $table->index(['tenant_id', 'is_active'], 'ix_tenant_redirects_active');
            $table->unique(['tenant_id', 'source_path'], 'uq_tenant_redirects_tenant_source');

            $table->foreign('tenant_id', 'fk_tenant_redirects_tenant')
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
        Schema::dropIfExists('tenant_redirects');
    }
};
