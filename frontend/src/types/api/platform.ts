export interface PlatformUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  is_platform_user: boolean;
}

export interface PlatformTenantKPIs {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  suspended_tenants: number;
  past_due_tenants: number;
  expiring_subscriptions_30d: number;
  estimated_mrr: number;
  total_users: number;
}

export interface PlatformDashboardData {
  kpis: PlatformTenantKPIs;
  plans: Array<{
    id: number;
    name: string;
    code: string;
    price: number;
    tenants_count: number;
  }>;
  recent_activity: Array<{
    id: number;
    uuid: string;
    action: string;
    entity_type: string;
    entity_id: number;
    tenant_id: number | null;
    actor_name: string;
    created_at: string;
    details: Record<string, unknown> | null;
  }>;
  system_health: {
    status: 'healthy' | 'degraded' | 'critical';
    database: string;
    cache: string;
    queue: string;
    server_time: string;
    active_connections: number;
  };
}

export interface PlatformTenant {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  domain?: string | null;
  status: 'active' | 'trial' | 'past_due' | 'suspended' | 'cancelled';
  currency_code: string;
  timezone: string;
  plan_id: number;
  users_count?: number;
  trial_ends_at?: string | null;
  suspended_at?: string | null;
  settings?: Record<string, unknown> | null;
  created_at: string;
  subscription?: {
    status: string;
    amount: number;
    starts_at?: string;
    ends_at?: string;
  } | null;
  plan?: {
    id: number;
    name: string;
    code: string;
    price: number;
    billing_period: string;
    limits?: {
      max_users?: number;
      max_factories?: number;
      max_warehouses?: number;
      max_monthly_orders?: number;
      storage_gb?: number;
      [key: string]: unknown;
    };
    features?: Record<string, unknown>;
  };
  subscriptions?: Array<{
    id: number;
    uuid: string;
    plan_id: number;
    status: string;
    starts_at: string;
    ends_at: string | null;
    trial_ends_at: string | null;
    plan?: {
      name: string;
      code: string;
    };
  }>;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    status: string;
    roles?: Array<{ name: string; slug: string }>;
  }>;
  usage_counters?: Array<{
    metric_key: string;
    counter_value: number;
    period_date: string;
  }>;
}

export interface PlatformPlan {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description?: string | null;
  price: number;
  billing_period: 'monthly' | 'yearly';
  limits: {
    max_users?: number;
    max_factories?: number;
    max_warehouses?: number;
    max_monthly_orders?: number;
    storage_gb?: number;
    [key: string]: unknown;
  };
  features: {
    pos_enabled?: boolean;
    ecommerce_storefront?: boolean;
    advanced_analytics?: boolean;
    multi_branch?: boolean;
    custom_domain?: boolean;
    api_access?: boolean;
    [key: string]: unknown;
  };
  is_active: boolean;
  is_public: boolean;
  tenants_count?: number;
}

export interface PlatformAuditLog {
  id: number;
  uuid: string;
  user_id: number | null;
  action: string;
  auditable_type: string;
  auditable_id: number;
  tenant_id: number | null;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  tenant?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}
