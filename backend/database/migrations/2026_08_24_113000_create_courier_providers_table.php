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
        Schema::create('courier_providers', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable(); // NULL = platform-provided provider definition
            $table->uuid('uuid');

            $table->string('code', 64); // pathao, steadfast, redx, paperfly, ecourier, custom
            $table->string('name', 255);
            $table->string('adapter_class', 255);
            $table->boolean('is_active')->default(true);

            $table->text('credentials')->nullable(); // encrypted JSON credentials
            $table->json('capabilities')->nullable();
            $table->string('webhook_secret', 255)->nullable();
            $table->decimal('default_charge', 18, 4)->default('0.0000');
            $table->json('settings')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_courier_providers_tenant_id');
            $table->unique(['tenant_id', 'code'], 'uq_courier_providers_tenant_code');
            $table->index('is_active', 'ix_courier_providers_active');

            $table->foreign('created_by', 'fk_courier_providers_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_courier_providers_updated_by')
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
        Schema::dropIfExists('courier_providers');
    }
};
