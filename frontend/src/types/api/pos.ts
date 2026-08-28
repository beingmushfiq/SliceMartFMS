/**
 * SliceMart FMS - Point of Sale (POS) Module TypeScript Contract
 * Aligned with Backend API Resources & Database Schemas
 */

import type { Invoice, SalesOrder } from './sales';

export type PosSessionStatus = 'open' | 'closed' | 'locked';

export interface PosTerminal {
  id: number;
  uuid: string;
  code: string;
  name: string;
  branch_id: number;
  branch_name?: string;
  default_warehouse_id?: number | null;
  default_warehouse_name?: string | null;
  printer_config?: Record<string, unknown> | null;
  is_active: boolean;
  created_at?: string;
}

export interface PosSession {
  id: number;
  uuid: string;
  session_number: string;
  terminal_id: number;
  terminal_name?: string;
  branch_id: number;
  branch_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  user_id: number;
  operator_name?: string;
  opened_at: string;
  closed_at?: string | null;
  opening_cash: string;
  expected_cash: string;
  counted_cash?: string | null;
  cash_variance?: string | null;
  card_total: string;
  mobile_total: string;
  credit_total: string;
  sales_count: number;
  refund_total: string;
  status: PosSessionStatus;
  notes?: string | null;
  created_at?: string;
}

export interface PosCheckoutItemPayload {
  product_id: number;
  quantity: string;
  unit_id: number;
  unit_price: string;
  variant_id?: number | null;
  discount_amount?: string;
  tax_profile_id?: number | null;
  tax_amount?: string;
}

export interface PosCheckoutPaymentPayload {
  method: 'cash' | 'card' | 'mobile_banking' | 'credit_adjustment';
  amount: string;
  change_given?: string;
}

export interface PosCheckoutPayload {
  pos_session_id: number;
  party_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  order_date?: string;
  discount_amount?: string;
  round_off?: string;
  notes?: string | null;
  idempotency_key?: string | null;
  items: PosCheckoutItemPayload[];
  payments: PosCheckoutPaymentPayload[];
}

export interface PosCheckoutResult {
  order: SalesOrder;
  invoice: Invoice;
  session: PosSession;
}
