import React, { useState, useMemo } from 'react';
import { api } from '../../../lib/api/client';
import { useTenantCapabilityStore } from '../../../lib/capabilities/tenantCapabilityStore';
import { Button } from '../../../components/ui/Button';
import { notify } from '../../../components/ui/Toast';
import {
  Type,
  Save,
  RotateCcw,
} from 'lucide-react';

const STANDARD_TERMS = [
  { key: 'raw_material', default: 'Raw Material', label: 'Raw Material / Inputs', description: 'Terms for basic production input materials.' },
  { key: 'finished_good', default: 'Finished Good', label: 'Finished Good / Outputs', description: 'Terms for finished items ready for sale.' },
  { key: 'production', default: 'Production', label: 'Production / Factory', description: 'Terms for manufacturing and processing operations.' },
  { key: 'bom', default: 'Bill of Materials', label: 'BOM / Recipe / Formula', description: 'Terms for material composition recipes.' },
  { key: 'warehouse', default: 'Warehouse', label: 'Warehouse / Storage', description: 'Terms for storage facilities and stock locations.' },
  { key: 'worker', default: 'Worker / Operator', label: 'Floor Worker / Operator', description: 'Terms for shop floor workers and line operators.' },
  { key: 'customer', default: 'Customer', label: 'Customer / Buyer', description: 'Terms for buyers and wholesale accounts.' },
  { key: 'supplier', default: 'Supplier / Vendor', label: 'Supplier / Vendor', description: 'Terms for procurement vendors.' },
];

export const TerminologySection: React.FC = () => {
  const manifest = useTenantCapabilityStore((state) => state.manifest);
  const invalidateManifest = useTenantCapabilityStore((state) => state.invalidate);
  const [userOverrides, setUserOverrides] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const terms = useMemo(() => {
    return {
      ...(manifest?.terminology || {}),
      ...userOverrides,
    };
  }, [manifest?.terminology, userOverrides]);

  const handleChange = (key: string, value: string) => {
    setUserOverrides((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await api.patch('/tenant/terminology', {
        terminology: terms,
      });
      await invalidateManifest();
      setUserOverrides({});
      notify.success('Terminology preferences saved successfully.');
    } catch {
      notify.error('Failed to save terminology.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetToStandard = () => {
    const defaults: Record<string, string> = {};
    STANDARD_TERMS.forEach((t) => {
      defaults[t.key] = t.default;
    });
    setUserOverrides(defaults);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-default bg-surface/80 p-5 sm:p-6 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Type className="size-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-default">Tenant Terminology & Naming Dictionary</h2>
            </div>
            <p className="text-xs text-muted max-w-2xl leading-relaxed">
              Tailor navigation, labels, and forms to your industry vocabulary. For example, a Bakery may call Raw Materials &ldquo;Ingredients&rdquo; and BOM &ldquo;Recipes&rdquo;, while a Garments factory calls them &ldquo;Fabrics & Trims&rdquo; and &ldquo;Tech Packs&rdquo;.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={handleResetToStandard} className="text-xs border border-default">
              <RotateCcw className="size-3.5 mr-1.5 text-muted" />
              Reset Defaults
            </Button>
            <Button variant="primary" size="md" onClick={handleSave} disabled={submitting} className="text-xs shadow-md shadow-indigo-600/20">
              <Save className="size-3.5 mr-1.5" />
              {submitting ? 'Saving...' : 'Save Terminology'}
            </Button>
          </div>
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STANDARD_TERMS.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-default bg-surface p-4 shadow-xs space-y-2 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-default">{item.label}</label>
              <span className="text-[10px] font-mono text-muted">Default: &ldquo;{item.default}&rdquo;</span>
            </div>

            <input
              type="text"
              value={terms[item.key] || ''}
              placeholder={item.default}
              onChange={(e) => handleChange(item.key, e.target.value)}
              className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
            />

            <p className="text-[11px] text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
