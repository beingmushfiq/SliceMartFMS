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
