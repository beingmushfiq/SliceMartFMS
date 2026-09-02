<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_qc_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name', 128);
            $table->string('code', 64)->nullable();
            $table->text('description')->nullable();
            $table->string('applies_to', 32)->default('production'); // production, receiving, dispatch, generic
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'applies_to'], 'ix_tenant_qc_tpl_applies');
        });

        Schema::create('tenant_qc_checks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('template_id')->constrained('tenant_qc_templates')->cascadeOnDelete();
            $table->string('name', 128);
            $table->text('description')->nullable();
            $table->string('input_type', 32)->default('pass_fail'); // pass_fail, numeric, measurement, text, checklist
            $table->string('expected_value', 128)->nullable();
            $table->string('min_tolerance', 64)->nullable();
            $table->string('max_tolerance', 64)->nullable();
            $table->string('unit', 32)->nullable();
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['template_id', 'sort_order'], 'ix_tenant_qc_checks_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_qc_checks');
        Schema::dropIfExists('tenant_qc_templates');
    }
};
