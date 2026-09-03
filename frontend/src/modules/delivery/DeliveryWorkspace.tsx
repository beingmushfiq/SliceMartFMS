import React, { useState } from 'react';
import type {
  CourierProvider,
  CourierShipment,
  RunSheet,
  CodReconciliation,
} from '../../types/api/delivery';
import type { DeliveryOrder } from '../../types/api/sales';
import { CourierShipmentsSection } from './sections/CourierShipmentsSection';
import { RunSheetsSection } from './sections/RunSheetsSection';
import { CourierProvidersSection } from './sections/CourierProvidersSection';
import { CodReconciliationSection } from './sections/CodReconciliationSection';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';

type DeliveryTab = 'shipments' | 'run_sheets' | 'providers' | 'cod_reconciliation';

export const DeliveryWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useWorkspaceTab<DeliveryTab>(
    'shipments',
    ['shipments', 'run_sheets', 'providers', 'cod_reconciliation'] as const
  );

  // Initial State Data
  const [providers, setProviders] = useState<CourierProvider[]>([
    {
      id: 1,
      uuid: 'cp-01',
      code: 'PATHAO',
      name: 'Pathao Courier',
      adapter_class: 'App\\Modules\\Delivery\\Adapters\\PathaoCourierAdapter',
      is_active: true,
      capabilities: {
        create_shipment: true,
        cancel_shipment: true,
        get_status: true,
        get_label: true,
        calculate_rate: true,
        schedule_pickup: true,
        webhooks: true,
        cod_collection: true,
      },
      default_charge: '60.0000',
    },
    {
      id: 2,
      uuid: 'cp-02',
      code: 'STEADFAST',
      name: 'Steadfast Courier',
      adapter_class: 'App\\Modules\\Delivery\\Adapters\\SteadfastCourierAdapter',
      is_active: true,
      capabilities: {
        create_shipment: true,
        cancel_shipment: true,
        get_status: true,
        get_label: true,
        calculate_rate: false,
        schedule_pickup: false,
        webhooks: true,
        cod_collection: true,
      },
      default_charge: '70.0000',
    },
  ]);

  const [shipments, setShipments] = useState<CourierShipment[]>([
    {
      id: 1,
      uuid: 'shp-01',
      delivery_order_id: 101,
      delivery_number: 'DO-202608-00101',
      courier_provider_id: 1,
      provider_name: 'Pathao Courier',
      consignment_id: 'PTH-9921827',
      awb_number: 'TRK-PTH-882190',
      label_path: '/labels/PTH-9921827.pdf',
      tracking_url: 'https://merchant.pathao.com/tracking?consignment_id=PTH-9921827',
      status: 'in_transit',
      provider_status_raw: 'In Transit - Hub Dispatch',
      charge_amount: '60.0000',
      cod_amount: '1250.0000',
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      uuid: 'shp-02',
      delivery_order_id: 102,
      delivery_number: 'DO-202608-00102',
      courier_provider_id: 2,
      provider_name: 'Steadfast Courier',
      consignment_id: 'STDF-440192',
      awb_number: 'CID-774129',
      label_path: '/labels/STDF-440192.pdf',
      tracking_url: 'https://steadfast.com.bd/tracking/STDF-440192',
      status: 'delivered',
      provider_status_raw: 'Delivered',
      charge_amount: '70.0000',
      cod_amount: '3400.0000',
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ]);

  const [runSheets, setRunSheets] = useState<RunSheet[]>([
    {
      id: 1,
      uuid: 'rs-01',
      run_sheet_number: 'RS-20260828-001',
      branch_id: 1,
      branch_name: 'Dhaka Central Hub',
      rider_id: 1,
      rider_name: 'Karim Rider',
      run_date: '2026-08-28',
      status: 'dispatched',
      total_stops: 3,
      completed_stops: 1,
      total_cod_expected: '2400.0000',
      total_cod_collected: '800.0000',
      dispatched_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ]);

  const [reconciliations, setReconciliations] = useState<CodReconciliation[]>([
    {
      id: 1,
      uuid: 'rec-01',
      reconciliation_number: 'REC-COD-20260828-001',
      source_type: 'run_sheet',
      source_id: 1,
      period_start: '2026-08-28',
      period_end: '2026-08-28',
      expected_amount: '2400.0000',
      received_amount: '2400.0000',
      variance_amount: '0.0000',
      status: 'reconciled',
      reconciled_by_name: 'Audit Manager',
      reconciled_at: new Date().toISOString(),
      notes: 'Cash verified and banked in City Bank A/C',
    },
  ]);

  const [pendingDeliveries] = useState<DeliveryOrder[]>([
    {
      id: 103,
      uuid: 'do-103',
      delivery_number: 'DO-202608-00103',
      sales_order_id: 203,
      warehouse_id: 1,
      recipient_name: 'Tanvir Hossain',
      recipient_phone: '+8801755555555',
      delivery_type: 'own_delivery',
      status: 'pending',
      cod_amount: '1850.0000',
      cod_collected_amount: '0.0000',
      cod_status: 'pending',
      delivery_charge: '60.0000',
      package_count: 1,
    },
    {
      id: 104,
      uuid: 'do-104',
      delivery_number: 'DO-202608-00104',
      sales_order_id: 204,
      warehouse_id: 1,
      recipient_name: 'Nusrat Jahan',
      recipient_phone: '+8801766666666',
      delivery_type: 'courier',
      status: 'pending',
      cod_amount: '950.0000',
      cod_collected_amount: '0.0000',
      cod_status: 'pending',
      delivery_charge: '60.0000',
      package_count: 1,
    },
  ]);

  const riders = [
    { id: 1, name: 'Karim Rider (+8801811111111)' },
    { id: 2, name: 'Rahim Dispatcher (+8801822222222)' },
  ];

  const branches = [
    { id: 1, name: 'Dhaka Central Hub' },
    { id: 2, name: 'Chittagong Regional Hub' },
  ];

  // Actions
  const handleBookShipment = async (deliveryOrderId: number, providerId: number) => {
    const provider = providers.find((p) => p.id === providerId);
    const delivery = pendingDeliveries.find((d) => d.id === deliveryOrderId);
    const newShipment: CourierShipment = {
      id: Date.now(),
      uuid: `shp-${Date.now()}`,
      delivery_order_id: deliveryOrderId,
      delivery_number: delivery?.delivery_number,
      courier_provider_id: providerId,
      provider_name: provider?.name,
      consignment_id: `PTH-${Math.floor(1000000 + Math.random() * 9000000)}`,
      awb_number: `TRK-AWB-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'confirmed',
      charge_amount: provider?.default_charge || '60.0000',
      cod_amount: delivery?.cod_amount || '0.0000',
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setShipments((prev) => [newShipment, ...prev]);
  };

  const handleTrackShipment = async (shipmentId: number) => {
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId ? { ...s, last_synced_at: new Date().toISOString() } : s
      )
    );
  };

  const handleCancelShipment = async (shipmentId: number, reason: string) => {
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId ? { ...s, status: 'cancelled', error_message: reason } : s
      )
    );
  };

  const handleOpenLabel = (shipment: CourierShipment) => {
    alert(`Generating & printing shipping label for Consignment ${shipment.consignment_id}...`);
  };

  const handleCreateRunSheet = async (data: {
    branch_id: number;
    rider_id?: number;
    run_date: string;
    delivery_order_ids: number[];
  }) => {
    const rider = riders.find((r) => r.id === data.rider_id);
    const branch = branches.find((b) => b.id === data.branch_id);
    const newSheet: RunSheet = {
      id: Date.now(),
      uuid: `rs-${Date.now()}`,
      run_sheet_number: `RS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      branch_id: data.branch_id,
      branch_name: branch?.name,
      rider_id: data.rider_id,
      rider_name: rider?.name,
      run_date: data.run_date,
      status: 'dispatched',
      total_stops: data.delivery_order_ids.length,
      completed_stops: 0,
      total_cod_expected: '1500.0000',
      total_cod_collected: '0.0000',
      dispatched_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setRunSheets((prev) => [newSheet, ...prev]);
  };

  const handleCompleteRunSheet = async (runSheetId: number) => {
    setRunSheets((prev) =>
      prev.map((rs) =>
        rs.id === runSheetId
          ? {
              ...rs,
              status: 'completed',
              completed_stops: rs.total_stops,
              total_cod_collected: rs.total_cod_expected,
              returned_at: new Date().toISOString(),
            }
          : rs
      )
    );
  };

  const handleSaveProvider = async (data: Partial<CourierProvider>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === data.id ? ({ ...p, ...data } as CourierProvider) : p))
    );
  };

  const handleToggleActive = async (provider: CourierProvider) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === provider.id ? { ...p, is_active: !p.is_active } : p))
    );
  };

  const handleCreateReconciliation = async (data: {
    source_type: 'run_sheet' | 'courier_provider';
    source_id: number;
    expected_amount: string;
    received_amount: string;
    notes?: string;
  }) => {
    const variance = (Number(data.received_amount) - Number(data.expected_amount)).toFixed(4);
    const newRec: CodReconciliation = {
      id: Date.now(),
      uuid: `rec-${Date.now()}`,
      reconciliation_number: `REC-COD-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      source_type: data.source_type,
      source_id: data.source_id,
      expected_amount: data.expected_amount,
      received_amount: data.received_amount,
      variance_amount: variance,
      status: Number(variance) === 0 ? 'reconciled' : 'disputed',
      reconciled_by_name: 'Current User',
      reconciled_at: new Date().toISOString(),
      notes: data.notes,
      created_at: new Date().toISOString(),
    };
    setReconciliations((prev) => [newRec, ...prev]);
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#6B7280',
            fontSize: '0.875rem',
          }}
        >
          <span>FMS</span>
          <span>/</span>
          <span>Logistics & Fulfillment</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ margin: '6px 0 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text, #111827)' }}>
            Delivery, Couriers & Fleet Dispatch
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Steadfast · Pathao · REDX Online
            </span>
            <button
              onClick={() => alert('Synchronizing shipment statuses with Pathao & Steadfast APIs... All tracking records updated.')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              🔄 Bulk Courier Sync
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid #E5E7EB',
          paddingBottom: 2,
        }}
      >
        <button
          onClick={() => setActiveTab('shipments')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'shipments' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeTab === 'shipments' ? '#2563EB' : '#4B5563',
            fontWeight: activeTab === 'shipments' ? 600 : 500,
            fontSize: '0.9375rem',
            cursor: 'pointer',
          }}
        >
          📦 3PL Shipments & Tracking
        </button>

        <button
          onClick={() => setActiveTab('run_sheets')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom:
              activeTab === 'run_sheets' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeTab === 'run_sheets' ? '#2563EB' : '#4B5563',
            fontWeight: activeTab === 'run_sheets' ? 600 : 500,
            fontSize: '0.9375rem',
            cursor: 'pointer',
          }}
        >
          🛵 Rider Run Sheets
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'providers' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeTab === 'providers' ? '#2563EB' : '#4B5563',
            fontWeight: activeTab === 'providers' ? 600 : 500,
            fontSize: '0.9375rem',
            cursor: 'pointer',
          }}
        >
          🏢 Courier Partners
        </button>

        <button
          onClick={() => setActiveTab('cod_reconciliation')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom:
              activeTab === 'cod_reconciliation' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeTab === 'cod_reconciliation' ? '#2563EB' : '#4B5563',
            fontWeight: activeTab === 'cod_reconciliation' ? 600 : 500,
            fontSize: '0.9375rem',
            cursor: 'pointer',
          }}
        >
          💵 COD Reconciliation
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'shipments' && (
        <CourierShipmentsSection
          shipments={shipments}
          providers={providers}
          pendingDeliveries={pendingDeliveries}
          onBookShipment={handleBookShipment}
          onTrackShipment={handleTrackShipment}
          onCancelShipment={handleCancelShipment}
          onOpenLabel={handleOpenLabel}
        />
      )}

      {activeTab === 'run_sheets' && (
        <RunSheetsSection
          runSheets={runSheets}
          pendingDeliveries={pendingDeliveries}
          riders={riders}
          branches={branches}
          onCreateRunSheet={handleCreateRunSheet}
          onCompleteRunSheet={handleCompleteRunSheet}
        />
      )}

      {activeTab === 'providers' && (
        <CourierProvidersSection
          providers={providers}
          onSaveProvider={handleSaveProvider}
          onToggleActive={handleToggleActive}
        />
      )}

      {activeTab === 'cod_reconciliation' && (
        <CodReconciliationSection
          reconciliations={reconciliations}
          completedRunSheets={runSheets.filter(
            (s) => s.status === 'completed' || s.status === 'dispatched'
          )}
          providers={providers}
          onCreateReconciliation={handleCreateReconciliation}
        />
      )}
    </div>
  );
};
export default DeliveryWorkspace;
