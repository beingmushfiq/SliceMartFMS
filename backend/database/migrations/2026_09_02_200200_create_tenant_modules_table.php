<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_modules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('module_key', 64);
            $table->boolean('enabled')->default(true);
            $table->boolean('plan_allowed')->default(true);
            $table->json('config')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'module_key'], 'uq_tenant_modules_tenant_key');
            $table->index(['tenant_id', 'enabled'], 'ix_tenant_modules_tenant_enabled');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_modules');
    }
};
