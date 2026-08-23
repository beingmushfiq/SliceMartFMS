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
        Schema::create('journal_lines', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('journal_entry_id');
            $table->unsignedBigInteger('account_id');

            $table->decimal('debit_amount', 18, 4)->default('0.0000');
            $table->decimal('credit_amount', 18, 4)->default('0.0000');

            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('cost_center_code', 64)->nullable();
            $table->unsignedBigInteger('party_id')->nullable();

            $table->text('narration')->nullable();
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_journal_lines_tenant_id');
            $table->index(['tenant_id', 'account_id'], 'ix_journal_lines_account');
            $table->index(['tenant_id', 'journal_entry_id'], 'ix_journal_lines_entry');

            $table->foreign(['tenant_id', 'journal_entry_id'], 'fk_journal_lines_entry')
                ->references(['tenant_id', 'id'])
                ->on('journal_entries')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'account_id'], 'fk_journal_lines_account')
                ->references(['tenant_id', 'id'])
                ->on('chart_of_accounts')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_journal_lines_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'party_id'], 'fk_journal_lines_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_journal_lines_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_journal_lines_updated_by')
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
        Schema::dropIfExists('journal_lines');
    }
};
