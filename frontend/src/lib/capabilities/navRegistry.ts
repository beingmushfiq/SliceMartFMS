import {
  Award,
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  ClipboardList,
  Clock,
  Coins,
  DollarSign,
  Factory,
  FileSpreadsheet,
  Kanban,
  LayoutDashboard,
  Microscope,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Target,
  Truck,
  UserCheck,
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
    title: 'Overview & Monitoring',
    items: [
      {
        id: 'dashboard',
        defaultLabel: 'Executive Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
      },
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
    ],
  },
  {
    title: 'Sales & Commercials',
    items: [
      {
        id: 'sales',
        moduleKey: 'sales',
        defaultLabel: 'Sales & Invoices',
        to: '/sales',
        icon: ShoppingBag,
        permission: [
          'sales.order.view',
          'sales.invoice.view',
          'sales.return.view',
        ],
      },
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
    ],
  },
  {
    title: 'CRM & Salesmen',
    items: [
      {
        id: 'crm-leads',
        moduleKey: 'sales',
        defaultLabel: 'Commercial Leads',
        to: '/sales?tab=leads',
        icon: Kanban,
        permission: ['sales.lead.view', 'crm.lead.view', 'sales.order.view'],
      },
      {
        id: 'salesmen-directory',
        moduleKey: 'sales',
        defaultLabel: 'Salesmen Directory',
        to: '/sales?tab=salesmen',
        icon: UserCheck,
        permission: ['sales.order.view', 'hr.employee.view'],
      },
      {
        id: 'sales-targets',
        moduleKey: 'sales',
        defaultLabel: 'Monthly Sales Targets',
        to: '/sales?tab=targets',
        icon: Target,
        permission: ['sales.order.view', 'sales.target.view'],
      },
      {
        id: 'sales-incentives',
        moduleKey: 'sales',
        defaultLabel: 'Incentive Policies',
        to: '/sales?tab=incentives',
        icon: Award,
        permission: ['sales.order.view', 'sales.incentive.view'],
      },
    ],
  },
  {
    title: 'Production & Quality',
    items: [
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
    ],
  },
  {
    title: 'Inventory & Supply',
    items: [
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
        defaultLabel: 'Logistics & Courier',
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
    title: 'Finance & Accounts',
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
        id: 'finance-due',
        moduleKey: 'finance',
        defaultLabel: 'Due & Collection',
        to: '/finance?tab=due-collection',
        icon: DollarSign,
        permission: ['finance.account.view', 'sales.invoice.view'],
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
        to: '/assets?tab=maintenance',
        icon: Wrench,
        permission: ['assets.asset.view', 'assets.maintenance.view'],
      },
    ],
  },
  {
    title: 'Workforce & HR',
    items: [
      {
        id: 'hr-employees',
        moduleKey: 'hr',
        defaultLabel: 'Workforce Directory',
        to: '/hr?tab=employees',
        icon: Users,
        permission: ['hr.employee.view'],
      },
      {
        id: 'hr-attendance',
        moduleKey: 'hr',
        defaultLabel: 'Shifts & Attendance',
        to: '/hr?tab=attendance',
        icon: Clock,
        permission: ['hr.attendance.view'],
      },
      {
        id: 'hr-payroll',
        moduleKey: 'hr',
        defaultLabel: 'Payroll & Payslips',
        to: '/hr?tab=payroll',
        icon: Receipt,
        permission: ['hr.payroll.view', 'hr.payslip.view'],
      },
      {
        id: 'hr-performance',
        moduleKey: 'hr',
        defaultLabel: 'Worker Performance',
        to: '/hr?tab=performance',
        icon: BarChart3,
        permission: ['hr.employee.view', 'production.worker_entry.view'],
      },
      {
        id: 'hr-departments',
        moduleKey: 'hr',
        defaultLabel: 'Departments & Setup',
        to: '/hr?tab=departments',
        icon: Briefcase,
        permission: ['hr.employee.view'],
      },
    ],
  },
  {
    title: 'Intelligence & System',
    items: [
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
