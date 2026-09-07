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
  id: string;
  title: string;
  items: DynamicNavItem[];
}

export interface NavOrderConfig {
  sections?: string[];
  items?: Record<string, string[]>;
}

/**
 * Canonical platform navigation registry ordered according to standard enterprise
 * industrial workflow:
 * 1. Overview & Monitoring (Dashboard & BI)
 * 2. CRM & Salesmen (Demand Generation, Leads & Targets)
 * 3. Sales & Commercials (Omnichannel B2B/Retail Orders, POS & Web Storefront)
 * 4. Inventory & Supply (Master Catalogue, Procurement POs, Stock Ledgers & Logistics)
 * 5. Production & Quality (Factory Batch Routing & Mandatory QC Gate)
 * 6. Finance & Accounts (General Ledger, Due & Collections, Assets & Maintenance)
 * 7. Workforce & HR (Employees, Attendance, Piece-Rate Performance & Payroll)
 * 8. Intelligence & System (RBAC, Audit Logs & Settings Center)
 */
export const PLATFORM_NAV_DEFINITIONS: DynamicNavSection[] = [
  {
    id: 'overview',
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
    id: 'crm',
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
    id: 'sales',
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
    id: 'supply',
    title: 'Inventory & Supply',
    items: [
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
    id: 'production',
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
    id: 'finance',
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
    id: 'hr',
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
        id: 'hr-performance',
        moduleKey: 'hr',
        defaultLabel: 'Worker Performance',
        to: '/hr?tab=performance',
        icon: BarChart3,
        permission: ['hr.employee.view', 'production.worker_entry.view'],
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
    id: 'system',
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

/**
 * Returns the canonical default navigation sequence structure.
 */
export function getDefaultNavOrder(): NavOrderConfig {
  return {
    sections: PLATFORM_NAV_DEFINITIONS.map((s) => s.id),
    items: PLATFORM_NAV_DEFINITIONS.reduce((acc, s) => {
      acc[s.id] = s.items.map((i) => i.id);
      return acc;
    }, {} as Record<string, string[]>),
  };
}

/**
 * Builds active navigation sections dynamically, honoring enabled module gates,
 * staff RBAC permissions, customized terminology, and custom section/item re-ordering.
 */
export function buildDynamicNavSections(
  isModuleEnabled: (key: string) => boolean,
  hasPermission: (perm: string | string[]) => boolean,
  getTerm: (key: string, fallback?: string) => string,
  customOrder?: NavOrderConfig | null
): Array<{ id: string; title: string; items: Array<DynamicNavItem & { label: string }> }> {
  // 1. Map canonical definitions into active resolved sections
  const mappedSections = PLATFORM_NAV_DEFINITIONS.map((section) => {
    let activeItems = section.items
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

    // Reorder items within section if custom item order is configured
    const customItemOrder = customOrder?.items?.[section.id];
    if (customItemOrder && Array.isArray(customItemOrder) && customItemOrder.length > 0) {
      activeItems = [...activeItems].sort((a, b) => {
        const indexA = customItemOrder.indexOf(a.id);
        const indexB = customItemOrder.indexOf(b.id);
        const posA = indexA === -1 ? 999 : indexA;
        const posB = indexB === -1 ? 999 : indexB;
        return posA - posB;
      });
    }

    return {
      id: section.id,
      title: section.title,
      items: activeItems,
    };
  }).filter((section) => section.items.length > 0);

  // 2. Reorder sections if custom section order is configured
  if (customOrder?.sections && Array.isArray(customOrder.sections) && customOrder.sections.length > 0) {
    const sectionOrder = customOrder.sections;
    return [...mappedSections].sort((a, b) => {
      const indexA = sectionOrder.indexOf(a.id);
      const indexB = sectionOrder.indexOf(b.id);
      const posA = indexA === -1 ? 999 : indexA;
      const posB = indexB === -1 ? 999 : indexB;
      return posA - posB;
    });
  }

  return mappedSections;
}
