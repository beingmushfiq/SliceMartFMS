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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <FileDown className="size-3" /> Save PDF
          </span>
        );
      case 'reprint':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <RotateCcw className="size-3" /> Reprint
          </span>
        );
      case 'print':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
          <h3 className="text-base font-bold text-default tracking-tight flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Print & Reprint Audit History</span>
          </h3>
          <p className="text-xs text-muted">
            Immutable audit record of every commercial document generated, printed, or exported as PDF.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-default bg-surface text-xs font-semibold text-default hover:bg-surface-sunken transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-surface border border-default text-xs">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by document number (e.g. INV-2026-000042)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-sunken border border-default text-default text-xs focus:outline-hidden focus:border-primary"
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
          className="bg-surface-sunken border border-default rounded-xl px-3 py-2 text-default text-xs cursor-pointer focus:outline-hidden focus:border-primary"
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
          className="bg-surface-sunken border border-default rounded-xl px-3 py-2 text-default text-xs cursor-pointer focus:outline-hidden focus:border-primary"
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
      <div className="overflow-hidden rounded-2xl border border-default bg-surface">
        <table className="w-full text-left text-xs text-default">
          <thead className="bg-surface-sunken text-[10px] uppercase font-bold text-muted border-b border-default tracking-wider">
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
          <tbody className="divide-y divide-default font-medium">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Loading audit logs...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  No print or export audit events recorded yet.
                </td>
              </tr>
            ) : (
              history.map((row) => (
                <tr key={row.id} className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-default">
                    {row.document_number}
                  </td>
                  <td className="px-4 py-3 capitalize text-default flex items-center gap-1.5">
                    <DocumentTypeIcon type={row.document_type} className="size-3.5 text-primary" />
                    <span>{row.document_type.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-default">
                    {row.template_name || 'System Default'} <span className="font-mono text-sky-600 dark:text-sky-400 text-[11px]">(v{row.template_version})</span>
                  </td>
                  <td className="px-4 py-3">{getActionBadge(row.action)}</td>
                  <td className="px-4 py-3 font-mono">{row.copies}</td>
                  <td className="px-4 py-3 text-default flex items-center gap-1">
                    <User className="size-3 text-muted" />
                    <span>{row.user_name || 'System / Operator'}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted">
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
