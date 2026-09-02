import {
  Boxes,
  Building2,
  ClipboardList,
  Coins,
  Factory,
  FileSpreadsheet,
  LayoutDashboard,
  Microscope,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Warehouse,
  Wrench,
} from 'lucide-react';

export interface DynamicNavItem {
  id: string;
  moduleKey?: string;
  labelKey?: string;
  defaultLabel: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission?: string | string[];
  badge?: string;
  badgeTone?: 'primary' | 'success' | 'amber' | 'neutral';
}

export interface DynamicNavSection {
  title: string;
  items: DynamicNavItem[];
}

export const PLATFORM_NAV_DEFINITIONS: DynamicNavSection[] = [
  {
    title: 'Operations & Execution',
    items: [
      {
        id: 'dashboard',
        defaultLabel: 'Operations Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'catalogue',
        moduleKey: 'inventory',
        labelKey: 'catalogue',
        defaultLabel: 'Catalogue & Master',
        to: '/catalogue',
        icon: Boxes,
        permission: [
          'catalog.product.view',
          'catalog.unit.view',
          'catalog.category.view',
          'catalog.brand.view',
          'catalog.bom.view',
          'catalog.party.view',
          'inventory.warehouse.view',
        ],
      },
      {
        id: 'production',
        moduleKey: 'production',
        labelKey: 'production',
        defaultLabel: 'Production Chain',
        to: '/production',
        icon: Factory,
        permission: ['production.batch.view', 'production.plan.view', 'production.worker_entry.view'],
      },
      {
        id: 'qc',
        moduleKey: 'qc',
        defaultLabel: 'Quality Control (QC)',
        to: '/qc',
        icon: Microscope,
        permission: ['qc.inspection.view', 'qc.parameter.view', 'qc.wastage.view'],
      },
      {
        id: 'inventory',
        moduleKey: 'inventory',
        labelKey: 'warehouse',
        defaultLabel: 'Stock & Inventory',
        to: '/inventory',
        icon: Warehouse,
        permission: [
          'inventory.stock.view',
          'inventory.warehouse.view',
          'inventory.movement.view',
          'inventory.transfer.view',
          'inventory.count.view',
        ],
      },
    ],
  },
  {
    title: 'Commerce & Supply Hub',
    items: [
      {
        id: 'pos',
        moduleKey: 'pos',
        defaultLabel: 'Point of Sale (POS)',
        to: '/pos',
        icon: ShoppingCart,
        permission: ['pos.terminal.view', 'pos.session.view', 'pos.sale.create'],
        badge: 'Fast',
        badgeTone: 'primary',
      },
      {
        id: 'ecommerce',
        moduleKey: 'ecommerce',
        defaultLabel: 'Storefront CMS',
        to: '/storefront',
        icon: Store,
        permission: ['ecommerce.storefront.view', 'ecommerce.storefront.manage'],
        badge: 'Live',
        badgeTone: 'success',
      },
      {
        id: 'sales',
        moduleKey: 'sales',
        defaultLabel: 'Sales & Invoices',
        to: '/sales',
        icon: ShoppingBag,
        permission: [
          'sales.order.view',
          'sales.invoice.view',
          'sales.lead.view',
          'sales.return.view',
        ],
      },
      {
        id: 'purchasing',
        moduleKey: 'purchasing',
        defaultLabel: 'Procurement (PO)',
        to: '/purchasing',
        icon: ClipboardList,
        permission: [
          'purchasing.order.view',
          'purchasing.requisition.view',
          'purchasing.grn.view',
          'purchasing.bill.view',
          'purchasing.return.view',
        ],
      },
      {
        id: 'delivery',
        moduleKey: 'delivery',
        defaultLabel: 'Logistics & 3PL Courier',
        to: '/logistics',
        icon: Truck,
        permission: [
          'logistics.delivery_order.view',
          'logistics.run_sheet.view',
          'logistics.shipment.view',
          'logistics.cod.view',
        ],
      },
    ],
  },
  {
    title: 'Finance & Workforce',
    items: [
      {
        id: 'finance',
        moduleKey: 'finance',
        defaultLabel: 'Finance & Accounts',
        to: '/finance',
        icon: Coins,
        permission: [
          'finance.account.view',
          'finance.journal.view',
          'finance.expense.view',
          'finance.bank.view',
          'finance.costing.view',
        ],
      },
      {
        id: 'assets',
        moduleKey: 'assets',
        defaultLabel: 'Fixed Assets',
        to: '/assets',
        icon: Building2,
        permission: ['assets.asset.view', 'assets.maintenance.view'],
      },
      {
        id: 'maintenance',
        moduleKey: 'maintenance',
        defaultLabel: 'Machine Maintenance',
        to: '/assets',
        icon: Wrench,
        permission: ['assets.asset.view', 'assets.maintenance.view'],
      },
      {
        id: 'hr',
        moduleKey: 'hr',
        defaultLabel: 'Workforce & HR',
        to: '/hr',
        icon: Users,
        permission: [
          'hr.employee.view',
          'hr.attendance.view',
          'hr.leave.view',
          'hr.payroll.view',
          'hr.payslip.view',
        ],
      },
    ],
  },
  {
    title: 'Intelligence & System',
    items: [
      {
        id: 'reports',
        moduleKey: 'reports',
        defaultLabel: 'Reports & BI (RMS)',
        to: '/reports',
        icon: FileSpreadsheet,
        permission: [
          'reports.report.view',
          'reports.dashboard.view',
          'reports.analytics.view',
          'reports.definition.view',
        ],
      },
      {
        id: 'roles',
        defaultLabel: 'Roles & RBAC',
        to: '/settings/roles',
        icon: Shield,
        permission: ['core.role.view', 'core.role.manage', 'core.permission.view'],
      },
      {
        id: 'audit',
        defaultLabel: 'Activity Log & Diffs',
        to: '/activity-logs',
        icon: ShieldCheck,
        permission: ['core.audit_log.view'],
      },
      {
        id: 'settings',
        defaultLabel: 'Settings Center',
        to: '/settings',
        icon: Settings,
        permission: ['core.setting.view', 'core.setting.manage', 'core.setting.configure'],
      },
    ],
  },
];

export function buildDynamicNavSections(
  isModuleEnabled: (key: string) => boolean,
  hasPermission: (perm: string | string[]) => boolean,
  getTerm: (key: string, fallback?: string) => string
): Array<{ title: string; items: Array<DynamicNavItem & { label: string }> }> {
  return PLATFORM_NAV_DEFINITIONS.map((section) => {
    const activeItems = section.items
      .filter((item) => {
        if (item.moduleKey && !isModuleEnabled(item.moduleKey)) {
          return false;
        }
        if (item.permission && !hasPermission(item.permission)) {
          return false;
        }
        return true;
      })
      .map((item) => {
        let label = item.defaultLabel;
        if (item.labelKey) {
          label = getTerm(item.labelKey, item.defaultLabel);
        }
        return {
          ...item,
          label,
        };
      });

    return {
      title: section.title,
      items: activeItems,
    };
  }).filter((section) => section.items.length > 0);
}
