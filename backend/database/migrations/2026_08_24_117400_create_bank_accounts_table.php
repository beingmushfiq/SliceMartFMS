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
        Schema::create('bank_accounts', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id');
            $table->string('code', 64);
            $table->string('name', 255);
            $table->string('account_type', 32); // cash, bank, mobile_wallet

            $table->string('bank_name', 128)->nullable();
            $table->string('account_number', 64)->nullable();
            $table->string('branch_name', 128)->nullable();
            $table->string('currency', 8)->default('BDT');

            $table->unsignedBigInteger('chart_of_account_id');
            $table->decimal('opening_balance', 18, 4)->default('0.0000');
            $table->decimal('current_balance', 18, 4)->default('0.0000'); // cache

            $table->boolean('is_default_for_pos')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_bank_accounts_tenant_id');
            $table->unique(['tenant_id', 'company_id', 'code'], 'uq_bank_accounts_company_code');

            $table->foreign(['tenant_id', 'company_id'], 'fk_bank_accounts_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'chart_of_account_id'], 'fk_bank_accounts_coa')
                ->references(['tenant_id', 'id'])
                ->on('chart_of_accounts')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_bank_accounts_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_bank_accounts_updated_by')
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
        Schema::dropIfExists('bank_accounts');
    }
};
