<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('industry_profiles', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 64)->unique('uq_industry_profiles_key');
            $table->string('label', 128);
            $table->json('business_type_keys')->nullable();
            $table->text('description')->nullable();
            $table->string('icon', 64)->default('Layers');
            $table->json('recommended_modules')->nullable();
            $table->json('default_terminology')->nullable();
            $table->json('default_production_stages')->nullable();
            $table->json('default_units')->nullable();
            $table->json('qc_template_config')->nullable();
            $table->json('default_custom_fields')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('industry_profiles');
    }
};
