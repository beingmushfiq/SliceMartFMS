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
        Schema::create('asset_categories', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('code', 64);
            $table->string('name', 255);
            $table->unsignedBigInteger('parent_id')->nullable();

            $table->string('default_depreciation_method', 32)->default('straight_line'); // none, straight_line, declining_balance
            $table->unsignedInteger('default_useful_life_months')->default(60);
            $table->decimal('default_salvage_percentage', 8, 4)->default('0.0000');
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_asset_categories_tenant_id');
            $table->unique(['tenant_id', 'code'], 'uq_asset_categories_code');

            $table->foreign(['tenant_id', 'parent_id'], 'fk_asset_categories_parent')
                ->references(['tenant_id', 'id'])
                ->on('asset_categories')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_asset_categories_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_asset_categories_updated_by')
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
        Schema::dropIfExists('asset_categories');
    }
};
