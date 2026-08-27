import type { CatalogTimestamped } from './catalog'

export interface PartyAddress {
  id: string
  type: string
  label: string | null
  contact_name: string | null
  phone: string | null
  line1: string
  line2: string | null
  area: string | null
  city: string
  district: string | null
  postal_code: string | null
  country_code: string
  latitude: string | null
  longitude: string | null
  is_default: boolean
}

export interface PartyContact {
  id: string
  name: string
  designation: string | null
  phone: string | null
  email: string | null
  is_primary: boolean
}

export interface Party extends CatalogTimestamped {
  id: string
  code: string
  name: string
  legal_name: string | null
  is_supplier: boolean
  is_customer: boolean
  is_dealer: boolean
  is_agent: boolean
  type: string
  tax_identifier: string | null
  phone: string | null
  email: string | null
  credit_limit: string
  credit_days: number
  price_list_id: string | null
  tax_profile_id: string | null
  opening_balance: string
  current_balance: string
  assigned_to: string | null
  status: string
  addresses?: PartyAddress[]
  contacts?: PartyContact[]
}
