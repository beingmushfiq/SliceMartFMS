import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  AlertTriangle,
  Flame,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { api } from '../../../lib/api/client';

export interface ReworkOrder {
  id: number;
  uuid: string;
  rework_number: string;
  batch_number: string;
  product_name: string;
  defect_category: string;
  defect_notes?: string | null;
  qty_defective: number;
  unit: string;
  assigned_station: string;
  assigned_operator?: string | null;
  status: 'pending' | 'in_rework' | 'completed' | 'scrapped';
  rework_cost: string;
  salvage_qty: number;
  scrap_qty: number;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

const SAMPLE_REWORK_ORDERS: ReworkOrder[] = [
  {
    id: 1,
    uuid: 'rwk-001',
    rework_number: 'RWK-2026-001',
    batch_number: 'BAT-202608-012',
    product_name: 'Master Corrugated Box 5-Ply (Large)',
    defect_category: 'Flute Delamination & Edge Crush',
    defect_notes: 'Adhesive curing failure along side seam during high-speed corrugation run.',
    qty_defective: 250,
    unit: 'PCS',
    assigned_station: 'Secondary Gluing & Press Station 2',
    assigned_operator: 'Md. Farooq Hossain (Senior Tech)',
    status: 'in_rework',
    rework_cost: '3400.00',
    salvage_qty: 230,
    scrap_qty: 20,
    started_at: '2026-08-29 09:00',
    created_at: '2026-08-28',
  },
  {
    id: 2,
    uuid: 'rwk-002',
    rework_number: 'RWK-2026-002',
    batch_number: 'BAT-202608-015',
    product_name: 'Custom Poly Bags (Printed)',
    defect_category: 'Flexographic Print Misalignment',
    defect_notes: 'Ink registration drift on 2nd color cylinder. Trim and re-heat seal tops.',
    qty_defective: 800,
    unit: 'PCS',
    assigned_station: 'Heat Sealing & Slitting Station 1',
    assigned_operator: 'Shamsul Alam',
    status: 'completed',
    rework_cost: '4800.00',
    salvage_qty: 760,
    scrap_qty: 40,
    started_at: '2026-08-26 14:00',
    completed_at: '2026-08-27 11:30',
    created_at: '2026-08-26',
  },
  {
    id: 3,
    uuid: 'rwk-003',
    rework_number: 'RWK-2026-003',
    batch_number: 'BAT-202608-019',
    product_name: 'Industrial Stretch Film Roll (23 Micron)',
    defect_category: 'Uneven Tension Gauge',
    defect_notes: 'Core misalignment resulting in roll edge telescoping. Rewind on turret rewinder.',
    qty_defective: 45,
    unit: 'Rolls',
    assigned_station: 'Turret Rewinder & Core Calibrator',
    assigned_operator: 'Anowar Hossain',
    status: 'pending',
    rework_cost: '1200.00',
    salvage_qty: 0,
    scrap_qty: 0,
    created_at: '2026-08-30',
  },
  {
    id: 4,
    uuid: 'rwk-004',
    rework_number: 'RWK-2026-004',
    batch_number: 'BAT-202608-008',
    product_name: 'Heavy Duty Strapping Band 19mm',
    defect_category: 'Tensile Strength Failure',
    defect_notes: 'Extrusion temperature drop caused brittle crystallization. Non-recoverable.',
    qty_defective: 120,
    unit: 'Rolls',
    assigned_station: 'Material Recovery Shredder',
    assigned_operator: 'Kazi Momin',
    status: 'scrapped',
    rework_cost: '800.00',
    salvage_qty: 0,
    scrap_qty: 120,
    started_at: '2026-08-20 08:30',
    completed_at: '2026-08-20 12:00',
    created_at: '2026-08-19',
  },
];

export function ReworkSection() {
  const [reworkOrders, setReworkOrders] = useState<ReworkOrder[]>(SAMPLE_REWORK_ORDERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ReworkOrder | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Form State for Add
  const [formData, setFormData] = useState({
    batch_number: '',
    product_name: '',
    defect_category: 'Flute Delamination & Edge Crush',
    defect_notes: '',
    qty_defective: '',
    unit: 'PCS',
    assigned_station: 'Secondary Gluing & Press Station 1',
    assigned_operator: '',
    estimated_cost: '',
  });

  // Form State for Completion
  const [completeData, setCompleteData] = useState({
    salvage_qty: '',
    scrap_qty: '',
    actual_cost: '',
  });

  useEffect(() => {
    let ignore = false;
    api.get<ReworkOrder[]>('/qc/rework-orders')
      .then((res) => {
        if (!ignore && res.data && res.data.length > 0) {
          setReworkOrders(res.data);
        }
      })
      .catch(() => {
        // Fallback to sample data
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(formData.qty_defective) || 1;
    const newOrder: ReworkOrder = {
      id: Date.now(),
      uuid: `rwk-${Date.now()}`,
      rework_number: `RWK-${new Date().getFullYear()}-${String(reworkOrders.length + 1).padStart(3, '0')}`,
      batch_number: formData.batch_number || 'BAT-202608-099',
      product_name: formData.product_name || 'Standard Production Item',
      defect_category: formData.defect_category,
      defect_notes: formData.defect_notes || null,
      qty_defective: qty,
      unit: formData.unit,
      assigned_station: formData.assigned_station,
      assigned_operator: formData.assigned_operator || 'Assigned Lead Tech',
      status: 'pending',
      rework_cost: formData.estimated_cost || '0.00',
      salvage_qty: 0,
      scrap_qty: 0,
      created_at: new Date().toISOString().slice(0, 10),
    };

    setReworkOrders([newOrder, ...reworkOrders]);
    setShowCreateModal(false);
    setFormData({
      batch_number: '',
      product_name: '',
      defect_category: 'Flute Delamination & Edge Crush',
      defect_notes: '',
      qty_defective: '',
      unit: 'PCS',
      assigned_station: 'Secondary Gluing & Press Station 1',
      assigned_operator: '',
      estimated_cost: '',
    });
  };

  const handleStartRework = (id: number) => {
    setReworkOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: 'in_rework', started_at: new Date().toISOString().slice(0, 16).replace('T', ' ') }
          : o
      )
    );
  };

  const handleCompleteRework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const salvage = parseInt(completeData.salvage_qty) || 0;
    const scrap = parseInt(completeData.scrap_qty) || 0;

    setReworkOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: scrap >= o.qty_defective && salvage === 0 ? 'scrapped' : 'completed',
              salvage_qty: salvage,
              scrap_qty: scrap,
              rework_cost: completeData.actual_cost || o.rework_cost,
              completed_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
          : o
      )
    );

    setShowCompleteModal(false);
    setSelectedOrder(null);
  };

  const filteredOrders = reworkOrders.filter((o) => {
    const matchesSearch =
      o.rework_number.toLowerCase().includes(search.toLowerCase()) ||
      o.batch_number.toLowerCase().includes(search.toLowerCase()) ||
      o.product_name.toLowerCase().includes(search.toLowerCase()) ||
      o.defect_category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDefectiveUnits = reworkOrders.reduce((sum, o) => sum + o.qty_defective, 0);
  const totalSalvagedUnits = reworkOrders.reduce((sum, o) => sum + o.salvage_qty, 0);
  const salvageRate = totalDefectiveUnits > 0 ? (totalSalvagedUnits / totalDefectiveUnits) * 100 : 0;
  const inReworkCount = reworkOrders.filter((o) => o.status === 'in_rework' || o.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Active Rework Jobs
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-default">
            {inReworkCount} Orders
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Currently queued or under station correction
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Salvage Recovery Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {salvageRate.toFixed(1)}% Yield
          </div>
          <div className="mt-1 text-[11px] text-muted">
            {totalSalvagedUnits.toLocaleString()} units restored to Grade-A inventory
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Total Rework Expenditure
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-default">
            BDT {reworkOrders.reduce((sum, o) => sum + parseFloat(o.rework_cost || '0'), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Labor & secondary processing costs
          </div>
        </div>

        <div className="rounded-2xl border border-default bg-surface p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Irrecoverable Scrap
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {reworkOrders.reduce((sum, o) => sum + o.scrap_qty, 0).toLocaleString()} Units
          </div>
          <div className="mt-1 text-[11px] text-muted">
            Routed to recycling / shredder
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search rework orders by #, batch, product or defect..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-default bg-surface pl-9 pr-3.5 py-2 text-xs text-default placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-default bg-surface px-3 py-2 text-xs text-default focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Queue</option>
            <option value="in_rework">In Progress</option>
            <option value="completed">Completed (Salvaged)</option>
            <option value="scrapped">Scrapped</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Rework Order</span>
        </button>
      </div>

      {/* Rework Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-default">
            <thead className="border-b border-default bg-surface-sunken text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">Rework Job #</th>
                <th className="px-4 py-3.5">Source Batch & Product</th>
                <th className="px-4 py-3.5">Defect Diagnostic</th>
                <th className="px-4 py-3.5">Defective Qty</th>
                <th className="px-4 py-3.5">Station & Tech</th>
                <th className="px-4 py-3.5">Salvage / Scrap</th>
                <th className="px-4 py-3.5">Cost</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted">
                    No rework orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-sunken/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {order.rework_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-default">{order.product_name}</div>
                      <div className="text-[11px] font-mono text-muted mt-0.5">
                        Batch: {order.batch_number}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-medium border border-rose-500/20">
                        <AlertTriangle className="h-3 w-3" />
                        {order.defect_category}
                      </span>
                      {order.defect_notes && (
                        <div className="text-[11px] text-muted line-clamp-1 mt-1 max-w-[200px]">
                          {order.defect_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-default">
                      {order.qty_defective} <span className="text-[10px] font-normal text-muted">{order.unit}</span>
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      <div className="font-medium text-default text-[11px]">{order.assigned_station}</div>
                      <div className="text-[10px] text-muted">{order.assigned_operator || 'Unassigned'}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      {order.status === 'completed' || order.status === 'scrapped' ? (
                        <div>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{order.salvage_qty} Salvaged</span>
                          <span className="text-muted"> / </span>
                          <span className="text-rose-600 dark:text-rose-400">{order.scrap_qty} Scrap</span>
                        </div>
                      ) : (
                        <span className="text-muted italic">In Progress</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-default">
                      BDT {parseFloat(order.rework_cost || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          order.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : order.status === 'in_rework'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                            : order.status === 'scrapped'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStartRework(order.id)}
                          className="rounded-lg bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 transition-colors cursor-pointer"
                        >
                          Start Rework
                        </button>
                      )}
                      {order.status === 'in_rework' && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setCompleteData({
                              salvage_qty: String(order.qty_defective),
                              scrap_qty: '0',
                              actual_cost: order.rework_cost,
                            });
                            setShowCompleteModal(true);
                          }}
                          className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          Complete & Yield
                        </button>
                      )}
                      {(order.status === 'completed' || order.status === 'scrapped') && (
                        <span className="text-[11px] text-muted font-mono">{order.completed_at?.slice(0, 10)}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Rework Modal */}
      {showCompleteModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-base font-bold text-default">Complete Rework Order</h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-muted hover:text-default cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-surface-sunken rounded-xl border border-default text-xs space-y-1">
              <div className="font-bold text-default">{selectedOrder.product_name}</div>
              <div className="text-muted font-mono">
                Total Defective to Account for: <strong className="text-default">{selectedOrder.qty_defective} {selectedOrder.unit}</strong>
              </div>
            </div>

            <form onSubmit={handleCompleteRework} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                    Salvaged Qty (Restored) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={selectedOrder.qty_defective}
                    value={completeData.salvage_qty}
                    onChange={(e) => {
                      const salvage = parseInt(e.target.value) || 0;
                      const scrap = Math.max(0, selectedOrder.qty_defective - salvage);
                      setCompleteData({
                        ...completeData,
                        salvage_qty: e.target.value,
                        scrap_qty: String(scrap),
                      });
                    }}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default font-mono font-bold focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                    Scrapped Qty (Lost) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={selectedOrder.qty_defective}
                    value={completeData.scrap_qty}
                    onChange={(e) => setCompleteData({ ...completeData, scrap_qty: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default font-mono font-bold focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Total Processing Cost (BDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={completeData.actual_cost}
                  onChange={(e) => setCompleteData({ ...completeData, actual_cost: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="rounded-xl border border-default px-4 py-2 text-muted hover:bg-surface-sunken hover:text-default transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Confirm Yield & Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rework Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-default bg-surface p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-base font-bold text-default">Issue Rework Order (QA)</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-default cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Source Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BAT-202608-012"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Product Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Carton 5-Ply"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Defect Category *
                  </label>
                  <select
                    value={formData.defect_category}
                    onChange={(e) => setFormData({ ...formData, defect_category: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3 py-2 text-default focus:border-primary focus:outline-none"
                  >
                    <option value="Flute Delamination & Edge Crush">Flute Delamination & Edge Crush</option>
                    <option value="Flexographic Print Misalignment">Flexographic Print Misalignment</option>
                    <option value="Uneven Tension Gauge">Uneven Tension Gauge</option>
                    <option value="Heat Seal Weakness">Heat Seal Weakness</option>
                    <option value="Dimension & Slotting Tolerance">Dimension & Slotting Tolerance</option>
                    <option value="Surface Scratches & Cosmetic">Surface Scratches & Cosmetic</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                      Defective Qty *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="100"
                      value={formData.qty_defective}
                      onChange={(e) => setFormData({ ...formData, qty_defective: e.target.value })}
                      className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default font-mono focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full rounded-xl border border-default bg-surface-sunken px-2 py-2 text-default focus:border-primary focus:outline-none"
                    >
                      <option value="PCS">PCS</option>
                      <option value="Rolls">Rolls</option>
                      <option value="KG">KG</option>
                      <option value="Boxes">Boxes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Assigned Rework Station *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Secondary Gluing Station 1"
                    value={formData.assigned_station}
                    onChange={(e) => setFormData({ ...formData, assigned_station: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Lead Technician / Operator
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Md. Farooq Hossain"
                    value={formData.assigned_operator}
                    onChange={(e) => setFormData({ ...formData, assigned_operator: e.target.value })}
                    className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Estimated Rework Cost (BDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2500.00"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Correction Instructions & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific corrective adjustments (e.g., adjust roller nip pressure, re-apply hot melt adhesive)..."
                  value={formData.defect_notes}
                  onChange={(e) => setFormData({ ...formData, defect_notes: e.target.value })}
                  className="w-full rounded-xl border border-default bg-surface-sunken px-3.5 py-2 text-default focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-default">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-default px-4 py-2 text-muted hover:bg-surface-sunken hover:text-default transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Dispatch Rework Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
