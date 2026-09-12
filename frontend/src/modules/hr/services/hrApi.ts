/**
 * SliceMart HR & Workforce API Service Layer
 * Fully typed client communicating with Laravel backend /api/v1/hr/*
 */

import { api } from '../../../lib/api/client';

export interface EmployeeApiItem {
  id: number;
  uuid?: string;
  employee_code: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  display_name: string;
  email?: string;
  phone: string;
  employment_type?: string;
  designation?: string;
  department?: string;
  department_id?: number;
  shift?: string;
  status: 'active' | 'on_leave' | 'suspended' | 'resigned' | 'terminated';
  date_of_joining?: string;
  bank_name?: string;
  bank_account_number?: string;
  mobile_wallet_number?: string;
  national_id?: string;
}

export interface DepartmentApiItem {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  employees_count?: number;
}

export interface DesignationApiItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  employees_count?: number;
}

export interface ShiftApiItem {
  id: number;
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  grace_in_minutes: number;
  is_active: boolean;
  employees_count?: number;
}

export interface AttendanceApiItem {
  id: number;
  employee_id: number;
  attendance_date: string;
  check_in_at?: string;
  check_out_at?: string;
  working_hours?: number;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'on_leave' | 'holiday';
  employee?: {
    display_name?: string;
    first_name?: string;
    employee_code?: string;
    department?: { name: string };
    designation?: { name: string };
  };
  shift?: {
    name: string;
    start_time: string;
    end_time: string;
  };
}

export interface AttendanceSummaryApi {
  date: string;
  total_workforce: number;
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  present_rate_percent: number;
}

export interface BadgePunchResult {
  success: boolean;
  type: 'clock_in' | 'clock_out';
  status?: string;
  message: string;
  employee: {
    id: number;
    name: string;
    employee_code: string;
    department?: string;
    designation?: string;
  };
}

export interface LeaveRequestApiItem {
  id: number;
  request_number: string;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: string | number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  employee?: {
    display_name?: string;
    employee_code?: string;
    department?: { name: string };
  };
  leaveType?: {
    name: string;
    code: string;
  };
}

export interface LeaveBalanceApiItem {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  opening_days: number | string;
  accrued_days: number | string;
  used_days: number | string;
  balance_days: number | string;
  leave_type?: {
    name: string;
    code: string;
  };
}

export interface SalaryStructureApiItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  currency_code: string;
  is_active: boolean;
  components?: Array<{
    id: number;
    salary_structure_id: number;
    component_id: number;
    calculation_type: 'fixed' | 'percentage';
    amount_or_percentage: string | number;
    sort_order: number;
    component?: {
      code: string;
      name: string;
      component_type: 'earning' | 'deduction';
      is_taxable: boolean;
    };
  }>;
}

export interface SalaryComponentApiItem {
  id: number;
  code: string;
  name: string;
  component_type: 'earning' | 'deduction';
  is_taxable: boolean;
  affects_gross: boolean;
}

export interface PayrollPeriodApiItem {
  id: number;
  period_code: string;
  pay_frequency: string;
  period_start: string;
  period_end: string;
  payment_date: string;
  status: 'open' | 'processing' | 'approved' | 'paid' | 'locked';
  total_gross: string | number;
  total_deductions: string | number;
  total_net: string | number;
  employee_count: number;
}

export interface PayslipApiItem {
  id: number;
  payslip_number: string;
  payroll_period_id: number;
  employee_id: number;
  gross_salary: string | number;
  total_deductions: string | number;
  net_salary: string | number;
  status: 'draft' | 'approved' | 'paid';
  employee?: {
    display_name?: string;
    employee_code?: string;
    department?: { name: string };
    designation?: { name: string };
  };
  items?: Array<{
    id: number;
    component_id: number;
    amount: string | number;
    component?: {
      name: string;
      component_type: 'earning' | 'deduction';
    };
  }>;
}

export interface PayrollAdvanceApiItem {
  id: number;
  advance_number: string;
  employee_id: number;
  amount: string | number;
  issued_on: string;
  installment_amount: string | number;
  recovered_amount: string | number;
  status: 'active' | 'recovered' | 'written_off';
  notes?: string;
  employee?: {
    display_name?: string;
    employee_code?: string;
    department?: { name: string };
  };
}

export interface EmployeeDocumentApiItem {
  id: number;
  employee_id: number;
  document_type: 'nid' | 'contract' | 'certificate' | 'photo' | 'health_pass' | 'other';
  issued_on?: string;
  expires_on?: string;
  notes?: string;
  created_at?: string;
}

export const hrApi = {
  // Employees
  async getEmployees(params?: { search?: string; department_id?: number; employment_type?: string; employment_status?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.department_id) query.set('department_id', String(params.department_id));
    if (params?.employment_type) query.set('employment_type', params.employment_type);
    if (params?.employment_status) query.set('employment_status', params.employment_status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<{ data: EmployeeApiItem[] }>(`/hr/employees${qs}`);
  },

  async createEmployee(payload: Record<string, unknown>) {
    return api.post<{ data: EmployeeApiItem; message: string }>('/hr/employees', payload);
  },

  async updateEmployee(id: number, payload: Record<string, unknown>) {
    return api.put<{ data: EmployeeApiItem; message: string }>(`/hr/employees/${id}`, payload);
  },

  async toggleEmployeeStatus(id: number) {
    return api.post<{ data: EmployeeApiItem; message: string }>(`/hr/employees/${id}/toggle-status`);
  },

  async getEmployeeDocuments(id: number) {
    return api.get<{ data: EmployeeDocumentApiItem[] }>(`/hr/employees/${id}/documents`);
  },

  async addEmployeeDocument(id: number, payload: { document_type: string; notes?: string; expires_on?: string }) {
    return api.post<{ data: EmployeeDocumentApiItem; message: string }>(`/hr/employees/${id}/documents`, payload);
  },

  // Departments, Designations & Shifts
  async getDepartments(activeOnly = false) {
    return api.get<{ data: DepartmentApiItem[] }>(`/hr/departments${activeOnly ? '?active_only=1' : ''}`);
  },

  async createDepartment(payload: { code: string; name: string; is_active?: boolean }) {
    return api.post<{ data: DepartmentApiItem; message: string }>('/hr/departments', payload);
  },

  async updateDepartment(id: number, payload: Partial<DepartmentApiItem>) {
    return api.put<{ data: DepartmentApiItem; message: string }>(`/hr/departments/${id}`, payload);
  },

  async getDesignations(activeOnly = false) {
    return api.get<{ data: DesignationApiItem[] }>(`/hr/designations${activeOnly ? '?active_only=1' : ''}`);
  },

  async createDesignation(payload: { code: string; name: string; description?: string; is_active?: boolean }) {
    return api.post<{ data: DesignationApiItem; message: string }>('/hr/designations', payload);
  },

  async getShifts(activeOnly = false) {
    return api.get<{ data: ShiftApiItem[] }>(`/hr/shifts${activeOnly ? '?active_only=1' : ''}`);
  },

  async createShift(payload: { code: string; name: string; start_time: string; end_time: string; break_minutes?: number; grace_in_minutes?: number }) {
    return api.post<{ data: ShiftApiItem; message: string }>('/hr/shifts', payload);
  },

  // Attendance & Badge Kiosk
  async getAttendances(params?: { date?: string; employee_id?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.employee_id) query.set('employee_id', String(params.employee_id));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<{ data: AttendanceApiItem[] }>(`/hr/attendances${qs}`);
  },

  async recordAttendance(payload: { employee_id: number; attendance_date: string; status?: string; shift_id?: number; check_in_at?: string; check_out_at?: string; remarks?: string }) {
    return api.post<{ data: AttendanceApiItem; message: string }>('/hr/attendances', payload);
  },

  async getAttendanceSummary(date?: string) {
    return api.get<AttendanceSummaryApi>(`/hr/attendances/summary${date ? `?date=${date}` : ''}`);
  },

  async punchBadge(badge_id: string, timestamp?: string) {
    return api.post<BadgePunchResult>('/hr/attendances/punch-badge', { badge_id, timestamp });
  },

  // Leaves & Balances
  async getLeaveRequests(params?: { status?: string; employee_id?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.employee_id) query.set('employee_id', String(params.employee_id));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<{ data: LeaveRequestApiItem[] }>(`/hr/leaves${qs}`);
  },

  async getLeaveTypes() {
    return api.get<{ data: Array<{ id: number; code: string; name: string; days_allowed: number }> }>('/hr/leaves/types');
  },

  async getLeaveBalances(params?: { employee_id?: number; year?: number }) {
    const query = new URLSearchParams();
    if (params?.employee_id) query.set('employee_id', String(params.employee_id));
    if (params?.year) query.set('year', String(params.year));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<{ data: LeaveBalanceApiItem[] }>(`/hr/leaves/balances${qs}`);
  },

  async submitLeaveRequest(payload: { employee_id: number; leave_type_id: number; start_date: string; end_date: string; total_days: number; reason?: string }) {
    return api.post<{ data: LeaveRequestApiItem; message: string }>('/hr/leaves', payload);
  },

  async approveLeave(id: number) {
    return api.post<{ data: LeaveRequestApiItem; message: string }>(`/hr/leaves/${id}/approve`);
  },

  async rejectLeave(id: number, rejection_reason?: string) {
    return api.post<{ data: LeaveRequestApiItem; message: string }>(`/hr/leaves/${id}/reject`, { rejection_reason });
  },

  // Salary Structures & Compensation
  async getSalaryStructures() {
    return api.get<{ data: SalaryStructureApiItem[] }>('/hr/salary-structures');
  },

  async getSalaryComponents() {
    return api.get<{ data: SalaryComponentApiItem[] }>('/hr/salary-structures/components');
  },

  async createSalaryStructure(payload: { code: string; name: string; description?: string; components: Array<{ salary_component_id: number; calculation_type: 'fixed' | 'percentage'; value: number }> }) {
    return api.post<{ data: SalaryStructureApiItem; message: string }>('/hr/salary-structures', payload);
  },

  // Payroll Periods, Payslips & Advances
  async getPayrollPeriods() {
    return api.get<{ data: PayrollPeriodApiItem[] }>('/hr/payroll/periods');
  },

  async createPayrollPeriod(payload: { period_code: string; pay_frequency: string; period_start: string; period_end: string; payment_date: string }) {
    return api.post<{ data: PayrollPeriodApiItem; message: string }>('/hr/payroll/periods', payload);
  },

  async processPayrollPeriod(id: number) {
    return api.post<{ data: PayrollPeriodApiItem; message: string }>(`/hr/payroll/periods/${id}/process`);
  },

  async disbursePayrollPeriod(id: number, payload?: { bank_reference?: string; payment_method?: string }) {
    return api.post<{ data: PayrollPeriodApiItem; message: string }>(`/hr/payroll/periods/${id}/disburse`, payload);
  },

  async getBankAdvice(id: number) {
    return api.get<{ period_code: string; total_net: number; advice_records: Array<Record<string, unknown>> }>(`/hr/payroll/periods/${id}/bank-advice`);
  },

  async getPayslips(params?: { payroll_period_id?: number; employee_id?: number }) {
    const query = new URLSearchParams();
    if (params?.payroll_period_id) query.set('payroll_period_id', String(params.payroll_period_id));
    if (params?.employee_id) query.set('employee_id', String(params.employee_id));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<{ data: PayslipApiItem[] }>(`/hr/payroll/payslips${qs}`);
  },

  async createPayslip(payload: {
    payroll_period_id: number;
    employee_id: number;
    gross_amount: number;
    total_deductions?: number | undefined;
    payment_method?: string | undefined;
    produced_quantity?: number | undefined;
    remarks?: string | undefined;
    items?: Array<{
      salary_component_id?: number | undefined;
      component_code?: string | undefined;
      component_name?: string | undefined;
      component_type: 'earning' | 'deduction';
      quantity?: number | undefined;
      rate?: number | undefined;
      amount: number;
    }> | undefined;
  }) {
    return api.post<{ data: PayslipApiItem; message: string }>('/hr/payroll/payslips', payload);
  },

  async getPayrollAdvances(params?: { status?: string; employee_id?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.employee_id) query.set('employee_id', String(params.employee_id));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<{ data: PayrollAdvanceApiItem[] }>(`/hr/payroll/advances${qs}`);
  },

  async requestPayrollAdvance(payload: { employee_id: number; amount: number; issued_on: string; installment_amount: number; notes?: string }) {
    return api.post<{ data: PayrollAdvanceApiItem; message: string }>('/hr/payroll/advances', payload);
  },
};

