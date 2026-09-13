import { useMemo } from 'react';
import type { Payslip } from '../../../types/api/hr';
import type { BusinessConfig } from '../../../lib/document/useBusinessConfig';
import {
  formatCurrency,
  formatDocumentDate,
  numberToWords,
} from '../../../lib/document/formatters';
import { generateBarcodeSvg } from '../../../lib/barcode/engine';

export interface PayslipDocumentProps {
  payslip: Payslip;
  businessConfig: BusinessConfig;
}

export function PayslipDocument({ payslip, businessConfig }: PayslipDocumentProps) {
  const currencySymbol = businessConfig.currencySymbol || '৳';
  const currencyCode = businessConfig.currencyCode || 'BDT';
  const currencyUnit = currencyCode === 'BDT' ? 'Taka' : currencyCode;

  const barcodeSvg = useMemo(() => {
    return generateBarcodeSvg({
      bcid: 'code128',
      text: payslip.payslip_number || 'SLIP-0000',
      scale: 1.4,
      height: 8,
      includeText: false,
    });
  }, [payslip.payslip_number]);

  const qrSvg = useMemo(() => {
    const slipPrefix = (businessConfig.name || 'ERP')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8)
      .toUpperCase() || 'ERP';
    return generateBarcodeSvg({
      bcid: 'qrcode',
      text: `${slipPrefix}-PAYSLIP:${payslip.payslip_number}|EMP:${payslip.employee?.employee_code || payslip.employee_id}|NET:${payslip.net_amount}|DATE:${payslip.created_at || ''}`,
      scale: 1.4,
      height: 14,
      width: 14,
    });
  }, [payslip.payslip_number, payslip.employee?.employee_code, payslip.employee_id, payslip.net_amount, payslip.created_at, businessConfig.name]);

  const earnings = useMemo(() => {
    return (payslip.items || []).filter(
      (item) => item.component_type === 'earning' || !item.component_type || parseFloat(item.amount) >= 0
    );
  }, [payslip.items]);

  const deductions = useMemo(() => {
    return (payslip.items || []).filter(
      (item) => item.component_type === 'deduction' || parseFloat(item.amount) < 0
    );
  }, [payslip.items]);

  const netAmountNum = parseFloat(payslip.net_amount || '0');
  const grossAmountNum = parseFloat(payslip.gross_amount || payslip.total_earnings || '0');
  const deductionsNum = parseFloat(payslip.total_deductions || '0');

  return (
    <div className="print-doc w-full text-slate-900 bg-white text-[9pt] leading-normal font-sans">
      {/* Top Header Block */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
        <div className="max-w-[60%]">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center tracking-wider">
              PAY
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight">
                {businessConfig.name}
              </h1>
              <p className="text-[7.5pt] font-semibold text-slate-600 tracking-wide uppercase">
                Human Resources & Payroll Disbursement Desk
              </p>
            </div>
          </div>
          <div className="text-[8pt] text-slate-600 space-y-0.5 mt-1 leading-tight">
            <p>{businessConfig.address}</p>
            {businessConfig.phone && <p>Phone: {businessConfig.phone} &bull; Email: {businessConfig.email}</p>}
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[7.5pt] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800">
              {payslip.payment_status?.toUpperCase() || 'ISSUED'}
            </span>
            <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
              Salary Payslip
            </h2>
          </div>

          <div className="font-mono text-xs font-bold text-slate-950 mb-1">
            {payslip.payslip_number}
          </div>

          <div
            className="my-1 size-13 flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <div className="text-[8pt] text-slate-600 space-y-0.5 font-mono">
            {payslip.payroll_period && (
              <div>
                <span className="text-slate-500 font-sans">Period: </span>
                <span className="font-bold text-slate-900">
                  {payslip.payroll_period.period_code} ({formatDocumentDate(payslip.payroll_period.period_start)} – {formatDocumentDate(payslip.payroll_period.period_end)})
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-500 font-sans">Issue Date: </span>
              <span className="font-bold text-slate-900">
                {formatDocumentDate(payslip.created_at || new Date().toISOString())}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Employee & Bank Details Strip */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-[8.5pt]">
        <div>
          <span className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Employee Information
          </span>
          <div className="font-bold text-slate-950 text-[10pt]">
            {payslip.employee?.display_name || 'Staff Member'}
          </div>
          <div className="text-slate-600 mt-1 space-y-0.5">
            <p>
              Employee ID: <span className="font-mono font-semibold text-slate-900">{payslip.employee?.employee_code || `EMP-${payslip.employee_id}`}</span>
            </p>
            {payslip.employee?.department?.name && (
              <p>
                Department: <span className="font-medium text-slate-900">{payslip.employee.department.name}</span>
              </p>
            )}
            {payslip.employee?.designation?.name && (
              <p>
                Designation: <span className="font-medium text-slate-900">{payslip.employee.designation.name}</span>
              </p>
            )}
            {payslip.employee?.phone && (
              <p>Contact: <span className="font-mono text-slate-800">{payslip.employee.phone}</span></p>
            )}
          </div>
        </div>

        <div>
          <span className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Disbursement & Production Output
          </span>
          <div className="text-slate-600 space-y-0.5 mt-1">
            <p>
              Payment Mode: <span className="font-semibold text-slate-900 uppercase">{payslip.payment_method || 'Bank Transfer'}</span>
            </p>
            {payslip.employee?.bank_account_number && (
              <p>
                Bank A/C: <span className="font-mono font-semibold text-slate-900">{payslip.employee.bank_account_number}</span>
              </p>
            )}
            {payslip.produced_quantity && parseFloat(payslip.produced_quantity) > 0 && (
              <p>
                Production Units: <span className="font-mono font-bold text-slate-900">{parseFloat(payslip.produced_quantity).toLocaleString()} pcs</span>
              </p>
            )}
            <div className="pt-1.5 flex items-center gap-2">
              <div
                className="overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Table: Earnings & Deductions */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Earnings Column */}
        <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-[8.5pt] text-slate-900 uppercase tracking-wide">Earnings / Outputs</span>
              <span className="text-[7.5pt] text-slate-500 uppercase font-semibold">Amount</span>
            </div>
            <table className="w-full text-left text-[8.5pt]">
              <tbody>
                {earnings.length > 0 ? (
                  earnings.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-3 py-1.5">
                        <div className="font-medium text-slate-900">{item.component_code}</div>
                        {item.quantity && item.rate && (
                          <div className="text-[7.5pt] text-slate-500 font-mono">
                            {parseFloat(item.quantity).toFixed(0)} units @ {formatCurrency(item.rate, currencySymbol)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold text-emerald-700">
                        {formatCurrency(item.amount, currencySymbol)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-3 py-3 text-center text-slate-400 italic text-[8pt]">
                      Standard basic compensation
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex justify-between items-center font-bold text-[8.5pt]">
            <span className="text-slate-700">Total Gross Earnings:</span>
            <span className="font-mono text-emerald-700">{formatCurrency(grossAmountNum, currencySymbol)}</span>
          </div>
        </div>

        {/* Deductions Column */}
        <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-[8.5pt] text-slate-900 uppercase tracking-wide">Deductions & Advances</span>
              <span className="text-[7.5pt] text-slate-500 uppercase font-semibold">Amount</span>
            </div>
            <table className="w-full text-left text-[8.5pt]">
              <tbody>
                {deductions.length > 0 ? (
                  deductions.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-3 py-1.5">
                        <div className="font-medium text-slate-900">{item.component_code}</div>
                        {item.quantity && item.rate && (
                          <div className="text-[7.5pt] text-slate-500 font-mono">
                            {item.quantity} × {formatCurrency(item.rate, currencySymbol)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-semibold text-rose-600">
                        {formatCurrency(Math.abs(parseFloat(item.amount)), currencySymbol)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-3 py-3 text-center text-slate-400 italic text-[8pt]">
                      No statutory or advance deductions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex justify-between items-center font-bold text-[8.5pt]">
            <span className="text-slate-700">Total Deductions:</span>
            <span className="font-mono text-rose-600">{formatCurrency(deductionsNum, currencySymbol)}</span>
          </div>
        </div>
      </div>

      {/* Net Pay Payout Banner */}
      <div className="flex justify-between items-center p-3.5 bg-slate-900 text-white rounded-lg mb-4">
        <div>
          <span className="text-[7.5pt] text-slate-400 uppercase tracking-wider font-semibold block">
            Net Payable Remuneration
          </span>
          <div className="text-[8pt] text-slate-300 italic mt-0.5">
            {numberToWords(netAmountNum, currencyUnit)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black font-mono tracking-tight text-emerald-400">
            {formatCurrency(netAmountNum, currencySymbol)}
          </div>
        </div>
      </div>

      {/* Signatures Block */}
      <div className="grid grid-cols-3 gap-6 pt-6 mt-4 border-t border-slate-200 text-center text-[7.5pt] break-inside-avoid">
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            Prepared By (HR & Payroll)
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            Audited & Approved By (Finance)
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
            Employee Signature / Acknowledgement
          </div>
        </div>
      </div>

      {/* Document Footer */}
      <div className="flex justify-between items-center text-[7pt] text-slate-400 pt-3 mt-3 border-t border-dashed border-slate-200 font-mono">
        <span>Payslip Reference: {payslip.uuid || payslip.payslip_number}</span>
        <span>Generated via {businessConfig.name} &bull; Printed on {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
