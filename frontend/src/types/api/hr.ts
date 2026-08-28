export type EmploymentType = 'permanent' | 'contract' | 'daily_wage' | 'piece_rate' | 'probation';
export type EmploymentStatus = 'active' | 'on_leave' | 'suspended' | 'resigned' | 'terminated';

export interface Department {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description?: string | undefined;
  is_active: boolean;
  created_at?: string | undefined;
}

export interface Designation {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description?: string | undefined;
  is_active: boolean;
  created_at?: string | undefined;
}

export interface Shift {
  id: number;
  uuid: string;
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  crosses_midnight: boolean;
  break_minutes: number;
  grace_in_minutes: number;
  is_active: boolean;
  created_at?: string | undefined;
}

export interface Employee {
  id: number;
  uuid: string;
  employee_code: string;
  user_id?: number | undefined;
  company_id: number;
  branch_id?: number | undefined;
  department_id?: number | undefined;
  department?: Department | undefined;
  designation_id?: number | undefined;
  designation?: Designation | undefined;
  first_name: string;
  last_name?: string | undefined;
  display_name: string;
  phone: string;
  email?: string | undefined;
  employment_type: EmploymentType;
  employment_status: EmploymentStatus;
  default_shift_id?: number | undefined;
  default_shift?: Shift | undefined;
  date_of_joining?: string | undefined;
  bank_name?: string | undefined;
  bank_account_number?: string | undefined;
  mobile_wallet_number?: string | undefined;
  is_active: boolean;
  created_at?: string | undefined;
}

export type AttendanceStatus =
  'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'holiday' | 'weekly_off';

export interface Attendance {
  id: number;
  uuid: string;
  employee_id: number;
  employee?: Employee | undefined;
  attendance_date: string;
  shift_id?: number | undefined;
  shift?: Shift | undefined;
  check_in_at?: string | undefined;
  check_out_at?: string | undefined;
  worked_minutes: number;
  late_minutes: number;
  overtime_minutes: number;
  status: AttendanceStatus;
  remarks?: string | undefined;
  created_at?: string | undefined;
}

export interface LeaveType {
  id: number;
  uuid: string;
  code: string;
  name: string;
  is_paid: boolean;
  annual_quota_days: string;
  is_active: boolean;
  created_at?: string | undefined;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: number;
  uuid: string;
  employee_id: number;
  employee?: Employee | undefined;
  leave_type_id: number;
  leave_type?: LeaveType | undefined;
  start_date: string;
  end_date: string;
  total_days: string | number;
  reason: string;
  status: LeaveStatus;
  approved_by?: number | undefined;
  approved_at?: string | undefined;
  created_at?: string | undefined;
}

export type PayrollPeriodStatus =
  'open' | 'calculating' | 'calculated' | 'approved' | 'paid' | 'closed';

export interface PayrollPeriod {
  id: number;
  uuid: string;
  company_id: number;
  period_code: string;
  pay_frequency: string;
  period_start: string;
  period_end: string;
  payment_date: string;
  status: PayrollPeriodStatus;
  total_gross: string;
  total_deductions: string;
  total_net: string;
  employee_count: number;
  locked_at?: string | undefined;
  created_at?: string | undefined;
}

export interface PayslipItem {
  id?: number | undefined;
  payslip_id?: number | undefined;
  salary_component_id: number;
  component_code: string;
  component_type: 'earning' | 'deduction';
  calculation_basis?: Record<string, unknown> | undefined;
  quantity?: string | undefined;
  rate?: string | undefined;
  amount: string;
  sort_order?: number | undefined;
}

export interface Payslip {
  id: number;
  uuid: string;
  payroll_period_id: number;
  payroll_period?: PayrollPeriod | undefined;
  employee_id: number;
  employee?: Employee | undefined;
  payslip_number: string;
  gross_amount: string;
  total_earnings: string;
  total_deductions: string;
  net_amount: string;
  produced_quantity?: string | undefined;
  payment_method: string;
  payment_status: string;
  items?: PayslipItem[] | undefined;
  created_at?: string | undefined;
}
