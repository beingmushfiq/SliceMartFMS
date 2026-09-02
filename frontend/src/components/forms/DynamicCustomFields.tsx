import React from 'react';
import { useTenantCapabilityStore } from '../../lib/capabilities/tenantCapabilityStore';
import type { CustomFieldDefinitionRecord } from '../../lib/capabilities/types';
import { Sparkles, HelpCircle } from 'lucide-react';

interface DynamicCustomFieldsProps {
  module: string;
  entity: string;
  values?: Record<string, unknown> | null | undefined;
  onChange?: (key: string, value: unknown) => void;
  disabled?: boolean;
  className?: string;
}

export const DynamicCustomFields: React.FC<DynamicCustomFieldsProps> = ({
  module,
  entity,
  values = {},
  onChange,
  disabled = false,
  className = '',
}) => {
  const getCustomFields = useTenantCapabilityStore((state) => state.getCustomFields);
  const fields = getCustomFields(module, entity);

  if (!fields || fields.length === 0) {
    return null;
  }

  const handleFieldChange = (key: string, val: unknown) => {
    if (onChange) {
      onChange(key, val);
    }
  };

  return (
    <div className={`space-y-4 rounded-xl border border-default bg-surface/50 p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-2 border-b border-default pb-2.5">
        <Sparkles className="size-4 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-default">
          Configured Custom Attributes ({fields.length})
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field: CustomFieldDefinitionRecord) => {
          const val = values ? values[field.key] : undefined;

          return (
            <div key={field.key} className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-semibold text-default">
                <span className="flex items-center gap-1">
                  {field.label}
                  {field.is_required && <span className="text-red-500 font-bold">*</span>}
                </span>
                {field.help_text && (
                  <span className="text-muted hover:text-default cursor-help" title={field.help_text}>
                    <HelpCircle className="size-3" />
                  </span>
                )}
              </label>

              {/* Input Type Renderers */}
              {field.field_type === 'textarea' ? (
                <textarea
                  value={(val as string) || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  disabled={disabled}
                  rows={3}
                  className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
                />
              ) : field.field_type === 'select' ? (
                <select
                  value={(val as string) || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  disabled={disabled}
                  className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none transition-colors"
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
              ) : field.field_type === 'toggle' || field.field_type === 'checkbox' || field.field_type === 'radio' ? (
                <label className="flex items-center gap-2 text-xs text-default cursor-pointer py-1.5">
                  <input
                    type="checkbox"
                    checked={Boolean(val)}
                    onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                    disabled={disabled}
                    className="size-4 rounded border-default text-primary focus:ring-primary"
                  />
                  <span>{field.placeholder || 'Enable / Yes'}</span>
                </label>
              ) : field.field_type === 'number' || field.field_type === 'currency' || field.field_type === 'percentage' ? (
                <input
                  type="number"
                  value={val !== undefined && val !== null ? String(val) : ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value === '' ? null : Number(e.target.value))}
                  placeholder={field.placeholder || '0.00'}
                  disabled={disabled}
                  className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors font-mono"
                />
              ) : field.field_type === 'date' ? (
                <input
                  type="date"
                  value={(val as string) || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  disabled={disabled}
                  className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none transition-colors"
                />
              ) : (
                <input
                  type="text"
                  value={(val as string) || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  disabled={disabled}
                  className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
