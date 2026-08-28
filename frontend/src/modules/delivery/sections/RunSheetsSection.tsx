import React, { useState } from 'react';
import type { RunSheet } from '../../../types/api/delivery';
import type { DeliveryOrder } from '../../../types/api/sales';

interface RunSheetsSectionProps {
  runSheets: RunSheet[];
  pendingDeliveries: DeliveryOrder[];
  riders: { id: number; name: string }[];
  branches: { id: number; name: string }[];
  onCreateRunSheet: (data: {
    branch_id: number;
    rider_id?: number;
    run_date: string;
    delivery_order_ids: number[];
  }) => Promise<void>;
  onCompleteRunSheet: (
    runSheetId: number,
    deliveries: { delivery_order_id: number; status: string; cod_collected: string }[]
  ) => Promise<void>;
}

export const RunSheetsSection: React.FC<RunSheetsSectionProps> = ({
  runSheets,
  pendingDeliveries,
  riders,
  branches,
  onCreateRunSheet,
  onCompleteRunSheet,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(branches[0]?.id || 1);
  const [selectedRiderId, setSelectedRiderId] = useState<number>(0);
  const [runDate, setRunDate] = useState<string>(
    () => new Date().toISOString().split('T')[0] ?? ''
  );
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleOrderSelection = (id: number) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const payload: {
        branch_id: number;
        rider_id?: number;
        run_date: string;
        delivery_order_ids: number[];
      } = {
        branch_id: selectedBranchId,
        run_date: runDate,
        delivery_order_ids: selectedOrderIds,
      };
      if (selectedRiderId > 0) {
        payload.rider_id = selectedRiderId;
      }
      await onCreateRunSheet(payload);
      setIsCreateModalOpen(false);
      setSelectedOrderIds([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSheet = async (runSheet: RunSheet) => {
    setIsSubmitting(true);
    try {
      await onCompleteRunSheet(runSheet.id, []);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#F3F4F6', text: '#4B5563' },
      dispatched: { bg: '#DBEAFE', text: '#1E40AF' },
      in_progress: { bg: '#FEF3C7', text: '#92400E' },
      completed: { bg: '#D1FAE5', text: '#065F46' },
      reconciled: { bg: '#EDE9FE', text: '#5B21B6' },
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
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
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
            Rider Delivery Run Sheets
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Dispatch multi-stop delivery challans to in-house delivery fleet and reconcile rider
            COD.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
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
          <span>+</span> Create Run Sheet
        </button>
      </div>

      {/* Run Sheets Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
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
              <th style={{ padding: '12px 16px' }}>Run Sheet #</th>
              <th style={{ padding: '12px 16px' }}>Branch</th>
              <th style={{ padding: '12px 16px' }}>Assigned Rider</th>
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Stops (Done/Total)</th>
              <th style={{ padding: '12px 16px' }}>COD Expected</th>
              <th style={{ padding: '12px 16px' }}>COD Collected</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.875rem', color: '#111827' }}>
            {runSheets.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ padding: '32px 16px', textAlign: 'center', color: '#6B7280' }}
                >
                  No rider run sheets created yet.
                </td>
              </tr>
            ) : (
              runSheets.map((rs) => (
                <tr key={rs.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563EB' }}>
                    {rs.run_sheet_number}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{rs.branch_name || 'Main Branch'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 500 }}>{rs.rider_name || 'Unassigned'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{rs.run_date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {rs.completed_stops} / {rs.total_stops}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    ৳ {Number(rs.total_cod_expected).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 600 }}>
                    ৳ {Number(rs.total_cod_collected).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(rs.status)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => window.print()}
                        title="Print delivery challan manifest"
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FFFFFF',
                          color: '#374151',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        🖨️ Challan
                      </button>
                      {rs.status === 'dispatched' && (
                        <button
                          onClick={() => handleCompleteSheet(rs)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: 'none',
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          ✓ Complete Sheet
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Run Sheet Modal */}
      {isCreateModalOpen && (
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
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 600 }}>
              Create Fleet Dispatch Run Sheet
            </h3>
            <form
              onSubmit={handleCreateSheet}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    Dispatch Branch
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                    }}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
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
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={runDate}
                    onChange={(e) => setRunDate(e.target.value)}
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
                    Assign Rider
                  </label>
                  <select
                    value={selectedRiderId}
                    onChange={(e) => setSelectedRiderId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="0">-- Select Fleet Rider --</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Select Delivery Orders to Batch ({selectedOrderIds.length} selected)
                </label>
                <div
                  style={{
                    maxHeight: 220,
                    overflowY: 'auto',
                    border: '1px solid #E5E7EB',
                    borderRadius: 6,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {pendingDeliveries.length === 0 ? (
                    <div
                      style={{
                        padding: 12,
                        textAlign: 'center',
                        color: '#6B7280',
                        fontSize: '0.875rem',
                      }}
                    >
                      No pending delivery orders available.
                    </div>
                  ) : (
                    pendingDeliveries.map((d) => (
                      <label
                        key={d.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: 8,
                          borderRadius: 4,
                          backgroundColor: selectedOrderIds.includes(d.id) ? '#EFF6FF' : '#F9FAFB',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(d.id)}
                          onChange={() => toggleOrderSelection(d.id)}
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600 }}>{d.delivery_number}</span> —{' '}
                          {d.recipient_name}
                          <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>
                            {d.recipient_phone}
                          </span>
                        </div>
                        <span style={{ fontWeight: 600, color: '#1E40AF' }}>
                          ৳ {Number(d.cod_amount).toFixed(2)}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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
                  disabled={isSubmitting || selectedOrderIds.length === 0}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: isSubmitting || selectedOrderIds.length === 0 ? 0.6 : 1,
                  }}
                >
                  {isSubmitting
                    ? 'Creating...'
                    : `Create Run Sheet (${selectedOrderIds.length} orders)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
