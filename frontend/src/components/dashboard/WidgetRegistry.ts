export interface DashboardWidgetMeta {
  id: string;
  moduleKey?: string;
  title: string;
  category: 'production' | 'sales' | 'inventory' | 'finance' | 'qc' | 'hr' | 'ecommerce';
  defaultEnabled: boolean;
}

export const DASHBOARD_WIDGET_DEFINITIONS: Record<string, DashboardWidgetMeta> = {
  kpi_production: {
    id: 'kpi_production',
    moduleKey: 'production',
    title: "Today's Production Output",
    category: 'production',
    defaultEnabled: true,
  },
  kpi_sales: {
    id: 'kpi_sales',
    moduleKey: 'sales',
    title: 'Gross Revenue Stream',
    category: 'sales',
    defaultEnabled: true,
  },
  kpi_qc: {
    id: 'kpi_qc',
    moduleKey: 'qc',
    title: 'Quality Pass Rate (QC)',
    category: 'qc',
    defaultEnabled: true,
  },
  kpi_ecommerce: {
    id: 'kpi_ecommerce',
    moduleKey: 'ecommerce',
    title: 'Storefront Online Orders',
    category: 'ecommerce',
    defaultEnabled: true,
  },
  kpi_inventory: {
    id: 'kpi_inventory',
    moduleKey: 'inventory',
    title: 'Low Stock Buffer Alerts',
    category: 'inventory',
    defaultEnabled: true,
  },
  kpi_hr: {
    id: 'kpi_hr',
    moduleKey: 'hr',
    title: 'Active Workers On Floor',
    category: 'hr',
    defaultEnabled: true,
  },
  chart_production_yield: {
    id: 'chart_production_yield',
    moduleKey: 'production',
    title: 'Production Velocity & Plan Target',
    category: 'production',
    defaultEnabled: true,
  },
  chart_omnichannel_mix: {
    id: 'chart_omnichannel_mix',
    moduleKey: 'sales',
    title: 'Omnichannel Revenue Mix',
    category: 'sales',
    defaultEnabled: true,
  },
  shop_floor_monitors: {
    id: 'shop_floor_monitors',
    moduleKey: 'production',
    title: 'Live Shop Floor Production Lines',
    category: 'production',
    defaultEnabled: true,
  },
  quick_actions: {
    id: 'quick_actions',
    title: 'Operational Action Bar',
    category: 'production',
    defaultEnabled: true,
  },
};
