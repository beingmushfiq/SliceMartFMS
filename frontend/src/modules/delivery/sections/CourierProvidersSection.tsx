import React, { useState } from 'react';
import type { CourierProvider } from '../../../types/api/delivery';
import { useCurrency } from '../../../hooks/useCurrency';

interface CourierProvidersSectionProps {
  providers: CourierProvider[];
  onSaveProvider: (provider: Partial<CourierProvider>) => Promise<void>;
  onToggleActive: (provider: CourierProvider) => Promise<void>;
}

export const CourierProvidersSection: React.FC<CourierProvidersSectionProps> = ({
  providers,
  onSaveProvider,
  onToggleActive,
}) => {
  const { formatCurrency } = useCurrency();
  const [selectedProvider, setSelectedProvider] = useState<CourierProvider | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CourierProvider>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const capabilitiesList = [
    { key: 'create_shipment', label: 'Consignment Creation' },
    { key: 'cancel_shipment', label: 'Online Cancellation' },
    { key: 'get_status', label: 'Live Tracking Sync' },
    { key: 'get_label', label: 'Shipping Label Download' },
    { key: 'calculate_rate', label: 'Dynamic Rate Calculation' },
    { key: 'schedule_pickup', label: 'Pickup Scheduling' },
    { key: 'webhooks', label: 'Inbound Webhooks' },
    { key: 'cod_collection', label: 'Cash on Delivery (COD)' },
  ];

  const handleOpenEdit = (provider: CourierProvider) => {
    setSelectedProvider(provider);
    setFormData({
      code: provider.code,
      name: provider.name,
      default_charge: provider.default_charge,
      is_active: provider.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    setIsSubmitting(true);
    try {
      await onSaveProvider({ ...formData, id: selectedProvider.id });
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
          Courier Partners & Capability Matrix
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6B7280' }}>
          Configure 3PL logistics provider credentials, default charges, and inspect supported
          features.
        </p>
      </div>

      {/* Providers Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {providers.map((p) => (
          <div
            key={p.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div>
                  <h3
                    style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}
                  >
                    {p.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>
                    CODE: {p.code}
                  </span>
                </div>
                <span
                  style={{
                    backgroundColor: p.is_active ? '#D1FAE5' : '#F3F4F6',
                    color: p.is_active ? '#065F46' : '#6B7280',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: 16 }}>
                <div>
                  <strong>Default Charge:</strong> {formatCurrency(p.default_charge)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 2 }}>
                  Adapter: {p.adapter_class.split('\\').pop()}
                </div>
              </div>

              {/* Capability Matrix Badges */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#6B7280',
                    marginBottom: 6,
                  }}
                >
                  SUPPORTED CAPABILITIES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {capabilitiesList.map((cap) => {
                    const isSupported = p.capabilities?.[cap.key] ?? true;
                    return (
                      <span
                        key={cap.key}
                        style={{
                          backgroundColor: isSupported ? '#EFF6FF' : '#F3F4F6',
                          color: isSupported ? '#1E40AF' : '#9CA3AF',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          textDecoration: isSupported ? 'none' : 'line-through',
                        }}
                      >
                        {isSupported ? '✓' : '✕'} {cap.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                borderTop: '1px solid #F3F4F6',
                paddingTop: 12,
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => onToggleActive(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {p.is_active ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => handleOpenEdit(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Provider Modal */}
      {isEditModalOpen && (
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
              maxWidth: 480,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 600 }}>
              Configure {selectedProvider?.name}
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
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  Default Delivery Charge (BDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.default_charge || ''}
                  onChange={(e) => setFormData({ ...formData, default_charge: e.target.value })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
