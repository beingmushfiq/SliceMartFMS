import React, { useState } from 'react';
import { useTenantCapabilityStore } from '../../lib/capabilities/tenantCapabilityStore';
import type { CustomFieldDefinitionRecord } from '../../lib/capabilities/types';
import { Sparkles, HelpCircle, Plus, Trash2, SlidersHorizontal, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';

interface DynamicCustomFieldsProps {
  module: string;
  entity: string;
  values?: Record<string, unknown> | null | undefined;
  onChange?: (key: string, value: unknown) => void;
  onRemoveKey?: (key: string) => void;
  disabled?: boolean;
  className?: string;
}

export const DynamicCustomFields: React.FC<DynamicCustomFieldsProps> = ({
  module,
  entity,
  values = {},
  onChange,
  onRemoveKey,
  disabled = false,
  className = '',
}) => {
  const getCustomFields = useTenantCapabilityStore((state) => state.getCustomFields);
  const schemaFields = getCustomFields(module, entity) || [];

  // State for ad-hoc custom attribute creation
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleFieldChange = (key: string, val: unknown) => {
    if (onChange) {
      onChange(key, val);
    }
  };

  const handleAddAdHoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    const formattedKey = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    handleFieldChange(formattedKey, newVal.trim());
    setNewKey('');
    setNewVal('');
    setShowAddForm(false);
  };

  const handleRemoveAttribute = (key: string) => {
    if (onRemoveKey) {
      onRemoveKey(key);
    } else if (onChange) {
      onChange(key, undefined);
    }
  };

  // Find any ad-hoc attributes that are present in values but not in schemaFields
  const schemaKeys = new Set(schemaFields.map((f) => f.key));
  const adHocEntries = Object.entries(values || {}).filter(
    ([k, v]) => !schemaKeys.has(k) && v !== undefined && v !== null && v !== ''
  );

  const hasAnyFields = schemaFields.length > 0 || adHocEntries.length > 0;

  return (
    <div className={`space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-sans">
              Dynamic Custom Attributes
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Industry-specific specifications, technical parameters, and custom metadata
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/settings/custom_fields"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            <SlidersHorizontal className="size-3" />
            <span>Manage Schema</span>
            <ExternalLink className="size-2.5" />
          </a>
        </div>
      </div>

      {/* Schema-Defined Custom Fields */}
      {schemaFields.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {schemaFields.map((field: CustomFieldDefinitionRecord) => {
            const val = values ? values[field.key] : undefined;

            return (
              <div key={field.key} className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    {field.label}
                    {field.is_required && <span className="text-red-500 font-bold">*</span>}
                  </span>
                  {field.help_text && (
                    <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" title={field.help_text}>
                      <HelpCircle className="size-3" />
                    </span>
                  )}
                </label>

                {field.field_type === 'textarea' ? (
                  <textarea
                    value={(val as string) || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                    disabled={disabled}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none transition-colors"
                  />
                ) : field.field_type === 'select' ? (
                  <select
                    value={(val as string) || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="">Select option...</option>
                    {(field.options || []).map((opt, idx) => {
                      const optVal = typeof opt === 'string' ? opt : opt.value;
                      const optLabel = typeof opt === 'string' ? opt : opt.label;
                      return (
                        <option key={idx} value={optVal}>
                          {optLabel}
                        </option>
                      );
                    })}
                  </select>
                ) : field.field_type === 'toggle' || field.field_type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer py-1.5">
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      disabled={disabled}
                      className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span>{field.placeholder || 'Enable / Yes'}</span>
                  </label>
                ) : field.field_type === 'number' ? (
                  <input
                    type="number"
                    value={val !== undefined && val !== null ? String(val) : ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value === '' ? null : Number(e.target.value))}
                    placeholder={field.placeholder || '0.00'}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:border-primary focus:outline-none transition-colors"
                  />
                ) : (
                  <input
                    type="text"
                    value={(val as string) || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none transition-colors"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ad-Hoc Item-Specific Attributes */}
      {adHocEntries.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Ad-Hoc Product Attributes ({adHocEntries.length})
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {adHocEntries.map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-600 dark:text-slate-400 text-[10px] uppercase font-mono">
                    {k.replace(/_/g, ' ')}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {String(v)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(k)}
                  disabled={disabled}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  title="Remove attribute"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helpful Explanatory Empty State if no fields exist yet */}
      {!hasAnyFields && (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-1 max-w-md">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
              No Custom Attributes Defined Yet
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Custom Attributes let you capture unique technical parameters for your industry (such as <strong>Fabric GSM, Thread Count, Chemical CAS No, Operating Voltage, Timber Species, or Sterilization Lot</strong>).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(true)}
              leftIcon={<Plus className="size-3" />}
            >
              Add Quick Attribute
            </Button>
            <a
              href="/settings/custom_fields"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
            >
              <SlidersHorizontal className="size-3" />
              <span>Define Global Fields</span>
            </a>
          </div>
        </div>
      )}

      {/* Quick Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddAdHoc} className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
          <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <Plus className="size-3.5" />
            <span>Add New Product Attribute</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Attribute Name / Key</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. GSM, Voltage, Wood Species"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Attribute Value</label>
              <input
                type="text"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                placeholder="e.g. 240 GSM, 220V AC, Solid Teak"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-xs cursor-pointer"
            >
              Save Attribute
            </button>
          </div>
        </form>
      )}

      {/* Button to add more ad-hoc attributes if fields already exist */}
      {hasAnyFields && !showAddForm && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add another custom attribute</span>
          </button>
        </div>
      )}
    </div>
  );
};
