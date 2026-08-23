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
        Schema::create('crm_leads', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('lead_number', 64);
            $table->string('name', 255);
            $table->string('company_name', 255)->nullable();
            $table->string('phone', 64)->nullable();
            $table->string('email', 255)->nullable();

            $table->string('source', 32)->default('walk_in'); // walk_in, phone, referral, online, field_visit, other
            $table->string('stage', 32)->default('new'); // new, contacted, qualified, proposal, won, lost
            $table->unsignedBigInteger('assigned_to')->nullable();

            $table->decimal('expected_value', 18, 4)->default('0.0000');
            $table->date('expected_close_date')->nullable();
            $table->unsignedBigInteger('lost_reason_id')->nullable();

            $table->unsignedBigInteger('converted_party_id')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_crm_leads_tenant_id');
            $table->unique(['tenant_id', 'lead_number'], 'uq_crm_leads_number');
            $table->index(['tenant_id', 'stage'], 'ix_crm_leads_stage');
            $table->index(['tenant_id', 'assigned_to'], 'ix_crm_leads_assigned');

            $table->foreign(['tenant_id', 'lost_reason_id'], 'fk_crm_leads_lost_reason')
                ->references(['tenant_id', 'id'])
                ->on('reason_codes')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'converted_party_id'], 'fk_crm_leads_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign('assigned_to', 'fk_crm_leads_assigned_to')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_crm_leads_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_crm_leads_updated_by')
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
        Schema::dropIfExists('crm_leads');
    }
};
