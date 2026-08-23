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
        Schema::create('invoices', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('invoice_number', 64);
            $table->unsignedBigInteger('sales_order_id')->nullable();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('party_id')->nullable(); // nullable for cash/walk-in

            $table->date('invoice_date');
            $table->date('due_date')->nullable();

            $table->decimal('subtotal', 18, 4)->default('0.0000');
            $table->decimal('discount_amount', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('shipping_amount', 18, 4)->default('0.0000');
            $table->decimal('round_off', 18, 4)->default('0.0000');
            $table->decimal('total_amount', 18, 4)->default('0.0000');
            $table->decimal('paid_amount', 18, 4)->default('0.0000');

            $table->string('status', 32)->default('draft'); // draft, posted, partially_paid, paid, void
            $table->unsignedBigInteger('invoice_template_id')->nullable();
            $table->integer('printed_count')->default(0);

            $table->unsignedBigInteger('posted_by')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->unsignedBigInteger('voided_by')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->text('void_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_invoices_tenant_id');
            $table->unique(['tenant_id', 'invoice_number'], 'uq_invoices_number');
            $table->index(['tenant_id', 'party_id', 'invoice_date'], 'ix_invoices_party_date');
            $table->index(['tenant_id', 'status'], 'ix_invoices_status');

            $table->foreign(['tenant_id', 'sales_order_id'], 'fk_invoices_so')
                ->references(['tenant_id', 'id'])
                ->on('sales_orders')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'company_id'], 'fk_invoices_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_invoices_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'party_id'], 'fk_invoices_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'invoice_template_id'], 'fk_invoices_template')
                ->references(['tenant_id', 'id'])
                ->on('invoice_templates')
                ->restrictOnDelete();

            $table->foreign('posted_by', 'fk_invoices_posted_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('voided_by', 'fk_invoices_voided_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_invoices_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_invoices_updated_by')
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
        Schema::dropIfExists('invoices');
    }
};
