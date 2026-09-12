import React, { useState } from 'react';
import { CreditCard, Search, Plus, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { notify } from '../../../components/ui/Toast';

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

  // Form State
  const [empName, setEmpName] = useState('Abdul Karim (EMP-00101)');
  const [loanAmount, setLoanAmount] = useState('12000');
  const [monthlyInstallment, setMonthlyInstallment] = useState('3000');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const filteredAdvances = advances.filter((adv) => {
    const matchesSearch =
      adv.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      adv.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      adv.advanceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || adv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAdvanced = advances.reduce((sum, a) => sum + a.amount, 0);
  const totalRecovered = advances.reduce((sum, a) => sum + a.recoveredAmount, 0);
  const totalOutstanding = totalAdvanced - totalRecovered;

  const handleGrantAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(loanAmount) || 0;
    const inst = parseFloat(monthlyInstallment) || 0;

    if (amt <= 0 || inst <= 0) {
      notify.error('Please enter valid advance and installment amounts.');
      return;
    }

    const created: AdvanceRecord = {
      id: Date.now(),
      advanceNumber: `ADV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: 1,
      employeeName: empName.split('(')[0].trim(),
      employeeCode: empName.match(/\((.*?)\)/)?.[1] || 'EMP-00000',
      department: 'Bakery Production',
      amount: amt,
      installmentAmount: inst,
      recoveredAmount: 0,
      issuedOn: issueDate,
      status: 'active',
      notes: notes.trim() || 'Approved salary advance.',
    };

    setAdvances([created, ...advances]);
    setIsModalOpen(false);
    setLoanAmount('12000');
    setMonthlyInstallment('3000');
    setNotes('');
    notify.success(`Salary advance ${created.advanceNumber} of ৳${amt.toLocaleString()} approved.`);
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

  return (
    <div className="space-y-6">
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

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          + Grant Advance
        </button>
      </div>

      {/* Register Table */}
      <div className="rounded-xl border border-default bg-surface overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-default bg-surface-sunken text-[11px] font-bold text-muted uppercase tracking-wider">
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
                <td colSpan={8} className="p-8 text-center text-muted">
                  No salary advance records match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredAdvances.map((adv) => {
                const remaining = adv.amount - adv.recoveredAmount;
                const isRecovered = adv.status === 'recovered' || remaining <= 0;

                return (
                  <tr key={adv.id} className="hover:bg-surface-sunken/50 transition-colors">
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
                      {!isRecovered ? (
                        <button
                          type="button"
                          onClick={() => handleManualRecovery(adv.id)}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold border border-default hover:bg-surface-sunken text-default transition-colors"
                        >
                          Deduct Cycle
                        </button>
                      ) : (
                        <span className="text-muted inline-flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled
                        </span>
                      )}
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
    </div>
  );
};
