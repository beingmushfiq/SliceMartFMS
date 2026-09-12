import React, { useState } from 'react';
import { DollarSign, ShieldCheck, Plus, CheckCircle2, ChevronRight } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { notify } from '../../../components/ui/Toast';

export interface SalaryStructureItem {
  id: number;
  code: string;
  name: string;
  description: string;
  currency: string;
  employeeCount: number;
  isActive: boolean;
  components: Array<{
    name: string;
    type: 'earning' | 'deduction';
    calculation: 'fixed' | 'percentage';
    value: number;
  }>;
}

const DEFAULT_STRUCTURES: SalaryStructureItem[] = [
  {
    id: 1,
    code: 'SAL-EXEC-01',
    name: 'Executive & Department Head Tier',
    description: 'Corporate management package with standard provident fund and tax withholding.',
    currency: 'BDT',
    employeeCount: 2,
    isActive: true,
    components: [
      { name: 'Basic Salary', type: 'earning', calculation: 'percentage', value: 60 },
      { name: 'House Rent Allowance (HRA)', type: 'earning', calculation: 'percentage', value: 25 },
      { name: 'Medical Allowance', type: 'earning', calculation: 'fixed', value: 5000 },
      { name: 'Conveyance Allowance', type: 'earning', calculation: 'fixed', value: 5000 },
      { name: 'Provident Fund (PF)', type: 'deduction', calculation: 'percentage', value: 8 },
      { name: 'Income Tax (TDS)', type: 'deduction', calculation: 'percentage', value: 5 },
    ],
  },
  {
    id: 2,
    code: 'SAL-PLANT-02',
    name: 'Factory Production & Bakery Staff Tier',
    description: 'Floor workers package with shift hazard allowance, piece-rate eligibility, and meal subsidy.',
    currency: 'BDT',
    employeeCount: 14,
    isActive: true,
    components: [
      { name: 'Basic Floor Wage', type: 'earning', calculation: 'percentage', value: 65 },
      { name: 'Food & Subsidy Allowance', type: 'earning', calculation: 'fixed', value: 3500 },
      { name: 'Night Shift Differential', type: 'earning', calculation: 'fixed', value: 2500 },
      { name: 'Attendance Bonus', type: 'earning', calculation: 'fixed', value: 1500 },
      { name: 'Welfare Fund', type: 'deduction', calculation: 'fixed', value: 500 },
    ],
  },
  {
    id: 3,
    code: 'SAL-SALES-03',
    name: 'Front-Desk & Retail Sales Tier',
    description: 'Commercial staff salary structure linked with POS sales commission and transport allowance.',
    currency: 'BDT',
    employeeCount: 6,
    isActive: true,
    components: [
      { name: 'Base Retainer', type: 'earning', calculation: 'percentage', value: 70 },
      { name: 'Retail Transport Allowance', type: 'earning', calculation: 'fixed', value: 3000 },
      { name: 'Mobile / Data Subsidy', type: 'earning', calculation: 'fixed', value: 1000 },
      { name: 'Employee Welfare Contribution', type: 'deduction', calculation: 'fixed', value: 400 },
    ],
  },
];

export const SalaryStructuresSection: React.FC = () => {
  const [structures, setStructures] = useState<SalaryStructureItem[]>(DEFAULT_STRUCTURES);
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructureItem | null>(DEFAULT_STRUCTURES[0] ?? null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Structure Form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBaseWage, setNewBaseWage] = useState('25000');

  const handleCreateStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      notify.error('Please specify both structure code and title.');
      return;
    }

    const created: SalaryStructureItem = {
      id: Date.now(),
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      description: newDesc.trim() || 'Custom organizational compensation tier.',
      currency: 'BDT',
      employeeCount: 0,
      isActive: true,
      components: [
        { name: 'Basic Salary', type: 'earning', calculation: 'percentage', value: 60 },
        { name: 'House Rent Allowance', type: 'earning', calculation: 'percentage', value: 25 },
        { name: 'Conveyance & Medical', type: 'earning', calculation: 'fixed', value: 4000 },
        { name: 'Statutory Provident Fund', type: 'deduction', calculation: 'percentage', value: 5 },
      ],
    };

    setStructures([created, ...structures]);
    setSelectedStructure(created);
    setIsCreateModalOpen(false);
    setNewCode('');
    setNewName('');
    setNewDesc('');
    notify.success(`Salary structure ${created.code} configured successfully.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-default bg-surface shadow-xs">
        <div>
          <h2 className="text-base font-bold text-default flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Compensation Tiers & Salary Structures
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Configure salary formulas, statutory provident funds, tax deductions, and allowance matrices across departments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          + New Salary Structure
        </button>
      </div>

      {/* Grid: Structure List & Detail Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of structures */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold text-muted uppercase tracking-wider px-1">
            Configured Grade Packages ({structures.length})
          </span>
          {structures.map((struct) => {
            const isSelected = selectedStructure?.id === struct.id;
            return (
              <div
                key={struct.id}
                onClick={() => setSelectedStructure(struct)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-sm'
                    : 'border-default bg-surface hover:border-default hover:bg-surface-sunken'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary mb-1">
                      {struct.code}
                    </span>
                    <h3 className="text-sm font-bold text-default">{struct.name}</h3>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted'}`} />
                </div>
                <p className="text-xs text-muted mt-1.5 line-clamp-2">{struct.description}</p>
                <div className="mt-3 pt-3 border-t border-default flex items-center justify-between text-xs text-muted">
                  <span>{struct.employeeCount} Assigned Workers</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {struct.components.length} Components
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Breakdown of selected structure */}
        {selectedStructure && (
          <div className="lg:col-span-7 rounded-xl border border-default bg-surface p-5 shadow-xs space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-default">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-sunken border border-default text-muted">
                  {selectedStructure.code}
                </span>
                <h3 className="text-lg font-bold text-default mt-1">{selectedStructure.name}</h3>
                <p className="text-xs text-muted mt-1">{selectedStructure.description}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active Tier
              </span>
            </div>

            {/* Interactive Simulation Calculator */}
            <div className="p-3.5 rounded-lg border border-default bg-surface-sunken space-y-2">
              <span className="text-xs font-bold text-default flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Benchmark Simulation Calculator
              </span>
              <div className="flex items-center gap-3">
                <label htmlFor="simBaseWage" className="text-xs text-muted">Gross Base Wage:</label>
                <div className="relative w-36">
                  <span className="absolute left-2.5 top-1.5 text-xs font-semibold text-muted">৳</span>
                  <input
                    id="simBaseWage"
                    type="number"
                    value={newBaseWage}
                    onChange={(e) => setNewBaseWage(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 rounded border border-default bg-surface text-xs font-bold text-default focus:ring-1 focus:ring-primary outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Itemized Components Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                Salary Structure Components ({selectedStructure.components.length})
              </h4>
              <div className="space-y-2">
                {selectedStructure.components.map((c, i) => {
                  const isEarning = c.type === 'earning';
                  const baseNum = parseFloat(newBaseWage) || 0;
                  const computedVal =
                    c.calculation === 'percentage'
                      ? (baseNum * c.value) / 100
                      : c.value;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-default bg-surface-sunken text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${isEarning ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                        <div>
                          <p className="font-semibold text-default">{c.name}</p>
                          <span className="text-[10px] text-muted capitalize">
                            {c.type} • {c.calculation === 'percentage' ? `${c.value}% of gross base` : 'Flat Monthly'}
                          </span>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${isEarning ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isEarning ? '+' : '-'} ৳{computedVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Structure */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Configure New Salary Structure Tier"
        size="lg"
      >
        <form onSubmit={handleCreateStructure} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tierCode" className="block text-xs font-semibold text-default mb-1">
                Tier Code *
              </label>
              <input
                id="tierCode"
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. SAL-DISPATCH-04"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-sm text-default focus:ring-2 focus:ring-primary/20 outline-hidden font-mono"
              />
            </div>
            <div>
              <label htmlFor="tierName" className="block text-xs font-semibold text-default mb-1">
                Structure Name *
              </label>
              <input
                id="tierName"
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. Logistics & Courier Driver Grade"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-sm text-default focus:ring-2 focus:ring-primary/20 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tierDesc" className="block text-xs font-semibold text-default mb-1">
              Description & Compensation Policy
            </label>
            <textarea
              id="tierDesc"
              rows={2}
              autoComplete="off"
              placeholder="Detail eligible designations, shift allowances, and statutory rules..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-sm text-default focus:ring-2 focus:ring-primary/20 outline-hidden"
            />
          </div>

          <div className="p-3 rounded-lg border border-default bg-surface-sunken text-xs text-muted">
            <span className="font-semibold text-default block mb-1">Default Template Components Added:</span>
            Basic Salary (60%), House Rent (25%), Conveyance & Medical (Flat ৳4,000), and PF Deduction (5%).
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-default">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-default text-default hover:bg-surface-sunken transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors"
            >
              Save Structure Tier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
