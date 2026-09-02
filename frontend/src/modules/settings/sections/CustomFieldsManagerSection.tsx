import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api/client';
import { useTenantCapabilityStore } from '../../../lib/capabilities/tenantCapabilityStore';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { notify } from '../../../components/ui/Toast';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import type { CustomFieldDefinitionRecord } from '../../../lib/capabilities/types';

const ENTITY_TARGETS = [
  { module: 'catalogue', entity: 'product', label: 'Products & Finished Goods' },
  { module: 'production', entity: 'batch', label: 'Production Work Batches' },
  { module: 'sales', entity: 'order', label: 'Sales Orders' },
  { module: 'purchasing', entity: 'order', label: 'Purchase Orders' },
  { module: 'parties', entity: 'customer', label: 'Customer Accounts' },
  { module: 'parties', entity: 'supplier', label: 'Supplier Accounts' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text (Single Line)' },
  { value: 'textarea', label: 'Text Area (Multi-Line)' },
  { value: 'number', label: 'Number (Integer/Decimal)' },
  { value: 'currency', label: 'Currency Value' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Single Select Dropdown' },
  { value: 'boolean', label: 'Toggle / Boolean' },
  { value: 'url', label: 'Web URL' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
];

export const CustomFieldsManagerSection: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState(ENTITY_TARGETS[0] ?? { module: 'catalogue', entity: 'product', label: 'Products & Finished Goods' });
  const [fields, setFields] = useState<CustomFieldDefinitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinitionRecord | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    internal_key: '',
    field_type: 'text' as CustomFieldDefinitionRecord['field_type'],
    is_required: false,
    placeholder: '',
    help_text: '',
    optionsString: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const invalidateManifest = useTenantCapabilityStore((state) => state.invalidate);

  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: CustomFieldDefinitionRecord[] }>(
        `/tenant/custom-fields?module=${selectedTarget.module}&entity=${selectedTarget.entity}`
      );
      if (res.data?.data) {
        setFields(res.data.data);
      }
    } catch {
      notify.error('Failed to load custom fields.');
    } finally {
      setLoading(false);
    }
  }, [selectedTarget.module, selectedTarget.entity]);

  useEffect(() => {
    let ignore = false;
    const execute = async () => {
      if (!ignore) {
        await fetchFields();
      }
    };
    void execute();
    return () => {
      ignore = true;
    };
  }, [fetchFields]);

  const openAddModal = () => {
    setEditingField(null);
    setFormData({
      label: '',
      internal_key: '',
      field_type: 'text',
      is_required: false,
      placeholder: '',
      help_text: '',
      optionsString: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (field: CustomFieldDefinitionRecord) => {
    setEditingField(field);
    setFormData({
      label: field.label,
      internal_key: field.key,
      field_type: field.field_type,
      is_required: field.is_required,
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      optionsString: Array.isArray(field.options) ? field.options.join(', ') : '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim()) return;

    setSubmitting(true);
    const parsedOptions = formData.optionsString
      ? formData.optionsString.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    try {
      if (editingField?.id) {
        await api.put(`/tenant/custom-fields/${editingField.id}`, {
          label: formData.label,
          is_required: formData.is_required,
          placeholder: formData.placeholder || null,
          help_text: formData.help_text || null,
          options: parsedOptions,
        });
        notify.success('Field updated successfully.');
      } else {
        await api.post('/tenant/custom-fields', {
          module: selectedTarget.module,
          entity: selectedTarget.entity,
          label: formData.label,
          internal_key: formData.internal_key || undefined,
          field_type: formData.field_type,
          is_required: formData.is_required,
          placeholder: formData.placeholder || null,
          help_text: formData.help_text || null,
          options: parsedOptions,
        });
        notify.success('Custom field created successfully.');
      }
      setModalOpen(false);
      await fetchFields();
      await invalidateManifest();
    } catch {
      notify.error('Failed to save custom field.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id?: number) => {
    if (!id) return;
    if (!confirm('Archive this custom field? Existing values on records will remain intact.')) return;
    try {
      await api.delete(`/tenant/custom-fields/${id}`);
      notify.success('Custom field archived.');
      await fetchFields();
      await invalidateManifest();
    } catch {
      notify.error('Failed to archive custom field.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-default bg-surface/80 p-5 sm:p-6 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-default">Dynamic Custom Attributes Engine</h2>
            </div>
            <p className="text-xs text-muted max-w-2xl leading-relaxed">
              Extend standard entities with industry-specific metadata fields (e.g. Fabric GSM for Garments, Voltage for Electronics, Expiry/Flavor for Foods).
            </p>
          </div>
          <Button variant="primary" size="md" onClick={openAddModal} className="text-xs shadow-md shadow-indigo-600/20">
            <Plus className="size-3.5 mr-1.5" />
            Add Custom Field
          </Button>
        </div>
      </div>

      {/* Target Entity Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-default pb-3">
        {ENTITY_TARGETS.map((target) => {
          const isSelected =
            target.module === selectedTarget.module && target.entity === selectedTarget.entity;
          return (
            <button
              key={`${target.module}.${target.entity}`}
              onClick={() => setSelectedTarget(target)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface border border-default text-muted hover:text-default hover:bg-surface-sunken'
              }`}
            >
              {target.label}
            </button>
          );
        })}
      </div>

      {/* Fields List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="size-6 animate-spin text-primary" />
        </div>
      ) : fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-default p-8 text-center">
          <Sparkles className="size-8 text-muted mb-2" />
          <p className="text-sm font-bold text-default">No custom fields defined for {selectedTarget.label}</p>
          <p className="text-xs text-muted mt-1">Add custom attributes to collect specific data during entry.</p>
          <Button variant="primary" size="sm" onClick={openAddModal} className="mt-4 text-xs">
            <Plus className="size-3 mr-1" />
            Add First Field
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div
              key={field.key}
              className="flex flex-col justify-between rounded-xl border border-default bg-surface p-4 shadow-xs hover:border-primary/30 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-default flex items-center gap-1.5">
                      {field.label}
                      {field.is_required && <span className="text-red-500 font-bold">*</span>}
                    </h3>
                    <span className="text-[11px] font-mono text-muted">Key: {field.key}</span>
                  </div>

                  <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 uppercase font-mono">
                    {field.field_type}
                  </span>
                </div>

                {field.help_text && (
                  <p className="text-xs text-muted leading-relaxed">{field.help_text}</p>
                )}

                {field.placeholder && (
                  <p className="text-[11px] text-muted italic">Placeholder: &ldquo;{field.placeholder}&rdquo;</p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-default flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditModal(field)}
                  className="rounded-lg p-1.5 text-muted hover:text-primary hover:bg-surface-sunken transition-colors"
                  title="Edit"
                >
                  <Edit2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleArchive(field.id)}
                  className="rounded-lg p-1.5 text-muted hover:text-red-500 hover:bg-surface-sunken transition-colors"
                  title="Archive"
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
        title={editingField ? `Edit Field: ${editingField.label}` : `New Custom Field for ${selectedTarget.label}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-default">
              Field Label <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g. Fabric GSM, Expiry Shelf Life, Voltage"
              className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {!editingField && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-default">
                Field Type <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={formData.field_type}
                onChange={(e) =>
                  setFormData({ ...formData, field_type: e.target.value as CustomFieldDefinitionRecord['field_type'] })
                }
                className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none transition-colors"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.field_type === 'select' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-default">Options (comma separated)</label>
              <input
                type="text"
                value={formData.optionsString}
                onChange={(e) => setFormData({ ...formData, optionsString: e.target.value })}
                placeholder="e.g. Small, Medium, Large, Extra Large"
                className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-default">Placeholder text</label>
            <input
              type="text"
              value={formData.placeholder}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="e.g. 180 GSM, 220V"
              className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-default">Help Tooltip / Instructions</label>
            <input
              type="text"
              value={formData.help_text}
              onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
              placeholder="e.g. Enter the density of fabric in grams per square meter"
              className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-default cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.is_required}
              onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
              className="size-4 rounded border-default text-primary focus:ring-primary"
            />
            <span>Make this field mandatory (Required)</span>
          </label>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-default">
            <Button variant="secondary" size="md" type="button" onClick={() => setModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={submitting} className="text-xs">
              {submitting ? 'Saving...' : 'Save Field'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
