import React, { useState } from 'react';
import type { CodReconciliation, RunSheet, CourierProvider } from '../../../types/api/delivery';
import { useCurrency } from '../../../hooks/useCurrency';
import { SelectDropdown } from '../../../components/ui/Dropdown';
import { ChevronDown, Eye, FileText } from 'lucide-react';
import { ActionMenuPortal } from '../../../components/ui/ActionMenuPortal';
import { cn } from '../../../lib/utils';

interface CodReconciliationSectionProps {
  reconciliations: CodReconciliation[];
  completedRunSheets: RunSheet[];
  providers: CourierProvider[];
  onCreateReconciliation: (data: {
    source_type: 'run_sheet' | 'courier_provider';
    source_id: number;
    expected_amount: string;
    received_amount: string;
    notes?: string;
  }) => Promise<void>;
}

export const CodReconciliationSection: React.FC<CodReconciliationSectionProps> = ({
  reconciliations,
  completedRunSheets,
  providers,
  onCreateReconciliation,
}) => {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceType, setSourceType] = useState<'run_sheet' | 'courier_provider'>('run_sheet');
  const [sourceId, setSourceId] = useState<number>(0);
  const [expectedAmount, setExpectedAmount] = useState<string>('0.00');
  const [receivedAmount, setReceivedAmount] = useState<string>('0.00');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeItemForDetails, setActiveItemForDetails] = useState<CodReconciliation | null>(null);

  const handleSourceSelect = (type: 'run_sheet' | 'courier_provider', id: number) => {
    setSourceType(type);
    setSourceId(id);
    if (type === 'run_sheet') {
      const sheet = completedRunSheets.find((s) => s.id === id);
      if (sheet) {
        setExpectedAmount(Number(sheet.total_cod_collected || sheet.total_cod_expected).toFixed(2));
        setReceivedAmount(Number(sheet.total_cod_collected || sheet.total_cod_expected).toFixed(2));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId) return;
    setIsSubmitting(true);
    try {
      await onCreateReconciliation({
        source_type: sourceType,
        source_id: sourceId,
        expected_amount: expectedAmount,
        received_amount: receivedAmount,
        notes,
      });
      setIsModalOpen(false);
      setSourceId(0);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      reconciled: { bg: '#D1FAE5', text: '#065F46' },
      disputed: { bg: '#FEE2E2', text: '#991B1B' },
      draft: { bg: '#FEF3C7', text: '#92400E' },
    };
    const s = map[status] || { bg: '#F3F4F6', text: '#4B5563' };
    return (
      <span
        style={{
          backgroundColor: s.bg,
          color: s.text,
          padding: '2px 8px',
          borderRadius: 9999,
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
            Cash On Delivery (COD) Reconciliation
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Audit rider cash collections and 3PL courier bank remittances against expected delivery
            totals.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <span>+</span> Reconcile Cash
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-75 bg-surface rounded-2xl border border-default shadow-2xs">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                backgroundColor: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                fontSize: '0.75rem',
                color: '#6B7280',
                textTransform: 'uppercase',
              }}
            >
              <th style={{ padding: '12px 16px' }}>Reconciliation #</th>
              <th style={{ padding: '12px 16px' }}>Source Channel</th>
              <th style={{ padding: '12px 16px' }}>Expected COD</th>
              <th style={{ padding: '12px 16px' }}>Received Amount</th>
              <th style={{ padding: '12px 16px' }}>Variance</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Reconciled Date</th>
              <th style={{ padding: '12px 16px' }}>Auditor</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.875rem', color: '#111827' }}>
            {reconciliations.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ padding: '32px 16px', textAlign: 'center', color: '#6B7280' }}
                >
                  No COD reconciliation records found.
                </td>
              </tr>
            ) : (
              reconciliations.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563EB' }}>
                    {r.reconciliation_number}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                      {r.source_type.replace(/_/g, ' ')} #{r.source_id}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{formatCurrency(r.expected_amount)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669' }}>
                    {formatCurrency(r.received_amount)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: Number(r.variance_amount) === 0 ? '#10B981' : '#EF4444',
                      }}
                    >
                      {Number(r.variance_amount) > 0 ? '+' : ''}
                      {Number(r.variance_amount).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(r.status)}</td>
                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.8125rem' }}>
                    {r.reconciled_at ? new Date(r.reconciled_at).toLocaleDateString() : 'Pending'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4B5563' }}>
                    {r.reconciled_by_name || 'System Auto'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveItemForDetails(r)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-sunken border border-default text-default transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openActionMenuId === r.id) {
                            setOpenActionMenuId(null);
                            setActionMenuAnchor(null);
                          } else {
                            setOpenActionMenuId(r.id);
                            setActionMenuAnchor(e.currentTarget);
                          }
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer',
                          openActionMenuId === r.id
                            ? 'bg-primary text-primary-fg border-primary shadow-xs'
                            : 'bg-surface hover:bg-surface-sunken border-default text-default'
                        )}
                      >
                        <span>Actions</span>
                        <ChevronDown className="size-3 text-muted" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Floating Action Menu via ActionMenuPortal */}
        {openActionMenuId !== null && actionMenuAnchor !== null && (
          <ActionMenuPortal
            anchorEl={actionMenuAnchor}
            open={true}
            onClose={() => {
              setOpenActionMenuId(null);
              setActionMenuAnchor(null);
            }}
          >
            {(() => {
              const activeItem = reconciliations.find((r) => r.id === openActionMenuId);
              if (!activeItem) return null;
              return (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null);
                      setActionMenuAnchor(null);
                      setActiveItemForDetails(activeItem);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-colors cursor-pointer text-left"
                  >
                    <Eye className="size-3.5 text-primary" />
                    <span>View Audit Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenActionMenuId(null);
                      setActionMenuAnchor(null);
                      navigator.clipboard?.writeText(activeItem.reconciliation_number);
                      alert(`Copied ${activeItem.reconciliation_number} to clipboard!`);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-colors cursor-pointer text-left"
                  >
                    <FileText className="size-3.5 text-emerald-600" />
                    <span>Copy Rec Reference</span>
                  </button>
                </>
              );
            })()}
          </ActionMenuPortal>
        )}
      </div>

      {/* Details Modal */}
      {activeItemForDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-default mb-4">
              <div>
                <h3 className="text-base font-bold text-default">
                  {activeItemForDetails.reconciliation_number}
                </h3>
                <p className="text-xs text-muted">
                  Source: {activeItemForDetails.source_type} #{activeItemForDetails.source_id}
                </p>
              </div>
              <div>{getStatusBadge(activeItemForDetails.status)}</div>
            </div>

            <div className="space-y-2.5 text-xs text-default">
              <div className="flex justify-between py-1 border-b border-default/40">
                <span className="text-muted">Expected COD:</span>
                <span className="font-semibold">{formatCurrency(activeItemForDetails.expected_amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-default/40">
                <span className="text-muted">Received Amount:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(activeItemForDetails.received_amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-default/40">
                <span className="text-muted">Variance:</span>
                <span className={cn("font-bold", Number(activeItemForDetails.variance_amount) === 0 ? "text-emerald-600" : "text-rose-600")}>
                  {Number(activeItemForDetails.variance_amount) > 0 ? '+' : ''}{Number(activeItemForDetails.variance_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-default/40">
                <span className="text-muted">Audited By:</span>
                <span>{activeItemForDetails.reconciled_by_name || 'System Auto'}</span>
              </div>
              {activeItemForDetails.notes && (
                <div className="pt-2">
                  <span className="text-muted block mb-1">Notes:</span>
                  <p className="p-2.5 bg-surface-sunken rounded-lg text-default border border-default/60">{activeItemForDetails.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveItemForDetails(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-sunken border border-default text-default transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              padding: 24,
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 600 }}>
              New Cash on Delivery Reconciliation
            </h3>
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Reconciliation Source
                </label>
                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                  <label
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}
                  >
                    <input
                      type="radio"
                      name="sourceType"
                      checked={sourceType === 'run_sheet'}
                      onChange={() => {
                        setSourceType('run_sheet');
                        setSourceId(0);
                      }}
                    />
                    Rider Run Sheet
                  </label>
                  <label
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}
                  >
                    <input
                      type="radio"
                      name="sourceType"
                      checked={sourceType === 'courier_provider'}
                      onChange={() => {
                        setSourceType('courier_provider');
                        setSourceId(0);
                      }}
                    />
                    3PL Courier Partner
                  </label>
                </div>

                <SelectDropdown
                  options={[
                    { value: 0, label: '-- Select Source Record --' },
                    ...(sourceType === 'run_sheet'
                      ? completedRunSheets.map((s) => ({
                          value: s.id,
                          label: `${s.run_sheet_number} (${s.rider_name || 'Rider'}) — ${formatCurrency(s.total_cod_collected)}`,
                        }))
                      : providers.map((p) => ({
                          value: p.id,
                          label: p.name,
                        }))),
                  ]}
                  value={sourceId}
                  onChange={(val) => handleSourceSelect(sourceType, Number(val))}
                  size="md"
                  buttonClassName="w-full"
                  aria-label="Select source record"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    Expected Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    Actual Cash Received ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Auditor Notes / Variance Reason
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes on shortage, bank deposit reference, etc."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !sourceId}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: isSubmitting || !sourceId ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Post Reconciliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
