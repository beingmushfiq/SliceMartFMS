<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Wave 10 — Production Plan Items
     * Implements ADR-011 / DATABASE_DESIGN.md §5 Group D.
     */
    public function up(): void
    {
        Schema::create('production_plan_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');
            $table->foreignId('production_plan_id');
            $table->foreignId('product_id');
            $table->foreignId('bill_of_material_id');
            $table->decimal('planned_quantity', 18, 4);
            $table->foreignId('unit_id');
            $table->foreignId('production_line_id')->nullable();
            $table->date('scheduled_date')->nullable();
            $table->decimal('produced_quantity', 18, 4)->default(0);
            $table->string('status', 32)->default('draft');
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_production_plan_items_uuid');
            $table->unique(['tenant_id', 'id'], 'uq_production_plan_items_tenant_id');

            $table->foreign(['tenant_id', 'production_plan_id'], 'fk_prod_plan_items_plan')
                ->references(['tenant_id', 'id'])
                ->on('production_plans')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_prod_plan_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'bill_of_material_id'], 'fk_prod_plan_items_bom')
                ->references(['tenant_id', 'id'])
                ->on('bill_of_materials')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_prod_plan_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'production_line_id'], 'fk_prod_plan_items_line')
                ->references(['tenant_id', 'id'])
                ->on('production_lines')
                ->restrictOnDelete();

            $table->index(['tenant_id', 'production_plan_id'], 'ix_prod_plan_items_tenant_plan');
            $table->index(['tenant_id', 'product_id'], 'ix_prod_plan_items_tenant_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_plan_items');
    }
};
