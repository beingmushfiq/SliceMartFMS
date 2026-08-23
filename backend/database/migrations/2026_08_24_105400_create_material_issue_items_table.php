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
     * Wave 10 — Material Issue Items
     * Implements ADR-011 / DATABASE_DESIGN.md §5 Group D.
     */
    public function up(): void
    {
        Schema::create('material_issue_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');
            $table->foreignId('material_issue_id');
            $table->foreignId('product_id');
            $table->decimal('requested_quantity', 18, 4);
            $table->decimal('issued_quantity', 18, 4)->default(0);
            $table->decimal('returned_quantity', 18, 4)->default(0);
            $table->foreignId('unit_id');
            $table->foreignId('warehouse_location_id')->nullable();
            $table->decimal('unit_cost', 18, 4)->default(0);

            // Deferred FK to stock_movements (Wave 12 table, resolved in Wave 25)
            $table->unsignedBigInteger('stock_movement_id')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_material_issue_items_uuid');
            $table->unique(['tenant_id', 'id'], 'uq_material_issue_items_tenant_id');

            $table->foreign(['tenant_id', 'material_issue_id'], 'fk_material_issue_items_issue')
                ->references(['tenant_id', 'id'])
                ->on('material_issues')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'product_id'], 'fk_material_issue_items_product')
                ->references(['tenant_id', 'id'])
                ->on('products')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'unit_id'], 'fk_material_issue_items_unit')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_location_id'], 'fk_material_issue_items_location')
                ->references(['tenant_id', 'id'])
                ->on('warehouse_locations')
                ->restrictOnDelete();

            $table->index(['tenant_id', 'material_issue_id'], 'ix_mat_issue_items_tenant_issue');
            $table->index(['tenant_id', 'product_id'], 'ix_mat_issue_items_tenant_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_issue_items');
    }
};
