// ─────────────────────────────────────────────────────────────
// WORKFORCE — Employee management and attendance
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Users, UserCheck, Calendar, UserPlus } from 'lucide-react';
import { KPICard } from '../../components/ui/KPICard';
import { StatusBadge } from '../../components/ui/Badge';
import { Tabs, TabList, TabTrigger, TabPanel } from '../../components/ui/Tabs';
import { SearchInput } from '../../components/ui/FormElements';
import { Button } from '../../components/ui/Button';
import { cn, formatBDT } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { ATTENDANCE_RECORDS } from '../../data/mockData';
import { QuickAddEmployeeModal } from '../../components/modals/QuickEntryModals';

export default function Workforce() {
  const employees = useAppStore(s => s.employees);
  const [search, setSearch] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const filtered = employees.filter(e =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.designation.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const present    = ATTENDANCE_RECORDS.filter(a => a.date === '2026-08-17' && a.status === 'present').length;
  const absent     = ATTENDANCE_RECORDS.filter(a => a.date === '2026-08-17' && a.status === 'absent').length;
  const onLeave    = ATTENDANCE_RECORDS.filter(a => a.date === '2026-08-17' && a.status === 'on_leave').length;

  const todayAttendance = ATTENDANCE_RECORDS.filter(a => a.date === '2026-08-17');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-700 text-slate-900">Workforce Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Employee records, attendance, shift tracking, and instant operator onboarding</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setShowAddEmployee(true)}
        >
          Quick Onboard Worker
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Employees" value={employees.length} icon={<Users className="w-4.5 h-4.5" />} iconColor="bg-blue-50 text-blue-600" />
        <KPICard label="Present Today"   value={present}          icon={<UserCheck className="w-4.5 h-4.5" />} iconColor="bg-success-50 text-success-600" alert="success" />
        <KPICard label="Absent Today"    value={absent}           icon={<UserCheck className="w-4.5 h-4.5" />} iconColor="bg-error-50 text-error-600" alert={absent > 0 ? 'warning' : undefined} />
        <KPICard label="On Leave"        value={onLeave}          icon={<Calendar className="w-4.5 h-4.5" />} iconColor="bg-slate-100 text-slate-500" />
      </div>

      <Tabs defaultTab="employees">
        <TabList>
          <TabTrigger id="employees"  count={employees.length}>Employees</TabTrigger>
          <TabTrigger id="attendance" count={todayAttendance.length}>Today's Attendance</TabTrigger>
          <TabTrigger id="performance">Performance</TabTrigger>
        </TabList>

        <div className="card mt-4">
          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-100">
            <SearchInput
              placeholder="Search by name, designation, department…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Employees Tab */}
          <TabPanel id="employees">
            <div className="overflow-x-auto">
              <table className="data-table" aria-label="Employee list">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Shift</th>
                    <th className="col-numeric">Salary (৳)</th>
                    <th>Status</th>
                    <th>Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr key={emp.id}>
                      <td>
                        <div>
                          <p className="font-600 text-slate-900">{emp.name}</p>
                          <p className="text-2xs text-slate-400 font-mono">{emp.phone}</p>
                        </div>
                      </td>
                      <td className="font-mono text-2xs text-slate-500">{emp.employeeId}</td>
                      <td>
                        <span className="badge badge-slate">{emp.department}</span>
                      </td>
                      <td className="text-slate-600">{emp.designation}</td>
                      <td>
                        <span className={cn(
                          'badge',
                          emp.shift === 'morning'   && 'badge-blue',
                          emp.shift === 'afternoon' && 'badge-amber',
                          emp.shift === 'night'     && 'badge-slate'
                        )}>
                          {emp.shift}
                        </span>
                      </td>
                      <td className="col-numeric font-mono">{formatBDT(emp.salary)}</td>
                      <td>
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="text-2xs text-slate-400 font-mono">{emp.joinDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabPanel>

          {/* Attendance Tab */}
          <TabPanel id="attendance">
            <div className="overflow-x-auto">
              <table className="data-table" aria-label="Today attendance">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Shift</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Overtime (hrs)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.map(a => {
                    const emp = employees.find(e => e.id === a.employeeId);
                    return (
                      <tr key={a.id}>
                        <td>
                          <p className="font-600 text-slate-900">{emp?.name ?? a.employeeId}</p>
                          <p className="text-2xs text-slate-400">{emp?.designation}</p>
                        </td>
                        <td className="capitalize text-slate-600">{a.shift}</td>
                        <td className="font-mono text-slate-600">{a.checkIn ?? '—'}</td>
                        <td className="font-mono text-slate-600">{a.checkOut ?? '—'}</td>
                        <td className="font-mono text-slate-600">{(a.overtimeHours ?? 0) > 0 ? `+${a.overtimeHours}h` : '—'}</td>
                        <td>
                          <span className={cn(
                            'badge',
                            a.status === 'present'  && 'badge-green',
                            a.status === 'absent'   && 'badge-red',
                            a.status === 'late'     && 'badge-amber',
                            a.status === 'on_leave' && 'badge-slate'
                          )}>
                            {a.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabPanel>

          {/* Performance Tab */}
          <TabPanel id="performance">
            <div className="p-6">
              <h3 className="text-sm font-700 text-slate-900 mb-4">Worker Output & Shift Efficiency</h3>
              <div className="space-y-4 max-w-xl">
                {employees.slice(0, 6).map(emp => {
                  const score = Math.floor(82 + (parseInt(emp.id.replace(/\D/g, '')) * 3) % 18);
                  return (
                    <div key={emp.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-600 text-slate-800">{emp.name} ({emp.designation})</span>
                        <span className="font-mono font-700 text-blue-600">{score}% Target Met</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            score >= 90 ? 'bg-emerald-500' : score >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                          )}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabPanel>
        </div>
      </Tabs>

      {/* Quick Add Employee Modal */}
      <QuickAddEmployeeModal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
      />
    </div>
  );
}
