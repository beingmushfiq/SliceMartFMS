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
        Schema::create('crm_activities', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('subject_type', 32); // lead, party
            $table->unsignedBigInteger('subject_id');
            $table->string('type', 32); // call, visit, email, sms, note, task
            $table->string('title', 255);
            $table->text('description')->nullable();

            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('outcome')->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_crm_activities_tenant_id');
            $table->index(['tenant_id', 'subject_type', 'subject_id'], 'ix_crm_activities_subject');
            $table->index(['tenant_id', 'assigned_to', 'due_at'], 'ix_crm_activities_assigned_due');

            $table->foreign('assigned_to', 'fk_crm_activities_assigned_to')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_crm_activities_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_crm_activities_updated_by')
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
        Schema::dropIfExists('crm_activities');
    }
};
