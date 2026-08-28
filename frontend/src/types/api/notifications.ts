export type NotificationSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface NotificationItem {
  id: number;
  uuid: string;
  user_id: number;
  type: string;
  channel: string;
  title_key: string;
  body_key: string;
  params?: Record<string, any>;
  severity: NotificationSeverity;
  action_url?: string;
  sent_at?: string;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  meta: {
    total: number;
    unread_count: number;
  };
}
