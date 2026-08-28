<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_fraud_assessments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->unsignedSmallInteger('risk_score')->default(0); // 0 - 100
            $table->string('risk_level', 32)->default('low'); // low, medium, high, critical
            $table->json('risk_factors')->nullable(); // list of triggered risk indicators
            $table->string('verification_status', 32)->default('pending_review'); // pending_review, verified, on_hold, rejected
            $table->json('verification_checklist')->nullable();
            $table->text('verification_notes')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'sales_order_id']);
            $table->index(['tenant_id', 'verification_status']);
            $table->index(['tenant_id', 'risk_level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_fraud_assessments');
    }
};
