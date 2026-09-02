// ═══════════════════════════════════════════════════════════════════════════
// PAPER SIZES TAB — Centralized Paper Size Registry
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Lock,
  Trash2,
  Ruler,
} from 'lucide-react';
import { api } from '../../../../lib/api/client';
import { notify } from '../../../../components/ui/Toast';
import { Modal, ConfirmDialog } from '../../../../components/ui/Modal';
import type { PaperSize } from '../../../../types/api/documents';

export function PaperSizesTab() {
  const [sizes, setSizes] = useState<PaperSize[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaperSize | null>(null);

  // Form State for custom paper size
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [widthMm, setWidthMm] = useState('100');
  const [heightMm, setHeightMm] = useState('150');
  const [unit, setUnit] = useState<'mm' | 'inch'>('mm');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginTop, setMarginTop] = useState('10');
  const [marginBottom, setMarginBottom] = useState('10');
  const [marginLeft, setMarginLeft] = useState('10');
  const [marginRight, setMarginRight] = useState('10');
  const [isSaving, setIsSaving] = useState(false);

  const fetchSizes = useCallback(async () => {
    try {
      const res = await api.get<{ data: PaperSize[] }>('/documents/paper-sizes');
      if (res.data?.data) {
        setSizes(res.data.data);
      }
    } catch {
      notify.error('Failed to load paper sizes');
    }
  }, []);

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify.error('Paper size name is required');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/documents/paper-sizes', {
        name,
        code: code || `custom_${Date.now()}`,
        width_mm: parseFloat(widthMm),
        height_mm: heightMm ? parseFloat(heightMm) : null,
        unit,
        orientation_default: orientation,
        margin_top_mm: parseFloat(marginTop) || 10,
        margin_bottom_mm: parseFloat(marginBottom) || 10,
        margin_left_mm: parseFloat(marginLeft) || 10,
        margin_right_mm: parseFloat(marginRight) || 10,
      });
      notify.success(`Custom paper size "${name}" added`);
      setIsModalOpen(false);
      setName('');
      setCode('');
      fetchSizes();
    } catch {
      notify.error('Failed to create paper size');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/documents/paper-sizes/${deleteTarget.id}`);
      notify.success(`Paper size "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchSizes();
    } catch {
      notify.error('Failed to delete paper size');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Paper Sizes Registry</h3>
          <p className="text-xs text-slate-400">
            Pre-calibrated physical dimensions and custom print media for laser printers, POS thermal rolls, and barcode roll printers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-fg hover:opacity-90 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Add Custom Size</span>
        </button>
      </div>

      {/* Grid of Paper Sizes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sizes.map((ps) => (
          <div
            key={ps.id}
            className="flex flex-col justify-between p-4 rounded-xl border border-slate-700/60 bg-slate-800/60 hover:border-slate-600 transition-all shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/60">
                    <Ruler className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white tracking-wide">{ps.name}</h4>
                    <span className="font-mono text-[11px] text-slate-400">{ps.code}</span>
                  </div>
                </div>

                {ps.is_builtin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600">
                    <Lock className="size-3" /> System
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Custom
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Dimensions</span>
                  <span className="font-medium text-slate-200 block">
                    {ps.width_mm} × {ps.height_mm ? `${ps.height_mm} mm` : 'Auto (Roll)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Orientation</span>
                  <span className="font-medium text-slate-200 capitalize block">{ps.orientation_default}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-[11px] text-slate-400">
              <span>Margins: {ps.margin_top_mm}mm T/B, {ps.margin_left_mm}mm L/R</span>
              {!ps.is_builtin && (
                <button
                  onClick={() => setDeleteTarget(ps)}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                  title="Delete Custom Paper Size"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Paper Size Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Custom Paper Size"
        size="md"
      >
        <form onSubmit={handleSaveCustom} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Size Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 100 × 150 mm Shipping Label"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Width (mm) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={widthMm}
                onChange={(e) => setWidthMm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Height (mm) (Empty for continuous roll)
              </label>
              <input
                type="number"
                step="0.1"
                value={heightMm}
                onChange={(e) => setHeightMm(e.target.value)}
                placeholder="Auto continuous"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'mm' | 'inch')}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs cursor-pointer"
              >
                <option value="mm">Millimeters (mm)</option>
                <option value="inch">Inches (in)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Orientation Default
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs cursor-pointer"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Top (mm)
              </label>
              <input
                type="number"
                value={marginTop}
                onChange={(e) => setMarginTop(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Bottom (mm)
              </label>
              <input
                type="number"
                value={marginBottom}
                onChange={(e) => setMarginBottom(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Left (mm)
              </label>
              <input
                type="number"
                value={marginLeft}
                onChange={(e) => setMarginLeft(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Right (mm)
              </label>
              <input
                type="number"
                value={marginRight}
                onChange={(e) => setMarginRight(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
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
              {isSaving ? 'Creating...' : 'Create Size'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Paper Size?"
        message={`Are you sure you want to delete custom size "${deleteTarget?.name}"?`}
        confirmLabel="Delete Size"
        variant="danger"
      />
    </div>
  );
}
