<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_field_definitions', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid');
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('module', 64);
            $table->string('entity', 64);
            $table->string('internal_key', 64);
            $table->string('label', 128);
            $table->string('field_type', 32); // text, textarea, number, currency, percentage, date, datetime, time, select, multi_select, radio, checkbox, toggle, file, image, url, email, phone, barcode, qr
            $table->json('options')->nullable();
            $table->json('validation_rules')->nullable();
            $table->boolean('is_required')->default(false);
            $table->json('default_value')->nullable();
            $table->string('placeholder', 255)->nullable();
            $table->text('help_text')->nullable();
            $table->json('visibility_rules')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_archived')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique('uuid', 'uq_custom_fields_uuid');
            $table->unique(['tenant_id', 'module', 'entity', 'internal_key'], 'uq_custom_fields_tenant_entity_key');
            $table->index(['tenant_id', 'module', 'entity', 'is_active'], 'ix_custom_fields_tenant_entity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_field_definitions');
    }
};
