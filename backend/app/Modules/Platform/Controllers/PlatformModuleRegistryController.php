<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformModuleRegistryController extends Controller
{
    /**
     * Return the authoritative registry of platform modules, capabilities, and plan allowances.
     */
    public function index(Request $request): JsonResponse
    {
        $modules = [
            [
                'key' => 'pos',
                'label' => 'POS Terminal & Cashier Engine',
                'category' => 'Retail & Commerce',
                'description' => 'Fast checkout, cash drawers, barcode scanning, offline queue sync, and session balancing.',
                'icon' => 'ShoppingCart',
                'is_core' => false,
                'default_enabled' => true,
                'min_plan_tier' => 'STARTER',
                'capabilities' => ['pos.terminals', 'pos.sessions', 'pos.offline_sync', 'pos.held_sales'],
            ],
            [
                'key' => 'production',
                'label' => 'Production Batches & Routing',
                'category' => 'Manufacturing',
                'description' => 'BOM assembly, production plans, worker daily outputs, stage tracking, and cost allocation.',
                'icon' => 'Cpu',
                'is_core' => false,
                'default_enabled' => true,
                'min_plan_tier' => 'PROFESSIONAL',
                'capabilities' => ['production.plans', 'production.batches', 'production.worker_entries', 'production.costing'],
            ],
            [
                'key' => 'qc',
                'label' => 'Quality Control & Rework',
                'category' => 'Manufacturing',
                'description' => 'Inspection parameters, defect classification, pass/fail thresholds, wastage tracking, and rework orders.',
                'icon' => 'ShieldAlert',
                'is_core' => false,
                'default_enabled' => true,
                'min_plan_tier' => 'PROFESSIONAL',
                'capabilities' => ['qc.inspections', 'qc.defects', 'qc.rework_orders', 'qc.wastage'],
            ],
            [
                'key' => 'storefront',
                'label' => 'B2C E-Commerce Storefront',
                'category' => 'Retail & Commerce',
                'description' => 'Public digital storefront, catalog, cart, coupons, WhatsApp checkout, shipping zones, and custom domains.',
                'icon' => 'Package',
                'is_core' => false,
                'default_enabled' => true,
                'min_plan_tier' => 'STARTER',
                'capabilities' => ['storefront.catalog', 'storefront.orders', 'storefront.domains', 'storefront.coupons'],
            ],
            [
                'key' => 'multi_branch',
                'label' => 'Multi-Branch & Factory Scoping',
                'category' => 'Enterprise Architecture',
                'description' => 'Company branches, multiple warehouses, inter-branch stock transfers, and scoped user roles.',
                'icon' => 'Building2',
                'is_core' => false,
                'default_enabled' => false,
                'min_plan_tier' => 'ENTERPRISE',
                'capabilities' => ['org.branches', 'org.warehouses', 'inventory.transfers', 'rbac.branch_scope'],
            ],
            [
                'key' => 'accounting',
                'label' => 'Financial Ledger & Invoicing',
                'category' => 'Finance',
                'description' => 'Double-entry chart of accounts, journal vouchers, accounts receivable/payable, and margin reports.',
                'icon' => 'DollarSign',
                'is_core' => false,
                'default_enabled' => true,
                'min_plan_tier' => 'STARTER',
                'capabilities' => ['finance.chart_of_accounts', 'finance.journal_entries', 'finance.invoices', 'finance.reports'],
            ],
            [
                'key' => 'delivery',
                'label' => 'Courier Logistics & COD',
                'category' => 'Logistics',
                'description' => 'Courier provider APIs (Steadfast, Pathao, RedX), run sheets, status webhooks, and COD reconciliations.',
                'icon' => 'Truck',
                'is_core' => false,
                'default_enabled' => false,
                'min_plan_tier' => 'PROFESSIONAL',
                'capabilities' => ['delivery.orders', 'delivery.run_sheets', 'delivery.courier_sync', 'delivery.cod_reconciliation'],
            ],
            [
                'key' => 'hr_payroll',
                'label' => 'HR, Attendance & Payroll',
                'category' => 'Workforce',
                'description' => 'Employee records, shifts, leave balances, attendance logs, salary structures, and payslips.',
                'icon' => 'Users',
                'is_core' => false,
                'default_enabled' => false,
                'min_plan_tier' => 'PROFESSIONAL',
                'capabilities' => ['hr.employees', 'hr.shifts', 'hr.attendance', 'hr.payroll'],
            ],
            [
                'key' => 'assets_maintenance',
                'label' => 'Asset & Machine Maintenance',
                'category' => 'Operations',
                'description' => 'Fixed assets register, depreciation schedules, preventive maintenance orders, and spare parts.',
                'icon' => 'Wrench',
                'is_core' => false,
                'default_enabled' => false,
                'min_plan_tier' => 'ENTERPRISE',
                'capabilities' => ['assets.register', 'assets.depreciation', 'assets.maintenance_orders'],
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $modules,
            'meta' => [
                'count' => count($modules),
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }
}
