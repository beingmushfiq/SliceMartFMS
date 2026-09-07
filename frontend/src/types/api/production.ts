export interface ProductionPlanItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  bom_id: string;
  bom_name?: string;
  planned_quantity: string;
  completed_quantity: string;
  notes?: string | null;
}

export interface ProductionPlan {
  id: string;
  plan_number: string;
  title: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  notes?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  items: ProductionPlanItem[];
  created_at: string;
  updated_at: string;
}

export interface ProductionBatchInput {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  warehouse_id: string;
  warehouse_name?: string;
  warehouse_location_id?: string | null;
  warehouse_location_name?: string | null;
  planned_quantity: string;
  actual_quantity: string;
  unit_cost: string;
  total_cost: string;
  created_at: string;
}

export interface ProductionOutput {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  warehouse_id: string;
  warehouse_name?: string;
  warehouse_location_id?: string | null;
  warehouse_location_name?: string | null;
  output_type: 'finished_good' | 'byproduct' | 'co_product';
  good_quantity: string;
  rejected_quantity: string;
  unit_cost: string;
  total_cost: string;
  created_at: string;
}

export interface ProductionBatch {
  id: string;
  batch_number: string;
  plan_id?: string | null;
  plan_number?: string | null;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  bom_id: string;
  bom_name?: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'closed';
  context_completeness: 'draft' | 'collecting' | 'context_complete' | 'analysed' | 'closed';
  target_quantity: string;
  actual_quantity: string;
  planned_quantity?: string;
  output_unit_id?: string;
  output_unit_code?: string;
  total_input_quantity: string;
  total_output_quantity: string;
  expected_yield_pct: string | null;
  actual_yield_pct: string | null;
  yield_variance_pct: string | null;
  yield_percentage?: string | null;
  variance_quantity?: string | null;
  variance_percentage?: string | null;
  process_loss_quantity: string;
  batch_date?: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  notes?: string | null;
  inputs?: ProductionBatchInput[];
  outputs?: ProductionOutput[];
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  status: 'active' | 'inactive' | 'terminated';
}

export interface WorkerProductionEntry {
  id: string;
  batch_id: string;
  batch_number?: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  work_date: string;
  shift: 'morning' | 'evening' | 'night' | 'general';
  wage_type: 'piece_rate' | 'hourly';
  good_quantity: string;
  rework_quantity: string;
  rejected_quantity: string;
  hours_worked?: string | null;
  piece_rate?: string | null;
  total_earned?: string | null;
  status: 'draft' | 'verified';
  verified_by?: string | null;
  verified_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerOutputSummary {
  total_entries: number;
  total_good_quantity: string;
  total_rework_quantity: string;
  total_rejected_quantity: string;
  total_earned: string;
}
