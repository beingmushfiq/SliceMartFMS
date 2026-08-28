export type DepreciationMethod =
  'straight_line' | 'declining_balance' | 'units_of_production' | 'none';
export type AssetStatus = 'active' | 'under_maintenance' | 'disposed' | 'written_off';
export type MaintenanceType = 'preventive' | 'corrective' | 'inspection' | 'calibration';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface AssetCategory {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description?: string | undefined;
  default_depreciation_method: DepreciationMethod;
  default_useful_life_months: number;
  default_salvage_percentage: string;
  is_active: boolean;
  created_at?: string | undefined;
}

export interface Asset {
  id: number;
  uuid: string;
  asset_code: string;
  name: string;
  description?: string | undefined;
  asset_category_id: number;
  category?: AssetCategory | undefined;
  company_id: number;
  branch_id?: number | undefined;
  factory_id?: number | undefined;
  purchase_date: string;
  purchase_cost: string;
  salvage_value: string;
  useful_life_months: number;
  depreciation_method: DepreciationMethod;
  accumulated_depreciation: string;
  book_value: string;
  status: AssetStatus;
  location?: string | undefined;
  serial_number?: string | undefined;
  warranty_expiry_date?: string | undefined;
  created_at?: string | undefined;
}

export interface AssetDepreciationEntry {
  id: number;
  uuid: string;
  asset_id: number;
  asset?: Asset | undefined;
  period_year: number;
  period_month: number;
  opening_book_value: string;
  depreciation_amount: string;
  closing_book_value: string;
  journal_entry_id?: number | undefined;
  posted_at?: string | undefined;
  created_at?: string | undefined;
}

export interface MaintenanceOrder {
  id: number;
  uuid: string;
  order_number: string;
  asset_id: number;
  asset?: Asset | undefined;
  maintenance_type: MaintenanceType;
  priority: MaintenancePriority;
  description: string;
  scheduled_date: string;
  completed_date?: string | undefined;
  cost: string;
  status: MaintenanceStatus;
  performed_by?: string | undefined;
  remarks?: string | undefined;
  created_at?: string | undefined;
}
