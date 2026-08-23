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
        Schema::create('summary_daily_sales', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('branch_id');
            $table->string('channel', 32); // counter, dealer, phone, field, online
            $table->date('summary_date');

            $table->unsignedInteger('order_count')->default(0);
            $table->decimal('gross_amount', 18, 4)->default('0.0000');
            $table->decimal('discount_amount', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('net_amount', 18, 4)->default('0.0000');
            $table->decimal('returned_amount', 18, 4)->default('0.0000');

            $table->timestamp('refreshed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_sum_daily_sales_tenant_id');
            $table->unique(['tenant_id', 'branch_id', 'channel', 'summary_date'], 'uq_sum_daily_sales_slot');

            $table->foreign(['tenant_id', 'branch_id'], 'fk_sum_daily_sales_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('summary_daily_sales');
    }
};
