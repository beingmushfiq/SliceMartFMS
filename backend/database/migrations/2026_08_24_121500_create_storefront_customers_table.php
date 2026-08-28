<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('storefront_customers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('storefront_id')->constrained('storefronts')->cascadeOnDelete();
            $table->foreignId('party_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name', 255);
            $table->string('email', 255)->nullable();
            $table->string('phone', 32);
            $table->string('password_hash', 255);
            $table->string('status', 32)->default('active'); // active, suspended
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'storefront_id', 'phone']);
            $table->index(['tenant_id', 'storefront_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storefront_customers');
    }
};
