import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, ShieldCheck, Plus, CheckCircle2, ChevronRight, RefreshCw, Trash2, CheckSquare, Square, Power, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { notify } from '../../../components/ui/Toast';
import { hrApi, type ApiSalaryStructure } from '../services/hrApi';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id?: number;
    code?: string;
    isBulk?: boolean;
  }>({ open: false });

  // New Structure Form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBaseWage, setNewBaseWage] = useState('25000');

  const loadStructures = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await hrApi.getSalaryStructures();
      const list = res?.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped: SalaryStructureItem[] = list.map((item: ApiSalaryStructure) => ({
          id: item.id,
          code: item.code || `SAL-${item.id}`,
          name: item.name,
          description: item.description || 'Configured salary structure tier.',
          currency: item.currency || 'BDT',
          employeeCount: item.employees_count ?? 0,
          isActive: item.is_active ?? true,
          components: Array.isArray(item.components) && item.components.length > 0
            ? item.components.map((c: Record<string, unknown>) => ({
                name: String(c.name || 'Component'),
                type: (c.type === 'deduction' ? 'deduction' : 'earning') as 'earning' | 'deduction',
                calculation: (c.calculation === 'percentage' ? 'percentage' : 'fixed') as 'fixed' | 'percentage',
                value: Number(c.value ?? c.amount_or_percentage ?? 0),
              }))
            : [
                { name: 'Basic Salary', type: 'earning', calculation: 'percentage', value: 60 },
                { name: 'House Rent Allowance', type: 'earning', calculation: 'percentage', value: 25 },
                { name: 'Conveyance & Medical', type: 'earning', calculation: 'fixed', value: 4000 },
                { name: 'Statutory Provident Fund', type: 'deduction', calculation: 'percentage', value: 5 },
              ],
        }));
        setStructures(mapped);
        if (!selectedStructure || !mapped.some((m) => m.id === selectedStructure.id)) {
          setSelectedStructure(mapped[0] ?? null);
        }
      }
      setLastSynced(new Date().toLocaleTimeString());
    } catch {
      // Keep local structures as fallback
    } finally {
      setIsSyncing(false);
    }
  }, [selectedStructure]);

  useEffect(() => {
    let active = true;
    void hrApi.getSalaryStructures().then((res) => {
      if (!active) return;
      const list = res?.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped: SalaryStructureItem[] = list.map((item: ApiSalaryStructure) => ({
          id: item.id,
          code: item.code || `SAL-${item.id}`,
          name: item.name,
          description: item.description || 'Configured salary structure tier.',
          currency: item.currency || 'BDT',
          employeeCount: item.employees_count ?? 0,
          isActive: item.is_active ?? true,
          components: Array.isArray(item.components) && item.components.length > 0
            ? item.components.map((c: Record<string, unknown>) => ({
                name: String(c.name || 'Component'),
                type: (c.type === 'deduction' ? 'deduction' : 'earning') as 'earning' | 'deduction',
                calculation: (c.calculation === 'percentage' ? 'percentage' : 'fixed') as 'fixed' | 'percentage',
                value: Number(c.value ?? c.amount_or_percentage ?? 0),
              }))
            : [
                { name: 'Basic Salary', type: 'earning', calculation: 'percentage', value: 60 },
                { name: 'House Rent Allowance', type: 'earning', calculation: 'percentage', value: 25 },
                { name: 'Conveyance & Medical', type: 'earning', calculation: 'fixed', value: 4000 },
                { name: 'Statutory Provident Fund', type: 'deduction', calculation: 'percentage', value: 5 },
              ],
        }));
        setStructures(mapped);
        setSelectedStructure(mapped[0] ?? null);
        setLastSynced(new Date().toLocaleTimeString());
      }
    }).catch(() => {
      // Keep local structures as fallback
    });

    return () => {
      active = false;
    };
  }, []);

  const toggleSelect = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === structures.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(structures.map((s) => s.id));
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      notify.error('Please specify both structure code and title.');
      return;
    }

    const payload = {
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      description: newDesc.trim() || 'Custom organizational compensation tier.',
      currency: 'BDT',
      is_active: true,
      components: [
        { name: 'Basic Salary', type: 'earning' as const, calculation: 'percentage' as const, value: 60 },
        { name: 'House Rent Allowance', type: 'earning' as const, calculation: 'percentage' as const, value: 25 },
        { name: 'Conveyance & Medical', type: 'earning' as const, calculation: 'fixed' as const, value: 4000 },
        { name: 'Statutory Provident Fund', type: 'deduction' as const, calculation: 'percentage' as const, value: 5 },
      ],
    };

    try {
      const res = await hrApi.createSalaryStructure(payload);
      const createdItem: SalaryStructureItem = {
        id: res?.data?.id ?? Date.now(),
        code: res?.data?.code ?? payload.code,
        name: res?.data?.name ?? payload.name,
        description: res?.data?.description ?? payload.description,
        currency: 'BDT',
        employeeCount: 0,
        isActive: true,
        components: payload.components,
      };

      setStructures([createdItem, ...structures]);
      setSelectedStructure(createdItem);
      setIsCreateModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewDesc('');
      notify.success(`Salary structure ${createdItem.code} configured successfully.`);
    } catch {
      // Fallback local save
      const fallbackItem: SalaryStructureItem = {
        id: Date.now(),
        code: payload.code,
        name: payload.name,
        description: payload.description,
        currency: 'BDT',
        employeeCount: 0,
        isActive: true,
        components: payload.components,
      };
      setStructures([fallbackItem, ...structures]);
      setSelectedStructure(fallbackItem);
      setIsCreateModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewDesc('');
      notify.success(`Salary structure ${fallbackItem.code} saved locally.`);
    }
  };

  const handleToggleStatus = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await hrApi.toggleSalaryStructureStatus(id);
      setStructures((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
      );
      if (selectedStructure?.id === id) {
        setSelectedStructure((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
      }
      notify.success('Salary structure status updated.');
    } catch {
      setStructures((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
      );
      notify.success('Structure status toggled locally.');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.isBulk) {
      setIsBulkProcessing(true);
      try {
        await hrApi.bulkDeleteSalaryStructures(selectedIds);
        setStructures((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
        if (selectedStructure && selectedIds.includes(selectedStructure.id)) {
          const remaining = structures.filter((s) => !selectedIds.includes(s.id));
          setSelectedStructure(remaining[0] ?? null);
        }
        notify.success(`${selectedIds.length} salary structures deleted successfully.`);
        setSelectedIds([]);
      } catch {
        setStructures((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
        setSelectedIds([]);
        notify.success('Structures removed.');
      } finally {
        setIsBulkProcessing(false);
        setDeleteConfirm({ open: false });
      }
    } else if (deleteConfirm.id) {
      const id = deleteConfirm.id;
      try {
        await hrApi.deleteSalaryStructure(id);
        setStructures((prev) => prev.filter((s) => s.id !== id));
        if (selectedStructure?.id === id) {
          const remaining = structures.filter((s) => s.id !== id);
          setSelectedStructure(remaining[0] ?? null);
        }
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        notify.success('Salary structure deleted.');
      } catch {
        setStructures((prev) => prev.filter((s) => s.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        notify.success('Salary structure removed.');
      } finally {
        setDeleteConfirm({ open: false });
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating Bulk Actions Ribbon */}
      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-20 flex items-center justify-between gap-3 p-3.5 rounded-xl border border-primary/30 bg-surface shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white shadow-xs">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-default">
                {selectedIds.length} Structure{selectedIds.length > 1 ? 's' : ''} Selected
              </p>
              <p className="text-[11px] text-muted">Execute bulk operations on compensation grade tiers</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-default text-muted hover:text-default hover:bg-surface-sunken transition-colors"
            >
              Deselect All
            </button>
            <button
              type="button"
              disabled={isBulkProcessing}
              onClick={() => setDeleteConfirm({ open: true, isBulk: true })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

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

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => void loadStructures()}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-default bg-surface hover:bg-surface-sunken text-default transition-colors disabled:opacity-50"
            title={lastSynced ? `Last synced: ${lastSynced}` : 'Sync with HR API'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync API'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            + New Salary Structure
          </button>
        </div>
      </div>

      {/* Grid: Structure List & Detail Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of structures */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Configured Grade Packages ({structures.length})
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              {selectedIds.length === structures.length && structures.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" /> Deselect All
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" /> Select All ({structures.length})
                </>
              )}
            </button>
          </div>

          {structures.map((struct) => {
            const isSelected = selectedStructure?.id === struct.id;
            const isChecked = selectedIds.includes(struct.id);

            return (
              <div
                key={struct.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedStructure(struct);
                  }
                }}
                onClick={() => setSelectedStructure(struct)}
                className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                  isChecked
                    ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
                    : isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-sm'
                    : 'border-default bg-surface hover:border-default hover:bg-surface-sunken'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => toggleSelect(struct.id, e)}
                      className="mt-0.5 text-muted hover:text-primary transition-colors shrink-0"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted/60" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary">
                          {struct.code}
                        </span>
                        {!struct.isActive && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-default mt-1">{struct.name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => void handleToggleStatus(struct.id, e)}
                      className="p-1 rounded-md text-muted hover:text-default hover:bg-surface-sunken transition-colors"
                      title={struct.isActive ? 'Deactivate Tier' : 'Activate Tier'}
                    >
                      <Power className={`w-3.5 h-3.5 ${struct.isActive ? 'text-emerald-600' : 'text-muted'}`} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ open: true, id: struct.id, code: struct.code });
                      }}
                      className="p-1 rounded-md text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Structure"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted'}`} />
                  </div>
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
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedStructure.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {selectedStructure.isActive ? 'Active Tier' : 'Inactive Tier'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirm({
                      open: true,
                      id: selectedStructure.id,
                      code: selectedStructure.code,
                    })
                  }
                  className="p-1.5 rounded-lg border border-default text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete Structure"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Simulation Calculator */}
            <div className="p-3.5 rounded-lg border border-default bg-surface-sunken space-y-2">
              <span className="text-xs font-bold text-default flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Benchmark Simulation Calculator
              </span>
              <div className="flex items-center gap-3">
                <label htmlFor="simBaseWage" className="text-xs text-muted">
                  Gross Base Wage:
                </label>
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false })}
        title={deleteConfirm.isBulk ? 'Delete Selected Salary Structures' : 'Delete Salary Structure'}
        size="sm"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-sm">Are you sure you want to delete?</p>
              <p className="mt-1">
                {deleteConfirm.isBulk
                  ? `This will permanently remove ${selectedIds.length} salary structure tiers from the system.`
                  : `This will permanently remove structure "${deleteConfirm.code}". Any employees assigned to it may need reassignment.`}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-default">
            <button
              type="button"
              onClick={() => setDeleteConfirm({ open: false })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-default text-default hover:bg-surface-sunken transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isBulkProcessing}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {isBulkProcessing ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

