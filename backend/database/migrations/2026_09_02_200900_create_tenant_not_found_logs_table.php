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
        Schema::create('tenant_not_found_logs', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('path', 512); // e.g. /broken-link-sample
            $table->string('referrer', 512)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->unsignedBigInteger('hit_count')->default(1);
            $table->timestamp('first_seen_at')->useCurrent();
            $table->timestamp('last_seen_at')->useCurrent();
            $table->boolean('is_resolved')->default(false);
            $table->unsignedBigInteger('resolved_redirect_id')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'path'], 'ix_not_found_tenant_path');
            $table->index(['tenant_id', 'is_resolved', 'hit_count'], 'ix_not_found_resolved_hits');

            $table->foreign('tenant_id', 'fk_not_found_logs_tenant')
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
        Schema::dropIfExists('tenant_not_found_logs');
    }
};
