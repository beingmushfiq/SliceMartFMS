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
        Schema::create('leave_types', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('code', 64);
            $table->string('name', 255);
            $table->boolean('is_paid')->default(true);
            $table->decimal('annual_quota_days', 8, 4)->default('0.0000');

            $table->string('accrual_method', 32)->default('none'); // none, monthly, yearly, on_join
            $table->boolean('carry_forward_allowed')->default(false);
            $table->decimal('max_carry_forward_days', 8, 4)->default('0.0000');
            $table->boolean('requires_attachment')->default(false);
            $table->unsignedInteger('min_notice_days')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_leave_types_tenant_id');
            $table->unique(['tenant_id', 'code'], 'uq_leave_types_code');

            $table->foreign('created_by', 'fk_leave_types_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_leave_types_updated_by')
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
        Schema::dropIfExists('leave_types');
    }
};
