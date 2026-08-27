import type { CatalogTimestamped } from './catalog'

export interface BillOfMaterialItem {
  id: string
  bom_id: string
  product_id: string
  variant_id: string | null
  unit_id: string
  quantity: string
  scrap_percentage: string
  notes: string | null
}

export interface BillOfMaterial extends CatalogTimestamped {
  id: string
  product_id: string
  variant_id: string | null
  code: string
  name: string
  version: number
  output_quantity: string
  output_unit_id: string
  is_active: boolean
  is_default: boolean
  notes: string | null
  items?: BillOfMaterialItem[]
}
