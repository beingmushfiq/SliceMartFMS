import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Clock,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Department, Designation, Shift } from '../../../types/api/hr';
import { Modal } from '../../../components/ui/Modal';
import { notify } from '../../../components/ui/Toast';

interface Props {
  departments: Department[];
  designations: Designation[];
  shifts: Shift[];
  onAddDepartment?: (dept: Department) => void;
  onAddDesignation?: (des: Designation) => void;
  onAddShift?: (shift: Shift) => void;
}

export function DepartmentsSetupSection({
  departments: initialDepartments,
  designations: initialDesignations,
  shifts: initialShifts,
  onAddDepartment,
  onAddDesignation,
  onAddShift,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'departments' | 'designations' | 'shifts'>('departments');

  const [deptList, setDeptList] = useState<Department[]>(initialDepartments);
  const [desList, setDesList] = useState<Designation[]>(initialDesignations);
  const [shiftList, setShiftList] = useState<Shift[]>(initialShifts);

  // Modals state
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  const [showAddDesModal, setShowAddDesModal] = useState(false);
  const [newDesCode, setNewDesCode] = useState('');
  const [newDesName, setNewDesName] = useState('');

  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [newShiftCode, setNewShiftCode] = useState('');
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('09:00');
  const [newShiftEnd, setNewShiftEnd] = useState('17:00');
  const [newShiftGrace, setNewShiftGrace] = useState(15);
  const [newShiftBreak, setNewShiftBreak] = useState(60);

  // Handlers
  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const code = newDeptCode.trim()
      ? newDeptCode.trim().toUpperCase()
      : newDeptName.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();

    const newDept: Department = {
      id: deptList.length + 1,
      uuid: `dep-auto-${Date.now()}`,
      code,
      name: newDeptName.trim(),
      is_active: true,
    };

    setDeptList([...deptList, newDept]);
    onAddDepartment?.(newDept);
    setShowAddDeptModal(false);
    setNewDeptCode('');
    setNewDeptName('');
    notify.success(`Department "${newDept.name}" created successfully`);
  };

  const handleCreateDesignation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesName.trim()) return;
    const code = newDesCode.trim()
      ? newDesCode.trim().toUpperCase()
      : newDesName.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();

    const newDes: Designation = {
      id: desList.length + 1,
      uuid: `des-auto-${Date.now()}`,
      code,
      name: newDesName.trim(),
      is_active: true,
    };

    setDesList([...desList, newDes]);
    onAddDesignation?.(newDes);
    setShowAddDesModal(false);
    setNewDesCode('');
    setNewDesName('');
    notify.success(`Designation "${newDes.name}" created successfully`);
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName.trim()) return;
    const code = newShiftCode.trim()
      ? newShiftCode.trim().toUpperCase()
      : newShiftName.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();

    const newShift: Shift = {
      id: shiftList.length + 1,
      uuid: `sh-auto-${Date.now()}`,
      code,
      name: newShiftName.trim(),
      start_time: `${newShiftStart}:00`,
      end_time: `${newShiftEnd}:00`,
      crosses_midnight: newShiftStart > newShiftEnd,
      break_minutes: newShiftBreak,
      grace_in_minutes: newShiftGrace,
      is_active: true,
    };

    setShiftList([...shiftList, newShift]);
    onAddShift?.(newShift);
    setShowAddShiftModal(false);
    setNewShiftCode('');
    setNewShiftName('');
    notify.success(`Shift Schedule "${newShift.name}" created successfully`);
  };

  const handleToggleDeptStatus = (id: number) => {
    setDeptList((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_active: !d.is_active } : d))
    );
    notify.info('Department status updated');
  };

  const handleToggleDesStatus = (id: number) => {
    setDesList((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_active: !d.is_active } : d))
    );
    notify.info('Designation status updated');
  };

  const handleToggleShiftStatus = (id: number) => {
    setShiftList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    );
    notify.info('Shift schedule status updated');
  };

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

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-surface-sunken p-1 rounded-xl border border-default">
            <button
              type="button"
              onClick={() => setActiveSubTab('departments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'departments'
                  ? 'bg-surface text-default shadow-xs font-semibold'
                  : 'text-muted hover:text-default'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Departments ({deptList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('designations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'designations'
                  ? 'bg-surface text-default shadow-xs font-semibold'
                  : 'text-muted hover:text-default'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Designations ({desList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('shifts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'shifts'
                  ? 'bg-surface text-default shadow-xs font-semibold'
                  : 'text-muted hover:text-default'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Shift Schedules ({shiftList.length})</span>
            </button>
          </div>

          {/* Primary Action Button Contextual to SubTab */}
          {activeSubTab === 'departments' && (
            <button
              type="button"
              onClick={() => setShowAddDeptModal(true)}
              className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-fg text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Department</span>
            </button>
          )}

          {activeSubTab === 'designations' && (
            <button
              type="button"
              onClick={() => setShowAddDesModal(true)}
              className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-fg text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Designation</span>
            </button>
          )}

          {activeSubTab === 'shifts' && (
            <button
              type="button"
              onClick={() => setShowAddShiftModal(true)}
              className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-fg text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Shift</span>
            </button>
          )}
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
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {deptList.map((dep) => (
                <tr key={dep.id} className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-primary">{dep.code}</td>
                  <td className="px-4 py-3.5 font-semibold text-default">{dep.name}</td>
                  <td className="px-4 py-3.5 text-muted">Core Enterprise Operations</td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        dep.is_active
                          ? 'bg-success-subtle text-success border-success'
                          : 'bg-danger-subtle text-danger border-danger'
                      }`}
                    >
                      {dep.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleDeptStatus(dep.id)}
                      className="px-2.5 py-1 text-2xs font-semibold rounded-lg border border-default hover:bg-surface-sunken text-muted hover:text-default transition cursor-pointer"
                    >
                      {dep.is_active ? 'Deactivate' : 'Activate'}
                    </button>
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
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {desList.map((des) => (
                <tr key={des.id} className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-primary">{des.code}</td>
                  <td className="px-4 py-3.5 font-semibold text-default">{des.name}</td>
                  <td className="px-4 py-3.5 text-muted">Standard Operational Band</td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        des.is_active
                          ? 'bg-success-subtle text-success border-success'
                          : 'bg-danger-subtle text-danger border-danger'
                      }`}
                    >
                      {des.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleDesStatus(des.id)}
                      className="px-2.5 py-1 text-2xs font-semibold rounded-lg border border-default hover:bg-surface-sunken text-muted hover:text-default transition cursor-pointer"
                    >
                      {des.is_active ? 'Deactivate' : 'Activate'}
                    </button>
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
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {shiftList.map((sh) => (
                <tr key={sh.id} className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-primary">{sh.code}</td>
                  <td className="px-4 py-3.5 font-semibold text-default">{sh.name}</td>
                  <td className="px-4 py-3.5 font-mono text-muted">
                    {sh.start_time.slice(0, 5)} - {sh.end_time.slice(0, 5)}
                    {sh.crosses_midnight && ' (+1d)'}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{sh.break_minutes} mins</td>
                  <td className="px-4 py-3.5 font-mono text-muted">{sh.grace_in_minutes} mins</td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        sh.is_active
                          ? 'bg-success-subtle text-success border-success'
                          : 'bg-danger-subtle text-danger border-danger'
                      }`}
                    >
                      {sh.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleShiftStatus(sh.id)}
                      className="px-2.5 py-1 text-2xs font-semibold rounded-lg border border-default hover:bg-surface-sunken text-muted hover:text-default transition cursor-pointer"
                    >
                      {sh.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Department */}
      <Modal
        open={showAddDeptModal}
        onClose={() => setShowAddDeptModal(false)}
        title="Add Business Department"
        subtitle="Define a new organizational unit or operational department."
        size="md"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4 pt-1">
          <div>
            <label htmlFor="dept-name-input" className="block text-xs font-semibold text-default uppercase mb-1">
              Department Name
            </label>
            <input
              id="dept-name-input"
              name="dept_name"
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Quality Assurance & Testing"
              required
              autoComplete="off"
              className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="dept-code-input" className="block text-xs font-semibold text-default uppercase mb-1">
              Department Code (Optional)
            </label>
            <input
              id="dept-code-input"
              name="dept_code"
              type="text"
              value={newDeptCode}
              onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
              placeholder="e.g. QA"
              autoComplete="off"
              className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-default">
            <button
              type="button"
              onClick={() => setShowAddDeptModal(false)}
              className="px-4 py-2 text-xs font-semibold border border-default rounded-xl text-muted hover:text-default cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-primary hover:bg-primary/90 text-primary-fg font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              Create Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Designation */}
      <Modal
        open={showAddDesModal}
        onClose={() => setShowAddDesModal(false)}
        title="Add Job Designation"
        subtitle="Create a new job title and classification."
        size="md"
      >
        <form onSubmit={handleCreateDesignation} className="space-y-4 pt-1">
          <div>
            <label htmlFor="des-name-input" className="block text-xs font-semibold text-default uppercase mb-1">
              Designation Title
            </label>
            <input
              id="des-name-input"
              name="des_name"
              type="text"
              value={newDesName}
              onChange={(e) => setNewDesName(e.target.value)}
              placeholder="e.g. Senior QC Inspector"
              required
              autoComplete="off"
              className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="des-code-input" className="block text-xs font-semibold text-default uppercase mb-1">
              Designation Code (Optional)
            </label>
            <input
              id="des-code-input"
              name="des_code"
              type="text"
              value={newDesCode}
              onChange={(e) => setNewDesCode(e.target.value.toUpperCase())}
              placeholder="e.g. QC_INSP"
              autoComplete="off"
              className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-default">
            <button
              type="button"
              onClick={() => setShowAddDesModal(false)}
              className="px-4 py-2 text-xs font-semibold border border-default rounded-xl text-muted hover:text-default cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-primary hover:bg-primary/90 text-primary-fg font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              Create Designation
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Shift */}
      <Modal
        open={showAddShiftModal}
        onClose={() => setShowAddShiftModal(false)}
        title="Add Shift Schedule"
        subtitle="Define a work shift with operating hours and grace period."
        size="md"
      >
        <form onSubmit={handleCreateShift} className="space-y-4 pt-1">
          <div>
            <label htmlFor="shift-name-input" className="block text-xs font-semibold text-default uppercase mb-1">
              Shift Title
            </label>
            <input
              id="shift-name-input"
              name="shift_name"
              type="text"
              value={newShiftName}
              onChange={(e) => setNewShiftName(e.target.value)}
              placeholder="e.g. Afternoon Shift (14:00 - 22:00)"
              required
              autoComplete="off"
              className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="shift-start-input" className="block text-xs font-semibold text-default uppercase mb-1">
                Start Time
              </label>
              <input
                id="shift-start-input"
                name="shift_start"
                type="time"
                value={newShiftStart}
                onChange={(e) => setNewShiftStart(e.target.value)}
                required
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="shift-end-input" className="block text-xs font-semibold text-default uppercase mb-1">
                End Time
              </label>
              <input
                id="shift-end-input"
                name="shift_end"
                type="time"
                value={newShiftEnd}
                onChange={(e) => setNewShiftEnd(e.target.value)}
                required
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="shift-grace-input" className="block text-xs font-semibold text-default uppercase mb-1">
                Grace In Minutes
              </label>
              <input
                id="shift-grace-input"
                name="shift_grace"
                type="number"
                value={newShiftGrace}
                onChange={(e) => setNewShiftGrace(parseInt(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm font-mono text-right focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="shift-break-input" className="block text-xs font-semibold text-default uppercase mb-1">
                Break Minutes
              </label>
              <input
                id="shift-break-input"
                name="shift_break"
                type="number"
                value={newShiftBreak}
                onChange={(e) => setNewShiftBreak(parseInt(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm font-mono text-right focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-default">
            <button
              type="button"
              onClick={() => setShowAddShiftModal(false)}
              className="px-4 py-2 text-xs font-semibold border border-default rounded-xl text-muted hover:text-default cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs bg-primary hover:bg-primary/90 text-primary-fg font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              Create Shift
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
