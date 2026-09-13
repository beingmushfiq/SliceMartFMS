<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_announcements', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('title', 255);
            $table->text('body');

            // Target audiences: all | plan | tenant
            $table->string('target_type', 32)->default('all');
            $table->json('target_ids')->nullable(); // plan IDs or tenant IDs

            // Severity: info | warning | critical
            $table->string('severity', 32)->default('info');

            $table->timestamp('publish_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'publish_at', 'expires_at'], 'ix_plat_announcements_active_window');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_announcements');
    }
};
