<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add composite performance indexes for multi-tenant high-throughput queries.
     */
    public function up(): void
    {
        if (! Schema::hasIndex('worker_production_entries', 'ix_worker_prod_entries_tenant_date')) {
            Schema::table('worker_production_entries', function (Blueprint $table): void {
                $table->index(['tenant_id', 'work_date'], 'ix_worker_prod_entries_tenant_date');
            });
        }

        if (! Schema::hasIndex('invoices', 'ix_invoices_tenant_status_date')) {
            Schema::table('invoices', function (Blueprint $table): void {
                $table->index(['tenant_id', 'status', 'invoice_date'], 'ix_invoices_tenant_status_date');
            });
        }

        if (! Schema::hasIndex('qc_inspections', 'ix_qc_inspections_tenant_date_result')) {
            Schema::table('qc_inspections', function (Blueprint $table): void {
                $table->index(['tenant_id', 'inspection_date', 'result'], 'ix_qc_inspections_tenant_date_result');
            });
        }

        if (! Schema::hasIndex('qc_inspections', 'ix_qc_inspections_tenant_created')) {
            Schema::table('qc_inspections', function (Blueprint $table): void {
                $table->index(['tenant_id', 'created_at'], 'ix_qc_inspections_tenant_created');
            });
        }

        if (! Schema::hasIndex('sales_orders', 'ix_sales_orders_tenant_date')) {
            Schema::table('sales_orders', function (Blueprint $table): void {
                $table->index(['tenant_id', 'order_date'], 'ix_sales_orders_tenant_date');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasIndex('sales_orders', 'ix_sales_orders_tenant_date')) {
            Schema::table('sales_orders', function (Blueprint $table): void {
                $table->dropIndex('ix_sales_orders_tenant_date');
            });
        }

        if (Schema::hasIndex('qc_inspections', 'ix_qc_inspections_tenant_created')) {
            Schema::table('qc_inspections', function (Blueprint $table): void {
                $table->dropIndex('ix_qc_inspections_tenant_created');
            });
        }

        if (Schema::hasIndex('qc_inspections', 'ix_qc_inspections_tenant_date_result')) {
            Schema::table('qc_inspections', function (Blueprint $table): void {
                $table->dropIndex('ix_qc_inspections_tenant_date_result');
            });
        }

        if (Schema::hasIndex('invoices', 'ix_invoices_tenant_status_date')) {
            Schema::table('invoices', function (Blueprint $table): void {
                $table->dropIndex('ix_invoices_tenant_status_date');
            });
        }

        if (Schema::hasIndex('worker_production_entries', 'ix_worker_prod_entries_tenant_date')) {
            Schema::table('worker_production_entries', function (Blueprint $table): void {
                $table->dropIndex('ix_worker_prod_entries_tenant_date');
            });
        }
    }
};
