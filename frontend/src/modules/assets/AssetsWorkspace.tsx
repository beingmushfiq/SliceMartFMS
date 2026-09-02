import React, { useState } from 'react';
import type {
  Asset,
  AssetCategory,
  AssetDepreciationEntry,
  MaintenanceOrder,
} from '../../types/api/assets';

type AssetTab = 'assets' | 'depreciation' | 'categories' | 'maintenance';

export const AssetsWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AssetTab>('assets');

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
      location: 'Dispatch Dispatch Hub',
      serial_number: 'PRN-99120',
      warranty_expiry_date: '2027-04-10',
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
  const [maintenanceOrders] = useState<MaintenanceOrder[]>([
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

  const totalAssetCost = assets.reduce((acc, a) => acc + parseFloat(a.purchase_cost), 0);
  const totalAccumulatedDepr = assets.reduce(
    (acc, a) => acc + parseFloat(a.accumulated_depreciation),
    0
  );
  const totalNetBookValue = assets.reduce((acc, a) => acc + parseFloat(a.book_value), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🏭</span> Fixed Assets & Depreciation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Asset Register, Straight-Line Monthly Depreciation, GL Journal Linking & Maintenance
            Work Orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddAssetModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition flex items-center gap-1 text-sm"
          >
            <span>+</span> Register New Asset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Gross Asset Value
          </div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
            ৳ {totalAssetCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Acquisition Cost Across {assets.length} Assets
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Accumulated Depreciation
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            ৳ {totalAccumulatedDepr.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-400 mt-1">Expensed to GL General Ledger</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Net Carrying Book Value
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            ৳ {totalNetBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-400 mt-1">Balance Sheet Asset Value</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Active Maintenance Orders
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {maintenanceOrders.length} Orders
          </div>
          <div className="text-xs text-gray-400 mt-1">Preventive & Fleet Servicing</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6">
        {(
          [
            { id: 'assets', label: '📋 Fixed Asset Register', count: assets.length },
            {
              id: 'depreciation',
              label: '📉 Monthly Depreciation Logs',
              count: depreciationEntries.length,
            },
            { id: 'maintenance', label: '🛠️ Maintenance & Repairs', count: maintenanceOrders.length },
            { id: 'categories', label: '🏷️ Asset Categories', count: categories.length },
          ] as { id: AssetTab; label: string; count: number }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition flex items-center gap-2 relative ${
              activeTab === tab.id
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Asset Register */}
      {activeTab === 'assets' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
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
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {assets.map((ast) => (
                <tr key={ast.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {ast.asset_code}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{ast.name}</div>
                    <div className="text-xs text-gray-500">
                      {ast.location} | S/N: {ast.serial_number || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                      {ast.category?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-gray-100">
                    ৳{' '}
                    {parseFloat(ast.purchase_cost).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-amber-600 dark:text-amber-400">
                    ৳{' '}
                    {parseFloat(ast.accumulated_depreciation).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{' '}
                    {parseFloat(ast.book_value).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
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

      {/* Tab 2: Depreciation Logs */}
      {activeTab === 'depreciation' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
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
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {depreciationEntries.map((dep) => (
                <tr key={dep.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                    {dep.period_year}-{String(dep.period_month).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {dep.asset?.name}
                    </div>
                    <div className="text-xs font-mono text-gray-500">{dep.asset?.asset_code}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">
                    ৳{' '}
                    {parseFloat(dep.opening_book_value).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    ৳{' '}
                    {parseFloat(dep.depreciation_amount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{' '}
                    {parseFloat(dep.closing_book_value).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                    JE-202608-000{dep.journal_entry_id}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{dep.posted_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Maintenance & Repairs */}
      {activeTab === 'maintenance' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Order Number</th>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Type & Priority</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Scheduled Date</th>
                <th className="px-6 py-3 text-right">Cost (BDT)</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {maintenanceOrders.map((mo) => (
                <tr key={mo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {mo.order_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {mo.asset?.name}
                    </div>
                    <div className="text-xs font-mono text-gray-500">{mo.asset?.asset_code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="capitalize text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {mo.maintenance_type}
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        mo.priority === 'high'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {mo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-gray-600 dark:text-gray-300">
                    {mo.description}
                  </td>
                  <td className="px-6 py-4 text-xs">{mo.scheduled_date}</td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900 dark:text-gray-100">
                    ৳ {parseFloat(mo.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 uppercase">
                      {mo.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Asset Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                  {cat.code}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  ACTIVE
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{cat.name}</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-medium capitalize">
                    {cat.default_depreciation_method.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Useful Life:</span>
                  <span className="font-semibold">
                    {cat.default_useful_life_months} Months ({cat.default_useful_life_months / 12}{' '}
                    Yrs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Default Salvage:</span>
                  <span className="font-semibold">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Register Fixed Asset
              </h3>
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="e.g. Industrial Overlock Sewing Machine"
                  required
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Asset Category
                  </label>
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Purchase Cost (BDT)
                  </label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-right font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Salvage Value (BDT)
                  </label>
                  <input
                    type="number"
                    value={newSalvage}
                    onChange={(e) => setNewSalvage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Useful Life (Months)
                  </label>
                  <input
                    type="number"
                    value={newMonths}
                    onChange={(e) => setNewMonths(parseInt(e.target.value) || 36)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 text-sm text-right font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 text-sm border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow"
                >
                  Register Asset
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
