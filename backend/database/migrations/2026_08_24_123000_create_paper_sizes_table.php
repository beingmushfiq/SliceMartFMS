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
        Schema::create('paper_sizes', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable(); // Nullable for global platform built-ins
            $table->uuid('uuid');

            $table->string('code', 64);
            $table->string('name', 128);
            $table->decimal('width_mm', 8, 2);
            $table->decimal('height_mm', 8, 2)->nullable(); // Nullable for continuous roll (thermal POS)
            $table->string('unit', 16)->default('mm'); // mm, inch
            $table->string('orientation_default', 16)->default('portrait'); // portrait, landscape
            $table->decimal('margin_top_mm', 6, 2)->default(10.00);
            $table->decimal('margin_bottom_mm', 6, 2)->default(10.00);
            $table->decimal('margin_left_mm', 6, 2)->default(10.00);
            $table->decimal('margin_right_mm', 6, 2)->default(10.00);

            $table->boolean('is_builtin')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->index(['tenant_id', 'is_active'], 'ix_paper_sizes_tenant_active');
            $table->index('code', 'ix_paper_sizes_code');

            $table->foreign('tenant_id', 'fk_paper_sizes_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            $table->foreign('created_by', 'fk_paper_sizes_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_paper_sizes_updated_by')
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
        Schema::dropIfExists('paper_sizes');
    }
};
