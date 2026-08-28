export interface StorefrontConfig {
  id: number;
  uuid: string;
  name: string;
  code: string;
  domain: string | null;
  subdomain: string;
  currency: string;
  locale: string;
  theme: {
    primary_color: string;
    accent_color: string;
    hero_title: string;
    hero_subtitle: string;
  };
  meta_title: string;
  meta_description: string | null;
  guest_checkout_enabled: boolean;
  cod_enabled: boolean;
  online_payment_enabled: boolean;
  whatsapp_number?: string | null;
  whatsapp_ordering_enabled?: boolean;
  whatsapp_default_message?: string | null;
  min_order_amount: string | null;
  status: 'draft' | 'live' | 'maintenance' | 'suspended';
}

export interface StorefrontProductVariant {
  id: number;
  sku: string;
  name: string;
  price: string;
  stock_quantity?: string;
  attributes?: Record<string, string>;
}

export interface StorefrontProduct {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  type: string;
  default_sale_price: string;
  category?: {
    id: number;
    name: string;
    code: string;
  };
  brand?: {
    id: number;
    name: string;
    code: string;
  };
  base_unit?: {
    id: number;
    name: string;
    code: string;
  };
  variants?: StorefrontProductVariant[];
}

export interface StorefrontCartItem {
  id: number;
  uuid: string;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  quantity: string;
  unit_price: string;
  line_discount: string;
  tax_amount: string;
  line_total: string;
  product?: StorefrontProduct;
  variant?: StorefrontProductVariant;
}

export interface StorefrontCart {
  id: number;
  uuid: string;
  session_token: string;
  item_count: number;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  shipping_amount: string;
  total_amount: string;
  coupon_code: string | null;
  status: string;
  items: StorefrontCartItem[];
}

export interface StorefrontCheckoutPayload {
  customer_name: string;
  phone: string;
  email?: string;
  delivery_address: string;
  city?: string;
  payment_method: 'cod' | 'online' | 'bkash' | 'nagad';
  notes?: string;
}

export interface StorefrontOrderConfirmation {
  order_number: string;
  order_uuid: string;
  total_amount: string;
  currency: string;
  payment_method: string;
  status: string;
  tracking_token: string;
}
