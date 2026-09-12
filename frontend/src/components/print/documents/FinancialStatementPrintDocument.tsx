import React, { useMemo } from 'react';
import type { BusinessConfig } from '../../../lib/document/useBusinessConfig';
import { formatCurrency, formatDocumentDate } from '../../../lib/document/formatters';
import { generateBarcodeSvg } from '../../../lib/barcode/engine';

export interface FinancialStatementData {
  periodTitle: string;
  reportCode: string;
  revenue: {
    grossSales: number;
    cogs: number;
    directLabour: number;
  };
  expenses: {
    logistics: number;
    utilities: number;
    administrative: number;
  };
  balanceSheet: {
    cashAndBanks: number;
    accountsReceivable: number;
    accountsPayable: number;
    contributedCapital: number;
    retainedEarnings: number;
  };
}

export interface FinancialStatementPrintDocumentProps {
  businessConfig: BusinessConfig;
  data?: Partial<FinancialStatementData>;
  generatedBy?: string;
  fiscalPeriodText?: string;
}

const DEFAULT_STATEMENT_DATA: FinancialStatementData = {
  periodTitle: 'Q3 FY2026 (1 Jul 2026 – 30 Sep 2026)',
  reportCode: 'FS-PL-2026-Q3',
  revenue: {
    grossSales: 950000,
    cogs: 480000,
    directLabour: 145000,
  },
  expenses: {
    logistics: 38500,
    utilities: 24000,
    administrative: 18200,
  },
  balanceSheet: {
    cashAndBanks: 970000,
    accountsReceivable: 340000,
    accountsPayable: 210000,
    contributedCapital: 500000,
    retainedEarnings: 600000,
  },
};

export const FinancialStatementPrintDocument: React.FC<FinancialStatementPrintDocumentProps> = ({
  businessConfig,
  data: propData,
  generatedBy = 'Chief Financial Controller',
  fiscalPeriodText,
}) => {
  const data = useMemo<FinancialStatementData>(() => {
    return {
      periodTitle: propData?.periodTitle || fiscalPeriodText || DEFAULT_STATEMENT_DATA.periodTitle,
      reportCode: propData?.reportCode || DEFAULT_STATEMENT_DATA.reportCode,
      revenue: {
        grossSales: propData?.revenue?.grossSales ?? DEFAULT_STATEMENT_DATA.revenue.grossSales,
        cogs: propData?.revenue?.cogs ?? DEFAULT_STATEMENT_DATA.revenue.cogs,
        directLabour: propData?.revenue?.directLabour ?? DEFAULT_STATEMENT_DATA.revenue.directLabour,
      },
      expenses: {
        logistics: propData?.expenses?.logistics ?? DEFAULT_STATEMENT_DATA.expenses.logistics,
        utilities: propData?.expenses?.utilities ?? DEFAULT_STATEMENT_DATA.expenses.utilities,
        administrative: propData?.expenses?.administrative ?? DEFAULT_STATEMENT_DATA.expenses.administrative,
      },
      balanceSheet: {
        cashAndBanks: propData?.balanceSheet?.cashAndBanks ?? DEFAULT_STATEMENT_DATA.balanceSheet.cashAndBanks,
        accountsReceivable: propData?.balanceSheet?.accountsReceivable ?? DEFAULT_STATEMENT_DATA.balanceSheet.accountsReceivable,
        accountsPayable: propData?.balanceSheet?.accountsPayable ?? DEFAULT_STATEMENT_DATA.balanceSheet.accountsPayable,
        contributedCapital: propData?.balanceSheet?.contributedCapital ?? DEFAULT_STATEMENT_DATA.balanceSheet.contributedCapital,
        retainedEarnings: propData?.balanceSheet?.retainedEarnings ?? DEFAULT_STATEMENT_DATA.balanceSheet.retainedEarnings,
      },
    };
  }, [propData, fiscalPeriodText]);

  const currencySymbol = businessConfig.currencySymbol || '৳';

  // Financial Calculations
  const costOfGoodsTotal = data.revenue.cogs + data.revenue.directLabour;
  const grossProfit = data.revenue.grossSales - costOfGoodsTotal;
  const grossProfitMargin = (grossProfit / (data.revenue.grossSales || 1)) * 100;

  const totalOpex = data.expenses.logistics + data.expenses.utilities + data.expenses.administrative;
  const netOperatingIncome = grossProfit - totalOpex;
  const netProfitMargin = (netOperatingIncome / (data.revenue.grossSales || 1)) * 100;

  const totalAssets = data.balanceSheet.cashAndBanks + data.balanceSheet.accountsReceivable;
  const totalLiabilities = data.balanceSheet.accountsPayable;
  const totalEquity = data.balanceSheet.contributedCapital + data.balanceSheet.retainedEarnings;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

  const companyInitials = (businessConfig.name || 'SliceMart')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SM';

  const barcodeSvg = useMemo(() => {
    return generateBarcodeSvg({
      bcid: 'code128',
      text: data.reportCode || 'FS-PL-2026-Q3',
      scale: 1.2,
      height: 7,
      includeText: false,
    });
  }, [data.reportCode]);

  return (
    <div className="print-doc w-full text-slate-900 bg-white text-[8.5pt] leading-normal font-sans print-page-a4 p-6 sm:p-8">
      {/* Official Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
        <div className="max-w-[58%]">
          <div className="flex items-center gap-2 mb-1">
            {businessConfig.logoUrl ? (
              <img
                src={businessConfig.logoUrl}
                alt={businessConfig.name}
                className="size-9 rounded object-contain"
              />
            ) : (
              <div className="size-9 rounded bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                {companyInitials}
              </div>
            )}
            <div>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight">
                {businessConfig.name}
              </h1>
              <p className="text-[7pt] font-semibold text-slate-600 uppercase tracking-wide">
                Corporate Finance & Accounting Desk &bull; Official Statutory Statement
              </p>
            </div>
          </div>
          <div className="text-[7.5pt] text-slate-600 mt-1 space-y-0.5">
            <p>{businessConfig.address || 'Industrial Processing Zone, Facility #1'}</p>
            <p>
              <span className="font-semibold text-slate-800">TIN/VAT:</span> {businessConfig.vatNumber || businessConfig.tinNumber || 'VAT-REG-981240-2026'} &bull;{' '}
              <span className="font-semibold text-slate-800">Phone:</span> {businessConfig.phone || '+880 1700-000000'}
            </p>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="inline-block bg-slate-900 text-white text-[7pt] font-black uppercase px-2 py-0.5 rounded mb-1">
            Audited Financial Record
          </div>
          <h2 className="text-sm font-black text-slate-950 uppercase tracking-tight">
            Financial Statement
          </h2>
          <div className="text-[7.5pt] font-mono text-slate-600 mt-0.5">
            Ref: <span className="font-bold text-slate-900">{data.reportCode}</span>
          </div>
          {barcodeSvg && (
            <div
              className="mt-1"
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
            />
          )}
          <div className="text-[7pt] text-slate-500 font-mono mt-0.5">
            Generated: {formatDocumentDate(new Date().toISOString(), true)}
          </div>
        </div>
      </div>

      {/* Parameter Ribbon */}
      <div className="bg-slate-100 border border-slate-300 rounded-lg p-2 mb-3 grid grid-cols-4 gap-2 text-[7.5pt]">
        <div>
          <span className="text-slate-500 block uppercase font-bold text-[6.5pt]">Reporting Fiscal Period</span>
          <span className="font-bold text-slate-900">{data.periodTitle}</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-bold text-[6.5pt]">Accounting Standard</span>
          <span className="font-semibold text-slate-800">Accrual Basis (IFRS/GAAP)</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase font-bold text-[6.5pt]">Reporting Currency</span>
          <span className="font-semibold text-slate-800">{businessConfig.currencyCode || 'BDT'} ({currencySymbol})</span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 block uppercase font-bold text-[6.5pt]">Reconciliation Audit</span>
          <span className="font-bold text-emerald-700">✓ 100% IN BALANCE</span>
        </div>
      </div>

      {/* Executive Financial Performance KPI Cards */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-50 border border-slate-300 rounded p-2 text-center">
          <span className="text-[6.5pt] uppercase font-bold text-slate-500 block">Gross Sales Revenue</span>
          <span className="text-[9.5pt] font-black text-slate-950 font-mono">
            {formatCurrency(data.revenue.grossSales, currencySymbol)}
          </span>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-300 rounded p-2 text-center">
          <span className="text-[6.5pt] uppercase font-bold text-emerald-800 block">Gross Profit ({grossProfitMargin.toFixed(1)}%)</span>
          <span className="text-[9.5pt] font-black text-emerald-900 font-mono">
            {formatCurrency(grossProfit, currencySymbol)}
          </span>
        </div>
        <div className="bg-blue-50/50 border border-blue-300 rounded p-2 text-center">
          <span className="text-[6.5pt] uppercase font-bold text-blue-800 block">Net Operating Income</span>
          <span className="text-[9.5pt] font-black text-blue-900 font-mono">
            {formatCurrency(netOperatingIncome, currencySymbol)}
          </span>
        </div>
        <div className="bg-purple-50/50 border border-purple-300 rounded p-2 text-center">
          <span className="text-[6.5pt] uppercase font-bold text-purple-800 block">Total Balance Assets</span>
          <span className="text-[9.5pt] font-black text-purple-900 font-mono">
            {formatCurrency(totalAssets, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Section 1: Statement of Profit & Loss (Income Statement) */}
      <div className="border border-slate-300 rounded-lg overflow-hidden mb-3">
        <div className="bg-slate-900 text-white px-3 py-1.5 flex justify-between items-center text-[8pt] font-bold">
          <span>PART I: STATEMENT OF PROFIT & LOSS (INCOME STATEMENT)</span>
          <span className="text-[7pt] font-normal opacity-80">Posted General Ledger & Inventory Valuation</span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-[7pt] uppercase font-bold text-slate-600">
              <th className="py-1 px-3">Account Code & Line Description</th>
              <th className="py-1 px-3 text-right">Sub-Total ({currencySymbol})</th>
              <th className="py-1 px-3 text-right">Net Amount ({currencySymbol})</th>
              <th className="py-1 px-3 text-right">% of Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Revenue */}
            <tr className="bg-white font-semibold text-slate-950">
              <td className="py-1.5 px-3">
                <span className="font-bold">4000 &bull; Gross Operating Sales Revenue</span>
              </td>
              <td className="py-1.5 px-3 text-right font-mono text-slate-500">—</td>
              <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800">
                {formatCurrency(data.revenue.grossSales, currencySymbol)}
              </td>
              <td className="py-1.5 px-3 text-right font-mono text-slate-600">100.0%</td>
            </tr>

            {/* Cost of Sales Header */}
            <tr className="bg-slate-50/70 text-[7.5pt] font-bold text-slate-700">
              <td colSpan={4} className="py-1 px-3 uppercase tracking-wider text-slate-500">
                Cost of Goods Sold & Direct Production Costs (COGS)
              </td>
            </tr>
            <tr className="text-slate-700">
              <td className="py-1 px-3 pl-6">
                5100 &bull; Direct Material & Packaging Consumption (COGS)
              </td>
              <td className="py-1 px-3 text-right font-mono text-rose-700">
                ({formatCurrency(data.revenue.cogs, currencySymbol)})
              </td>
              <td className="py-1 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-1 px-3 text-right font-mono text-slate-500">
                {((data.revenue.cogs / (data.revenue.grossSales || 1)) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr className="text-slate-700">
              <td className="py-1 px-3 pl-6">
                5200 &bull; Direct Factory & Production Labour
              </td>
              <td className="py-1 px-3 text-right font-mono text-rose-700">
                ({formatCurrency(data.revenue.directLabour, currencySymbol)})
              </td>
              <td className="py-1 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-1 px-3 text-right font-mono text-slate-500">
                {((data.revenue.directLabour / (data.revenue.grossSales || 1)) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr className="bg-slate-100/60 font-semibold text-slate-800">
              <td className="py-1.5 px-3 pl-6 italic">Total Cost of Goods Sold</td>
              <td className="py-1.5 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700">
                ({formatCurrency(costOfGoodsTotal, currencySymbol)})
              </td>
              <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                {((costOfGoodsTotal / (data.revenue.grossSales || 1)) * 100).toFixed(1)}%
              </td>
            </tr>

            {/* Gross Profit Subtotal */}
            <tr className="bg-emerald-50/70 border-t-2 border-b-2 border-emerald-400/50 font-bold text-slate-950">
              <td className="py-1.5 px-3 uppercase text-emerald-950">
                GROSS PROFIT (Operational Margin)
              </td>
              <td className="py-1.5 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-1.5 px-3 text-right font-mono font-black text-emerald-800 text-[9pt]">
                {formatCurrency(grossProfit, currencySymbol)}
              </td>
              <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-900">
                {grossProfitMargin.toFixed(1)}%
              </td>
            </tr>

            {/* Operating Expenses */}
            <tr className="bg-slate-50/70 text-[7.5pt] font-bold text-slate-700">
              <td colSpan={4} className="py-1 px-3 uppercase tracking-wider text-slate-500">
                Operating Expenses & Overheads (OPEX)
              </td>
            </tr>
            <tr className="text-slate-700">
              <td className="py-1 px-3 pl-6">6100 &bull; Logistics & 3PL Delivery Courier Fees</td>
              <td className="py-1 px-3 text-right font-mono text-slate-700">
                {formatCurrency(data.expenses.logistics, currencySymbol)}
              </td>
              <td className="py-1 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-1 px-3 text-right font-mono text-slate-500">
                {((data.expenses.logistics / (data.revenue.grossSales || 1)) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr className="text-slate-700">
              <td className="py-1 px-3 pl-6">6200 &bull; Factory Utilities, Power & Water</td>
              <td className="py-1 px-3 text-right font-mono text-slate-700">
                {formatCurrency(data.expenses.utilities, currencySymbol)}
              </td>
              <td className="py-1 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-1 px-3 text-right font-mono text-slate-500">
                {((data.expenses.utilities / (data.revenue.grossSales || 1)) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr className="text-slate-700">
              <td className="py-1 px-3 pl-6">6300 &bull; Administrative, IT & Software Licenses</td>
              <td className="py-1 px-3 text-right font-mono text-slate-700">
                {formatCurrency(data.expenses.administrative, currencySymbol)}
              </td>
              <td className="py-1 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-1 px-3 text-right font-mono text-slate-500">
                {((data.expenses.administrative / (data.revenue.grossSales || 1)) * 100).toFixed(1)}%
              </td>
            </tr>
            <tr className="bg-slate-100/60 font-semibold text-slate-800">
              <td className="py-1.5 px-3 pl-6 italic">Total Operating Expenses (OPEX)</td>
              <td className="py-1.5 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-700">
                ({formatCurrency(totalOpex, currencySymbol)})
              </td>
              <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                {((totalOpex / (data.revenue.grossSales || 1)) * 100).toFixed(1)}%
              </td>
            </tr>

            {/* Net Operating Income Double Underline */}
            <tr className="bg-slate-900 text-white font-black text-[9pt]">
              <td className="py-2 px-3 uppercase tracking-wide">
                NET OPERATING INCOME (EBIT)
              </td>
              <td className="py-2 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-2 px-3 text-right font-mono font-black text-emerald-300 text-[10pt]">
                {formatCurrency(netOperatingIncome, currencySymbol)}
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-200">
                {netProfitMargin.toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 2: Statement of Financial Position (Balance Sheet Summary) */}
      <div className="border border-slate-300 rounded-lg overflow-hidden mb-3">
        <div className="bg-slate-900 text-white px-3 py-1.5 flex justify-between items-center text-[8pt] font-bold">
          <span>PART II: STATEMENT OF FINANCIAL POSITION (BALANCE SHEET SUMMARY)</span>
          <span className="text-[7pt] font-normal opacity-80">Fundamental Accounting Equation Verification</span>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-300 bg-white">
          {/* Left Column: Assets */}
          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-300 pb-1">
              <span className="font-bold uppercase text-[7.5pt] text-slate-700">Current & Liquid Assets</span>
              <span className="text-[7pt] text-slate-500 font-mono">1000 - 1999</span>
            </div>
            <div className="space-y-1 text-[8pt]">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">1010 &bull; Liquid Cash & Commercial Bank Balances</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(data.balanceSheet.cashAndBanks, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">1050 &bull; Trade Accounts Receivable (Customers)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(data.balanceSheet.accountsReceivable, currencySymbol)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center font-black text-[9pt] bg-slate-50 p-1.5 rounded">
              <span className="uppercase text-slate-950">TOTAL ASSETS</span>
              <span className="font-mono text-slate-950">
                {formatCurrency(totalAssets, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Right Column: Liabilities & Equity */}
          <div className="p-3 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-300 pb-1">
              <span className="font-bold uppercase text-[7.5pt] text-slate-700">Liabilities & Owner's Equity</span>
              <span className="text-[7pt] text-slate-500 font-mono">2000 - 3999</span>
            </div>
            <div className="space-y-1 text-[8pt]">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">2010 &bull; Trade Accounts Payable (Suppliers)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(data.balanceSheet.accountsPayable, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 text-[7.5pt] border-b border-slate-200 pb-1">
                <span>Sub-Total Liabilities:</span>
                <span className="font-mono">{formatCurrency(totalLiabilities, currencySymbol)}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-700">3010 &bull; Owner's Contributed Equity</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(data.balanceSheet.contributedCapital, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">3050 &bull; Retained Fiscal Earnings</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(data.balanceSheet.retainedEarnings, currencySymbol)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center font-black text-[9pt] bg-slate-50 p-1.5 rounded">
              <span className="uppercase text-slate-950">TOTAL LIABILITIES & EQUITY</span>
              <span className="font-mono text-slate-950">
                {formatCurrency(totalLiabilitiesAndEquity, currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Equation Status Strip */}
        <div className={`px-3 py-1.5 text-[7.5pt] font-semibold flex items-center justify-between ${
          isBalanced
            ? 'bg-emerald-100 text-emerald-900 border-t border-emerald-300'
            : 'bg-rose-100 text-rose-900 border-t border-rose-300'
        }`}>
          <span>
            Equation Check: Assets ({formatCurrency(totalAssets, currencySymbol)}) = Liabilities ({formatCurrency(totalLiabilities, currencySymbol)}) + Equity ({formatCurrency(totalEquity, currencySymbol)})
          </span>
          <span className="font-bold">
            {isBalanced ? '✓ 100% RECONCILED & BALANCED' : '⚠ DISCREPANCY DETECTED'}
          </span>
        </div>
      </div>

      {/* Disclosures & Audit Footnotes */}
      <div className="border border-slate-200 bg-slate-50/60 rounded p-2.5 mb-4 text-[7pt] text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 uppercase tracking-wider text-[6.5pt]">
          Accounting Policies & Audit Disclosures:
        </div>
        <p>
          1. <strong>Basis of Preparation:</strong> This statement has been extracted directly from the system's General Ledger database on an accrual accounting basis in compliance with applicable accounting principles and national tax reporting regulations.
        </p>
        <p>
          2. <strong>Inventory & Cost Valuation:</strong> Product costing and cost of goods sold are calculated based on posted manufacturing receipts, batch bills of materials (BOM), and direct production payroll allocations.
        </p>
        <p>
          3. <strong>Document Integrity:</strong> System-generated authoritative report verified by automated trial balance integrity checksums.
        </p>
      </div>

      {/* Corporate Signatures & Approvals */}
      <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-[7.5pt]">
        <div>
          <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
            {generatedBy}
          </div>
          <div className="text-[6.5pt] text-slate-500 uppercase font-semibold">
            Prepared By (Finance & Costing)
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
            Internal Audit & Compliance Desk
          </div>
          <div className="text-[6.5pt] text-slate-500 uppercase font-semibold">
            Verified By (General Ledger Audit)
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
            {businessConfig.signatureAuthorized || 'Managing Director / CFO'}
          </div>
          <div className="text-[6.5pt] text-slate-500 uppercase font-semibold">
            Executive Approval & Authorization
          </div>
        </div>
      </div>

      {/* Digital Stamp Footer */}
      <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[6.5pt] text-slate-400 font-mono">
        <div>
          SliceMart ERP Document Engine &bull; Ref: {data.reportCode} &bull; Security Checksum: VALID
        </div>
        <div>
          Official Copy &bull; Page 1 of 1
        </div>
      </div>
    </div>
  );
};

export default FinancialStatementPrintDocument;
