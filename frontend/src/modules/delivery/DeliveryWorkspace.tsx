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
import { Truck, Bike, Building2, Banknote, RefreshCw, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

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
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
              <Truck className="size-3 text-primary" />
              Logistics & Fleet Dispatch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default">
            Delivery, Couriers & Fleet Dispatch
          </h1>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            3PL courier API integrations, rider run sheets, and cash-on-delivery reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Steadfast · Pathao · REDX
          </span>
          <button
            type="button"
            onClick={() => alert('Synchronizing shipment statuses with Pathao & Steadfast APIs... All tracking records updated.')}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-fg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            Bulk Courier Sync
          </button>
        </div>
      </div>

      {/* Universal Delivery Quick-Action Ribbon */}
      <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 via-surface to-surface-raised p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-default">
              <Zap className="size-3.5 text-amber-500 fill-amber-500" />
              <span>Quick Actions • Courier Dispatch & Driver Logistics</span>
            </div>
            <p className="text-[11px] text-muted">
              Book courier parcels, prepare rider delivery run sheets, or reconcile collected cash with 1 click.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('shipments')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <Truck className="size-3.5" />
              <span>Book Courier Parcel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('run_sheets')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-sunken text-default border border-default shadow-2xs transition-all cursor-pointer"
            >
              <Bike className="size-3.5 text-cyan-600" />
              <span>Create Rider Run Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cod_reconciliation')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-sunken text-default border border-default shadow-2xs transition-all cursor-pointer"
            >
              <Banknote className="size-3.5 text-emerald-600" />
              <span>Settle COD Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('providers')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-sunken text-default border border-default shadow-2xs transition-all cursor-pointer"
            >
              <Building2 className="size-3.5 text-primary" />
              <span>Manage Couriers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs Tray */}
      <div className="flex overflow-x-auto p-1.5 bg-surface-sunken rounded-2xl border border-default shadow-2xs">
        <div className="flex gap-1.5 min-w-full sm:min-w-0" aria-label="Delivery sections">
          {[
            { id: 'shipments', label: '3PL Shipments & Tracking', icon: Truck, count: shipments.length },
            { id: 'run_sheets', label: 'Rider Run Sheets', icon: Bike, count: runSheets.length },
            { id: 'providers', label: 'Courier Partners', icon: Building2, count: providers.length },
            { id: 'cod_reconciliation', label: 'COD Reconciliation', icon: Banknote, count: reconciliations.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-fg font-semibold shadow-xs border border-primary'
                    : 'text-muted hover:text-default hover:bg-surface/50 border border-transparent'
                )}
              >
                <Icon className={cn('size-3.5', isActive ? 'text-primary-fg' : 'text-muted')} />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-surface text-muted border border-default'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
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
