export interface CatalogTimestamped {
  created_at: string | null
  updated_at: string | null
}

export interface Category extends CatalogTimestamped {
  id: string
  parent_id: string | null
  code: string
  name: string
  path: string | null
  is_active: boolean
  parent?: Category | null
  children?: Category[] | null
}

export interface Brand extends CatalogTimestamped {
  id: string
  code: string
  name: string
  logo_path: string | null
  is_active: boolean
}

export interface Product extends CatalogTimestamped {
  id: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  type: string
  category_id: string | null
  brand_id: string | null
  base_unit_id: string
  purchase_unit_id: string | null
  sales_unit_id: string | null
  is_produced: boolean
  is_purchased: boolean
  is_sold: boolean
  is_stock_tracked: boolean
  has_variants: boolean
  tracking_mode: string
  shelf_life_days: number | null
  reorder_level: string | null
  reorder_quantity: string | null
  standard_cost: string
  default_sale_price: string
  tax_profile_id: string | null
  weight: string | null
  dimensions: Record<string, unknown> | null
  is_online: boolean
  online_slug: string | null
  online_meta: Record<string, unknown> | null
  status: string
}
