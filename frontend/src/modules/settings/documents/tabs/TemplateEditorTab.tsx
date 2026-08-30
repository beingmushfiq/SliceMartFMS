// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE EDITOR TAB — Full-Featured Split-Panel Template Builder
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Sliders,
  Eye,
  FileSignature,
  FileText,
  Sparkles,
} from 'lucide-react';
import { api } from '../../../../lib/api/client';
import { notify } from '../../../../components/ui/Toast';
import { TemplatePreview } from '../components/TemplatePreview';
import type {
  DocumentTemplate,
  DocumentType,
  DocumentTemplateLayoutConfig,
  PaperSize,
  PrintProfile,
} from '../../../../types/api/documents';

interface TemplateEditorTabProps {
  template: DocumentTemplate | null;
  onBack: () => void;
  onSaved: () => void;
}

export function TemplateEditorTab({ template, onBack, onSaved }: TemplateEditorTabProps) {
  const isEditing = Boolean(template);

  // Form State
  const [name, setName] = useState(template?.name || 'Custom Document Template');
  const [documentType, setDocumentType] = useState<DocumentType>(template?.document_type || 'sales_invoice');
  const [paperSizeId, setPaperSizeId] = useState<number | undefined>(template?.paper_size_id || undefined);
  const [printProfileId, setPrintProfileId] = useState<number | undefined>(template?.print_profile_id || undefined);
  const [isDefault, setIsDefault] = useState(template?.is_default || false);

  // Layout Config
  const [config, setConfig] = useState<DocumentTemplateLayoutConfig>(() => {
    return (
      template?.active_version?.layout_config || {
        showLogo: true,
        showCompanyTax: true,
        showCustomerTax: true,
        showBatchNumber: true,
        showSku: true,
        showDiscount: true,
        showVat: true,
        showAmountInWords: true,
        showTerms: true,
        showSignatures: true,
        showQrCode: true,
        showBarcode: true,
        showPrice: true,
        showName: true,
        showMfgDate: true,
        showExpDate: true,
        barcodeFormat: 'code128',
        primaryColor: '#0f172a',
        fontFamily: 'Inter',
        fontSize: 'base',
        signaturePreparedBy: 'Prepared By (Billing Desk)',
        signatureCheckedBy: 'Verified By (Accounts & Audit)',
        signatureAuthorizedBy: 'Authorized Representative',
        signatureReceiver: 'Customer Acknowledgement',
      }
    );
  });

  // Paper Sizes & Profiles
  const [paperSizes, setPaperSizes] = useState<PaperSize[]>([]);
  const [profiles, setProfiles] = useState<PrintProfile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'visibility' | 'signatures' | 'terms'>('general');

  useEffect(() => {
    api.get<{ data: PaperSize[] }>('/documents/paper-sizes').then((res) => {
      if (res.data?.data) setPaperSizes(res.data.data);
    });
    api.get<{ data: PrintProfile[] }>('/documents/print-profiles').then((res) => {
      if (res.data?.data) setProfiles(res.data.data);
    });
  }, []);

  const handleToggle = (key: keyof DocumentTemplateLayoutConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (publishActive = true) => {
    if (!name.trim()) {
      notify.error('Template name is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        document_type: documentType,
        paper_size_id: paperSizeId,
        print_profile_id: printProfileId,
        status: publishActive ? 'active' : 'draft',
        is_default: isDefault,
        change_summary: isEditing ? 'Visual layout adjustment' : 'Initial creation',
        layout_config: config,
      };

      if (isEditing && template) {
        await api.put(`/documents/templates/${template.id}`, payload);
        notify.success(`Template "${name}" updated (v${(template?.current_version ?? 1) + 1})`);
      } else {
        await api.post('/documents/templates', payload);
        notify.success(`Template "${name}" created successfully`);
      }
      onSaved();
    } catch {
      notify.error('Failed to save document template');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPaperSize = paperSizes.find((p) => p.id === paperSizeId);

  return (
    <div className="space-y-4">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Back to Templates"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {isEditing && template ? `Edit Template: ${template.name}` : 'Create New Document Template'}
              {isEditing && template && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                  Current v{template.current_version}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Configure layout parameters and inspect proportional real-time preview.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-xs font-semibold text-primary-fg hover:opacity-90 shadow-sm transition-all cursor-pointer"
          >
            <Save className="size-3.5" />
            <span>{isSaving ? 'Saving...' : 'Publish Version'}</span>
          </button>
        </div>
      </div>

      {/* Split Panel Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Config Accordions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sub-nav tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            {[
              { id: 'general', label: 'Setup', icon: Sliders },
              { id: 'visibility', label: 'Fields & Layout', icon: Eye },
              { id: 'signatures', label: 'Signatures', icon: FileSignature },
              { id: 'terms', label: 'Terms & Notes', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-fg font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4 text-xs">
            {activeTab === 'general' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Standard Commercial VAT Invoice"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Document Type
                  </label>
                  <select
                    value={documentType}
                    disabled={isEditing}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-primary text-xs capitalize cursor-pointer disabled:opacity-60"
                  >
                    <option value="sales_invoice">Sales Invoice</option>
                    <option value="delivery_challan">Delivery Challan</option>
                    <option value="purchase_order">Purchase Order</option>
                    <option value="goods_receipt">Goods Receipt Note (GRN)</option>
                    <option value="credit_note">Credit Note</option>
                    <option value="payment_receipt">Payment Receipt</option>
                    <option value="pos_receipt_80mm">POS Receipt (80mm Thermal)</option>
                    <option value="pos_receipt_58mm">POS Receipt (58mm Thermal)</option>
                    <option value="barcode_label">Barcode / Product Label</option>
                    <option value="stock_transfer">Stock Transfer</option>
                    <option value="report">Report Document</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Paper Format
                    </label>
                    <select
                      value={paperSizeId || ''}
                      onChange={(e) => setPaperSizeId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-primary text-xs cursor-pointer"
                    >
                      <option value="">Auto Detect</option>
                      {paperSizes.map((ps) => (
                        <option key={ps.id} value={ps.id}>
                          {ps.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Print Profile
                    </label>
                    <select
                      value={printProfileId || ''}
                      onChange={(e) => setPrintProfileId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-primary text-xs cursor-pointer"
                    >
                      <option value="">Default Profile</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary size-4"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Set as Default Template</span>
                      <span className="text-[11px] text-slate-400">
                        Automatically use this template when generating {documentType.replace(/_/g, ' ')}s.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'visibility' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Control which visual sections and columns appear on the printed document.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: 'showLogo', label: 'Company Header & Logo' },
                    { key: 'showCompanyTax', label: 'Company Tax & VAT Numbers' },
                    { key: 'showCustomerTax', label: 'Customer / Party Tax ID' },
                    { key: 'showSku', label: 'Item SKU Column' },
                    { key: 'showBatchNumber', label: 'Batch & Lot Number Column' },
                    { key: 'showDiscount', label: 'Discount Amount Column' },
                    { key: 'showVat', label: 'Tax / VAT Amount Breakdown' },
                    { key: 'showAmountInWords', label: 'Total Amount in Words' },
                    { key: 'showQrCode', label: 'Verification QR Code' },
                    { key: 'showBarcode', label: 'Document Number Barcode' },
                    { key: 'showTerms', label: 'Terms & Conditions Block' },
                  ].map((field) => {
                    const k = field.key as keyof DocumentTemplateLayoutConfig;
                    const isChecked = config[k] !== false;
                    return (
                      <label
                        key={field.key}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-medium text-slate-200">{field.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggle(k)}
                          className="rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary size-4"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'signatures' && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-slate-800">
                  <input
                    type="checkbox"
                    checked={config.showSignatures !== false}
                    onChange={() => handleToggle('showSignatures')}
                    className="rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary size-4"
                  />
                  <span className="text-xs font-semibold text-slate-200">Include Signature Area</span>
                </label>

                {config.showSignatures !== false && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                        Prepared By Label
                      </label>
                      <input
                        type="text"
                        value={config.signaturePreparedBy || ''}
                        onChange={(e) => setConfig((p) => ({ ...p, signaturePreparedBy: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                        Checked / Verified Label
                      </label>
                      <input
                        type="text"
                        value={config.signatureCheckedBy || ''}
                        onChange={(e) => setConfig((p) => ({ ...p, signatureCheckedBy: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                        Authorized Signatory Label
                      </label>
                      <input
                        type="text"
                        value={config.signatureAuthorizedBy || ''}
                        onChange={(e) => setConfig((p) => ({ ...p, signatureAuthorizedBy: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                        Receiver Acknowledgement Label
                      </label>
                      <input
                        type="text"
                        value={config.signatureReceiver || ''}
                        onChange={(e) => setConfig((p) => ({ ...p, signatureReceiver: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Custom Terms & Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={config.customTerms || ''}
                    onChange={(e) => setConfig((p) => ({ ...p, customTerms: e.target.value }))}
                    placeholder="Leave empty to use tenant global terms, or enter custom terms for this template..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Footer Note / Greeting
                  </label>
                  <input
                    type="text"
                    value={config.footerGreeting || ''}
                    onChange={(e) => setConfig((p) => ({ ...p, footerGreeting: e.target.value }))}
                    placeholder="e.g. This is a computer generated document. Thank you for your business."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Proportional Preview */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col h-[680px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary" />
              <span className="font-semibold text-slate-200">Live Proportional Preview</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              {selectedPaperSize?.name || 'A4 Portrait (210 × 297 mm)'}
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            <TemplatePreview
              documentType={documentType}
              layoutConfig={config}
              paperCode={selectedPaperSize?.code || 'a4_portrait'}
              scale={0.78}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
