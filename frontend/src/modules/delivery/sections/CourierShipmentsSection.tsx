import React, { useState } from 'react';
import type { CourierShipment, CourierProvider } from '../../../types/api/delivery';
import type { DeliveryOrder } from '../../../types/api/sales';
import { useCurrency } from '../../../hooks/useCurrency';

interface CourierShipmentsSectionProps {
  shipments: CourierShipment[];
  providers: CourierProvider[];
  pendingDeliveries: DeliveryOrder[];
  onBookShipment: (deliveryOrderId: number, providerId: number, notes?: string) => Promise<void>;
  onTrackShipment: (shipmentId: number) => Promise<void>;
  onCancelShipment: (shipmentId: number, reason: string) => Promise<void>;
  onOpenLabel: (shipment: CourierShipment) => void;
}

export const CourierShipmentsSection: React.FC<CourierShipmentsSectionProps> = ({
  shipments,
  providers,
  pendingDeliveries,
  onBookShipment,
  onTrackShipment,
  onCancelShipment,
  onOpenLabel,
}) => {
  const { formatCurrency } = useCurrency();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number>(0);
  const [selectedProviderId, setSelectedProviderId] = useState<number>(0);
  const [bookNotes, setBookNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredShipments = shipments.filter((s) => {
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    const matchesProvider =
      selectedProvider === 'all' || s.courier_provider_id === Number(selectedProvider);
    const matchesSearch =
      (s.consignment_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (s.awb_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (s.delivery_number?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesStatus && matchesProvider && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#FEF3C7', text: '#92400E' },
      confirmed: { bg: '#E0E7FF', text: '#3730A3' },
      in_transit: { bg: '#DBEAFE', text: '#1E40AF' },
      out_for_delivery: { bg: '#FCE7F3', text: '#9D174D' },
      delivered: { bg: '#D1FAE5', text: '#065F46' },
      failed: { bg: '#FEE2E2', text: '#991B1B' },
      cancelled: { bg: '#F3F4F6', text: '#4B5563' },
      returned: { bg: '#EDE9FE', text: '#5B21B6' },
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

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliveryId || !selectedProviderId) return;
    setIsSubmitting(true);
    try {
      await onBookShipment(selectedDeliveryId, selectedProviderId, bookNotes);
      setIsBookModalOpen(false);
      setSelectedDeliveryId(0);
      setSelectedProviderId(0);
      setBookNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner & Action */}
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
            Courier Consignments & Tracking
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Book 3PL parcel consignments (Pathao, Steadfast, RedX) and track live statuses.
          </p>
        </div>
        <button
          onClick={() => setIsBookModalOpen(true)}
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
          <span>+</span> Book 3PL Shipment
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          backgroundColor: '#FFFFFF',
          padding: 16,
          borderRadius: 8,
          border: '1px solid #E5E7EB',
        }}
      >
        <input
          type="text"
          placeholder="Search Consignment / AWB / Delivery #..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1 1 200px',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #D1D5DB',
            fontSize: '0.875rem',
          }}
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #D1D5DB',
            fontSize: '0.875rem',
            backgroundColor: '#FFFFFF',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_transit">In Transit</option>
          <option value="out_for_delivery">Out For Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="returned">Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #D1D5DB',
            fontSize: '0.875rem',
            backgroundColor: '#FFFFFF',
          }}
        >
          <option value="all">All Providers</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Shipments Table */}
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
              <th style={{ padding: '12px 16px' }}>Consignment / AWB</th>
              <th style={{ padding: '12px 16px' }}>Courier Partner</th>
              <th style={{ padding: '12px 16px' }}>Delivery Order</th>
              <th style={{ padding: '12px 16px' }}>COD Amount</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Synced At</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.875rem', color: '#111827' }}>
            {filteredShipments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: '32px 16px', textAlign: 'center', color: '#6B7280' }}
                >
                  No courier shipments found.
                </td>
              </tr>
            ) : (
              filteredShipments.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#2563EB' }}>
                      {s.consignment_id || 'Generating...'}
                    </div>
                    {s.awb_number && (
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        AWB: {s.awb_number}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 500 }}>{s.provider_name || '3PL Partner'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {s.delivery_number || `#${s.delivery_order_id}`}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(s.cod_amount)}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(s.status)}</td>
                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.8125rem' }}>
                    {s.last_synced_at
                      ? new Date(s.last_synced_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => onTrackShipment(s.id)}
                        title="Sync live status from courier"
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
                        🔄 Sync
                      </button>
                      <button
                        onClick={() => onOpenLabel(s)}
                        title="Print Courier Shipping Label"
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
                        🏷️ Label
                      </button>
                      {s.status !== 'delivered' && s.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            const reason = prompt('Cancellation reason:');
                            if (reason) onCancelShipment(s.id, reason);
                          }}
                          title="Cancel shipment with courier"
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid #FCA5A5',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          ✕ Cancel
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

      {/* Book Shipment Modal */}
      {isBookModalOpen && (
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
              Book 3PL Courier Shipment
            </h3>
            <form
              onSubmit={handleCreateShipment}
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
                  Select Delivery Order
                </label>
                <select
                  value={selectedDeliveryId}
                  onChange={(e) => setSelectedDeliveryId(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">-- Choose Pending Delivery Order --</option>
                  {pendingDeliveries.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.delivery_number} — {d.recipient_name} ({formatCurrency(d.cod_amount)})
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
                  Select Courier Partner
                </label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">-- Choose Courier Provider --</option>
                  {providers
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Default charge: {formatCurrency(p.default_charge)})
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
                  Special Instructions / Pickup Notes
                </label>
                <textarea
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Fragile bakery items, handle with care."
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
                  onClick={() => setIsBookModalOpen(false)}
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
                  disabled={isSubmitting || !selectedDeliveryId || !selectedProviderId}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    opacity: isSubmitting || !selectedDeliveryId || !selectedProviderId ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Shipment Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
