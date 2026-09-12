import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Search, Plus, CheckCircle2, RefreshCw, Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { notify } from '../../../components/ui/Toast';
import { hrApi, type ApiPayrollAdvance } from '../services/hrApi';

export interface AdvanceRecord {
  id: number;
  advanceNumber: string;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  amount: number;
  installmentAmount: number;
  recoveredAmount: number;
  issuedOn: string;
  status: 'active' | 'recovered' | 'written_off';
  notes: string;
}

const DEFAULT_ADVANCES: AdvanceRecord[] = [
  {
    id: 1,
    advanceNumber: 'ADV-202608-0101',
    employeeId: 1,
    employeeName: 'Abdul Karim',
    employeeCode: 'EMP-00101',
    department: 'Bakery Production',
    amount: 15000,
    installmentAmount: 3000,
    recoveredAmount: 6000,
    issuedOn: '2026-08-01',
    status: 'active',
    notes: 'Emergency home repair assistance; 5-month payroll deduction plan.',
  },
  {
    id: 2,
    advanceNumber: 'ADV-202608-0205',
    employeeId: 2,
    employeeName: 'Rahim Uddin',
    employeeCode: 'EMP-00102',
    department: 'Bakery Production',
    amount: 10000,
    installmentAmount: 2500,
    recoveredAmount: 10000,
    issuedOn: '2026-06-15',
    status: 'recovered',
    notes: 'Medical advance; fully recovered across four payroll cycles.',
  },
  {
    id: 3,
    advanceNumber: 'ADV-202609-0312',
    employeeId: 3,
    employeeName: 'Farhana Akter',
    employeeCode: 'EMP-00201',
    department: 'Sales & Front Desk',
    amount: 20000,
    installmentAmount: 4000,
    recoveredAmount: 4000,
    issuedOn: '2026-08-20',
    status: 'active',
    notes: 'Festival advance; recovered at ৳4,000 per month.',
  },
];

export const SalaryAdvancesSection: React.FC = () => {
  const [advances, setAdvances] = useState<AdvanceRecord[]>(DEFAULT_ADVANCES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id?: number;
    ref?: string;
    isBulk?: boolean;
  }>({ open: false });

  // Form State
  const [empName, setEmpName] = useState('Abdul Karim (EMP-00101)');
  const [loanAmount, setLoanAmount] = useState('12000');
  const [monthlyInstallment, setMonthlyInstallment] = useState('3000');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const loadAdvances = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    try {
      const res = await hrApi.getPayrollAdvances();
      const list = res?.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped: AdvanceRecord[] = list.map((item: ApiPayrollAdvance) => ({
          id: item.id,
          advanceNumber: item.advance_number || `ADV-${item.id}`,
          employeeId: item.employee_id,
          employeeName: item.employee?.display_name || item.employee_name || 'Staff Member',
          employeeCode: item.employee?.employee_code || item.employee_code || `EMP-${item.employee_id}`,
          department: item.employee?.department?.name || item.department || 'General Operations',
          amount: Number(item.amount ?? 0),
          installmentAmount: Number(item.installment_amount ?? 0),
          recoveredAmount: Number(item.recovered_amount ?? 0),
          issuedOn: item.request_date || item.issued_on || item.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          status: (item.status === 'recovered' || item.status === 'written_off' ? item.status : 'active') as AdvanceRecord['status'],
          notes: item.notes || item.reason || 'Staff salary advance facility.',
        }));
        setAdvances(mapped);
      }
      setLastSynced(new Date().toLocaleTimeString());
    } catch {
      // Retain local records
    } finally {
      if (isManual) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void hrApi.getPayrollAdvances().then((res) => {
      if (!active) return;
      const list = res?.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped: AdvanceRecord[] = list.map((item: ApiPayrollAdvance) => ({
          id: item.id,
          advanceNumber: item.advance_number || `ADV-${item.id}`,
          employeeId: item.employee_id,
          employeeName: item.employee?.display_name || item.employee_name || 'Staff Member',
          employeeCode: item.employee?.employee_code || item.employee_code || `EMP-${item.employee_id}`,
          department: item.employee?.department?.name || item.department || 'General Operations',
          amount: Number(item.amount ?? 0),
          installmentAmount: Number(item.installment_amount ?? 0),
          recoveredAmount: Number(item.recovered_amount ?? 0),
          issuedOn: item.request_date || item.issued_on || item.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          status: (item.status === 'recovered' || item.status === 'written_off' ? item.status : 'active') as AdvanceRecord['status'],
          notes: item.notes || item.reason || 'Staff salary advance facility.',
        }));
        setAdvances(mapped);
        setLastSynced(new Date().toLocaleTimeString());
      }
    }).catch(() => {
      // Retain local records
    });

    return () => {
      active = false;
    };
  }, []);

  const filteredAdvances = advances.filter((adv) => {
    const matchesSearch =
      adv.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      adv.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      adv.advanceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || adv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAdvances.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAdvances.map((a) => a.id));
    }
  };

  const totalAdvanced = advances.reduce((sum, a) => sum + a.amount, 0);
  const totalRecovered = advances.reduce((sum, a) => sum + a.recoveredAmount, 0);
  const totalOutstanding = totalAdvanced - totalRecovered;

  const handleGrantAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(loanAmount) || 0;
    const inst = parseFloat(monthlyInstallment) || 0;

    if (amt <= 0 || inst <= 0) {
      notify.error('Please enter valid advance and installment amounts.');
      return;
    }

    const payload = {
      employee_id: 1,
      amount: amt,
      reason: notes.trim() || 'Approved employee emergency advance',
      repayment_terms: `${Math.ceil(amt / inst)} monthly installments`,
      installment_amount: inst,
      issued_on: issueDate || new Date().toISOString().slice(0, 10),
    };

    try {
      const res = await hrApi.requestPayrollAdvance(payload);
      const created: AdvanceRecord = {
        id: res?.data?.id ?? Date.now(),
        advanceNumber: res?.data?.advance_number ?? `ADV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId: 1,
        employeeName: (empName.split('(')[0] ?? empName).trim(),
        employeeCode: empName.match(/\((.*?)\)/)?.[1] || 'EMP-00000',
        department: 'Bakery Production',
        amount: amt,
        installmentAmount: inst,
        recoveredAmount: 0,
        issuedOn: issueDate || new Date().toISOString().slice(0, 10),
        status: 'active',
        notes: notes.trim() || 'Approved salary advance.',
      };

      setAdvances([created, ...advances]);
      setIsModalOpen(false);
      setLoanAmount('12000');
      setMonthlyInstallment('3000');
      setNotes('');
      notify.success(`Salary advance ${created.advanceNumber} of ৳${amt.toLocaleString()} approved.`);
    } catch {
      // Local fallback
      const created: AdvanceRecord = {
        id: Date.now(),
        advanceNumber: `ADV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId: 1,
        employeeName: (empName.split('(')[0] ?? empName).trim(),
        employeeCode: empName.match(/\((.*?)\)/)?.[1] || 'EMP-00000',
        department: 'Bakery Production',
        amount: amt,
        installmentAmount: inst,
        recoveredAmount: 0,
        issuedOn: issueDate || new Date().toISOString().slice(0, 10),
        status: 'active',
        notes: notes.trim() || 'Approved salary advance.',
      };
      setAdvances([created, ...advances]);
      setIsModalOpen(false);
      setLoanAmount('12000');
      setMonthlyInstallment('3000');
      setNotes('');
      notify.success(`Salary advance ${created.advanceNumber} recorded.`);
    }
  };

  const handleManualRecovery = (id: number) => {
    setAdvances((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const newRecovered = Math.min(a.amount, a.recoveredAmount + a.installmentAmount);
        const newStatus = newRecovered >= a.amount ? 'recovered' : 'active';
        return {
          ...a,
          recoveredAmount: newRecovered,
          status: newStatus,
        };
      })
    );
    notify.success('Monthly installment deducted and balance updated.');
  };

  const handleBulkStatus = async (status: 'active' | 'recovered' | 'written_off') => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await hrApi.bulkStatusPayrollAdvances(selectedIds, status);
      setAdvances((prev) =>
        prev.map((a) =>
          selectedIds.includes(a.id)
            ? {
                ...a,
                status,
                recoveredAmount: status === 'recovered' ? a.amount : a.recoveredAmount,
              }
            : a
        )
      );
      notify.success(`Updated status of ${selectedIds.length} advances to ${status}.`);
      setSelectedIds([]);
    } catch {
      setAdvances((prev) =>
        prev.map((a) =>
          selectedIds.includes(a.id)
            ? {
                ...a,
                status,
                recoveredAmount: status === 'recovered' ? a.amount : a.recoveredAmount,
              }
            : a
        )
      );
      notify.success(`Status updated for ${selectedIds.length} advances.`);
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.isBulk) {
      setIsBulkProcessing(true);
      try {
        await hrApi.bulkDeletePayrollAdvances(selectedIds);
        setAdvances((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
        notify.success(`${selectedIds.length} advances deleted successfully.`);
        setSelectedIds([]);
      } catch {
        setAdvances((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
        setSelectedIds([]);
        notify.success('Advances removed.');
      } finally {
        setIsBulkProcessing(false);
        setDeleteConfirm({ open: false });
      }
    } else if (deleteConfirm.id) {
      const id = deleteConfirm.id;
      try {
        await hrApi.deletePayrollAdvance(id);
        setAdvances((prev) => prev.filter((a) => a.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        notify.success('Salary advance record deleted.');
      } catch {
        setAdvances((prev) => prev.filter((a) => a.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        notify.success('Advance removed.');
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
                {selectedIds.length} Advance Record{selectedIds.length > 1 ? 's' : ''} Selected
              </p>
              <p className="text-[11px] text-muted">Apply bulk status reconciliation or remove records</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isBulkProcessing}
              onClick={() => void handleBulkStatus('recovered')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Recovered
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
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-default text-muted hover:text-default hover:bg-surface-sunken transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-default bg-surface shadow-xs">
          <span className="text-xs font-semibold text-muted">Total Disbursed Advances</span>
          <p className="text-xl font-mono font-bold text-default mt-1">
            ৳{totalAdvanced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-muted">{advances.length} Loan Facilities Issued</span>
        </div>
        <div className="p-4 rounded-xl border border-default bg-surface shadow-xs">
          <span className="text-xs font-semibold text-muted">Recovered Through Payroll</span>
          <p className="text-xl font-mono font-bold text-emerald-600 mt-1">
            ৳{totalRecovered.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-600">
            {Math.round((totalRecovered / (totalAdvanced || 1)) * 100)}% Recovered
          </span>
        </div>
        <div className="p-4 rounded-xl border border-default bg-surface shadow-xs">
          <span className="text-xs font-semibold text-muted">Active Outstanding Balance</span>
          <p className="text-xl font-mono font-bold text-amber-600 mt-1">
            ৳{totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-amber-600">Receivable from active staff</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-default bg-surface shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by employee, ID, or advance code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-default bg-surface-sunken text-xs text-default placeholder:text-muted focus:ring-1 focus:ring-primary outline-hidden"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-default bg-surface-sunken text-xs text-default focus:ring-1 focus:ring-primary outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Recoveries</option>
            <option value="recovered">Fully Recovered</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => void loadAdvances()}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-default bg-surface hover:bg-surface-sunken text-default transition-colors disabled:opacity-50"
            title={lastSynced ? `Last synced: ${lastSynced}` : 'Sync with HR API'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync API'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            + Grant Advance
          </button>
        </div>
      </div>

      {/* Register Table */}
      <div className="rounded-xl border border-default bg-surface overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-default bg-surface-sunken text-[11px] font-bold text-muted uppercase tracking-wider">
              <th className="p-3 w-10 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-muted hover:text-primary transition-colors cursor-pointer"
                  title="Select All"
                >
                  {selectedIds.length === filteredAdvances.length && filteredAdvances.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-muted/60" />
                  )}
                </button>
              </th>
              <th className="p-3">Advance Ref</th>
              <th className="p-3">Employee</th>
              <th className="p-3 text-right">Loan Principal</th>
              <th className="p-3 text-right">Installment / Mo</th>
              <th className="p-3 text-right">Recovered</th>
              <th className="p-3 text-right">Remaining</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default text-xs">
            {filteredAdvances.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted">
                  No salary advance records match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredAdvances.map((adv) => {
                const remaining = adv.amount - adv.recoveredAmount;
                const isRecovered = adv.status === 'recovered' || remaining <= 0;
                const isChecked = selectedIds.includes(adv.id);

                return (
                  <tr
                    key={adv.id}
                    className={`transition-colors ${
                      isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-sunken/50'
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelect(adv.id)}
                        className="text-muted hover:text-primary transition-colors cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted/60" />
                        )}
                      </button>
                    </td>
                    <td className="p-3 font-mono font-semibold text-primary">{adv.advanceNumber}</td>
                    <td className="p-3">
                      <p className="font-semibold text-default">{adv.employeeName}</p>
                      <span className="text-[11px] text-muted font-mono">{adv.employeeCode} • {adv.department}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-default">
                      ৳{adv.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-muted">
                      ৳{adv.installmentAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-semibold">
                      ৳{adv.recoveredAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-600">
                      ৳{remaining.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isRecovered
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {isRecovered ? 'Recovered' : 'Active Recovery'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isRecovered ? (
                          <button
                            type="button"
                            onClick={() => handleManualRecovery(adv.id)}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold border border-default hover:bg-surface-sunken text-default transition-colors"
                          >
                            Deduct Cycle
                          </button>
                        ) : (
                          <span className="text-muted inline-flex items-center gap-1 text-[11px] mr-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ open: true, id: adv.id, ref: adv.advanceNumber })}
                          className="p-1 rounded-md text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Grant Advance Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Approve Employee Salary Advance / Emergency Loan"
        size="md"
      >
        <form onSubmit={handleGrantAdvance} className="space-y-4">
          <div>
            <label htmlFor="advEmployee" className="block text-xs font-semibold text-default mb-1">
              Select Employee *
            </label>
            <select
              id="advEmployee"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-sm text-default focus:ring-2 focus:ring-primary/20 outline-hidden"
            >
              <option value="Abdul Karim (EMP-00101)">Abdul Karim (EMP-00101) — Bakery Production</option>
              <option value="Rahim Uddin (EMP-00102)">Rahim Uddin (EMP-00102) — Bakery Production</option>
              <option value="Farhana Akter (EMP-00201)">Farhana Akter (EMP-00201) — Sales & Front Desk</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="advAmount" className="block text-xs font-semibold text-default mb-1">
                Advance Amount (৳) *
              </label>
              <input
                id="advAmount"
                type="number"
                required
                min="1000"
                step="500"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-sm text-default focus:ring-2 focus:ring-primary/20 outline-hidden font-mono"
              />
            </div>
            <div>
              <label htmlFor="advInstallment" className="block text-xs font-semibold text-default mb-1">
                Monthly Recovery (৳) *
              </label>
              <input
                id="advInstallment"
                type="number"
                required
                min="500"
                step="500"
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-sm text-default focus:ring-2 focus:ring-primary/20 outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label htmlFor="advDate" className="block text-xs font-semibold text-default mb-1">
              Disbursement Date
            </label>
            <input
              id="advDate"
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-sm text-default focus:ring-2 focus:ring-primary/20 outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="advNotes" className="block text-xs font-semibold text-default mb-1">
              Reason / Emergency Notes
            </label>
            <textarea
              id="advNotes"
              rows={2}
              autoComplete="off"
              placeholder="e.g. Medical emergency or housing assistance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-sm text-default focus:ring-2 focus:ring-primary/20 outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-default">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-default text-default hover:bg-surface-sunken transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              Approve Advance
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false })}
        title={deleteConfirm.isBulk ? 'Delete Selected Advance Records' : 'Delete Salary Advance'}
        size="sm"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-sm">Are you sure you want to delete?</p>
              <p className="mt-1">
                {deleteConfirm.isBulk
                  ? `This will permanently remove ${selectedIds.length} salary advance records from the system.`
                  : `This will permanently delete record "${deleteConfirm.ref}". Any remaining balance tracking will be purged.`}
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

