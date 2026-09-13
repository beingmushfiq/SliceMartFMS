<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Enhance tenant_subscriptions table
        Schema::table('tenant_subscriptions', function (Blueprint $table): void {
            $table->char('currency_code', 3)->default('BDT')->after('amount');
            $table->string('billing_cycle', 32)->default('monthly')->after('currency_code');
            $table->unsignedSmallInteger('grace_period_days')->default(7)->after('billing_cycle');
            $table->timestamp('grace_period_ends_at')->nullable()->after('ends_at');
            $table->boolean('auto_renew')->default(false)->after('grace_period_ends_at');
            $table->string('discount_type', 32)->default('none')->after('auto_renew');
            $table->decimal('discount_value', 18, 4)->default(0)->after('discount_type');
            $table->text('notes')->nullable()->after('external_reference');
            $table->foreignId('renewed_by')->nullable()->constrained('users')->nullOnDelete()->after('updated_by');

            $table->index(['tenant_id', 'ends_at', 'status'], 'ix_tenant_subs_tenant_ends_status');
        });

        // 2. Add archived_at to tenants table
        Schema::table('tenants', function (Blueprint $table): void {
            $table->timestamp('archived_at')->nullable()->after('suspended_at');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn('archived_at');
        });

        Schema::table('tenant_subscriptions', function (Blueprint $table): void {
            $table->dropIndex('ix_tenant_subs_tenant_ends_status');
            $table->dropConstrainedForeignId('renewed_by');
            $table->dropColumn([
                'currency_code',
                'billing_cycle',
                'grace_period_days',
                'grace_period_ends_at',
                'auto_renew',
                'discount_type',
                'discount_value',
                'notes',
            ]);
        });
    }
};
