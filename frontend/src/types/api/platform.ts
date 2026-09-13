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
  expiring_subscriptions?: number;
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
  status: 'active' | 'trial' | 'past_due' | 'suspended' | 'cancelled' | 'pending' | 'archived';
  effective_status?: string;
  days_remaining?: number | null;
  days_overdue?: number | null;
  is_in_grace_period?: boolean;
  currency_code: string;
  timezone: string;
  plan_id: number;
  users_count?: number;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
  grace_period_ends_at?: string | null;
  grace_period_days?: number | null;
  suspended_at?: string | null;
  archived_at?: string | null;
  settings?: Record<string, unknown> | null;
  created_at: string;
  subscription?: {
    status: string;
    amount: number;
    currency_code?: string;
    billing_cycle?: string;
    starts_at?: string;
    ends_at?: string;
    grace_period_days?: number;
    grace_period_ends_at?: string;
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
    plan_name?: string;
    plan_code?: string;
    status: string;
    amount: number;
    currency_code?: string;
    billing_cycle?: string;
    grace_period_days?: number;
    grace_period_ends_at?: string | null;
    auto_renew?: boolean;
    discount_type?: string;
    discount_value?: number;
    notes?: string | null;
    renewed_by_name?: string | null;
    starts_at: string;
    ends_at: string | null;
    trial_ends_at?: string | null;
  }>;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    status: string;
    roles?: Array<{ name: string; slug: string }>;
  }>;
  usage_counters?: Array<{
    metric: string;
    period: string;
    value: number;
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
  actor_name?: string;
  actor_email?: string;
  tenant?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface PlatformPayment {
  id: number;
  uuid: string;
  tenant_id: number;
  subscription_id?: number | null;
  invoice_reference: string;
  amount: number;
  currency_code: string;
  payment_method: string;
  transaction_reference?: string | null;
  payment_date: string;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  notes?: string | null;
  tenant?: {
    id: number;
    name: string;
    slug: string;
  };
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

export interface PlatformRole {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string | null;
  permissions: string[];
  is_system: boolean;
  users_count?: number;
  created_at?: string;
}

export interface PlatformAdminUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  status: string;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  roles: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

export interface PlatformErrorLogItem {
  id: number;
  uuid: string;
  fingerprint: string;
  tenant_id?: number | null;
  user_id?: number | null;
  error_type: string;
  message: string;
  stack_trace?: string | null;
  severity: 'info' | 'warning' | 'error' | 'critical';
  module?: string | null;
  route?: string | null;
  ip?: string | null;
  browser?: string | null;
  environment: string;
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  resolved_at?: string | null;
  resolution_note?: string | null;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  tenant?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  resolver?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface PlatformFeatureFlag {
  id: number;
  uuid: string;
  key: string;
  tenant_id?: number | null;
  enabled: boolean;
  rollout_percentage?: number | null;
  description: string;
  conditions?: Record<string, unknown> | null;
  tenant?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  created_at?: string;
}

export interface PlatformAnnouncement {
  id: number;
  uuid: string;
  title: string;
  body: string;
  target_type: 'all' | 'plan' | 'tenant';
  target_ids?: number[] | null;
  severity: 'info' | 'warning' | 'critical';
  publish_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  creator?: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string;
}

export interface PlatformSupportTicket {
  id: number;
  uuid: string;
  ticket_number: string;
  tenant_id: number;
  title: string;
  description: string;
  category: 'billing' | 'technical' | 'bug' | 'feature_request' | 'general';
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_tenant' | 'resolved' | 'closed';
  assigned_to?: number | null;
  created_by?: number | null;
  resolved_at?: string | null;
  created_at: string;
  tenant?: {
    id: number;
    name: string;
    slug: string;
  };
  creator?: {
    id: number;
    name: string;
    email: string;
  } | null;
  assignee?: {
    id: number;
    name: string;
    email: string;
  } | null;
  notes_count?: number;
  notes?: PlatformSupportTicketNote[];
}

export interface PlatformSupportTicketNote {
  id: number;
  ticket_id: number;
  note: string;
  is_internal: boolean;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  author?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface PlatformModuleRegistryItem {
  key: string;
  label: string;
  category: string;
  description: string;
  icon: string;
  is_core: boolean;
  default_enabled: boolean;
  min_plan_tier: string;
  capabilities: string[];
}

export interface PlatformSystemHealthData {
  status: 'healthy' | 'degraded' | 'critical';
  checks: {
    database: { status: string; latency_ms?: number; driver?: string; error?: string };
    storage: { status: string; latency_ms?: number; disk?: string; error?: string };
    cache: { status: string; latency_ms?: number; store?: string; error?: string };
    queue: { status: string; queued_jobs?: number; failed_jobs?: number; connection?: string; error?: string };
    integrations: Record<string, { configured: boolean; driver?: string }>;
  };
  server: {
    php_version: string;
    laravel_version: string;
    environment: string;
    server_time: string;
    memory_usage_mb: number;
    memory_peak_mb: number;
  };
}

