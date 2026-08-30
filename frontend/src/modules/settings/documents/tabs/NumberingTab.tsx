// ═══════════════════════════════════════════════════════════════════════════
// NUMBERING TAB — Centralized Server-Side Document Number Sequences
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  Binary,
  Edit2,
  Save,
  Plus,
  ShieldCheck,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { api } from '../../../../lib/api/client';
import { notify } from '../../../../components/ui/Toast';
import { Modal } from '../../../../components/ui/Modal';
import type { DocumentNumberingSequence } from '../../../../types/api/documents';

export function NumberingTab() {
  const [sequences, setSequences] = useState<DocumentNumberingSequence[]>([]);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      const res = await api.get<{ data: DocumentNumberingSequence[] }>('/documents/numbering');
      if (res.data?.data) {
        setSequences(res.data.data);
      }
    } catch {
      notify.error('Failed to load document number sequences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const handleEdit = (seq: DocumentNumberingSequence) => {
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
      notify.success(`Sequence for "${editSeq.document_type}" updated`);
      setIsModalOpen(false);
      fetchSequences();
    } catch {
      notify.error('Failed to update number sequence');
    } finally {
      setIsSaving(false);
    }
  };

  const computeExampleNumber = (p: string, n: string, pad: string, s: string) => {
    const padLen = parseInt(pad, 10) || 5;
    const num = parseInt(n, 10) || 1;
    const padded = String(num).padStart(padLen, '0');
    return `${p}${padded}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Document Number Sequences</h3>
          <p className="text-xs text-slate-400">
            Authoritative server-side series counters. All document numbers are locked & issued in atomicity to prevent collisions.
          </p>
        </div>
      </div>

      {/* Grid of Sequences */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sequences.map((seq) => {
          const sample = computeExampleNumber(
            seq.prefix || '',
            String(seq.next_number),
            String(seq.padding),
            seq.suffix || ''
          );

          return (
            <div
              key={seq.id}
              className="flex flex-col justify-between p-4 rounded-xl border border-slate-700/60 bg-slate-800/60 hover:border-slate-600 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/60">
                      <Binary className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white tracking-wide capitalize">
                        {seq.document_type.replace(/_/g, ' ')}
                      </h4>
                      <span className="font-mono text-[11px] text-slate-400">
                        Prefix: <strong className="text-slate-200">{seq.prefix || 'None'}</strong>
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-700/60 text-slate-300 border border-slate-600">
                    {seq.reset_period}
                  </span>
                </div>

                <div className="my-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Next Issued Identifier
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-400 tracking-wider block">
                    {sample}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-[11px] text-slate-400">
                <span>Padding: {seq.padding} digits</span>
                <button
                  onClick={() => handleEdit(seq)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700/60 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Edit2 className="size-3" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Sequence Modal */}
      <Modal
        isOpen={isModalOpen}
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
                placeholder="e.g. INV-2026-"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Suffix (Optional)
              </label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g. /BD"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs"
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
                max="12"
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
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Reset Counter Schedule
            </label>
            <select
              value={resetPeriod}
              onChange={(e) => setResetPeriod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs cursor-pointer"
            >
              <option value="never">Never (Continuous counter)</option>
              <option value="yearly">Financial / Calendar Year (Reset to 1)</option>
              <option value="monthly">Monthly Reset</option>
            </select>
          </div>

          {/* Live Preview */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Live Preview of Next Issued Document Number
            </span>
            <span className="font-mono text-base font-bold text-emerald-400 tracking-wide">
              {computeExampleNumber(prefix, nextNumber, padding, suffix)}
            </span>
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
