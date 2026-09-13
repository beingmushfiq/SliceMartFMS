<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_support_tickets', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('ticket_number', 32)->unique(); // e.g. TKT-202609-0001
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();

            $table->string('title', 255);
            $table->text('description');

            // Category: billing | technical | bug | feature_request | general
            $table->string('category', 64)->default('technical');

            // Priority: low | medium | high | urgent
            $table->string('priority', 32)->default('medium');

            // Status: open | in_progress | waiting_tenant | resolved | closed
            $table->string('status', 32)->default('open');

            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status'], 'ix_plat_tickets_tenant_status');
            $table->index(['status', 'priority'], 'ix_plat_tickets_status_priority');
        });

        Schema::create('platform_support_ticket_notes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ticket_id')->constrained('platform_support_tickets')->cascadeOnDelete();
            $table->text('note');
            $table->boolean('is_internal')->default(true); // true = platform staff only, false = visible to tenant

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_support_ticket_notes');
        Schema::dropIfExists('platform_support_tickets');
    }
};
