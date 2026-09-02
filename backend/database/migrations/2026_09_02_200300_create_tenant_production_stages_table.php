<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_production_stages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('key', 64);
            $table->string('label', 128);
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_qc_stage')->default(false);
            $table->boolean('requires_worker_tracking')->default(true);
            $table->boolean('requires_machine_tracking')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'key'], 'uq_tenant_prod_stages_tenant_key');
            $table->index(['tenant_id', 'sort_order'], 'ix_tenant_prod_stages_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_production_stages');
    }
};
