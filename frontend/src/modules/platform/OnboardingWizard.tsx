import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api/client';
import { useTenantCapabilityStore } from '../../lib/capabilities/tenantCapabilityStore';
import { useAuthStore } from '../../lib/auth/authStore';
import { Button } from '../../components/ui/Button';
import { notify } from '../../components/ui/Toast';
import { IndustryProfilePicker } from './IndustryProfilePicker';
import {
  ArrowRight,
  ArrowLeft,
  Layers,
  Microscope,
  Rocket,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { IndustryProfileTemplate, ProductionStageConfig } from '../../lib/capabilities/types';

const STEPS = [
  { id: 1, title: 'Company Identity', desc: 'Legal and organizational details' },
  { id: 2, title: 'Business Model', desc: 'Manufacturing, Wholesale, Retail' },
  { id: 3, title: 'Industry Profile', desc: '1-click sector blueprint' },
  { id: 4, title: 'Production Type', desc: 'Discrete, Process, Job-shop' },
  { id: 5, title: 'Module Selection', desc: 'Choose active modules' },
  { id: 6, title: 'Production Stages', desc: 'Sequential routing steps' },
  { id: 7, title: 'Terminology', desc: 'Customize vocabulary' },
  { id: 8, title: 'Units of Measure', desc: 'Measurement standards' },
  { id: 9, title: 'Quality Control', desc: 'Inspection standards & tolerance' },
  { id: 10, title: 'Launch', desc: 'Confirm & provision workspace' },
];

const BUSINESS_MODELS = [
  { key: 'manufacturing', label: 'Manufacturing & Processing', desc: 'Produce goods from raw materials with BOM & stages.' },
  { key: 'wholesale', label: 'Wholesale & B2B Distribution', desc: 'Bulk supply to dealers, supermarkets, and corporate buyers.' },
  { key: 'retail', label: 'Retail & POS Outlets', desc: 'Physical showroom counters with fast POS barcode checkout.' },
  { key: 'ecommerce', label: 'Direct E-Commerce', desc: 'Online storefront with delivery tracking.' },
  { key: 'trading', label: 'Trading & Brokering', desc: 'Procure and fulfill without factory manufacturing.' },
];

const MANUFACTURING_TYPES = [
  { key: 'discrete', label: 'Discrete Manufacturing', desc: 'Countable items (garments, furniture, electronics, auto parts, appliances).' },
  { key: 'process', label: 'Process / Recipe Manufacturing', desc: 'Liquid or bulk batch blending (food, beverages, chemicals, paints, pharma).' },
  { key: 'job_shop', label: 'Job Shop & Custom Build', desc: 'Made-to-order custom fabrication and bespoke prototyping.' },
  { key: 'assembly', label: 'Assembly & Kitting', desc: 'Combining pre-fabricated components into finished sets.' },
  { key: 'none', label: 'None / Pure Distribution', desc: 'Trading and logistics only, no manufacturing chain.' },
];

const ALL_MODULES = [
  { key: 'production', label: 'Production Chain & BOM', category: 'Operations' },
  { key: 'inventory', label: 'Stock & Multi-Warehouse', category: 'Operations' },
  { key: 'qc', label: 'Quality Control (QC)', category: 'Operations' },
  { key: 'purchasing', label: 'Procurement (PO) & Bills', category: 'Supply Chain' },
  { key: 'sales', label: 'B2B Sales & Invoicing', category: 'Supply Chain' },
  { key: 'pos', label: 'Point of Sale (POS)', category: 'Commerce' },
  { key: 'ecommerce', label: 'Storefront CMS & Webshop', category: 'Commerce' },
  { key: 'delivery', label: 'Courier & 3PL Logistics', category: 'Logistics' },
  { key: 'finance', label: 'Finance & Accounts Ledger', category: 'Enterprise' },
  { key: 'assets', label: 'Fixed Assets & Machinery', category: 'Enterprise' },
  { key: 'hr', label: 'Workforce & HR Payroll', category: 'Enterprise' },
  { key: 'reports', label: 'Reports & BI RMS', category: 'Intelligence' },
];

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const invalidateManifest = useTenantCapabilityStore((state) => state.invalidate);
  const bootstrapManifest = useTenantCapabilityStore((state) => state.bootstrap);
  const tenant = useAuthStore((state) => state.tenant);

  // Wizard Master State
  const [companyName, setCompanyName] = useState(tenant?.name || '');
  const [currencyCode, setCurrencyCode] = useState('BDT');
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [businessTypes, setBusinessTypes] = useState<string[]>(['manufacturing', 'wholesale']);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('general_manufacturing');
  const [manufacturingType, setManufacturingType] = useState('discrete');
  const [enabledModules, setEnabledModules] = useState<string[]>([
    'production', 'inventory', 'purchasing', 'sales', 'pos', 'ecommerce', 'delivery', 'finance', 'assets', 'hr', 'qc', 'reports'
  ]);
  const [productionStages, setProductionStages] = useState<ProductionStageConfig[]>([
    { key: 'material_prep', label: 'Material Preparation', sort_order: 1, is_qc_stage: false },
    { key: 'assembly', label: 'Assembly & Processing', sort_order: 2, is_qc_stage: false },
    { key: 'qc_inspection', label: 'Quality Control', sort_order: 3, is_qc_stage: true },
    { key: 'packaging', label: 'Packaging & Boxing', sort_order: 4, is_qc_stage: false },
  ]);
  const [terminology, setTerminology] = useState<Record<string, string>>({
    raw_material: 'Raw Material',
    finished_good: 'Finished Good',
    production: 'Production',
    bom: 'Bill of Materials',
    warehouse: 'Warehouse',
    worker: 'Worker / Operator',
  });
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['PCS', 'KG', 'BOX', 'PACK']);

  // Fetch existing state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await api.get<{ success: boolean; data: Record<string, unknown> }>(
          '/tenant/onboarding/state'
        );
        if (res.data?.data) {
          const d = res.data.data;
          if (d.name) setCompanyName(String(d.name));
          if (d.currency_code) setCurrencyCode(String(d.currency_code));
          if (d.timezone) setTimezone(String(d.timezone));
          if (Array.isArray(d.business_type_keys)) setBusinessTypes(d.business_type_keys as string[]);
          if (d.industry_profile_key) setSelectedIndustry(String(d.industry_profile_key));
          if (d.manufacturing_type) setManufacturingType(String(d.manufacturing_type));
          if (typeof d.onboarding_step === 'number' && d.onboarding_step > 1) {
            setCurrentStep(d.onboarding_step);
          }
        }
      } catch {
        // Continue with defaults
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, []);

  const handleApplyIndustryProfile = (profile: IndustryProfileTemplate) => {
    setSelectedIndustry(profile.key);
    if (profile.business_type_keys) setBusinessTypes(profile.business_type_keys);
    if (profile.recommended_modules) setEnabledModules(profile.recommended_modules);
    if (profile.default_terminology) setTerminology(profile.default_terminology);
    if (profile.default_production_stages) setProductionStages(profile.default_production_stages);
    if (profile.default_units) setSelectedUnits(profile.default_units);
    notify.info(`Industry preset '${profile.label}' selected.`);
  };

  const handleNext = async () => {
    // Save step progress to backend
    try {
      await api.post('/tenant/onboarding/step', {
        step: currentStep,
        data: {
          company_name: companyName,
          currency_code: currencyCode,
          timezone,
          business_type_keys: businessTypes,
          industry_profile_key: selectedIndustry,
          manufacturing_type: manufacturingType,
          enabled_modules: enabledModules,
          production_stages: productionStages,
          terminology,
          units: selectedUnits,
        },
      });
    } catch {
      // Non-blocking
    }

    if (currentStep < 10) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await api.post('/tenant/onboarding/complete', {
        currency_code: currencyCode,
        timezone,
        business_type_keys: businessTypes,
        industry_profile_key: selectedIndustry,
        manufacturing_type: manufacturingType,
        enabled_modules: enabledModules,
        production_stages: productionStages,
        terminology,
      });

      await invalidateManifest();
      await bootstrapManifest(true);
      notify.success('🎉 Workspace initialized successfully!');
      navigate('/dashboard');
    } catch {
      notify.error('Failed to finalize onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-page) text-default py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Monogram */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/20">
            <Layers className="size-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-default">
            Workspace Configuration Wizard
          </h1>
          <p className="text-xs text-muted max-w-lg mx-auto leading-relaxed">
            Configure your industry profile, operational workflow, modules, floor stages, and vocabulary in 10 simple steps.
          </p>
        </div>

        {/* 10-Step Progress Rail */}
        <div className="flex items-center justify-between overflow-x-auto py-2 px-1 scrollbar-none border-y border-default">
          {STEPS.map((step) => {
            const isDone = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all shrink-0 text-left ${
                  isCurrent
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : isDone
                    ? 'text-primary font-semibold hover:bg-surface'
                    : 'text-muted hover:text-default opacity-60'
                }`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-primary'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-sunken text-muted border border-default'
                  }`}
                >
                  {isDone ? '✓' : step.id}
                </span>
                <span className="text-xs hidden sm:inline">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content Container */}
        <div className="rounded-2xl border border-default bg-surface p-6 sm:p-8 shadow-sm space-y-6">
          {/* STEP 1: Company Identity */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-default">Step 1: Company Identity & Regional Standards</h2>
                <p className="text-xs text-muted">Set up your brand name, base currency, and operational timezone.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-default">Company / Factory Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Industrial Garments Ltd."
                    className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-default">Base Currency</label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                  >
                    <option value="BDT">BDT (৳ Bangladeshi Taka)</option>
                    <option value="USD">USD ($ United States Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                    <option value="INR">INR (₹ Indian Rupee)</option>
                    <option value="AED">AED (د.إ UAE Dirham)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-default">Default Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                  >
                    <option value="Asia/Dhaka">Asia/Dhaka (UTC+06:00)</option>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="America/New_York">America/New_York (UTC-05:00)</option>
                    <option value="Europe/London">Europe/London (UTC+00:00)</option>
                    <option value="Asia/Dubai">Asia/Dubai (UTC+04:00)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (UTC+05:30)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Business Model */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-default">Step 2: Business Operating Models</h2>
                <p className="text-xs text-muted">Select all channels and operation models applicable to your enterprise.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BUSINESS_MODELS.map((bm) => {
                  const isChecked = businessTypes.includes(bm.key);
                  return (
                    <button
                      key={bm.key}
                      type="button"
                      onClick={() => {
                        setBusinessTypes((prev) =>
                          isChecked ? prev.filter((k) => k !== bm.key) : [...prev, bm.key]
                        );
                      }}
                      className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer text-left transition-all ${
                        isChecked
                          ? 'border-primary bg-primary-subtle ring-1 ring-primary'
                          : 'border-default bg-surface hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="size-4 rounded text-primary mt-0.5"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-default">{bm.label}</h4>
                        <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{bm.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Industry Profile Presets */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-default">Step 3: Industry Sector Blueprint</h2>
                <p className="text-xs text-muted">
                  Choose a pre-configured template to auto-populate modules, terminology, floor stages, and QC checks.
                </p>
              </div>

              <IndustryProfilePicker
                selectedKey={selectedIndustry}
                onSelect={handleApplyIndustryProfile}
              />
            </div>
          )}

          {/* STEP 4: Manufacturing Model */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-default">Step 4: Manufacturing Execution Style</h2>
                <p className="text-xs text-muted">How does your factory or workshop assemble and transform products?</p>
              </div>

              <div className="space-y-3">
                {MANUFACTURING_TYPES.map((mt) => {
                  const isSelected = manufacturingType === mt.key;
                  return (
                    <button
                      key={mt.key}
                      type="button"
                      onClick={() => setManufacturingType(mt.key)}
                      className={`w-full flex items-center justify-between rounded-xl border p-4 cursor-pointer text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary-subtle ring-1 ring-primary'
                          : 'border-default bg-surface hover:border-primary/40'
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-default">{mt.label}</h4>
                        <p className="text-[11px] text-muted mt-0.5">{mt.desc}</p>
                      </div>
                      <input
                        type="radio"
                        checked={isSelected}
                        readOnly
                        className="size-4 text-primary"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Module Selection */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-default">Step 5: Modular Capability Selection</h2>
                <p className="text-xs text-muted">Enable the modules you need for day-to-day operations.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_MODULES.map((m) => {
                  const isChecked = enabledModules.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => {
                        setEnabledModules((prev) =>
                          isChecked ? prev.filter((k) => k !== m.key) : [...prev, m.key]
                        );
                      }}
                      className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer text-left transition-all ${
                        isChecked
                          ? 'border-primary bg-primary-subtle'
                          : 'border-default bg-surface/50 opacity-70'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-default truncate block">{m.label}</span>
                        <span className="text-[10px] text-muted">{m.category}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="size-4 text-primary"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Production Stages */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-default">Step 6: Production Floor Stages</h2>
                <p className="text-xs text-muted">Define the sequential stages through which work batches flow.</p>
              </div>

              <div className="space-y-2.5">
                {productionStages.map((stage, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-default bg-surface p-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-surface-sunken font-bold text-muted font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-default">{stage.label}</span>
                      {stage.is_qc_stage && (
                        <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 dark:text-purple-300">
                          QC Check
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductionStages((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-muted hover:text-red-500 p-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Terminology */}
          {currentStep === 7 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-default">Step 7: Vocabulary & Terminology</h2>
                <p className="text-xs text-muted">Customize how core entities are labeled across the system.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(terminology).map(([key, val]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-default capitalize">
                      {key.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setTerminology((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: Units of Measure */}
          {currentStep === 8 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-default">Step 8: Units of Measurement</h2>
                <p className="text-xs text-muted">Select active measurement units for raw materials and stock.</p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {['PCS', 'KG', 'GM', 'LTR', 'ML', 'METER', 'YARD', 'BOX', 'PACK', 'CARTON', 'ROLL', 'SET', 'CFT'].map(
                  (u) => {
                    const isSelected = selectedUnits.includes(u);
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          setSelectedUnits((prev) =>
                            isSelected ? prev.filter((x) => x !== u) : [...prev, u]
                          );
                        }}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-surface border border-default text-muted hover:text-default'
                        }`}
                      >
                        {u}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* STEP 9: Quality Control Standards */}
          {currentStep === 9 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-default">Step 9: Quality Control (QC) & Inspection</h2>
                <p className="text-xs text-muted">Configure automated quality gate checks during production & receiving.</p>
              </div>

              <div className="rounded-xl border border-default bg-surface-sunken p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Microscope className="size-4 text-primary" />
                  <span className="text-xs font-bold text-default">Standard QC Gate Checks Enabled</span>
                </div>
                <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                  <li>Inbound Raw Material Inspection at Receiving GRN</li>
                  <li>In-line Stage Tolerance & Defect Scrap Recording</li>
                  <li>Pre-packaging Final Quality Audit & Batch Clearance</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 10: Confirmation & Provision */}
          {currentStep === 10 && (
            <div className="space-y-5 text-center py-4">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                <Rocket className="size-7" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h2 className="text-xl font-bold text-default">Ready to Launch Your Platform</h2>
                <p className="text-xs text-muted leading-relaxed">
                  Everything is configured. Clicking &ldquo;Initialize Workspace&rdquo; will activate your selected modules, provision production stages, apply naming conventions, and launch your dashboard.
                </p>
              </div>

              <div className="rounded-xl border border-default bg-surface/50 p-4 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Company:</span>
                  <strong className="text-default">{companyName || tenant?.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Industry Profile:</span>
                  <strong className="text-default capitalize">{selectedIndustry.replace('_', ' ')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Active Modules:</span>
                  <strong className="text-primary">{enabledModules.length} Modules</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Floor Stages:</span>
                  <strong className="text-default">{productionStages.length} Stages</strong>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-default">
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrev}
              disabled={currentStep === 1 || submitting}
              className="text-xs border border-default"
            >
              <ArrowLeft className="size-3.5 mr-1.5" />
              Previous
            </Button>

            {currentStep < 10 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                className="text-xs shadow-md shadow-indigo-600/20"
              >
                <span>Continue</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleComplete}
                disabled={submitting}
                className="text-xs shadow-lg shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-500"
              >
                <Rocket className="size-4 mr-2" />
                {submitting ? 'Initializing...' : 'Initialize Workspace'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
