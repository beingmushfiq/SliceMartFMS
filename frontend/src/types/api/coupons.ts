export interface Coupon {
  id: number;
  uuid: string;
  storefront_id?: number | null;
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed' | 'free_shipping';
  discount_value: string;
  min_order_amount?: string | null;
  max_discount_amount?: string | null;
  applies_to: 'order' | 'product' | 'category';
  applies_to_ids?: number[] | null;
  usage_limit_total?: number | null;
  usage_limit_per_customer?: number | null;
  used_count: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponStats {
  total_coupons: number;
  active_coupons: number;
  total_redemptions: number;
  expired_coupons: number;
}
