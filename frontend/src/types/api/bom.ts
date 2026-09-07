import type { CatalogTimestamped } from './catalog';

export interface BillOfMaterialItem {
  id?: string;
  bom_id?: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  variant_id?: string | null;
  unit_id: string;
  unit_code?: string;
  quantity: string | number;
  standard_cost?: number;
  scrap_percentage?: string;
  wastage_allowance_percentage?: string;
  is_optional?: boolean;
  sort_order?: number;
  notes?: string | null;
}

export interface BillOfMaterial extends CatalogTimestamped {
  id: string;
  product_id: string;
  variant_id: string | null;
  code: string;
  name: string;
  version: number | string;
  output_quantity: string;
  output_unit_id: string;
  is_active: boolean;
  is_default: boolean;
  notes: string | null;
  items?: BillOfMaterialItem[];
}
