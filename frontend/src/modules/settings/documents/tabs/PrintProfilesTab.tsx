// ═══════════════════════════════════════════════════════════════════════════
// PRINT PROFILES TAB — Output Device Profiles
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Printer,
  Trash2,
  Edit2,
  Star,
} from 'lucide-react';
import { api } from '../../../../lib/api/client';
import { notify } from '../../../../components/ui/Toast';
import { Modal, ConfirmDialog } from '../../../../components/ui/Modal';
import type { PrintProfile, PaperSize } from '../../../../types/api/documents';

export function PrintProfilesTab() {
  const [profiles, setProfiles] = useState<PrintProfile[]>([]);
  const [paperSizes, setPaperSizes] = useState<PaperSize[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<PrintProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrintProfile | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [paperSizeId, setPaperSizeId] = useState<number | undefined>(undefined);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginTop, setMarginTop] = useState('10');
  const [marginBottom, setMarginBottom] = useState('10');
  const [marginLeft, setMarginLeft] = useState('10');
  const [marginRight, setMarginRight] = useState('10');
  const [scale, setScale] = useState('1.0');
  const [copies, setCopies] = useState('1');
  const [isPrinterFriendly, setIsPrinterFriendly] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await api.get<{ data: PrintProfile[] }>('/documents/print-profiles');
      if (res.data?.data) {
        setProfiles(res.data.data);
      }
    } catch {
      notify.error('Failed to load print profiles');
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
    api.get<{ data: PaperSize[] }>('/documents/paper-sizes').then((res) => {
      if (res.data?.data) setPaperSizes(res.data.data);
    });
  }, [fetchProfiles]);

  const handleOpenCreate = () => {
    setEditProfile(null);
    setName('');
    setPaperSizeId(paperSizes[0]?.id);
    setOrientation('portrait');
    setMarginTop('10');
    setMarginBottom('10');
    setMarginLeft('10');
    setMarginRight('10');
    setScale('1.0');
    setCopies('1');
    setIsPrinterFriendly(true);
    setIsDefault(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profile: PrintProfile) => {
    setEditProfile(profile);
    setName(profile.name);
    setPaperSizeId(profile.paper_size_id || undefined);
    setOrientation(profile.orientation);
    setMarginTop(String(profile.margin_top_mm));
    setMarginBottom(String(profile.margin_bottom_mm));
    setMarginLeft(String(profile.margin_left_mm));
    setMarginRight(String(profile.margin_right_mm));
    setScale(String(profile.scale));
    setCopies(String(profile.copies));
    setIsPrinterFriendly(profile.is_printer_friendly);
    setIsDefault(profile.is_default);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify.error('Profile name is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        paper_size_id: paperSizeId,
        orientation,
        margin_top_mm: parseFloat(marginTop) || 10,
        margin_bottom_mm: parseFloat(marginBottom) || 10,
        margin_left_mm: parseFloat(marginLeft) || 10,
        margin_right_mm: parseFloat(marginRight) || 10,
        scale: parseFloat(scale) || 1.0,
        copies: parseInt(copies, 10) || 1,
        is_printer_friendly: isPrinterFriendly,
        is_default: isDefault,
      };

      if (editProfile) {
        await api.put(`/documents/print-profiles/${editProfile.id}`, payload);
        notify.success(`Profile "${name}" updated`);
      } else {
        await api.post('/documents/print-profiles', payload);
        notify.success(`Profile "${name}" created`);
      }
      setIsModalOpen(false);
      fetchProfiles();
    } catch {
      notify.error('Failed to save print profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/documents/print-profiles/${deleteTarget.id}`);
      notify.success(`Print profile "${deleteTarget.name}" removed`);
      setDeleteTarget(null);
      fetchProfiles();
    } catch {
      notify.error('Failed to delete print profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Print Profiles</h3>
          <p className="text-xs text-slate-400">
            Define reusable printer device settings, custom margins, scale factors, and copies.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-fg hover:opacity-90 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="size-4" />
          <span>New Profile</span>
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between p-4 rounded-xl border border-slate-700/60 bg-slate-800/60 hover:border-slate-600 transition-all shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
                    <Printer className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white tracking-wide">{p.name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {p.paper_size?.name || 'A4 Standard'}
                    </span>
                  </div>
                </div>

                {p.is_default && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    <Star className="size-3 fill-amber-400 text-amber-400" /> Default
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Orientation</span>
                  <span className="font-medium text-slate-200 capitalize">{p.orientation}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Scale</span>
                  <span className="font-mono font-medium text-slate-200">{Math.round(p.scale * 100)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Copies</span>
                  <span className="font-mono font-medium text-slate-200">{p.copies}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-[11px] text-slate-400">
              <span>Margins: {p.margin_top_mm}mm T/B, {p.margin_left_mm}mm L/R</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Edit Profile"
                >
                  <Edit2 className="size-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                  title="Delete Profile"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editProfile ? `Edit Profile: ${editProfile.name}` : 'Create Print Profile'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Profile Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dispatch Thermal Roll 80mm"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Paper Size
              </label>
              <select
                value={paperSizeId || ''}
                onChange={(e) => setPaperSizeId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs cursor-pointer"
              >
                {paperSizes.map((ps) => (
                  <option key={ps.id} value={ps.id}>
                    {ps.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs cursor-pointer"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Scale (1.0 = 100%)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.2"
                max="3.0"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Default Copies
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrinterFriendly}
                onChange={(e) => setIsPrinterFriendly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-primary size-4"
              />
              <span className="text-xs text-slate-300">Optimize for high-contrast B&W print</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-primary size-4"
              />
              <span className="text-xs text-slate-300">Set as Tenant Default Print Profile</span>
            </label>
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
              {isSaving ? 'Saving...' : editProfile ? 'Save Changes' : 'Create Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Print Profile?"
        message={`Are you sure you want to delete print profile "${deleteTarget?.name}"?`}
        confirmLabel="Delete Profile"
        variant="danger"
      />
    </div>
  );
}
