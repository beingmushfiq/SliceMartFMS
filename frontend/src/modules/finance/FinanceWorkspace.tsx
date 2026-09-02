import React, { useState } from 'react';
import type {
  ChartOfAccount,
  JournalEntry,
  BankAccount,
  Expense,
  ProductCost,
} from '../../types/api/finance';

type FinanceTab = 'coa' | 'journal' | 'banking' | 'expenses' | 'costing' | 'statements';

function createManualJournalEntry(
  entryIndex: number,
  narration: string,
  totalDebit: number,
  totalCredit: number,
  lines: Array<{ account_id: number; debit: string; credit: string; narration: string }>,
  accounts: ChartOfAccount[]
): JournalEntry {
  const now = new Date();
  const idStr = String(entryIndex).padStart(4, '0');
  const monthStr = now.toISOString().slice(0, 7).replace('-', '');
  return {
    id: entryIndex,
    uuid: `je-auto-${now.getTime()}`,
    entry_number: `JE-${monthStr}-${idStr}`,
    entry_date: now.toISOString().slice(0, 10),
    entry_type: 'manual',
    source_module: 'general_ledger',
    narration: narration || 'Manual double-entry adjustment',
    total_debit: totalDebit.toFixed(4),
    total_credit: totalCredit.toFixed(4),
    status: 'posted',
    posted_at: now.toISOString(),
    lines: lines.map((l, idx) => {
      const acc = accounts.find((a) => a.id === l.account_id);
      return {
        id: idx + 1,
        account_id: l.account_id,
        account: acc,
        debit_amount: parseFloat(l.debit || '0').toFixed(4),
        credit_amount: parseFloat(l.credit || '0').toFixed(4),
        narration: l.narration,
      };
    }),
  };
}

export const FinanceWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('journal');

  // Chart of Accounts State
  const [accounts] = useState<ChartOfAccount[]>([
    {
      id: 101,
      uuid: 'coa-101',
      account_code: '1010',
      name: 'Cash on Hand',
      account_type: 'asset',
      account_subtype: 'cash',
      normal_balance: 'debit',
      is_active: true,
      current_balance: '125000.0000',
    },
    {
      id: 102,
      uuid: 'coa-102',
      account_code: '1020',
      name: 'BRAC Bank Operating A/C',
      account_type: 'asset',
      account_subtype: 'bank',
      normal_balance: 'debit',
      is_active: true,
      current_balance: '845000.0000',
    },
    {
      id: 103,
      uuid: 'coa-103',
      account_code: '1050',
      name: 'Accounts Receivable',
      account_type: 'asset',
      account_subtype: 'receivable',
      normal_balance: 'debit',
      is_active: true,
      current_balance: '340000.0000',
    },
    {
      id: 201,
      uuid: 'coa-201',
      account_code: '2010',
      name: 'Accounts Payable',
      account_type: 'liability',
      account_subtype: 'payable',
      normal_balance: 'credit',
      is_active: true,
      current_balance: '210000.0000',
    },
    {
      id: 301,
      uuid: 'coa-301',
      account_code: '3010',
      name: 'Shareholders Equity',
      account_type: 'equity',
      account_subtype: 'capital',
      normal_balance: 'credit',
      is_active: true,
      current_balance: '500000.0000',
    },
    {
      id: 401,
      uuid: 'coa-401',
      account_code: '4010',
      name: 'Sales Revenue',
      account_type: 'income',
      account_subtype: 'sales',
      normal_balance: 'credit',
      is_active: true,
      current_balance: '950000.0000',
    },
    {
      id: 501,
      uuid: 'coa-501',
      account_code: '5010',
      name: 'Cost of Goods Sold (COGS)',
      account_type: 'expense',
      account_subtype: 'cogs',
      normal_balance: 'debit',
      is_active: true,
      current_balance: '480000.0000',
    },
    {
      id: 601,
      uuid: 'coa-601',
      account_code: '6010',
      name: 'Direct Factory Labour',
      account_type: 'expense',
      account_subtype: 'labour',
      normal_balance: 'debit',
      is_active: true,
      current_balance: '145000.0000',
    },
  ]);

  // Journal Entries State
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      id: 1,
      uuid: 'je-01',
      entry_number: 'JE-202608-0001',
      entry_date: '2026-08-28',
      entry_type: 'manual',
      source_module: 'general_ledger',
      narration: 'Cash sale received from customer counter',
      total_debit: '15000.0000',
      total_credit: '15000.0000',
      status: 'posted',
      posted_at: '2026-08-28 10:15:00',
      lines: [
        {
          id: 1,
          account_id: 101,
          account: {
            id: 101,
            uuid: 'coa-101',
            account_code: '1010',
            name: 'Cash on Hand',
            account_type: 'asset',
            normal_balance: 'debit',
            is_active: true,
          },
          debit_amount: '15000.0000',
          credit_amount: '0.0000',
          narration: 'Counter cash received',
        },
        {
          id: 2,
          account_id: 401,
          account: {
            id: 401,
            uuid: 'coa-401',
            account_code: '4010',
            name: 'Sales Revenue',
            account_type: 'income',
            normal_balance: 'credit',
            is_active: true,
          },
          debit_amount: '0.0000',
          credit_amount: '15000.0000',
          narration: 'Sales revenue recognized',
        },
      ],
    },
    {
      id: 2,
      uuid: 'je-02',
      entry_number: 'JE-202608-0002',
      entry_date: '2026-08-28',
      entry_type: 'system',
      source_module: 'assets',
      narration: 'Monthly depreciation for cutting equipment',
      total_debit: '4500.0000',
      total_credit: '4500.0000',
      status: 'posted',
      posted_at: '2026-08-28 11:30:00',
      lines: [
        {
          id: 3,
          account_id: 501,
          debit_amount: '4500.0000',
          credit_amount: '0.0000',
          narration: 'Depreciation expense',
        },
        {
          id: 4,
          account_id: 101,
          debit_amount: '0.0000',
          credit_amount: '4500.0000',
          narration: 'Accumulated depreciation offset',
        },
      ],
    },
  ]);

  // Bank Accounts State
  const [bankAccounts] = useState<BankAccount[]>([
    {
      id: 1,
      uuid: 'ba-01',
      company_id: 1,
      account_name: 'SliceMart Principal Operating',
      account_number: '1501204892001',
      bank_name: 'BRAC Bank PLC',
      branch_name: 'Gulshan Branch',
      routing_number: '060261354',
      swift_code: 'BRAKBDDH',
      currency_code: 'BDT',
      opening_balance: '500000.0000',
      current_balance: '845000.0000',
      is_active: true,
    },
    {
      id: 2,
      uuid: 'ba-02',
      company_id: 1,
      account_name: 'SliceMart Factory Payroll',
      account_number: '2050189340002',
      bank_name: 'Islami Bank Bangladesh PLC',
      branch_name: 'Tejgaon Industrial Area',
      routing_number: '125271890',
      swift_code: 'IBBLBDDH',
      currency_code: 'BDT',
      opening_balance: '200000.0000',
      current_balance: '350000.0000',
      is_active: true,
    },
  ]);

  // Expenses State
  const [expenses] = useState<Expense[]>([
    {
      id: 1,
      uuid: 'exp-01',
      company_id: 1,
      expense_category_id: 1,
      category: {
        id: 1,
        uuid: 'ec-01',
        code: 'UTIL',
        name: 'Factory Electricity & Power',
        is_active: true,
      },
      expense_date: '2026-08-25',
      amount: '42500.0000',
      payment_method: 'bank_transfer',
      payee_name: 'DESCO Ltd.',
      description: 'Factory power bill for July/August billing cycle',
      status: 'approved',
      journal_entry_id: 101,
    },
    {
      id: 2,
      uuid: 'exp-02',
      company_id: 1,
      expense_category_id: 3,
      category: {
        id: 3,
        uuid: 'ec-03',
        code: 'LOG',
        name: 'Courier & Last-mile Dispatch',
        is_active: true,
      },
      expense_date: '2026-08-27',
      amount: '12800.0000',
      payment_method: 'cash',
      payee_name: 'Pathao Fleet Dispatch',
      description: 'Weekly courier delivery handling settlement',
      status: 'approved',
      journal_entry_id: 102,
    },
  ]);

  // Product Costings State
  const [productCosts] = useState<ProductCost[]>([
    {
      id: 1,
      uuid: 'pc-01',
      product_id: 1,
      product: { id: 1, name: 'Premium Cotton Oxford Shirt', sku: 'SHT-OXF-001' },
      costing_method: 'standard',
      material_cost: '320.0000',
      labour_cost: '145.0000',
      overhead_cost: '45.0000',
      total_cost: '510.0000',
      standard_cost: '510.0000',
      effective_from: '2026-08-01',
      source: 'production',
      calculated_at: '2026-08-28 08:30:00',
    },
    {
      id: 2,
      uuid: 'pc-02',
      product_id: 2,
      product: { id: 2, name: 'Slim Fit Denim Jeans 14oz', sku: 'JNS-SLM-002' },
      costing_method: 'standard',
      material_cost: '480.0000',
      labour_cost: '190.0000',
      overhead_cost: '60.0000',
      total_cost: '730.0000',
      standard_cost: '730.0000',
      effective_from: '2026-08-01',
      source: 'production',
      calculated_at: '2026-08-28 08:30:00',
    },
  ]);

  // New Journal Entry Modal State
  const [showNewJournalModal, setShowNewJournalModal] = useState(false);
  const [newNarration, setNewNarration] = useState('');
  const [newLines, setNewLines] = useState<
    Array<{ account_id: number; debit: string; credit: string; narration: string }>
  >([
    { account_id: 101, debit: '0.00', credit: '0.00', narration: '' },
    { account_id: 401, debit: '0.00', credit: '0.00', narration: '' },
  ]);

  const totalNewDebit = newLines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const totalNewCredit = newLines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const isJournalBalanced = Math.abs(totalNewDebit - totalNewCredit) < 0.001 && totalNewDebit > 0;

  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJournalBalanced) {
      alert('Debit must exactly equal Credit to post a double-entry journal entry.');
      return;
    }

    const createdEntry = createManualJournalEntry(
      journalEntries.length + 1,
      newNarration,
      totalNewDebit,
      totalNewCredit,
      newLines,
      accounts
    );

    setJournalEntries([createdEntry, ...journalEntries]);
    setShowNewJournalModal(false);
    setNewNarration('');
    setNewLines([
      { account_id: 101, debit: '0.00', credit: '0.00', narration: '' },
      { account_id: 401, debit: '0.00', credit: '0.00', narration: '' },
    ]);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Module Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20">
              Finance & Accounting
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default">
            General Ledger & Cost Rollup Hub
          </h1>
          <p className="mt-1.5 text-xs text-muted max-w-2xl leading-relaxed">
            Double-entry General Ledger, Chart of Accounts, Bank Reconciliations & Multi-Component Production Cost Rollups
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowNewJournalModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs"
          >
            <span>+</span> Post Journal Entry
          </button>
        </div>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-6 shadow-xs border border-default">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Total Liquid Assets
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            ৳ 970,000.00
          </div>
          <div className="text-[11px] text-muted mt-1">Cash (৳125k) + BRAC Bank (৳845k)</div>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-xs border border-default">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Total Receivables
          </div>
          <div className="text-2xl font-extrabold text-primary mt-2 font-mono">
            ৳ 340,000.00
          </div>
          <div className="text-[11px] text-muted mt-1">From Corporate & B2B Invoices</div>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-xs border border-default">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Operating Payables
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            ৳ 210,000.00
          </div>
          <div className="text-[11px] text-muted mt-1">Supplier Bills & Logistics</div>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-xs border border-default">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Recognized Sales Revenue
          </div>
          <div className="text-2xl font-extrabold text-primary mt-2 font-mono">
            ৳ 950,000.00
          </div>
          <div className="text-[11px] text-muted mt-1">Current Fiscal Period</div>
        </div>
      </div>

      {/* Segmented Navigation Tabs Tray */}
      <div className="flex overflow-x-auto p-1.5 bg-surface-sunken rounded-2xl border border-default shadow-2xs">
        <div className="flex gap-1.5 min-w-full sm:min-w-0">
          {([
            { id: 'journal', label: 'General Ledger & Journals', count: journalEntries.length },
            { id: 'coa', label: 'Chart of Accounts', count: accounts.length },
            { id: 'statements', label: 'Financial Statements & P&L', count: 'Live' },
            { id: 'banking', label: 'Banking & Treasury', count: bankAccounts.length },
            { id: 'expenses', label: 'Operating Expenses', count: expenses.length },
            { id: 'costing', label: 'Product Cost Rollup', count: productCosts.length },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-surface text-default font-semibold shadow-xs border border-default/70'
                    : 'text-muted hover:text-default hover:bg-surface/50 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-primary-subtle text-primary font-bold' : 'bg-surface-sunken text-muted'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: General Ledger & Journals */}
      {activeTab === 'journal' && (
        <div className="space-y-4 pt-1">
          <div className="bg-surface rounded-2xl shadow-xs border border-default overflow-hidden">
            <table className="w-full text-left text-xs text-default">
              <thead className="bg-surface-sunken/70 text-muted uppercase text-[11px] font-semibold tracking-wider border-b border-default">
                <tr>
                  <th className="px-5 py-3.5">Entry Number</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Module / Type</th>
                  <th className="px-5 py-3.5">Narration</th>
                  <th className="px-5 py-3.5 text-right">Debit (BDT)</th>
                  <th className="px-5 py-3.5 text-right">Credit (BDT)</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {journalEntries.map((je) => (
                  <tr key={je.id} className="hover:bg-surface-sunken/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-primary">
                      {je.entry_number}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-muted">{je.entry_date}</td>
                    <td className="px-5 py-3.5">
                      <span className="capitalize px-2.5 py-0.5 text-[10px] font-semibold bg-surface-sunken rounded-full text-muted border border-default">
                        {je.source_module} ({je.entry_type})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-default">{je.narration}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{' '}
                      {parseFloat(je.total_debit).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{' '}
                      {parseFloat(je.total_credit).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {je.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Chart of Accounts */}
      {activeTab === 'coa' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Account Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Subtype</th>
                <th className="px-6 py-3">Normal Balance</th>
                <th className="px-6 py-3 text-right">Current Balance (BDT)</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-gray-100">
                    {acc.account_code}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {acc.name}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    <span
                      className={`px-2 py-0.5 text-xs rounded font-medium ${
                        acc.account_type === 'asset'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          : acc.account_type === 'liability'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : acc.account_type === 'income'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                      }`}
                    >
                      {acc.account_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize text-gray-500">
                    {acc.account_subtype || '—'}
                  </td>
                  <td className="px-6 py-4 uppercase text-xs font-semibold text-gray-500">
                    {acc.normal_balance}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">
                    ৳{' '}
                    {parseFloat(acc.current_balance || '0').toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Banking & Treasury */}
      {activeTab === 'banking' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bankAccounts.map((ba) => (
            <div
              key={ba.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {ba.bank_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {ba.account_name} ({ba.branch_name})
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {ba.currency_code}
                </span>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Account Number:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {ba.account_number}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Routing Number:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    {ba.routing_number}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">SWIFT Code:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    {ba.swift_code}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-500">Current Balance:</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  ৳{' '}
                  {parseFloat(ba.current_balance).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Expenses & Claims */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Expense Date</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Payee Name</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Payment Method</th>
                <th className="px-6 py-3 text-right">Amount (BDT)</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4">{exp.expense_date}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                    {exp.category?.name}
                  </td>
                  <td className="px-6 py-4">{exp.payee_name || '—'}</td>
                  <td className="px-6 py-4 max-w-xs truncate text-gray-500">{exp.description}</td>
                  <td className="px-6 py-4 capitalize text-xs">
                    {exp.payment_method.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                    ৳ {parseFloat(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {exp.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Product Cost Rollup */}
      {activeTab === 'costing' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Product / SKU</th>
                  <th className="px-6 py-3 text-right">Material Cost</th>
                  <th className="px-6 py-3 text-right">Piece-rate Labour</th>
                  <th className="px-6 py-3 text-right">Factory Overhead</th>
                  <th className="px-6 py-3 text-right">Standard Unit Cost</th>
                  <th className="px-6 py-3">Effective Date</th>
                  <th className="px-6 py-3 text-center">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {productCosts.map((pc) => (
                  <tr key={pc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {pc.product?.name}
                      </div>
                      <div className="text-xs font-mono text-gray-500">{pc.product?.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">
                      ৳ {parseFloat(pc.material_cost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      ৳ {parseFloat(pc.labour_cost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">
                      ৳ {parseFloat(pc.overhead_cost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      ৳ {parseFloat(pc.total_cost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{pc.effective_from}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded">
                        {pc.source.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Financial Statements & P&L */}
      {activeTab === 'statements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Fiscal Period Statement of Profit & Loss (Income Statement)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Live computed from posted general ledger transactions and inventory valuation
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 cursor-pointer"
            >
              🖨️ Print Financial Statement
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Statement Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b pb-2 dark:border-gray-700">
                Revenue & Cost of Sales
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-gray-900 dark:text-gray-100 font-semibold">
                  <span>Gross Sales Revenue</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">৳ 950,000.00</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                  <span className="pl-4">Less: Cost of Goods Sold (COGS)</span>
                  <span className="font-mono text-rose-500">(৳ 480,000.00)</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                  <span className="pl-4">Less: Direct Factory Labour</span>
                  <span className="font-mono text-rose-500">(৳ 145,000.00)</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center font-bold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900/40 p-2 rounded">
                  <span>Gross Profit</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">৳ 325,000.00 (34.2%)</span>
                </div>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b pb-2 pt-3 dark:border-gray-700">
                Operating Expenses
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                  <span>Logistics & 3PL Courier Fees</span>
                  <span className="font-mono">৳ 38,500.00</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                  <span>Utilities & Factory Power</span>
                  <span className="font-mono">৳ 24,000.00</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                  <span>Administrative & Software</span>
                  <span className="font-mono">৳ 18,200.00</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center font-bold text-base text-gray-900 dark:text-gray-100 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
                  <span className="text-emerald-700 dark:text-emerald-400">Net Operating Income</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">৳ 244,300.00</span>
                </div>
              </div>
            </div>

            {/* Balance Sheet Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b pb-2 dark:border-gray-700">
                Balance Sheet Equation (Assets = Liabilities + Equity)
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <div className="flex justify-between items-center font-bold text-blue-900 dark:text-blue-300 mb-1.5">
                    <span>Total Current & Fixed Assets</span>
                    <span className="font-mono">৳ 1,310,000.00</span>
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
                    <div className="flex justify-between"><span>• Liquid Cash & Banks:</span> <span className="font-mono font-semibold">৳ 970,000.00</span></div>
                    <div className="flex justify-between"><span>• Accounts Receivable:</span> <span className="font-mono font-semibold">৳ 340,000.00</span></div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <div className="flex justify-between items-center font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                    <span>Total Liabilities</span>
                    <span className="font-mono">৳ 210,000.00</span>
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5">
                    <div className="flex justify-between"><span>• Accounts Payable:</span> <span className="font-mono font-semibold">৳ 210,000.00</span></div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex justify-between items-center font-bold text-indigo-900 dark:text-indigo-300 mb-1.5">
                    <span>Owner's Equity & Retained Earnings</span>
                    <span className="font-mono">৳ 1,100,000.00</span>
                  </div>
                  <div className="text-xs text-indigo-700 dark:text-indigo-400 space-y-0.5">
                    <div className="flex justify-between"><span>• Contributed Capital:</span> <span className="font-mono font-semibold">৳ 500,000.00</span></div>
                    <div className="flex justify-between"><span>• Retained Fiscal Earnings:</span> <span className="font-mono font-semibold">৳ 600,000.00</span></div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span>Balance Check: ৳ 1,310,000 = ৳ 210,000 + ৳ 1,100,000</span>
                  <span>✓ 100% IN BALANCE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Journal Entry Modal */}
      {showNewJournalModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Post Double-Entry Journal Voucher
              </h3>
              <button
                onClick={() => setShowNewJournalModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostJournal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Narration / Description
                </label>
                <input
                  type="text"
                  value={newNarration}
                  onChange={(e) => setNewNarration(e.target.value)}
                  placeholder="e.g. Counter cash sales deposit"
                  required
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Journal Lines (Debit = Credit)
                </label>
                {newLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <select
                      value={line.account_id}
                      onChange={(e) => {
                        const updated = [...newLines];
                        const target = updated[idx];
                        if (target) {
                          target.account_id = parseInt(e.target.value);
                          setNewLines(updated);
                        }
                      }}
                      className="col-span-6 px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.account_code} - {a.name} ({a.account_type})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Debit"
                      value={line.debit}
                      onChange={(e) => {
                        const updated = [...newLines];
                        const target = updated[idx];
                        if (target) {
                          target.debit = e.target.value;
                          setNewLines(updated);
                        }
                      }}
                      className="col-span-3 px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-right font-mono"
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Credit"
                      value={line.credit}
                      onChange={(e) => {
                        const updated = [...newLines];
                        const target = updated[idx];
                        if (target) {
                          target.credit = e.target.value;
                          setNewLines(updated);
                        }
                      }}
                      className="col-span-3 px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-right font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Balance Verification Bar */}
              <div
                className={`p-4 rounded-lg flex items-center justify-between text-sm ${
                  isJournalBalanced
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                <div>
                  <span className="font-semibold">Debits:</span> ৳ {totalNewDebit.toFixed(2)} |{' '}
                  <span className="font-semibold">Credits:</span> ৳ {totalNewCredit.toFixed(2)}
                </div>
                <div className="font-bold">
                  {isJournalBalanced
                    ? '✓ BALANCED'
                    : `⚠️ OUT OF BALANCE (৳ ${Math.abs(totalNewDebit - totalNewCredit).toFixed(2)})`}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowNewJournalModal(false)}
                  className="px-4 py-2 text-sm border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJournalBalanced}
                  className="px-5 py-2 text-sm bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white font-medium rounded-lg shadow"
                >
                  Confirm & Post to General Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceWorkspace;
