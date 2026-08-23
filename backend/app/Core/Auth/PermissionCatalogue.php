<?php

declare(strict_types=1);

namespace App\Core\Auth;

use InvalidArgumentException;

/**
 * Permission Catalogue for SliceMart FMS (ADR-008).
 *
 * Enforces canonical 3-segment format: `module.resource.action`.
 * Closed action vocabulary:
 * - view, create, update, delete, approve, void, export, lock, assign, import, print, manage, configure.
 */
class PermissionCatalogue
{
    /**
     * Closed action vocabulary (ADR-008).
     *
     * @var list<string>
     */
    public const VALID_ACTIONS = [
        'view',
        'create',
        'update',
        'delete',
        'approve',
        'void',
        'export',
        'lock',
        'assign',
        'import',
        'print',
        'manage',
        'configure',
    ];

    /**
     * Canonical system permissions list.
     *
     * @var list<string>
     */
    public const ALL_PERMISSIONS = [
        // Tenancy & Platform
        'platform.tenant.view',
        'platform.tenant.create',
        'platform.tenant.update',
        'platform.tenant.suspend',
        'platform.plan.manage',
        'platform.audit.view',

        // Core Identity & RBAC
        'core.user.view',
        'core.user.create',
        'core.user.update',
        'core.user.delete',
        'core.role.view',
        'core.role.manage',
        'core.permission.view',
        'core.audit_log.view',
        'core.setting.manage',
        'core.sequence.configure',

        // Organization
        'org.company.view',
        'org.company.manage',
        'org.branch.view',
        'org.branch.manage',
        'org.factory.view',
        'org.factory.manage',
        'org.production_line.view',
        'org.production_line.manage',

        // Master Data & Catalog
        'catalog.unit.view',
        'catalog.unit.manage',
        'catalog.category.view',
        'catalog.category.manage',
        'catalog.brand.view',
        'catalog.brand.manage',
        'catalog.product.view',
        'catalog.product.create',
        'catalog.product.update',
        'catalog.product.delete',
        'catalog.bom.view',
        'catalog.bom.manage',
        'catalog.price_list.view',
        'catalog.price_list.manage',
        'catalog.party.view',
        'catalog.party.create',
        'catalog.party.update',
        'catalog.party.delete',

        // Production & Worker Output
        'production.plan.view',
        'production.plan.create',
        'production.plan.approve',
        'production.batch.view',
        'production.batch.create',
        'production.batch.update',
        'production.batch.approve',
        'production.material_issue.view',
        'production.material_issue.create',
        'production.output.view',
        'production.output.create',
        'production.worker_entry.view',
        'production.worker_entry.create',
        'production.worker_entry.approve',

        // QC & Wastage
        'qc.inspection.view',
        'qc.inspection.create',
        'qc.inspection.approve',
        'qc.defect.view',
        'qc.defect.manage',
        'qc.wastage.view',
        'qc.wastage.create',
        'qc.wastage.approve',

        // Inventory & Warehousing
        'inventory.warehouse.view',
        'inventory.warehouse.manage',
        'inventory.stock.view',
        'inventory.stock.adjust',
        'inventory.movement.view',
        'inventory.transfer.view',
        'inventory.transfer.create',
        'inventory.transfer.approve',
        'inventory.count.view',
        'inventory.count.create',
        'inventory.count.approve',

        // Purchasing
        'purchasing.requisition.view',
        'purchasing.requisition.create',
        'purchasing.requisition.approve',
        'purchasing.order.view',
        'purchasing.order.create',
        'purchasing.order.approve',
        'purchasing.grn.view',
        'purchasing.grn.create',
        'purchasing.grn.approve',
        'purchasing.bill.view',
        'purchasing.bill.create',
        'purchasing.bill.approve',
        'purchasing.return.view',
        'purchasing.return.create',

        // Sales & Invoicing
        'sales.lead.view',
        'sales.lead.manage',
        'sales.order.view',
        'sales.order.create',
        'sales.order.approve',
        'sales.order.void',
        'sales.invoice.view',
        'sales.invoice.create',
        'sales.invoice.approve',
        'sales.invoice.void',
        'sales.invoice.print',
        'sales.return.view',
        'sales.return.create',
        'sales.return.approve',

        // POS
        'pos.terminal.view',
        'pos.terminal.manage',
        'pos.session.view',
        'pos.session.create',
        'pos.session.lock',
        'pos.sale.create',

        // Logistics & Delivery
        'logistics.delivery_order.view',
        'logistics.delivery_order.create',
        'logistics.delivery_order.assign',
        'logistics.run_sheet.view',
        'logistics.run_sheet.create',
        'logistics.run_sheet.approve',
        'logistics.shipment.view',
        'logistics.shipment.create',
        'logistics.cod.view',
        'logistics.cod.approve',

        // HR & Payroll
        'hr.employee.view',
        'hr.employee.create',
        'hr.employee.update',
        'hr.attendance.view',
        'hr.attendance.create',
        'hr.leave.view',
        'hr.leave.create',
        'hr.leave.approve',
        'hr.payroll.view',
        'hr.payroll.create',
        'hr.payroll.approve',
        'hr.payroll.lock',
        'hr.payslip.view',
        'hr.payslip.print',

        // Assets & Maintenance
        'assets.asset.view',
        'assets.asset.create',
        'assets.asset.update',
        'assets.asset.depreciate',
        'assets.maintenance.view',
        'assets.maintenance.create',
        'assets.maintenance.approve',

        // Finance & Costing
        'finance.account.view',
        'finance.account.manage',
        'finance.journal.view',
        'finance.journal.create',
        'finance.journal.approve',
        'finance.expense.view',
        'finance.expense.create',
        'finance.expense.approve',
        'finance.bank.view',
        'finance.bank.manage',
        'finance.costing.view',
        'finance.costing.manage',

        // Reporting & Analytics
        'reports.definition.view',
        'reports.report.view',
        'reports.report.export',
        'reports.dashboard.view',
        'reports.analytics.view',

        // E-commerce
        'ecommerce.storefront.view',
        'ecommerce.storefront.manage',
        'ecommerce.cart.view',
        'ecommerce.coupon.view',
        'ecommerce.coupon.manage',
        'ecommerce.review.view',
        'ecommerce.review.approve',

        // Integrations
        'integrations.webhook.view',
        'integrations.webhook.manage',
        'integrations.import.view',
        'integrations.import.create',
    ];

    /**
     * Validate and parse a permission string into [module, resource, action].
     *
     * @return array{module: string, resource: string, action: string}
     */
    public static function parse(string $permission): array
    {
        $parts = explode('.', $permission);
        if (count($parts) !== 3) {
            throw new InvalidArgumentException("Invalid permission format '{$permission}'. Must be module.resource.action.");
        }

        [$module, $resource, $action] = $parts;

        if ($module === '' || $resource === '' || $action === '') {
            throw new InvalidArgumentException("Permission segments cannot be empty in '{$permission}'.");
        }

        if (! in_array($action, self::VALID_ACTIONS, true)) {
            throw new InvalidArgumentException("Invalid action '{$action}' in permission '{$permission}'.");
        }

        return [
            'module' => $module,
            'resource' => $resource,
            'action' => $action,
        ];
    }

    /**
     * Compute a deterministic hash representing the version of a permission set.
     *
     * @param  list<string>  $permissions
     */
    public static function computePermVersion(array $permissions): string
    {
        $unique = array_unique($permissions);
        sort($unique);

        return substr(hash('sha256', implode('|', $unique)), 0, 12);
    }

    /**
     * Get the full flat list of system permissions.
     *
     * @return list<string>
     */
    public static function getAllPermissions(): array
    {
        return self::ALL_PERMISSIONS;
    }
}
