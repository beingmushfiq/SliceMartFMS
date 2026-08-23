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
        Schema::create('journal_entries', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id');
            $table->string('entry_number', 64);
            $table->date('entry_date');
            $table->string('entry_type', 32)->default('manual'); // manual, system
            $table->string('source_module', 64)->nullable(); // inventory, sales, purchase, payroll, assets, expenses

            $table->string('reference_type', 64)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();

            $table->text('narration')->nullable();
            $table->decimal('total_debit', 18, 4)->default('0.0000');
            $table->decimal('total_credit', 18, 4)->default('0.0000');

            $table->string('status', 32)->default('draft'); // draft, posted, void

            $table->unsignedBigInteger('posted_by')->nullable();
            $table->timestamp('posted_at')->nullable();

            $table->unsignedBigInteger('voided_by')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->text('void_reason')->nullable();

            $table->unsignedBigInteger('reversal_of_entry_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_journal_entries_tenant_id');
            $table->unique(['tenant_id', 'company_id', 'entry_number'], 'uq_journal_entries_company_num');
            $table->index(['tenant_id', 'entry_date'], 'ix_journal_entries_date');
            $table->index(['tenant_id', 'reference_type', 'reference_id'], 'ix_journal_entries_ref');

            $table->foreign(['tenant_id', 'company_id'], 'fk_journal_entries_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'reversal_of_entry_id'], 'fk_journal_entries_reversal')
                ->references(['tenant_id', 'id'])
                ->on('journal_entries')
                ->restrictOnDelete();

            $table->foreign('posted_by', 'fk_journal_entries_posted_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('voided_by', 'fk_journal_entries_voided_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_journal_entries_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_journal_entries_updated_by')
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
        Schema::dropIfExists('journal_entries');
    }
};
