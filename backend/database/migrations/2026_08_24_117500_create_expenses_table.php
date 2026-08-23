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
        Schema::create('expenses', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('expense_number', 64);
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('expense_category_id');
            $table->date('expense_date');

            $table->string('payee_type', 32); // party, employee, other
            $table->unsignedBigInteger('payee_id')->nullable();
            $table->string('payee_name', 255); // snapshot label

            $table->text('description')->nullable();
            $table->decimal('amount', 18, 4);
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('total_amount', 18, 4);

            $table->string('payment_method', 32); // cash, bank, mobile_wallet, credit, cheque
            $table->unsignedBigInteger('bank_account_id')->nullable();
            $table->string('reference_number', 128)->nullable();
            $table->unsignedBigInteger('attachment_id')->nullable();

            $table->string('status', 32)->default('draft'); // draft, submitted, approved, rejected, paid, void
            $table->unsignedBigInteger('submitted_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->unsignedBigInteger('journal_entry_id')->nullable();
            $table->string('cost_center_code', 64)->nullable();

            $table->string('related_module', 64)->nullable();
            $table->string('related_reference_type', 64)->nullable();
            $table->unsignedBigInteger('related_reference_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_expenses_tenant_id');
            $table->unique(['tenant_id', 'expense_number'], 'uq_expenses_number');
            $table->index(['tenant_id', 'expense_date', 'status'], 'ix_expenses_date_status');

            $table->foreign(['tenant_id', 'company_id'], 'fk_expenses_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_expenses_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'expense_category_id'], 'fk_expenses_category')
                ->references(['tenant_id', 'id'])
                ->on('expense_categories')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'bank_account_id'], 'fk_expenses_bank_account')
                ->references(['tenant_id', 'id'])
                ->on('bank_accounts')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'attachment_id'], 'fk_expenses_attachment')
                ->references(['tenant_id', 'id'])
                ->on('attachments')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'journal_entry_id'], 'fk_expenses_journal_entry')
                ->references(['tenant_id', 'id'])
                ->on('journal_entries')
                ->restrictOnDelete();

            $table->foreign('submitted_by', 'fk_expenses_submitted_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('approved_by', 'fk_expenses_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_expenses_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_expenses_updated_by')
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
        Schema::dropIfExists('expenses');
    }
};
