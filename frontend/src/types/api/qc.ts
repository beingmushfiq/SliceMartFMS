export interface QcParameter {
  id: string;
  code: string;
  name: string;
  category: string;
  data_type: 'numeric' | 'boolean' | 'options' | 'text';
  min_value?: string | null;
  max_value?: string | null;
  target_value?: string | null;
  unit_of_measure?: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QcInspectionResult {
  id: string;
  qc_parameter_id: string;
  parameter_code?: string;
  parameter_name?: string;
  measured_value?: string | null;
  measured_text?: string | null;
  is_passed: boolean;
  remarks?: string | null;
}

export interface QcDefect {
  id: string;
  defect_type: string;
  severity: 'minor' | 'major' | 'critical';
  quantity: string;
  description?: string | null;
}

export interface QcInspection {
  id: string;
  inspection_number: string;
  batch_id?: string | null;
  batch_number?: string | null;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  inspection_type: 'incoming' | 'in_process' | 'final';
  status: 'draft' | 'in_progress' | 'passed' | 'rejected' | 'rework';
  sample_size: string;
  inspected_quantity: string;
  passed_quantity: string;
  rejected_quantity: string;
  inspection_date: string;
  inspector_name?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string | null;
  results?: QcInspectionResult[];
  defects?: QcDefect[];
  created_at: string;
  updated_at: string;
}

export interface WastageRecord {
  id: string;
  record_number: string;
  batch_id?: string | null;
  batch_number?: string | null;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  warehouse_id: string;
  warehouse_name?: string;
  warehouse_location_id?: string | null;
  reason_code_id: string;
  reason_code?: string;
  reason_name?: string;
  quantity: string;
  unit_cost: string;
  total_cost: string;
  recorded_date: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}
