import React, { useState } from 'react';
import type {
  Asset,
  AssetCategory,
  AssetDepreciationEntry,
  MaintenanceOrder,
  MaintenanceType,
  MaintenancePriority,
} from '../../types/api/assets';
import { useCurrency } from '../../hooks/useCurrency';
import { useWorkspaceTab } from '../../hooks/useWorkspaceTab';
import {
  Building2,
  TrendingDown,
  Wrench,
  Tag,
  Plus,
  Cpu,
  Activity,
  CheckCircle2,
  Clock,
  Lock,
  Layers,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

type AssetTab = 'machinery' | 'maintenance' | 'assets' | 'depreciation' | 'categories';
type PerspectiveMode = 'all' | 'operations' | 'finance';

interface PlantMachineMeta {
  asset_id: number;
  line_name: string;
  runtime_hours: number;
  next_service_due: string;
  interlock_status: 'operational' | 'service_due' | 'maintenance_lock';
}

export const AssetsWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useWorkspaceTab<AssetTab>(
    'machinery',
    ['machinery', 'maintenance', 'assets', 'depreciation', 'categories'] as const,
    'tab'
  );
  const [perspective, setPerspective] = useState<PerspectiveMode>('all');
  const { formatCurrency } = useCurrency();

  // Asset Categories State
  const [categories] = useState<AssetCategory[]>([
    {
      id: 1,
      uuid: 'ac-01',
      code: 'MACHINERY',
      name: 'Plant & Heavy Machinery',
      default_depreciation_method: 'straight_line',
      default_useful_life_months: 60,
      default_salvage_percentage: '5.0000',
      is_active: true,
    },
    {
      id: 2,
      uuid: 'ac-02',
      code: 'VEHICLES',
      name: 'Delivery Vans & Logistics Fleet',
      default_depreciation_method: 'straight_line',
      default_useful_life_months: 48,
      default_salvage_percentage: '10.0000',
      is_active: true,
    },
    {
      id: 3,
      uuid: 'ac-03',
      code: 'EQUIPMENT',
      name: 'POS Terminals & Factory IT Hardware',
      default_depreciation_method: 'straight_line',
      default_useful_life_months: 36,
      default_salvage_percentage: '0.0000',
      is_active: true,
    },
  ]);

  // Assets Register State
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: 1,
      uuid: 'ast-01',
      asset_code: 'AST-MAC-001',
      name: 'Industrial Automatic Fabric Laser Cutter',
      asset_category_id: 1,
      category: categories[0],
      company_id: 1,
      branch_id: 1,
      purchase_date: '2026-01-15',
      purchase_cost: '240000.0000',
      salvage_value: '12000.0000',
      useful_life_months: 60,
      depreciation_method: 'straight_line',
      accumulated_depreciation: '26600.0000',
      book_value: '213400.0000',
      status: 'active',
      location: 'Tejgaon Plant - Cutting Floor #1',
      serial_number: 'LSR-2026-X88',
      warranty_expiry_date: '2028-01-15',
    },
    {
      id: 2,
      uuid: 'ast-02',
      asset_code: 'AST-VEH-001',
      name: 'Toyota HiAce Delivery Van (Dhaka Metro-11)',
      asset_category_id: 2,
      category: categories[1],
      company_id: 1,
      branch_id: 1,
      purchase_date: '2026-02-01',
      purchase_cost: '3200000.0000',
      salvage_value: '320000.0000',
      useful_life_months: 48,
      depreciation_method: 'straight_line',
      accumulated_depreciation: '360000.0000',
      book_value: '2840000.0000',
      status: 'active',
      location: 'Gulshan Hub Garage',
      serial_number: 'VIN-982173819283',
      warranty_expiry_date: '2029-02-01',
    },
    {
      id: 3,
      uuid: 'ast-03',
      asset_code: 'AST-EQP-001',
      name: 'High-Speed Automated Label Printer Station',
      asset_category_id: 3,
      category: categories[2],
      company_id: 1,
      branch_id: 1,
      purchase_date: '2026-04-10',
      purchase_cost: '85000.0000',
      salvage_value: '0.0000',
      useful_life_months: 36,
      depreciation_method: 'straight_line',
      accumulated_depreciation: '9444.0000',
      book_value: '75556.0000',
      status: 'active',
      location: 'Dispatch Hub - Packing Line',
      serial_number: 'PRN-99120',
      warranty_expiry_date: '2027-04-10',
    },
  ]);

  // Operational Machine Metadata (linking to production lines)
  const [machinesMeta] = useState<PlantMachineMeta[]>([
    {
      asset_id: 1,
      line_name: 'Laser Cutting Line #1',
      runtime_hours: 1420,
      next_service_due: '2026-09-25',
      interlock_status: 'operational',
    },
    {
      asset_id: 3,
      line_name: 'Automated Packing & Label Line',
      runtime_hours: 890,
      next_service_due: '2026-10-10',
      interlock_status: 'operational',
    },
  ]);

  // Depreciation Log State
  const [depreciationEntries] = useState<AssetDepreciationEntry[]>([
    {
      id: 1,
      uuid: 'dep-01',
      asset_id: 1,
      asset: assets[0],
      period_year: 2026,
      period_month: 8,
      opening_book_value: '217200.0000',
      depreciation_amount: '3800.0000',
      closing_book_value: '213400.0000',
      journal_entry_id: 2,
      posted_at: '2026-08-28 11:30:00',
    },
    {
      id: 2,
      uuid: 'dep-02',
      asset_id: 2,
      asset: assets[1],
      period_year: 2026,
      period_month: 8,
      opening_book_value: '2900000.0000',
      depreciation_amount: '60000.0000',
      closing_book_value: '2840000.0000',
      journal_entry_id: 3,
      posted_at: '2026-08-28 11:30:00',
    },
  ]);

  // Maintenance Work Orders State
  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([
    {
      id: 1,
      uuid: 'mo-01',
      order_number: 'MO-202608-001',
      asset_id: 1,
      asset: assets[0],
      maintenance_type: 'preventive',
      priority: 'medium',
      description: 'Laser optic alignment and coolant system flush',
      scheduled_date: '2026-09-05',
      cost: '4500.0000',
      status: 'scheduled',
      performed_by: 'Authorized Tech - SharpCut Engineering',
    },
    {
      id: 2,
      uuid: 'mo-02',
      order_number: 'MO-202608-002',
      asset_id: 2,
      asset: assets[1],
      maintenance_type: 'preventive',
      priority: 'high',
      description: '10,000km engine oil, brake pads and transmission check',
      scheduled_date: '2026-08-30',
      cost: '12000.0000',
      status: 'in_progress',
      performed_by: 'Navana Motors Workshop',
    },
  ]);

  // Add Asset Modal State
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(1);
  const [newCost, setNewCost] = useState('50000');
  const [newSalvage, setNewSalvage] = useState('0');
  const [newMonths, setNewMonths] = useState(36);

  // Add Maintenance Order Modal State
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number>(assets[0]?.id || 1);
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('preventive');
  const [priority, setPriority] = useState<MaintenancePriority>('medium');
  const [description, setDescription] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [estimatedCost, setEstimatedCost] = useState<string>('5000');
  const [technician, setTechnician] = useState<string>('Internal Plant Engineer');

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === newCategoryId);
    const costNum = parseFloat(newCost) || 0;
    const salvageNum = parseFloat(newSalvage) || 0;

    const newAsset: Asset = {
      id: assets.length + 1,
      uuid: `ast-auto-${Date.now()}`,
      asset_code: `AST-${cat?.code || 'GEN'}-${String(assets.length + 1).padStart(3, '0')}`,
      name: newAssetName,
      asset_category_id: newCategoryId,
      category: cat,
      company_id: 1,
      branch_id: 1,
      purchase_date: new Date().toISOString().slice(0, 10),
      purchase_cost: costNum.toFixed(4),
      salvage_value: salvageNum.toFixed(4),
      useful_life_months: newMonths,
      depreciation_method: 'straight_line',
      accumulated_depreciation: '0.0000',
      book_value: costNum.toFixed(4),
      status: 'active',
      location: 'Main Factory Hub',
    };

    setAssets([...assets, newAsset]);
    setShowAddAssetModal(false);
    setNewAssetName('');
  };

  const handleCreateMaintenanceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = assets.find((a) => a.id === selectedAssetId);
    const costNum = parseFloat(estimatedCost) || 0;

    const newOrder: MaintenanceOrder = {
      id: maintenanceOrders.length + 1,
      uuid: `mo-auto-${Date.now()}`,
      order_number: `MO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(maintenanceOrders.length + 1).padStart(3, '0')}`,
      asset_id: selectedAssetId,
      asset: targetAsset,
      maintenance_type: maintenanceType,
      priority,
      description,
      scheduled_date: scheduledDate,
      cost: costNum.toFixed(4),
      status: 'scheduled',
      performed_by: technician,
    };

    setMaintenanceOrders([newOrder, ...maintenanceOrders]);
    setShowAddMaintenanceModal(false);
    setDescription('');
    setActiveTab('maintenance');
  };

  const handleCompleteOrder = (orderId: number) => {
    setMaintenanceOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o))
    );
  };

  // Financial calculations
  const totalAssetCost = assets.reduce((acc, a) => acc + parseFloat(a.purchase_cost), 0);
  const totalAccumulatedDepr = assets.reduce(
    (acc, a) => acc + parseFloat(a.accumulated_depreciation),
    0
  );
  const totalNetBookValue = assets.reduce((acc, a) => acc + parseFloat(a.book_value), 0);

  // Operational calculations
  const plantMachines = assets.filter(
    (a) => a.category?.code === 'MACHINERY' || a.category?.code === 'EQUIPMENT'
  );
  const activeMaintenanceOrders = maintenanceOrders.filter((o) => o.status !== 'completed');
  const totalMaintenanceCost = maintenanceOrders.reduce((acc, o) => acc + parseFloat(o.cost), 0);

  const isOperationsTab = activeTab === 'machinery' || activeTab === 'maintenance';
  const showOperationsKpis = perspective === 'operations' || (perspective === 'all' && isOperationsTab);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-default pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
              <Layers className="size-3 text-primary" />
              Enterprise Asset & Machinery Lifecycle
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-default">
            Asset Management
          </h1>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            Unified asset lifecycle: plant machinery health, preventive maintenance work orders, capitalisation register, and straight-line depreciation schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter: Perspective selector */}
          <div className="flex items-center bg-surface-sunken p-1 rounded-xl border border-default text-2xs font-semibold">
            <button
              type="button"
              onClick={() => setPerspective('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition cursor-pointer',
                perspective === 'all'
                  ? 'bg-surface text-default shadow-2xs font-bold'
                  : 'text-muted hover:text-default'
              )}
            >
              All Lenses
            </button>
            <button
              type="button"
              onClick={() => {
                setPerspective('operations');
                if (!isOperationsTab) setActiveTab('machinery');
              }}
              className={cn(
                'px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer',
                perspective === 'operations'
                  ? 'bg-primary text-primary-fg shadow-2xs font-bold'
                  : 'text-muted hover:text-default'
              )}
            >
              <Wrench className="size-3" />
              Plant & CMMS
            </button>
            <button
              type="button"
              onClick={() => {
                setPerspective('finance');
                if (isOperationsTab) setActiveTab('assets');
              }}
              className={cn(
                'px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer',
                perspective === 'finance'
                  ? 'bg-primary text-primary-fg shadow-2xs font-bold'
                  : 'text-muted hover:text-default'
              )}
            >
              <Building2 className="size-3" />
              Finance & Depr
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMaintenanceModal(true)}
            className="px-3.5 py-2 bg-surface hover:bg-surface-sunken border border-default text-default font-semibold rounded-xl shadow-2xs transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Wrench className="size-3.5 text-primary" />
            New Work Order
          </button>

          <button
            type="button"
            onClick={() => setShowAddAssetModal(true)}
            className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-fg font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Plus className="size-3.5" />
            Register Asset
          </button>
        </div>
      </div>

      {/* Dynamic Context-Aware KPI Cards */}
      {showOperationsKpis ? (
        /* Operational / Machinery Perspective */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface rounded-2xl p-4 shadow-2xs border border-default">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                Plant Machinery Uptime
              </div>
              <Activity className="size-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              100% Operational
            </div>
            <div className="text-xs text-muted mt-1">
              {plantMachines.length} Workstations Assigned to Lines
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-2xs border border-default">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                Active Work Orders
              </div>
              <Wrench className="size-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
              {activeMaintenanceOrders.length} In Progress
            </div>
            <div className="text-xs text-muted mt-1">
              Preventive Servicing & Calibration
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-2xs border border-default">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                Next Scheduled Routine
              </div>
              <Clock className="size-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-default mt-2">
              Sep 25, 2026
            </div>
            <div className="text-xs text-muted mt-1">
              Fabric Laser Cutter Optic Check
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-2xs border border-default">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                Maintenance OpEx YTD
              </div>
              <TrendingDown className="size-4 text-rose-500" />
            </div>
            <div className="text-2xl font-extrabold text-default mt-2">
              {formatCurrency(totalMaintenanceCost)}
            </div>
            <div className="text-xs text-muted mt-1">Parts & External Technicians</div>
          </div>
        </div>
      ) : (
        /* Financial / Fixed Asset Perspective */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface rounded-2xl p-4 shadow-2xs border border-default">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">
              Total Gross Asset Value
            </div>
            <div className="text-2xl font-extrabold text-default mt-2">
              {formatCurrency(totalAssetCost)}
            </div>
            <div className="text-xs text-muted mt-1">
              Acquisition Cost Across {assets.length} Assets
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-2xs border border-default">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">
              Accumulated Depreciation
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
              {formatCurrency(totalAccumulatedDepr)}
            </div>
            <div className="text-xs text-muted mt-1">Expensed to GL General Ledger</div>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-2xs border border-default">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">
              Net Carrying Book Value
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatCurrency(totalNetBookValue)}
            </div>
            <div className="text-xs text-muted mt-1">Balance Sheet Asset Value</div>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-2xs border border-default">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">
              Monthly Depreciation Run
            </div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
              {formatCurrency(63800)}
            </div>
            <div className="text-xs text-muted mt-1">Current Month Amortization</div>
          </div>
        </div>
      )}

      {/* Universal Asset Lifecycle Quick-Action Ribbon */}
      <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 via-surface to-surface-raised p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-default">
              <Zap className="size-3.5 text-amber-500 fill-amber-500" />
              <span>Quick Actions • Equipment Health & Financial Assets</span>
            </div>
            <p className="text-[11px] text-muted">
              Report equipment repairs, add capital assets, or execute monthly depreciation ledger write-downs with 1 click.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddMaintenanceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <Wrench className="size-3.5" />
              <span>Log Repair Ticket</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddAssetModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-fg shadow-xs transition-all cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Register Asset</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('depreciation')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-sunken text-default border border-default shadow-2xs transition-all cursor-pointer"
            >
              <TrendingDown className="size-3.5 text-indigo-500" />
              <span>Run Monthly Depreciation</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('machinery')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-sunken text-default border border-default shadow-2xs transition-all cursor-pointer"
            >
              <Cpu className="size-3.5 text-cyan-600" />
              <span>Machinery Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto p-1.5 bg-surface-sunken rounded-2xl border border-default shadow-2xs">
        <div className="flex gap-1.5 min-w-full sm:min-w-0" aria-label="Asset Sections">
          {(
            [
              {
                id: 'machinery',
                label: 'Plant Machinery & Workstations',
                icon: Cpu,
                count: plantMachines.length,
                group: 'operations',
              },
              {
                id: 'maintenance',
                label: 'Maintenance & Repairs',
                icon: Wrench,
                count: maintenanceOrders.length,
                group: 'operations',
              },
              {
                id: 'assets',
                label: 'Fixed Asset Register',
                icon: Building2,
                count: assets.length,
                group: 'finance',
              },
              {
                id: 'depreciation',
                label: 'Monthly Depreciation Logs',
                icon: TrendingDown,
                count: depreciationEntries.length,
                group: 'finance',
              },
              {
                id: 'categories',
                label: 'Asset Categories & Policies',
                icon: Tag,
                count: categories.length,
                group: 'finance',
              },
            ] as {
              id: AssetTab;
              label: string;
              icon: typeof Building2;
              count: number;
              group: 'operations' | 'finance';
            }[]
          )
            .filter((tab) => {
              if (perspective === 'operations') return tab.group === 'operations';
              if (perspective === 'finance') return tab.group === 'finance';
              return true;
            })
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
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

      {/* Tab 1: Plant Machinery & Workstations (Operational CMMS) */}
      {activeTab === 'machinery' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-2xl border border-default p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-default flex items-center gap-1.5">
                <Lock className="size-4 text-emerald-500" />
                Production Line Scheduling & Machinery Interlock
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Machines with active breakdowns or scheduled preventive maintenance automatically alert the production line scheduler.
              </p>
            </div>
            <div className="flex items-center gap-2 text-2xs font-semibold">
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> All Lines Operational
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plantMachines.map((m) => {
              const meta = machinesMeta.find((meta) => meta.asset_id === m.id);
              const relatedOrders = maintenanceOrders.filter((o) => o.asset_id === m.id);
              const activeOrder = relatedOrders.find((o) => o.status !== 'completed');

              return (
                <div
                  key={m.id}
                  className="bg-surface rounded-2xl border border-default p-5 shadow-2xs hover:border-primary/40 transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary-subtle px-2 py-0.5 rounded border border-primary/20">
                          {m.asset_code}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {activeOrder ? 'Under Service' : 'Operational'}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-default mt-1.5">{m.name}</h4>
                      <p className="text-xs text-muted">
                        {m.location} • S/N: {m.serial_number || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-default text-xs">
                    <div>
                      <span className="text-muted block text-2xs uppercase tracking-wider">
                        Assigned Line
                      </span>
                      <span className="font-semibold text-default">
                        {meta?.line_name || 'General Factory Floor'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-2xs uppercase tracking-wider">
                        Runtime Logged
                      </span>
                      <span className="font-mono font-semibold text-default">
                        {meta?.runtime_hours || 1200} Operating Hours
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-2xs uppercase tracking-wider">
                        Next Service Due
                      </span>
                      <span className="font-semibold text-default">
                        {meta?.next_service_due || '2026-09-30'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-2xs uppercase tracking-wider">
                        Active Order
                      </span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {activeOrder ? activeOrder.order_number : 'None (Ready)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-2xs text-muted">
                      Book Value: <strong className="text-default">{formatCurrency(m.book_value)}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssetId(m.id);
                          setMaintenanceType('preventive');
                          setShowAddMaintenanceModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-default text-xs font-semibold hover:bg-surface-sunken text-default transition cursor-pointer"
                      >
                        Schedule PM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssetId(m.id);
                          setMaintenanceType('corrective');
                          setPriority('high');
                          setShowAddMaintenanceModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                      >
                        Report Issue
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Maintenance Work Orders */}
      {activeTab === 'maintenance' && (
        <div className="bg-surface rounded-2xl shadow-2xs border border-default overflow-hidden">
          <div className="p-4 border-b border-default flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-default">Maintenance Work Orders & Service Tickets</h3>
              <p className="text-xs text-muted">
                Track scheduled preventive inspections, emergency repairs, parts consumption, and technician assignments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMaintenanceModal(true)}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-fg text-xs font-semibold rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="size-3" />
              Create Order
            </button>
          </div>

          <table className="w-full text-left text-sm text-default">
            <thead className="bg-surface-sunken text-muted uppercase text-2xs font-bold border-b border-default">
              <tr>
                <th className="px-6 py-3">Order Number</th>
                <th className="px-6 py-3">Target Asset</th>
                <th className="px-6 py-3">Type & Priority</th>
                <th className="px-6 py-3">Service Scope</th>
                <th className="px-6 py-3">Scheduled Date</th>
                <th className="px-6 py-3 text-right">Cost (BDT)</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {maintenanceOrders.map((mo) => (
                <tr key={mo.id} className="hover:bg-surface-sunken/50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-primary">
                    {mo.order_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-default">
                      {mo.asset?.name}
                    </div>
                    <div className="text-2xs font-mono text-muted">{mo.asset?.asset_code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="capitalize text-xs font-semibold text-default">
                      {mo.maintenance_type}
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        mo.priority === 'high' || mo.priority === 'critical'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {mo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="truncate text-xs text-muted">{mo.description}</div>
                    <div className="text-2xs font-medium text-default mt-0.5">
                      Tech: {mo.performed_by || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">{mo.scheduled_date}</td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-default">
                    {formatCurrency(mo.cost)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        'px-2.5 py-1 text-2xs font-bold rounded-full uppercase',
                        mo.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      )}
                    >
                      {mo.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {mo.status !== 'completed' ? (
                      <button
                        type="button"
                        onClick={() => handleCompleteOrder(mo.id)}
                        className="px-2 py-1 text-2xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Complete
                      </button>
                    ) : (
                      <span className="text-2xs text-muted flex items-center justify-end gap-1">
                        <CheckCircle2 className="size-3 text-emerald-500" /> Done
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Fixed Asset Register */}
      {activeTab === 'assets' && (
        <div className="bg-surface rounded-2xl shadow-2xs border border-default overflow-hidden">
          <table className="w-full text-left text-sm text-default">
            <thead className="bg-surface-sunken text-muted uppercase text-2xs font-bold border-b border-default">
              <tr>
                <th className="px-6 py-3">Asset Code</th>
                <th className="px-6 py-3">Name & Details</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Cost (BDT)</th>
                <th className="px-6 py-3 text-right">Accum. Depr (BDT)</th>
                <th className="px-6 py-3 text-right">Net Book Value (BDT)</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {assets.map((ast) => (
                <tr key={ast.id} className="hover:bg-surface-sunken/50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-primary">
                    {ast.asset_code}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-default">{ast.name}</div>
                    <div className="text-xs text-muted">
                      {ast.location} | S/N: {ast.serial_number || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 text-xs font-semibold bg-surface-sunken rounded text-muted border border-default">
                      {ast.category?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-default">
                    {formatCurrency(ast.purchase_cost)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-amber-600 dark:text-amber-400">
                    {formatCurrency(ast.accumulated_depreciation)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(ast.book_value)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 uppercase">
                      {ast.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Depreciation Logs */}
      {activeTab === 'depreciation' && (
        <div className="bg-surface rounded-2xl shadow-2xs border border-default overflow-hidden">
          <table className="w-full text-left text-sm text-default">
            <thead className="bg-surface-sunken text-muted uppercase text-2xs font-bold border-b border-default">
              <tr>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3 text-right">Opening Book Value</th>
                <th className="px-6 py-3 text-right">Monthly Depreciation</th>
                <th className="px-6 py-3 text-right">Closing Book Value</th>
                <th className="px-6 py-3">GL Reference</th>
                <th className="px-6 py-3">Posted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {depreciationEntries.map((dep) => (
                <tr key={dep.id} className="hover:bg-surface-sunken/50 transition">
                  <td className="px-6 py-4 font-semibold text-default">
                    {dep.period_year}-{String(dep.period_month).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-default">
                      {dep.asset?.name}
                    </div>
                    <div className="text-xs font-mono text-muted">{dep.asset?.asset_code}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-muted">
                    {formatCurrency(dep.opening_book_value)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(dep.depreciation_amount)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(dep.closing_book_value)}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-primary">
                    JE-202608-000{dep.journal_entry_id}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">{dep.posted_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Asset Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-surface rounded-2xl p-6 shadow-2xs border border-default space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-surface-sunken rounded text-default border border-default">
                  {cat.code}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  ACTIVE
                </span>
              </div>
              <h3 className="font-bold text-lg text-default">{cat.name}</h3>
              <div className="space-y-2 text-sm text-muted">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="font-medium capitalize text-default">
                    {cat.default_depreciation_method.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Useful Life:</span>
                  <span className="font-semibold text-default">
                    {cat.default_useful_life_months} Months ({cat.default_useful_life_months / 12}{' '}
                    Yrs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Default Salvage:</span>
                  <span className="font-semibold text-default">
                    {parseFloat(cat.default_salvage_percentage)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddAssetModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-default space-y-6">
            <div className="flex items-center justify-between border-b border-default pb-4">
              <h3 className="text-lg font-bold text-default">
                Register Capital Asset
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAssetModal(false)}
                className="text-muted hover:text-default cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default uppercase mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="e.g. Industrial Overlock Sewing Machine"
                  required
                  className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-default uppercase mb-1">
                    Asset Category
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-default uppercase mb-1">
                    Purchase Cost (BDT)
                  </label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm text-right font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-default uppercase mb-1">
                    Salvage Value (BDT)
                  </label>
                  <input
                    type="number"
                    value={newSalvage}
                    onChange={(e) => setNewSalvage(e.target.value)}
                    className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-default uppercase mb-1">
                    Useful Life (Months)
                  </label>
                  <input
                    type="number"
                    value={newMonths}
                    onChange={(e) => setNewMonths(parseInt(e.target.value) || 36)}
                    className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm text-right font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-default rounded-xl text-muted hover:text-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-primary hover:bg-primary/90 text-primary-fg font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Maintenance Order Modal */}
      {showAddMaintenanceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-default space-y-6">
            <div className="flex items-center justify-between border-b border-default pb-4">
              <div>
                <h3 className="text-lg font-bold text-default">
                  Create Maintenance Work Order
                </h3>
                <p className="text-xs text-muted">
                  Issue a preventive servicing or corrective repair order for plant machinery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMaintenanceModal(false)}
                className="text-muted hover:text-default cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMaintenanceOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-default uppercase mb-1">
                  Target Machine / Asset
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_code} — {a.name} ({a.category?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-default uppercase mb-1">
                    Order Type
                  </label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                    className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm"
                  >
                    <option value="preventive">Preventive Maintenance</option>
                    <option value="corrective">Corrective Repair</option>
                    <option value="inspection">Safety & Quality Inspection</option>
                    <option value="calibration">Machine Calibration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-default uppercase mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                    className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Line Stoppage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default uppercase mb-1">
                  Problem / Service Scope
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe required service, parts replacement, lubrication, calibration..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-default uppercase mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-default uppercase mb-1">
                    Est. Cost (BDT)
                  </label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-default uppercase mb-1">
                  Assigned Technician / Workshop
                </label>
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="e.g. SharpCut Eng. / Internal Plant Maintenance"
                  required
                  className="w-full px-3 py-2 border border-default rounded-xl bg-surface-sunken text-default text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowAddMaintenanceModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-default rounded-xl text-muted hover:text-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-primary hover:bg-primary/90 text-primary-fg font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsWorkspace;
