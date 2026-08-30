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
        Schema::create('print_profiles', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('name', 128);
            $table->unsignedBigInteger('paper_size_id')->nullable();
            $table->string('orientation', 16)->default('portrait'); // portrait, landscape
            $table->decimal('margin_top_mm', 6, 2)->default(10.00);
            $table->decimal('margin_bottom_mm', 6, 2)->default(10.00);
            $table->decimal('margin_left_mm', 6, 2)->default(10.00);
            $table->decimal('margin_right_mm', 6, 2)->default(10.00);
            $table->decimal('scale', 4, 2)->default(1.00);
            $table->unsignedSmallInteger('copies')->default(1);
            $table->boolean('is_printer_friendly')->default(true);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_print_profiles_tenant_id');
            $table->index(['tenant_id', 'is_active'], 'ix_print_profiles_tenant_active');

            $table->foreign('tenant_id', 'fk_print_profiles_tenant')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            $table->foreign('paper_size_id', 'fk_print_profiles_paper_size')
                ->references('id')
                ->on('paper_sizes')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_print_profiles_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_print_profiles_updated_by')
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
        Schema::dropIfExists('print_profiles');
    }
};
