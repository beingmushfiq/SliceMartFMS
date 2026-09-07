import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../../lib/api/client';
import { useTenantCapabilityStore } from '../../../lib/capabilities/tenantCapabilityStore';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import {
  Factory,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Microscope,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import type { ProductionStageConfig } from '../../../lib/capabilities/types';

export const ProductionStagesSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<ProductionStageConfig | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    key: '',
    description: '',
    is_qc_stage: false,
    requires_worker_tracking: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const invalidateManifest = useTenantCapabilityStore((state) => state.invalidate);
  const getTerm = useTenantCapabilityStore((state) => state.getTerm);

  const { data: stages = [], isLoading, isFetching, refetch } = useQuery<ProductionStageConfig[]>({
    queryKey: ['tenant', 'production-stages'],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; data: ProductionStageConfig[] }>(
          '/tenant/production-stages'
        );
        if (res.data?.data) {
          return res.data.data;
        }
      } catch {
        // Fallback
      }
      return [];
    },
  });

  const openAddModal = () => {
    setEditingStage(null);
    setFormData({
      label: '',
      key: '',
      description: '',
      is_qc_stage: false,
      requires_worker_tracking: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (stage: ProductionStageConfig) => {
    setEditingStage(stage);
    setFormData({
      label: stage.label,
      key: stage.key,
      description: '',
      is_qc_stage: stage.is_qc_stage,
      requires_worker_tracking: stage.requires_worker_tracking ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) return;

    setSubmitting(true);
    try {
      if (editingStage?.id) {
        await api.put(`/tenant/production-stages/${editingStage.id}`, {
          label: formData.label,
          is_qc_stage: formData.is_qc_stage,
          requires_worker_tracking: formData.requires_worker_tracking,
        });
        toast.success('Stage updated successfully.');
      } else {
        await api.post('/tenant/production-stages', formData);
        toast.success('Stage created successfully.');
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tenant', 'production-stages'] });
      await invalidateManifest();
    } catch {
      toast.error('Failed to save stage.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm('Are you sure you want to remove this production stage?')) return;
    try {
      await api.delete(`/tenant/production-stages/${id}`);
      toast.success('Stage deleted.');
      queryClient.invalidateQueries({ queryKey: ['tenant', 'production-stages'] });
      await invalidateManifest();
    } catch {
      toast.error('Failed to delete stage.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const newStages = [...stages];
    const [moved] = newStages.splice(index, 1);
    if (!moved) return;
    newStages.splice(newIndex, 0, moved);

    const payload = newStages.map((st, i) => ({
      id: st.id!,
      sort_order: i + 1,
    }));

    queryClient.setQueryData<ProductionStageConfig[]>(
      ['tenant', 'production-stages'],
      newStages.map((st, i) => ({ ...st, sort_order: i + 1 }))
    );

    try {
      await api.post('/tenant/production-stages/reorder', { stages: payload });
      await invalidateManifest();
    } catch {
      toast.error('Failed to save stage order.');
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-default bg-surface/80 p-5 sm:p-6 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Factory className="size-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-default">
                Dynamic {getTerm('production', 'Production')} Stages
              </h2>
            </div>
            <p className="text-xs text-muted max-w-2xl leading-relaxed">
              Define the sequential floor stages of your manufacturing process (e.g. Cutting → Sewing → QC → Boxing). 
              Batch progression, worker piece tracking, and yield tracking will automatically follow this sequence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 text-muted hover:text-default hover:bg-surface-sunken rounded-xl border border-default transition-colors cursor-pointer"
              title="Refresh Stages"
            >
              <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <Button variant="primary" size="md" onClick={openAddModal} className="text-xs shadow-md shadow-emerald-600/20">
              <Plus className="size-3.5 mr-1.5" />
              Add Stage
            </Button>
          </div>
        </div>
      </div>

      {/* Stages List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="size-6 animate-spin text-primary" />
        </div>
      ) : stages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-default p-8 text-center">
          <Sliders className="size-8 text-muted mb-2" />
          <p className="text-sm font-bold text-default">No production stages configured</p>
          <p className="text-xs text-muted mt-1">Add your factory floor stages to begin routing batches.</p>
          <Button variant="primary" size="sm" onClick={openAddModal} className="mt-4 text-xs">
            <Plus className="size-3 mr-1" />
            Add First Stage
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <div
              key={stage.id || stage.key}
              className="flex items-center justify-between rounded-xl border border-default bg-surface p-4 shadow-xs hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-7 items-center justify-center rounded-lg bg-surface-sunken text-xs font-bold text-muted font-mono border border-default shrink-0">
                  {idx + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-default truncate">{stage.label}</span>
                    {stage.is_qc_stage && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        <Microscope className="size-3 text-purple-500" />
                        QC Stage
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-muted">Key: {stage.key}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="rounded-lg p-1.5 text-muted hover:text-default hover:bg-surface-sunken disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Up"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === stages.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="rounded-lg p-1.5 text-muted hover:text-default hover:bg-surface-sunken disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Down"
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(stage)}
                  className="rounded-lg p-1.5 text-muted hover:text-primary hover:bg-surface-sunken transition-colors"
                  title="Edit"
                >
                  <Edit2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(stage.id)}
                  className="rounded-lg p-1.5 text-muted hover:text-red-500 hover:bg-surface-sunken transition-colors"
                  title="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStage ? 'Edit Production Stage' : 'New Production Stage'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-default">
              Stage Name / Label <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g. Coil Winding, Chassis Assembly, Soldering, Burn-In Testing"
              className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-default cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_qc_stage}
                onChange={(e) => setFormData({ ...formData, is_qc_stage: e.target.checked })}
                className="size-4 rounded border-default text-primary focus:ring-primary"
              />
              <span>Quality Control (QC) Inspection Stage</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-default cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requires_worker_tracking}
                onChange={(e) => setFormData({ ...formData, requires_worker_tracking: e.target.checked })}
                className="size-4 rounded border-default text-primary focus:ring-primary"
              />
              <span>Track Individual Worker Piece-Rate Output</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
            <Button variant="secondary" size="md" type="button" onClick={() => setModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={submitting} className="text-xs">
              {submitting ? 'Saving...' : 'Save Stage'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
