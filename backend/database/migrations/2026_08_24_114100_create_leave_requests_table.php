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
        Schema::create('leave_requests', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('request_number', 64);
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('leave_type_id');

            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_days', 8, 4);
            $table->boolean('is_half_day')->default(false);

            $table->text('reason')->nullable();
            $table->unsignedBigInteger('attachment_id')->nullable();
            $table->string('status', 32)->default('draft'); // draft, submitted, approved, rejected, cancelled

            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_leave_requests_tenant_id');
            $table->unique(['tenant_id', 'request_number'], 'uq_leave_requests_number');
            $table->index(['tenant_id', 'employee_id', 'start_date'], 'ix_leave_requests_emp_date');

            $table->foreign(['tenant_id', 'employee_id'], 'fk_leave_requests_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'leave_type_id'], 'fk_leave_requests_type')
                ->references(['tenant_id', 'id'])
                ->on('leave_types')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'attachment_id'], 'fk_leave_requests_attachment')
                ->references(['tenant_id', 'id'])
                ->on('attachments')
                ->restrictOnDelete();

            $table->foreign('approved_by', 'fk_leave_requests_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_leave_requests_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_leave_requests_updated_by')
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
        Schema::dropIfExists('leave_requests');
    }
};
