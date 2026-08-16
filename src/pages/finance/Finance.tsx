// ─────────────────────────────────────────────────────────────
// FINANCE — Accounts, transactions, expenses
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Plus, Download } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { KPICard } from '../../components/ui/KPICard';
import { Tabs, TabList, TabTrigger, TabPanel } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { cn, formatBDT, formatDate } from '../../lib/utils';
import { EXPENSE_CATEGORIES, FINANCE_TREND_7D } from '../../data/mockData';
import { QuickAddAccountModal, QuickAddButton } from '../../components/modals/QuickEntryModals';
import type { Transaction, Expense, ExpenseCategory } from '../../types';

export default function Finance() {
  const accounts     = useAppStore(s => s.accounts);
  const transactions = useAppStore(s => s.transactions);
  const expenses     = useAppStore(s => s.expenses);
  const addExpense   = useAppStore(s => s.addExpense);
  const addTransaction = useAppStore(s => s.addTransaction);
  const updateAccountBalance = useAppStore(s => s.updateAccountBalance);

  const [showExpense, setShowExpense] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [expForm,     setExpForm]     = useState({
    category:    '' as ExpenseCategory | '',
    description: '',
    amount:      '',
    accountId:   '',
    paymentMode: 'cash' as 'cash' | 'bank_transfer' | 'check' | 'mobile_banking',
    notes:       '',
  });

  const totalBalance  = accounts.reduce((s, a) => s + a.balance, 0);
  const totalIncome   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense  = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleAddExpense = () => {
    if (!expForm.category || !expForm.amount || !expForm.accountId) return;
    setSaving(true);
    setTimeout(() => {
      const exp: Expense = {
        id:          `EXP-${Date.now()}`,
        expenseNo:   `EXP-${String(expenses.length + 50).padStart(4,'0')}`,
        category:    expForm.category as ExpenseCategory,
        description: expForm.description,
        amount:      parseFloat(expForm.amount),
        accountId:   expForm.accountId,
        paymentMode: expForm.paymentMode,
        date:        new Date().toISOString().slice(0,10),
        status:      'approved',
        approvedBy:  'Mushfiqur Rahman',
        notes:       expForm.notes,
        createdBy:   'Mushfiqur Rahman',
        createdAt:   new Date().toISOString(),
      };
      const txn: Transaction = {
        id:          `TXN-${Date.now()}`,
        txnNo:       `TXN-${String(transactions.length + 200).padStart(5,'0')}`,
        accountId:   expForm.accountId,
        type:        'expense',
        amount:      parseFloat(expForm.amount),
        category:    expForm.category,
        description: expForm.description,
        reference:   exp.expenseNo,
        date:        exp.date,
        balanceBefore: accounts.find(a => a.id === expForm.accountId)?.balance ?? 0,
        balanceAfter:  (accounts.find(a => a.id === expForm.accountId)?.balance ?? 0) - parseFloat(expForm.amount),
        performedBy:   'Mushfiqur Rahman',
        createdAt:   new Date().toISOString(),
      };
      addExpense(exp);
      addTransaction(txn);
      updateAccountBalance(expForm.accountId, -parseFloat(expForm.amount));
      setShowExpense(false);
      setSaving(false);
      setExpForm({ category: '', description: '', amount: '', accountId: '', paymentMode: 'cash', notes: '' });
    }, 700);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-700 text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Accounts, transactions, expenses and P&L</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>Export</Button>
          <Button variant="primary"   size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowExpense(true)}>
            Add Expense
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Cash & Bank" value={formatBDT(totalBalance, { compact: true })} icon={<Wallet className="w-4.5 h-4.5" />} iconColor="bg-blue-50 text-blue-600" />
        <KPICard label="Total Income"      value={formatBDT(totalIncome, { compact: true })}  icon={<TrendingUp className="w-4.5 h-4.5" />} iconColor="bg-success-50 text-success-600" />
        <KPICard label="Total Expenses"    value={formatBDT(totalExpense, { compact: true })} icon={<TrendingDown className="w-4.5 h-4.5" />} iconColor="bg-error-50 text-error-600" />
        <KPICard label="Net Balance"       value={formatBDT(totalIncome - totalExpense, { compact: true })} icon={<ArrowLeftRight className="w-4.5 h-4.5" />} iconColor="bg-slate-100 text-slate-500" />
      </div>

      {/* Charts + Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <section className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="section-title">Cash Flow — Last 7 Days</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={FINANCE_TREND_7D} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatBDT(Number(v))} contentStyle={{ fontSize: 12 }} />
                <Line dataKey="income"   name="Income"   stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line dataKey="expenses" name="Expenses" stroke="#dc2626" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Accounts */}
        <section className="card">
          <div className="card-header"><h2 className="section-title">Accounts</h2></div>
          <div className="card-body space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <div>
                  <div className="font-500 text-slate-800 text-sm">{acc.name}</div>
                  <div className="text-xs text-slate-400 capitalize">{acc.type.replace('_', ' ')} {acc.accountNo ? `· ${acc.accountNo}` : ''}</div>
                </div>
                <span className={cn('font-mono font-700 text-sm', acc.balance >= 0 ? 'text-slate-900' : 'text-error-600')}>
                  {formatBDT(acc.balance)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Tabs: Transactions / Expenses */}
      <Tabs defaultTab="transactions">
        <TabList>
          <TabTrigger id="transactions">Transactions ({transactions.length})</TabTrigger>
          <TabTrigger id="expenses">Expenses ({expenses.length})</TabTrigger>
        </TabList>

        <div className="card mt-4">
          <TabPanel id="transactions">
            <div className="overflow-x-auto">
              <table className="data-table" aria-label="Transactions">
                <thead>
                  <tr>
                    <th>Txn #</th>
                    <th>Date</th>
                    <th>Account</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="col-numeric">Amount</th>
                    <th className="col-numeric">Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(txn => (
                    <tr key={txn.id}>
                      <td className="font-mono text-xs font-600 text-blue-600">{txn.txnNo ?? txn.transactionNo}</td>
                      <td className="text-xs text-slate-500">{formatDate(txn.date)}</td>
                      <td className="text-slate-700 font-500">{(txn as any).accountName}</td>
                      <td className="text-xs text-slate-500">{txn.category}</td>
                      <td className="text-slate-700">{txn.description}</td>
                      <td className={cn(
                        'col-numeric font-mono font-600',
                        txn.type === 'income' ? 'text-success-700' : 'text-error-700'
                      )}>
                        {txn.type === 'income' ? '+' : '-'}{formatBDT(txn.amount)}
                      </td>
                      <td className="col-numeric font-mono text-slate-700">{formatBDT(txn.balanceAfter ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabPanel>

          <TabPanel id="expenses">
            <div className="overflow-x-auto">
              <table className="data-table" aria-label="Expenses">
                <thead>
                  <tr>
                    <th>Expense #</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Payment Mode</th>
                    <th className="col-numeric">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="font-mono text-xs text-blue-600 font-600">{exp.expenseNo}</td>
                      <td className="text-xs text-slate-500">{formatDate(exp.date)}</td>
                      <td className="text-sm text-slate-700">{exp.category}</td>
                      <td className="text-slate-700">{exp.description}</td>
                      <td className="text-xs text-slate-500">{(exp.paymentMode ?? 'cash').replace('_', ' ')}</td>
                      <td className="col-numeric font-mono font-600 text-error-700">{formatBDT(exp.amount)}</td>
                      <td><StatusBadge status={exp.status ?? 'approved'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabPanel>
        </div>
      </Tabs>

      {/* Add Expense Modal */}
      <Modal
        open={showExpense}
        onClose={() => setShowExpense(false)}
        title="Add Expense"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowExpense(false)}>Cancel</Button>
            <Button variant="danger"    size="sm" loading={saving}
              disabled={!expForm.category || !expForm.amount || !expForm.accountId}
              onClick={handleAddExpense}>
              Record Expense
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="exp-cat">Category</label>
              <select id="exp-cat" className="form-select" value={expForm.category}
                onChange={e => setExpForm(v => ({ ...v, category: e.target.value as ExpenseCategory }))}>
                <option value="">Select…</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label form-label-required" htmlFor="exp-account">Account</label>
                <QuickAddButton label="Account" onClick={() => setShowAddAccount(true)} />
              </div>
              <select id="exp-account" className="form-select" value={expForm.accountId}
                onChange={e => setExpForm(v => ({ ...v, accountId: e.target.value }))}>
                <option value="">Select…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="exp-desc">Description</label>
            <input id="exp-desc" type="text" className="form-input" placeholder="Brief expense description…"
              value={expForm.description} onChange={e => setExpForm(v => ({ ...v, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="exp-amount">Amount (৳)</label>
              <input id="exp-amount" type="number" min="0" className="form-input font-mono text-lg text-center"
                placeholder="5000" value={expForm.amount}
                onChange={e => setExpForm(v => ({ ...v, amount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="exp-mode">Payment Mode</label>
              <select id="exp-mode" className="form-select" value={expForm.paymentMode}
                onChange={e => setExpForm(v => ({ ...v, paymentMode: e.target.value as any }))}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Cheque</option>
                <option value="mobile_banking">Mobile Banking</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="exp-notes">Notes</label>
            <textarea id="exp-notes" className="form-textarea" rows={2} placeholder="Additional notes…"
              value={expForm.notes} onChange={e => setExpForm(v => ({ ...v, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Quick Add Account Modal */}
      <QuickAddAccountModal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onCreated={(acc) => setExpForm(v => ({ ...v, accountId: acc.id }))}
      />
    </div>
  );
}
