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
        Schema::create('tenant_domains', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid')->unique();

            // The fully qualified domain name, e.g. "slicemart.tech" or "slicemart.devcenterpoint.com"
            $table->string('domain', 255)->unique();

            // platform_subdomain, custom_primary, custom_alias
            $table->string('type', 32)->default('custom_alias');
            $table->boolean('is_primary')->default(false);

            // dns_txt, cname, a_record
            $table->string('verification_method', 32)->default('dns_txt');
            $table->string('verification_token', 128)->nullable();

            // pending, verified, failed
            $table->string('verification_status', 32)->default('pending');

            // pending, active, failed, not_required
            $table->string('ssl_status', 32)->default('pending');

            $table->json('dns_records_expected')->nullable();
            $table->json('dns_records_found')->nullable();

            $table->timestamp('verified_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('dns_last_checked_at')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'is_primary'], 'ix_tenant_domains_tenant_primary');
            $table->index(['tenant_id', 'verification_status'], 'ix_tenant_domains_tenant_status');
            $table->index('verification_token', 'ix_tenant_domains_token');

            $table->foreign('tenant_id', 'fk_tenant_domains_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            $table->foreign('created_by', 'fk_tenant_domains_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_tenant_domains_updated_by')
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
        Schema::dropIfExists('tenant_domains');
    }
};
