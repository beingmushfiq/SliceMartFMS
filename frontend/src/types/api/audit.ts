export interface AuditLogItem {
  id: number;
  uuid: string;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  action: string;
  auditable_type: string;
  auditable_id?: number | string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  changed_fields?: string[];
  context?: Record<string, any>;
  ip?: string;
  user_agent?: string;
  correlation_id?: string;
  created_at: string;
}

export interface AuditLogListResponse {
  data: AuditLogItem[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}
