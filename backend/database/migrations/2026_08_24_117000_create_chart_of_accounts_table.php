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
        Schema::create('chart_of_accounts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id');
            $table->string('account_code', 64);
            $table->string('name', 255);
            $table->string('account_type', 32); // asset, liability, equity, income, expense
            $table->string('account_subtype', 64); // cash, bank, receivable, inventory, fixed_asset, payable, tax, capital, sales, other_income, cogs, payroll, depreciation, operating_expense

            $table->unsignedBigInteger('parent_id')->nullable();
            $table->boolean('is_group')->default(false);
            $table->string('normal_balance', 16)->default('debit'); // debit, credit
            $table->boolean('is_system')->default(false); // cannot be deleted
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_chart_of_accounts_tenant_id');
            $table->unique(['tenant_id', 'company_id', 'account_code'], 'uq_coa_company_code');

            $table->foreign(['tenant_id', 'company_id'], 'fk_coa_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'parent_id'], 'fk_coa_parent')
                ->references(['tenant_id', 'id'])
                ->on('chart_of_accounts')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_coa_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_coa_updated_by')
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
        Schema::dropIfExists('chart_of_accounts');
    }
};
