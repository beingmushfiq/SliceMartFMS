/**
 * SliceMart FMS - Sales & Invoicing Module TypeScript Contract
 * Aligned with Backend API Resources & Database Schemas
 */

export type SalesOrderChannel = 'counter' | 'dealer' | 'phone' | 'field' | 'online';

export type SalesOrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'allocated'
  | 'picking'
  | 'packed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export type SalesOrderPaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'pending' | 'failed';

export type InvoiceStatus = 'draft' | 'posted' | 'paid' | 'partially_paid' | 'void';

export type DeliveryOrderStatus =
  'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

export type SalesReturnStatus = 'draft' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface SalesOrderItem {
  id: number;
  uuid: string;
  product_id: number;
  product_name?: string;
  variant_id?: number | null;
  description?: string | null;
  quantity: string;
  unit_id: number;
  unit_price: string;
  discount_percentage?: string;
  discount_amount?: string;
  tax_profile_id?: number | null;
  tax_amount?: string;
  line_total: string;
  delivered_quantity?: string;
  returned_quantity?: string;
  batch_code?: string | null;
  sort_order?: number;
}

export interface SalesOrder {
  id: number;
  uuid: string;
  order_number: string;
  channel: SalesOrderChannel;
  party_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  warehouse_id?: number | null;
  warehouse_name?: string | null;
  order_date: string;
  required_date?: string | null;
  currency_code: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  shipping_amount: string;
  round_off: string;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  delivery_type: string;
  status: SalesOrderStatus;
  payment_status: SalesOrderPaymentStatus;
  notes?: string | null;
  shipping_address?: string | null;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  items?: SalesOrderItem[];
}

export interface InvoiceItem {
  id: number;
  uuid: string;
  invoice_id: number;
  product_id?: number | null;
  product_name?: string;
  description?: string | null;
  quantity: string;
  unit_id?: number | null;
  unit_price: string;
  discount_amount: string;
  tax_profile_id?: number | null;
  tax_amount: string;
  line_total: string;
  sort_order?: number;
}

export interface Invoice {
  id: number;
  uuid: string;
  invoice_number: string;
  sales_order_id?: number | null;
  sales_order_number?: string | null;
  party_id?: number | null;
  customer_name?: string | null;
  branch_id?: number | null;
  invoice_date: string;
  due_date?: string | null;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  shipping_amount: string;
  round_off: string;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  status: InvoiceStatus;
  void_reason?: string | null;
  printed_count: number;
  posted_at?: string | null;
  created_at?: string;
  items?: InvoiceItem[];
}

export interface DeliveryOrderItem {
  id: number;
  uuid: string;
  delivery_order_id: number;
  product_id: number;
  product_name?: string;
  variant_id?: number | null;
  batch_code?: string | null;
  quantity: string;
  delivered_quantity: string;
  returned_quantity: string;
  unit_id: number;
}

export interface DeliveryOrder {
  id: number;
  uuid: string;
  delivery_number: string;
  sales_order_id: number;
  sales_order_number?: string | null;
  invoice_id?: number | null;
  party_id?: number | null;
  warehouse_id: number;
  warehouse_name?: string | null;
  recipient_name: string;
  recipient_phone: string;
  delivery_type: string;
  scheduled_date?: string | null;
  status: DeliveryOrderStatus;
  cod_amount: string;
  cod_collected_amount: string;
  cod_status: string;
  delivery_charge: string;
  package_count: number;
  special_instructions?: string | null;
  delivered_at?: string | null;
  created_at?: string;
  items?: DeliveryOrderItem[];
}

export interface PaymentAllocation {
  id: number;
  uuid: string;
  payment_id: number;
  allocatable_type: string;
  allocatable_id: number;
  amount: string;
}

export interface Payment {
  id: number;
  uuid: string;
  payment_number: string;
  direction: 'in' | 'out';
  party_id?: number | null;
  customer_name?: string | null;
  company_id?: number | null;
  branch_id?: number | null;
  payment_date: string;
  method: string;
  bank_account_id?: number | null;
  reference_number?: string | null;
  amount: string;
  allocated_amount: string;
  unallocated_amount: string;
  currency_code: string;
  status: string;
  notes?: string | null;
  posted_at?: string | null;
  created_at?: string;
  allocations?: PaymentAllocation[];
}

export interface SalesReturnItem {
  id: number;
  uuid: string;
  product_id: number;
  product_name?: string;
  variant_id?: number | null;
  quantity: string;
  unit_id: number;
  unit_price: string;
  line_total: string;
  condition: string;
  batch_code?: string | null;
}

export interface SalesReturn {
  id: number;
  uuid: string;
  return_number: string;
  invoice_id?: number | null;
  sales_order_id?: number | null;
  party_id?: number | null;
  customer_name?: string | null;
  warehouse_id: number;
  warehouse_name?: string | null;
  return_date: string;
  reason_code_id: number;
  reason_code_name?: string | null;
  restock: boolean;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  refund_method: string;
  credit_note_number?: string | null;
  status: SalesReturnStatus;
  approved_at?: string | null;
  created_at?: string;
  items?: SalesReturnItem[];
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type LeadSource = 'website' | 'storefront' | 'referral' | 'cold_outreach' | 'event' | 'social_media';

export interface Lead {
  id: number;
  uuid: string;
  name: string;
  company_name?: string | null;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  deal_value: string;
  currency_code: string;
  assigned_to?: string | null;
  notes?: string | null;
  expected_close_date?: string | null;
  converted_to_customer_id?: number | null;
  created_at: string;
}

export interface CustomerCrm {
  id: number;
  uuid: string;
  name: string;
  type: 'retail' | 'wholesale' | 'dealer' | 'corporate';
  email?: string | null;
  phone: string;
  address?: string | null;
  city?: string | null;
  credit_limit: string;
  current_balance: string;
  loyalty_points: number;
  total_orders_count: number;
  lifetime_value: string;
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
}
