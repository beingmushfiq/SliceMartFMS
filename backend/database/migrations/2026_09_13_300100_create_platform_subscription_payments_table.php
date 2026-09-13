<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_subscription_payments', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('tenant_subscriptions')->nullOnDelete();

            $table->string('invoice_reference', 64)->unique();
            $table->decimal('amount', 18, 4);
            $table->char('currency_code', 3)->default('BDT');
            $table->string('payment_method', 64)->nullable(); // e.g. bank_transfer, bKash, cash, stripe, nagad, rocket
            $table->string('transaction_reference', 191)->nullable();
            $table->date('payment_date');
            $table->date('billing_period_start')->nullable();
            $table->date('billing_period_end')->nullable();

            // paid | pending | failed | refunded
            $table->string('status', 32)->default('paid');
            $table->text('notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'payment_date'], 'ix_plat_sub_pay_tenant_date');
            $table->index(['status', 'payment_date'], 'ix_plat_sub_pay_status_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_subscription_payments');
    }
};
