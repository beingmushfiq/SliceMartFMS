import { useState } from 'react';
import {
  Briefcase,
  Building2,
  Clock,
} from 'lucide-react';
import type { Department, Designation, Shift } from '../../../types/api/hr';

interface Props {
  departments: Department[];
  designations: Designation[];
  shifts: Shift[];
}

export function DepartmentsSetupSection({
  departments,
  designations,
  shifts,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'departments' | 'designations' | 'shifts'>('departments');

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-default">Organization Hierarchy & Operational Setup</h2>
          <p className="text-xs text-muted">
            Manage business units, departments, job designations, and factory work shift schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-sunken p-1 rounded-xl border border-default">
            <button
              onClick={() => setActiveSubTab('departments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSubTab === 'departments'
                  ? 'bg-surface text-default shadow-xs font-semibold'
                  : 'text-muted hover:text-default'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Departments ({departments.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('designations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSubTab === 'designations'
                  ? 'bg-surface text-default shadow-xs font-semibold'
                  : 'text-muted hover:text-default'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Designations ({designations.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('shifts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSubTab === 'shifts'
                  ? 'bg-surface text-default shadow-xs font-semibold'
                  : 'text-muted hover:text-default'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Shift Schedules ({shifts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Departments Table */}
      {activeSubTab === 'departments' && (
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Department Code</th>
                <th className="px-4 py-3.5">Department Name</th>
                <th className="px-4 py-3.5">Operational Scope</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {departments.map((dep) => (
                <tr key={dep.id} className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-default">{dep.code}</td>
                  <td className="px-4 py-3.5 font-semibold text-default">{dep.name}</td>
                  <td className="px-4 py-3.5 text-muted">Core Enterprise Operations</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-subtle text-success border border-success">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Designations Table */}
      {activeSubTab === 'designations' && (
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Designation Code</th>
                <th className="px-4 py-3.5">Job Title</th>
                <th className="px-4 py-3.5">Grade / Classification</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {designations.map((des) => (
                <tr key={des.id} className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-default">{des.code}</td>
                  <td className="px-4 py-3.5 font-semibold text-default">{des.name}</td>
                  <td className="px-4 py-3.5 text-muted">Standard Operational Band</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-subtle text-success border border-success">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Shifts Table */}
      {activeSubTab === 'shifts' && (
        <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Shift Code</th>
                <th className="px-4 py-3.5">Shift Title</th>
                <th className="px-4 py-3.5">Working Hours</th>
                <th className="px-4 py-3.5">Break Minutes</th>
                <th className="px-4 py-3.5">Grace Period</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {shifts.map((sh) => (
                <tr key={sh.id} className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-default">{sh.code}</td>
                  <td className="px-4 py-3.5 font-semibold text-default">{sh.name}</td>
                  <td className="px-4 py-3.5 font-mono text-default">
                    {sh.start_time} — {sh.end_time}
                    {sh.crosses_midnight && (
                      <span className="ml-1 text-[10px] text-amber-500 font-bold">(Overnight)</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-muted">{sh.break_minutes} mins</td>
                  <td className="px-4 py-3.5 font-mono text-muted">{sh.grace_in_minutes} mins</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-subtle text-success border border-success">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
