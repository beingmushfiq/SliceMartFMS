import React, { useState } from 'react';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import { useCurrency } from '../../hooks/useCurrency';
import type {
  Employee,
  Department,
  Designation,
  Shift,
  Attendance,
  LeaveRequest,
  LeaveType,
  PayrollPeriod,
  Payslip,
} from '../../types/api/hr';

type HrTab = 'employees' | 'attendance' | 'leaves' | 'payroll';
type EmploymentType = 'permanent' | 'contract' | 'daily_wage' | 'piece_rate';

export const HrWorkspace: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useWorkspaceTab<HrTab>(
    'payroll',
    ['employees', 'attendance', 'leaves', 'payroll'] as const
  );
  const [selectedEmployeeForBadge, setSelectedEmployeeForBadge] = useState<Employee | null>(null);

  // Master Reference Data
  const [departments] = useState<Department[]>([
    { id: 1, uuid: 'dep-01', code: 'PROD', name: 'Factory Production Floor', is_active: true },
    { id: 2, uuid: 'dep-02', code: 'LOG', name: 'Logistics & Fleet Dispatch', is_active: true },
    { id: 3, uuid: 'dep-03', code: 'ADMIN', name: 'Accounts & Corporate Admin', is_active: true },
  ]);

  const [designations] = useState<Designation[]>([
    { id: 1, uuid: 'des-01', code: 'CUT_OP', name: 'Fabric Cutting Operator', is_active: true },
    { id: 2, uuid: 'des-02', code: 'SEW_OP', name: 'Industrial Sewing Machinist', is_active: true },
    { id: 3, uuid: 'des-03', code: 'RIDER', name: 'Delivery Courier Rider', is_active: true },
    { id: 4, uuid: 'des-04', code: 'ACC', name: 'Senior Accountant', is_active: true },
  ]);

  const [shifts] = useState<Shift[]>([
    {
      id: 1,
      uuid: 'sh-01',
      code: 'MORNING',
      name: 'Standard Morning Shift (09:00 - 17:00)',
      start_time: '09:00:00',
      end_time: '17:00:00',
      crosses_midnight: false,
      break_minutes: 60,
      grace_in_minutes: 15,
      is_active: true,
    },
    {
      id: 2,
      uuid: 'sh-02',
      code: 'EVENING',
      name: 'Factory Night Shift (18:00 - 02:00)',
      start_time: '18:00:00',
      end_time: '02:00:00',
      crosses_midnight: true,
      break_minutes: 45,
      grace_in_minutes: 10,
      is_active: true,
    },
  ]);

  const [leaveTypes] = useState<LeaveType[]>([
    {
      id: 1,
      uuid: 'lt-01',
      code: 'CASUAL',
      name: 'Casual Leave',
      is_paid: true,
      annual_quota_days: '14.0000',
      is_active: true,
    },
    {
      id: 2,
      uuid: 'lt-02',
      code: 'SICK',
      name: 'Medical / Sick Leave',
      is_paid: true,
      annual_quota_days: '14.0000',
      is_active: true,
    },
  ]);

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 1,
      uuid: 'emp-01',
      employee_code: 'EMP-00101',
      first_name: 'Abdul',
      last_name: 'Karim',
      display_name: 'Abdul Karim',
      phone: '+8801711223344',
      email: 'karim.worker@slicemart.com',
      company_id: 1,
      department_id: 1,
      department: departments[0],
      designation_id: 1,
      designation: designations[0],
      employment_type: 'piece_rate',
      employment_status: 'active',
      default_shift_id: 1,
      default_shift: shifts[0],
      date_of_joining: '2026-01-01',
      bank_account_number: '205011928391',
      is_active: true,
    },
    {
      id: 2,
      uuid: 'emp-02',
      employee_code: 'EMP-00102',
      first_name: 'Rahim',
      last_name: 'Uddin',
      display_name: 'Rahim Uddin',
      phone: '+8801722334455',
      company_id: 1,
      department_id: 1,
      department: departments[0],
      designation_id: 2,
      designation: designations[1],
      employment_type: 'piece_rate',
      employment_status: 'active',
      default_shift_id: 1,
      default_shift: shifts[0],
      date_of_joining: '2026-02-15',
      is_active: true,
    },
    {
      id: 3,
      uuid: 'emp-03',
      employee_code: 'EMP-00201',
      first_name: 'Farhana',
      last_name: 'Akter',
      display_name: 'Farhana Akter',
      phone: '+8801733445566',
      email: 'farhana.admin@slicemart.com',
      company_id: 1,
      department_id: 3,
      department: departments[2],
      designation_id: 4,
      designation: designations[3],
      employment_type: 'permanent',
      employment_status: 'active',
      default_shift_id: 1,
      default_shift: shifts[0],
      date_of_joining: '2026-01-01',
      bank_account_number: '150128919201',
      is_active: true,
    },
  ]);

  // Attendance State
  const [attendances] = useState<Attendance[]>([
    {
      id: 1,
      uuid: 'att-01',
      employee_id: 1,
      employee: employees[0],
      attendance_date: '2026-08-28',
      shift_id: 1,
      shift: shifts[0],
      check_in_at: '2026-08-28 09:05:00',
      check_out_at: '2026-08-28 17:15:00',
      worked_minutes: 490,
      late_minutes: 0,
      overtime_minutes: 10,
      status: 'present',
      remarks: 'Full day shift completed on cutting floor',
    },
    {
      id: 2,
      uuid: 'att-02',
      employee_id: 2,
      employee: employees[1],
      attendance_date: '2026-08-28',
      shift_id: 1,
      shift: shifts[0],
      check_in_at: '2026-08-28 09:20:00',
      check_out_at: '2026-08-28 17:20:00',
      worked_minutes: 480,
      late_minutes: 20,
      overtime_minutes: 0,
      status: 'late',
      remarks: 'Late check-in beyond 15m grace period',
    },
  ]);

  // Leave Requests State
  const [leaveRequests] = useState<LeaveRequest[]>([
    {
      id: 1,
      uuid: 'lr-01',
      employee_id: 3,
      employee: employees[2],
      leave_type_id: 1,
      leave_type: leaveTypes[0],
      start_date: '2026-09-02',
      end_date: '2026-09-04',
      total_days: '3.0000',
      reason: 'Family wedding event',
      status: 'approved',
    },
  ]);

  // Payroll Periods & Runs State
  const [payrollPeriods] = useState<PayrollPeriod[]>([
    {
      id: 1,
      uuid: 'pp-01',
      company_id: 1,
      period_code: 'PAY-202608',
      pay_frequency: 'monthly',
      period_start: '2026-08-01',
      period_end: '2026-08-31',
      payment_date: '2026-09-01',
      status: 'closed',
      total_gross: '98500.0000',
      total_deductions: '3500.0000',
      total_net: '95000.0000',
      employee_count: 3,
      locked_at: '2026-08-28 10:00:00',
    },
  ]);

  const [payslips] = useState<Payslip[]>([
    {
      id: 1,
      uuid: 'ps-01',
      payroll_period_id: 1,
      employee_id: 1,
      employee: employees[0],
      payslip_number: 'PS-202608-0001',
      gross_amount: '38500.0000',
      total_earnings: '38500.0000',
      total_deductions: '1000.0000',
      net_amount: '37500.0000',
      produced_quantity: '1280.0000',
      payment_method: 'bank',
      payment_status: 'paid',
      items: [
        {
          salary_component_id: 101,
          component_code: 'PIECE_RATE',
          component_type: 'earning',
          quantity: '1280.0000',
          rate: '30.0000',
          amount: '38400.0000',
        },
        {
          salary_component_id: 102,
          component_code: 'ATTENDANCE_BONUS',
          component_type: 'earning',
          quantity: '1.0000',
          rate: '100.0000',
          amount: '100.0000',
        },
      ],
    },
    {
      id: 2,
      uuid: 'ps-02',
      payroll_period_id: 1,
      employee_id: 3,
      employee: employees[2],
      payslip_number: 'PS-202608-0003',
      gross_amount: '60000.0000',
      total_earnings: '60000.0000',
      total_deductions: '2500.0000',
      net_amount: '57500.0000',
      payment_method: 'bank',
      payment_status: 'paid',
      items: [
        {
          salary_component_id: 201,
          component_code: 'BASIC_SALARY',
          component_type: 'earning',
          quantity: '1.0000',
          rate: '45000.0000',
          amount: '45000.0000',
        },
        {
          salary_component_id: 202,
          component_code: 'HOUSE_RENT',
          component_type: 'earning',
          quantity: '1.0000',
          rate: '15000.0000',
          amount: '15000.0000',
        },
      ],
    },
  ]);

  // Selected payslip view state
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // Onboard Employee Modal State
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmpType, setNewEmpType] = useState<Employee['employment_type']>('piece_rate');
  const [newDeptId, setNewDeptId] = useState(1);

  const handleOnboardEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departments.find((d) => d.id === newDeptId);
    const newEmp: Employee = {
      id: employees.length + 1,
      uuid: `emp-auto-${Date.now()}`,
      employee_code: `EMP-${String(employees.length + 101).padStart(5, '0')}`,
      first_name: newFirstName,
      last_name: newLastName,
      display_name: `${newFirstName} ${newLastName}`.trim(),
      phone: newPhone,
      company_id: 1,
      department_id: newDeptId,
      department: dept,
      employment_type: newEmpType,
      employment_status: 'active',
      default_shift_id: 1,
      default_shift: shifts[0],
      date_of_joining: new Date().toISOString().slice(0, 10),
      is_active: true,
    };

    setEmployees([...employees, newEmp]);
    setShowOnboardModal(false);
    setNewFirstName('');
    setNewLastName('');
    setNewPhone('');
  };

  const pieceRateCount = employees.filter((e) => e.employment_type === 'piece_rate').length;
  const salariedCount = employees.filter((e) => e.employment_type !== 'piece_rate').length;

  return (
    <div className="p-6 space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>👥</span> Human Resources, Attendance & Piece-Rate Payroll
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Employee Directory, Shift & Grace Period Attendance, Phase 3 Piece-Rate Output
            Consumption & Immutable Locked Payroll Runs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnboardModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition flex items-center gap-1 text-sm"
          >
            <span>+</span> Onboard Employee
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Active Workforce
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
            {employees.length} Personnel
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {pieceRateCount} Piece-Rate | {salariedCount} Salaried
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Monthly Payroll Run
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
            {formatCurrency(payrollPeriods[0]?.total_net || '0')}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Period: {payrollPeriods[0]?.period_code} (LOCKED)
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Today's Present Rate
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            100%
          </div>
          <div className="text-xs text-gray-400 mt-1">Shift Grace In: 15 Minutes</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Approved Leave Requests
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {leaveRequests.length} Scheduled
          </div>
          <div className="text-xs text-gray-400 mt-1">Casual & Medical Quota</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6">
        {[
          { id: 'payroll', label: '💰 Payroll Runs & Payslips', count: payslips.length },
          { id: 'employees', label: '👔 Employee Directory', count: employees.length },
          { id: 'attendance', label: '⏱️ Shifts & Attendance', count: attendances.length },
          { id: 'leaves', label: '🏖️ Leave Management', count: leaveRequests.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as HrTab)}
            className={`pb-3 text-sm font-medium transition flex items-center gap-2 relative ${
              activeTab === tab.id
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Payroll Runs & Payslips */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Payroll Period Header Card */}
          {payrollPeriods.map((period) => (
            <div
              key={period.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">
                      {period.period_code}
                    </h3>
                    <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 uppercase tracking-wide">
                      🔒 {period.status} & LOCKED
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Dates: {period.period_start} to {period.period_end} | Disbursed:{' '}
                    {period.payment_date}
                  </p>
                </div>

                <div className="flex gap-6 text-right">
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-semibold">
                      Total Gross
                    </span>
                    <div className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100">
                      {formatCurrency(period.total_gross)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase font-semibold">
                      Total Net Payout
                    </span>
                    <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(period.total_net)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Payslip Items Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                Itemized Worker Payslips
              </h3>
              <span className="text-xs text-gray-500">Includes Phase 3 Piece-Rate Auto-Rollup</span>
            </div>
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Payslip Number</th>
                  <th className="px-6 py-3">Employee Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Output Qty (Pcs)</th>
                  <th className="px-6 py-3 text-right">Gross Amount</th>
                  <th className="px-6 py-3 text-right">Deductions</th>
                  <th className="px-6 py-3 text-right">Net Payable</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {ps.payslip_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {ps.employee?.display_name}
                      </div>
                      <div className="text-xs font-mono text-gray-500">
                        {ps.employee?.employee_code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          ps.employee?.employment_type === 'piece_rate'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}
                      >
                        {ps.employee?.employment_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {ps.produced_quantity
                        ? `${parseFloat(ps.produced_quantity).toFixed(0)} Pcs`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-gray-100">
                      {formatCurrency(ps.gross_amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      {formatCurrency(ps.total_deductions)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(ps.net_amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedPayslip(ps)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded font-medium transition"
                      >
                        View Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Employee Directory */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Full Name</th>
                <th className="px-6 py-3">Department & Designation</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Employment Type</th>
                <th className="px-6 py-3">Shift</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {emp.employee_code}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                    {emp.display_name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {emp.department?.name}
                    </div>
                    <div className="text-xs text-gray-500">{emp.designation?.name}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{emp.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                        emp.employment_type === 'piece_rate'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}
                    >
                      {emp.employment_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {emp.default_shift?.name || 'Standard Shift'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      ACTIVE
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedEmployeeForBadge(emp)}
                      className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded font-semibold border border-indigo-200 dark:border-indigo-800 transition"
                    >
                      🪪 ID Badge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Shifts & Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Check-In</th>
                  <th className="px-6 py-3">Check-Out</th>
                  <th className="px-6 py-3 text-right">Worked (Mins)</th>
                  <th className="px-6 py-3 text-right">Late (Mins)</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {attendances.map((att) => (
                  <tr
                    key={att.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <td className="px-6 py-4">{att.attendance_date}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {att.employee?.display_name}
                      </div>
                      <div className="text-xs font-mono text-gray-500">
                        {att.employee?.employee_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{att.check_in_at}</td>
                    <td className="px-6 py-4 font-mono text-xs">{att.check_out_at}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                      {att.worked_minutes} mins ({(att.worked_minutes / 60).toFixed(1)} hrs)
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      {att.late_minutes} mins
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase ${
                          att.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Leave Management */}
      {activeTab === 'leaves' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Leave Type</th>
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">End Date</th>
                <th className="px-6 py-3 text-right">Days</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {leaveRequests.map((lr) => (
                <tr key={lr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {lr.employee?.display_name}
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                      {lr.employee?.employee_code}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {lr.leave_type?.name}
                  </td>
                  <td className="px-6 py-4 text-xs">{lr.start_date}</td>
                  <td className="px-6 py-4 text-xs">{lr.end_date}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                    {parseFloat(String(lr.total_days))} Days
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{lr.reason}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 uppercase">
                      {lr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Payslip Breakdown Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Payslip Details ({selectedPayslip.payslip_number})
                </h3>
                <p className="text-xs text-gray-500">
                  Employee: {selectedPayslip.employee?.display_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-500 uppercase">
                Itemized Salary & Piece-Rate Earnings
              </div>
              {selectedPayslip.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {item.component_code}
                    </div>
                    {item.quantity && item.rate && (
                      <div className="text-xs text-gray-500">
                        {parseFloat(item.quantity).toFixed(0)} units @ {formatCurrency(item.rate)}
                      </div>
                    )}
                  </div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t dark:border-gray-700 flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-500">Net Payable Amount</span>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(selectedPayslip.net_amount)}
                </div>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Employee Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Onboard New Workforce Member
              </h3>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+88017..."
                  required
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Employment Type
                  </label>
                  <select
                    value={newEmpType}
                    onChange={(e) => setNewEmpType(e.target.value as EmploymentType)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                  >
                    <option value="piece_rate">Piece-Rate Worker</option>
                    <option value="permanent">Permanent Salaried</option>
                    <option value="contract">Contract Staff</option>
                    <option value="daily_wage">Daily Wage</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 text-sm border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow"
                >
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee ID Badge Print Modal */}
      {selectedEmployeeForBadge && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>🪪 Workforce ID Card</span>
              </h3>
              <button
                onClick={() => setSelectedEmployeeForBadge(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Standard CR80 Card Layout Preview */}
            <div className="border-2 border-indigo-500/40 rounded-2xl p-5 bg-linear-to-b from-indigo-900/10 to-transparent flex flex-col items-center text-center space-y-3">
              <div className="w-full flex items-center justify-between border-b border-indigo-500/20 pb-2">
                <span className="font-extrabold text-xs tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                  SLICE MART FMS
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
                  Security Pass
                </span>
              </div>

              {/* Photo Avatar */}
              <div className="size-20 rounded-2xl bg-indigo-100 dark:bg-indigo-950 border-2 border-indigo-400/40 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-300 shadow-inner">
                {selectedEmployeeForBadge.first_name[0]}{selectedEmployeeForBadge.last_name?.[0] ?? ''}
              </div>

              <div>
                <div className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                  {selectedEmployeeForBadge.display_name}
                </div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedEmployeeForBadge.designation?.name ?? 'Factory Operator'}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  {selectedEmployeeForBadge.department?.name ?? 'Production Floor'}
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-left bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[11px] font-mono">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block font-sans">ID Code</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{selectedEmployeeForBadge.employee_code}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block font-sans">Phone</span>
                  <span className="text-gray-700 dark:text-gray-300">{selectedEmployeeForBadge.phone}</span>
                </div>
              </div>

              {/* High-Density Barcode Graphic */}
              <div className="w-full bg-white p-2 rounded-lg border border-gray-300 flex flex-col items-center">
                <div className="font-mono text-[8px] tracking-[3px] text-black font-bold uppercase mb-0.5">
                  ||||| | |||| ||| ||||| || |||||| | ||| ||||
                </div>
                <div className="font-mono text-[9px] text-black font-semibold">
                  *{selectedEmployeeForBadge.employee_code}*
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedEmployeeForBadge(null)}
                className="flex-1 px-3 py-2 text-xs border rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow cursor-pointer"
              >
                🖨️ Print Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrWorkspace;
