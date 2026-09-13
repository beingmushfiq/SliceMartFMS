<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_roles', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name', 128);
            $table->string('slug', 64)->unique();
            $table->text('description')->nullable();
            $table->json('permissions'); // Array of permission slug strings
            $table->boolean('is_system')->default(false); // System roles cannot be deleted

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('platform_role_user', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('platform_role_id')->constrained('platform_roles')->cascadeOnDelete();
            $table->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('granted_at')->useCurrent();

            $table->unique(['user_id', 'platform_role_id'], 'uq_plat_role_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_role_user');
        Schema::dropIfExists('platform_roles');
    }
};
