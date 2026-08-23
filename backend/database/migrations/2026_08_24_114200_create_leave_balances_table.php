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
        Schema::create('leave_balances', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('leave_type_id');
            $table->unsignedSmallInteger('year');

            $table->decimal('opening_days', 8, 4)->default('0.0000');
            $table->decimal('accrued_days', 8, 4)->default('0.0000');
            $table->decimal('used_days', 8, 4)->default('0.0000');
            $table->decimal('carried_forward_days', 8, 4)->default('0.0000');
            $table->decimal('balance_days', 8, 4)->default('0.0000'); // derived transactional cache

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_leave_balances_tenant_id');
            $table->unique(['tenant_id', 'employee_id', 'leave_type_id', 'year'], 'uq_leave_balances_slot');

            $table->foreign(['tenant_id', 'employee_id'], 'fk_leave_balances_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'leave_type_id'], 'fk_leave_balances_type')
                ->references(['tenant_id', 'id'])
                ->on('leave_types')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_leave_balances_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_leave_balances_updated_by')
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
        Schema::dropIfExists('leave_balances');
    }
};
