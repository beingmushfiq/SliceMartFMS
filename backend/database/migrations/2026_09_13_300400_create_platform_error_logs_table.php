<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_error_logs', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('fingerprint', 64)->index(); // SHA256 / MD5 hash of error signature for deduplication

            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();

            $table->string('error_type', 128); // Exception class or error code
            $table->text('message');
            $table->mediumText('stack_trace')->nullable();

            // info | warning | error | critical
            $table->string('severity', 32)->default('error');

            $table->string('module', 64)->nullable();
            $table->string('route', 255)->nullable();
            $table->uuid('request_id')->nullable();
            $table->uuid('correlation_id')->nullable()->index();

            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->string('browser', 128)->nullable();
            $table->string('environment', 32)->default('production');

            // open | investigating | resolved | ignored
            $table->string('status', 32)->default('open');
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_note')->nullable();

            $table->unsignedInteger('occurrence_count')->default(1);
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['status', 'severity', 'last_seen_at'], 'ix_plat_errors_status_sev_time');
            $table->index(['tenant_id', 'last_seen_at'], 'ix_plat_errors_tenant_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_error_logs');
    }
};
