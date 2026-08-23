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
        Schema::create('qc_parameters', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('product_id')->nullable();
            $table->string('name', 128);
            $table->string('type', 32); // numeric, boolean, select, text
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->decimal('min_value', 18, 4)->nullable();
            $table->decimal('max_value', 18, 4)->nullable();
            $table->json('options')->nullable();
            $table->tinyInteger('is_mandatory')->default(1);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_qc_parameters_tenant_id');
            $table->index(['tenant_id', 'product_id'], 'ix_qc_parameters_tenant_product');

            $table->foreign(['tenant_id', 'product_id'], 'fk_qc_parameters_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_qc_parameters_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_qc_parameters_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_qc_parameters_updated_by')
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
        Schema::dropIfExists('qc_parameters');
    }
};
