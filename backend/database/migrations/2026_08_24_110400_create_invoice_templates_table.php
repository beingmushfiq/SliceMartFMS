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
        Schema::create('invoice_templates', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('company_id')->nullable();
            $table->string('name', 255);
            $table->string('type', 32)->default('invoice'); // invoice, receipt, delivery_note, purchase_order, quotation, payslip
            $table->string('paper_size', 32)->default('a4'); // a4, a5, letter, thermal_80, thermal_58
            $table->string('orientation', 16)->default('portrait'); // portrait, landscape

            $table->json('definition'); // JSON shape: list of positioned elements
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('version')->default(1);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_invoice_templates_tenant_id');
            $table->unique(['tenant_id', 'type', 'name'], 'uq_invoice_templates_type_name');

            $table->foreign(['tenant_id', 'company_id'], 'fk_invoice_templates_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_invoice_templates_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_invoice_templates_updated_by')
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
        Schema::dropIfExists('invoice_templates');
    }
};
