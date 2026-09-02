// ═══════════════════════════════════════════════════════════════════════════
// REPRINT HISTORY TAB — Append-Only Document Audit Trail
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  Search,
  FileDown,
  Printer,
  RotateCcw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useReprintHistory } from '../../../../lib/document/useReprintHistory';
import { DocumentTypeIcon } from '../components/DocumentTypeIcon';

export function ReprintHistoryTab() {
  const { history, loading, filters, setFilters, refetch } = useReprintHistory({
    per_page: 50,
  });

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, q: searchTerm }));
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950/80 text-sky-400 border border-sky-800/60">
            <FileDown className="size-3" /> Save PDF
          </span>
        );
      case 'reprint':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <RotateCcw className="size-3" /> Reprint
          </span>
        );
      case 'print':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <Printer className="size-3" /> Printed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Print & Reprint Audit History</span>
          </h3>
          <p className="text-xs text-slate-400">
            Immutable audit record of every commercial document generated, printed, or exported as PDF.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by document number (e.g. INV-2026-000042)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 text-xs"
          />
        </form>

        <select
          value={filters.action || ''}
          onChange={(e) => {
            const val = e.target.value;
            setFilters((p) => {
              const next = { ...p };
              if (val) {
                next.action = val;
              } else {
                delete next.action;
              }
              return next;
            });
          }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs cursor-pointer"
        >
          <option value="">All Actions</option>
          <option value="print">Physical Print</option>
          <option value="pdf">PDF Export</option>
          <option value="reprint">Reprint</option>
        </select>

        <select
          value={filters.document_type || ''}
          onChange={(e) => {
            const val = e.target.value;
            setFilters((p) => {
              const next = { ...p };
              if (val) {
                next.document_type = val;
              } else {
                delete next.document_type;
              }
              return next;
            });
          }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs cursor-pointer"
        >
          <option value="">All Documents</option>
          <option value="sales_invoice">Sales Invoice</option>
          <option value="delivery_challan">Delivery Challan</option>
          <option value="purchase_order">Purchase Order</option>
          <option value="goods_receipt">Goods Receipt (GRN)</option>
          <option value="payment_receipt">Payment Receipt</option>
          <option value="pos_receipt_80mm">POS Thermal 80mm</option>
          <option value="barcode_label">Barcode Labels</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 tracking-wider">
            <tr>
              <th className="px-4 py-3">Document Identifier</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Template Used</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Copies</th>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading audit logs...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No print or export audit events recorded yet.
                </td>
              </tr>
            ) : (
              history.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-white">
                    {row.document_number}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-300 flex items-center gap-1.5">
                    <DocumentTypeIcon type={row.document_type} className="size-3.5 text-primary" />
                    <span>{row.document_type.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {row.template_name || 'System Default'} <span className="font-mono text-sky-400 text-[11px]">(v{row.template_version})</span>
                  </td>
                  <td className="px-4 py-3">{getActionBadge(row.action)}</td>
                  <td className="px-4 py-3 font-mono">{row.copies}</td>
                  <td className="px-4 py-3 text-slate-300 flex items-center gap-1">
                    <User className="size-3 text-slate-500" />
                    <span>{row.user_name || 'System / Operator'}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
