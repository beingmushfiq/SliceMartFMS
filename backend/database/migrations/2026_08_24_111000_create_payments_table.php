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
        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('payment_number', 64);
            $table->string('direction', 16); // in (receipt), out (payment)
            $table->unsignedBigInteger('party_id')->nullable();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();

            $table->date('payment_date');
            $table->string('method', 32); // cash, bank_transfer, cheque, card, mobile_banking, credit_adjustment
            $table->unsignedBigInteger('bank_account_id')->nullable();
            $table->string('reference_number', 128)->nullable();

            $table->decimal('amount', 18, 4);
            $table->decimal('allocated_amount', 18, 4)->default('0.0000');
            $table->decimal('unallocated_amount', 18, 4)->default('0.0000');
            $table->string('currency_code', 3)->default('USD');

            $table->string('status', 32)->default('draft'); // draft, posted, bounced, cancelled
            $table->unsignedBigInteger('received_by')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_payments_tenant_id');
            $table->unique(['tenant_id', 'payment_number'], 'uq_payments_number');
            $table->index(['tenant_id', 'party_id', 'payment_date'], 'ix_payments_party_date');
            $table->index(['tenant_id', 'status'], 'ix_payments_status');

            $table->foreign(['tenant_id', 'party_id'], 'fk_payments_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'company_id'], 'fk_payments_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_payments_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign('received_by', 'fk_payments_received_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_payments_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_payments_updated_by')
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
        Schema::dropIfExists('payments');
    }
};
