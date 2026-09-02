// ═══════════════════════════════════════════════════════════════════════════
// NUMBERING TAB — Centralized Server-Side Document Number Sequences
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  Binary,
  Edit2,
} from 'lucide-react';
import { api } from '../../../../lib/api/client';
import { notify } from '../../../../components/ui/Toast';
import { Modal } from '../../../../components/ui/Modal';
import type { DocumentNumberingSequence } from '../../../../types/api/documents';

export function NumberingTab() {
  const [sequences, setSequences] = useState<DocumentNumberingSequence[]>([]);
  const [editSeq, setEditSeq] = useState<DocumentNumberingSequence | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [padding, setPadding] = useState('5');
  const [nextNumber, setNextNumber] = useState('1');
  const [resetPeriod, setResetPeriod] = useState<'never' | 'yearly' | 'monthly'>('yearly');
  const [isSaving, setIsSaving] = useState(false);

  const fetchSequences = useCallback(async () => {
    try {
      const res = await api.get<{ data: DocumentNumberingSequence[] }>('/documents/numbering');
      if (res.data?.data) {
        setSequences(res.data.data);
      }
    } catch {
      notify.error('Failed to load numbering sequences');
    }
  }, []);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const handleOpenEdit = (seq: DocumentNumberingSequence) => {
    setEditSeq(seq);
    setPrefix(seq.prefix || '');
    setSuffix(seq.suffix || '');
    setPadding(String(seq.padding));
    setNextNumber(String(seq.next_number));
    setResetPeriod(seq.reset_period);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSeq) return;

    setIsSaving(true);
    try {
      await api.put(`/documents/numbering/${editSeq.id}`, {
        prefix,
        suffix: suffix || null,
        padding: parseInt(padding, 10) || 5,
        next_number: parseInt(nextNumber, 10) || 1,
        reset_period: resetPeriod,
      });
      notify.success(`Sequence for ${editSeq.document_type} updated`);
      setIsModalOpen(false);
      fetchSequences();
    } catch {
      notify.error('Failed to save numbering sequence');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateSampleNumber = (
    p: string,
    s: string,
    pad: number,
    num: number
  ) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const processedPrefix = p
      .replace('{YYYY}', String(year))
      .replace('{YY}', String(year).slice(-2))
      .replace('{MM}', month);
    const numStr = String(num).padStart(pad, '0');
    return `${processedPrefix}${numStr}${s ? `-${s}` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-white tracking-wide">Document Numbering Sequences</h3>
        <p className="text-xs text-slate-400">
          Atomic server-side counter configurations preventing duplicate invoices, challans, POs, and voucher numbers.
        </p>
      </div>

      {/* Grid of Numbering Sequences */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sequences.map((seq) => {
          const sample = calculateSampleNumber(
            seq.prefix || '',
            seq.suffix || '',
            seq.padding,
            seq.next_number
          );

          return (
            <div
              key={seq.id}
              className="flex flex-col justify-between p-4 rounded-xl border border-slate-700/60 bg-slate-800/60 hover:border-slate-600 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      <Binary className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white capitalize tracking-wide">
                        {seq.document_type.replace(/_/g, ' ')}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Reset: {seq.reset_period}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(seq)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Edit Sequence"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                </div>

                <div className="my-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Next Generated Identifier
                  </span>
                  <div className="font-mono text-sm font-bold text-emerald-400">
                    {sample}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-700/40 text-[10px] font-mono text-slate-400 text-center">
                <div>
                  <span className="text-slate-500 block">Prefix</span>
                  <span className="text-slate-200">{seq.prefix}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Padding</span>
                  <span className="text-slate-200">{seq.padding} digits</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Counter</span>
                  <span className="text-slate-200">{seq.next_number}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Sequence Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Configure Sequence: ${editSeq?.document_type.replace(/_/g, ' ') || ''}`}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Prefix Pattern *
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. INV-{YYYY}-"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Supports {'{YYYY}'}, {'{YY}'}, {'{MM}'}</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Suffix (Optional)
              </label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g. BD"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Zero Padding Digits
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={padding}
                onChange={(e) => setPadding(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Next Sequence Number
              </label>
              <input
                type="number"
                min="1"
                value={nextNumber}
                onChange={(e) => setNextNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Counter Reset Period
            </label>
            <select
              value={resetPeriod}
              onChange={(e) => setResetPeriod(e.target.value as 'never' | 'yearly' | 'monthly')}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs cursor-pointer"
            >
              <option value="yearly">Yearly Reset (Starts from 1 every Jan 1st)</option>
              <option value="monthly">Monthly Reset (Starts from 1 each month)</option>
              <option value="never">Never Reset (Continuous sequence)</option>
            </select>
          </div>

          {/* Sample Preview */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
              Sample Formatted Identifier
            </span>
            <div className="font-mono text-sm font-bold text-emerald-400">
              {calculateSampleNumber(prefix, suffix, parseInt(padding, 10) || 5, parseInt(nextNumber, 10) || 1)}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-fg font-semibold hover:opacity-90"
            >
              {isSaving ? 'Saving...' : 'Save Sequence'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
