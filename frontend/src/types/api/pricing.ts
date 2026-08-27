import type { CatalogTimestamped } from './catalog'

export interface PriceListItem {
  id: string
  price_list_id: string
  product_id: string
  variant_id: string | null
  min_quantity: string
  unit_price: string
  discount_percentage: string
}

export interface PriceList extends CatalogTimestamped {
  id: string
  code: string
  name: string
  currency_code: string
  applies_to: string
  channel: string | null
  priority: number
  valid_from: string | null
  valid_to: string | null
  is_active: boolean
  items?: PriceListItem[]
}

export interface DiscountRule extends CatalogTimestamped {
  id: string
  name: string
  scope: string
  scope_id: string | null
  condition: Record<string, unknown> | null
  discount_type: string
  value: string
  valid_from: string | null
  valid_to: string | null
  priority: number
  is_active: boolean
}

export interface TaxProfile extends CatalogTimestamped {
  id: string
  code: string
  name: string
  rate: string
  type: string
  is_compound: boolean
  is_active: boolean
}
