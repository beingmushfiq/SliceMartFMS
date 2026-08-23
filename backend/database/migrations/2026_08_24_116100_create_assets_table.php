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
        Schema::create('assets', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('asset_code', 64);
            $table->string('asset_tag', 64)->nullable();
            $table->string('name', 255);
            $table->unsignedBigInteger('asset_category_id');

            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('factory_id')->nullable();
            $table->unsignedBigInteger('production_line_id')->nullable();
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->unsignedBigInteger('assigned_employee_id')->nullable();

            $table->string('serial_number', 128)->nullable();
            $table->string('manufacturer', 128)->nullable();
            $table->string('model', 128)->nullable();

            $table->date('purchase_date')->nullable();
            $table->unsignedBigInteger('purchase_order_id')->nullable();
            $table->unsignedBigInteger('supplier_party_id')->nullable();
            $table->decimal('purchase_cost', 18, 4)->default('0.0000');

            $table->string('depreciation_method', 32)->default('straight_line'); // none, straight_line, declining_balance
            $table->unsignedInteger('useful_life_months')->default(60);
            $table->decimal('salvage_value', 18, 4)->default('0.0000');
            $table->decimal('accumulated_depreciation', 18, 4)->default('0.0000');
            $table->decimal('book_value', 18, 4)->default('0.0000'); // derived cache

            $table->date('warranty_expires_on')->nullable();
            $table->string('status', 32)->default('idle'); // in_use, idle, under_maintenance, in_repair, retired, disposed, lost
            $table->string('condition', 32)->default('good'); // new, good, fair, poor, unserviceable

            $table->date('disposal_date')->nullable();
            $table->decimal('disposal_amount', 18, 4)->nullable();
            $table->text('disposal_reason')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_assets_tenant_id');
            $table->unique(['tenant_id', 'asset_code'], 'uq_assets_code');
            $table->index(['tenant_id', 'asset_category_id', 'status'], 'ix_assets_cat_status');

            $table->foreign(['tenant_id', 'asset_category_id'], 'fk_assets_category')
                ->references(['tenant_id', 'id'])
                ->on('asset_categories')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'company_id'], 'fk_assets_company')
                ->references(['tenant_id', 'id'])
                ->on('companies')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'branch_id'], 'fk_assets_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'factory_id'], 'fk_assets_factory')
                ->references(['tenant_id', 'id'])
                ->on('factories')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'production_line_id'], 'fk_assets_prod_line')
                ->references(['tenant_id', 'id'])
                ->on('production_lines')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_assets_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'assigned_employee_id'], 'fk_assets_employee')
                ->references(['tenant_id', 'id'])
                ->on('employees')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'purchase_order_id'], 'fk_assets_purchase_order')
                ->references(['tenant_id', 'id'])
                ->on('purchase_orders')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'supplier_party_id'], 'fk_assets_supplier')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_assets_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_assets_updated_by')
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
        Schema::dropIfExists('assets');
    }
};
