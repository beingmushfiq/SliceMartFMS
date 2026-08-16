// ─────────────────────────────────────────────────────────────
// INVENTORY OVERVIEW — Warehouse stock management
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import {
  Package, AlertTriangle, TrendingUp,
  RefreshCw, Download,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/FormElements';
import { EmptyState, Pagination } from '../../components/ui/Feedback';
import { KPICard } from '../../components/ui/KPICard';
import { Tabs, TabList, TabTrigger, TabPanel } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { cn, formatBDT } from '../../lib/utils';

export default function InventoryOverview() {
  const inventory = useAppStore(s => s.inventory);
  const updateStock = useAppStore(s => s.updateStock);

  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [adjItem,   setAdjItem]   = useState<string | null>(null);
  const [adjForm,   setAdjForm]   = useState({ qty: '', type: 'add' as 'add' | 'subtract', reason: '' });
  const [adjSaving, setAdjSaving] = useState(false);

  const PAGE_SIZE = 12;

  // Computed stats
  const rawMaterials  = inventory.filter(i => i.itemType === 'material');
  const products      = inventory.filter(i => i.itemType === 'product');
  const lowStock      = inventory.filter(i => i.qty > 0 && i.qty <= i.minStock);
  const outOfStock    = inventory.filter(i => i.qty === 0);
  const totalValue    = inventory.reduce((s, i) => s + i.totalValue, 0);

  // Filter
  const filteredInv = useMemo(() => {
    if (!search) return inventory;
    const q = search.toLowerCase();
    return inventory.filter(i =>
      i.itemName.toLowerCase().includes(q) ||
      i.itemId.toLowerCase().includes(q) ||
      i.warehouseId.toLowerCase().includes(q)
    );
  }, [inventory, search]);

  const selectedAdj = inventory.find(i => i.id === adjItem);

  const handleAdjustment = () => {
    if (!adjItem || !adjForm.qty) return;
    const item = inventory.find(i => i.id === adjItem);
    if (!item) return;
    setAdjSaving(true);
    const delta = adjForm.type === 'add' ? parseInt(adjForm.qty) : -parseInt(adjForm.qty);
    setTimeout(() => {
      updateStock(item.itemId, item.warehouseId, delta, {
        itemId:       item.itemId,
        itemName:     item.itemName,
        itemType:     item.itemType,
        warehouseId:  item.warehouseId,
        movementType: 'adjustment',
        qty:          Math.abs(delta),
        unit:         item.unit,
        date:         new Date().toISOString().slice(0, 10),
        reference:    `ADJ-${Date.now()}`,
        notes:        adjForm.reason,
        performedBy:  'Mushfiqur Rahman',
        createdAt:    new Date().toISOString(),
      });
      setAdjItem(null);
      setAdjSaving(false);
      setAdjForm({ qty: '', type: 'add', reason: '' });
    }, 700);
  };

  const stockLevelColor = (item: typeof inventory[0]) => {
    if (item.qty === 0) return 'bg-error-500';
    if (item.qty <= item.minStock) return 'bg-warning-500';
    return 'bg-success-500';
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-700 text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time stock levels across all warehouses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total SKUs"       value={inventory.length} icon={<Package className="w-4.5 h-4.5" />} iconColor="bg-slate-100 text-slate-500" />
        <KPICard label="Total Value"      value={formatBDT(totalValue, { compact: true })} icon={<TrendingUp className="w-4.5 h-4.5" />} iconColor="bg-success-50 text-success-600" />
        <KPICard label="Low Stock"        value={lowStock.length} alert={lowStock.length > 0 ? 'warning' : undefined} icon={<AlertTriangle className="w-4.5 h-4.5" />} iconColor="bg-warning-50 text-warning-600" />
        <KPICard label="Out of Stock"     value={outOfStock.length} alert={outOfStock.length > 0 ? 'error' : undefined} icon={<AlertTriangle className="w-4.5 h-4.5" />} iconColor="bg-error-50 text-error-600" />
      </div>

      {/* Tabs: Raw Materials / Finished Goods */}
      <Tabs defaultTab="materials">
        <div className="card">
          <div className="card-header border-b-0 pb-0">
            <TabList>
              <TabTrigger id="materials" count={rawMaterials.length}>Raw Materials</TabTrigger>
              <TabTrigger id="products"  count={products.length}>Finished Goods</TabTrigger>
              <TabTrigger id="all"       count={inventory.length}>All Stock</TabTrigger>
            </TabList>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-t border-slate-100">
            <SearchInput
              placeholder="Search by item name, ID, warehouse…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="max-w-sm"
              aria-label="Search inventory"
            />
          </div>

          {['materials', 'products', 'all'].map(tabId => {
            const items = tabId === 'materials'
              ? filteredInv.filter(i => i.itemType === 'material')
              : tabId === 'products'
              ? filteredInv.filter(i => i.itemType === 'product')
              : filteredInv;

            const paged  = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
            const tPages = Math.ceil(items.length / PAGE_SIZE);

            return (
              <TabPanel key={tabId} id={tabId}>
                <div className="overflow-x-auto">
                  <table className="data-table" aria-label={`${tabId} inventory`}>
                    <thead>
                      <tr>
                        <th aria-label="Stock level" className="w-8"></th>
                        <th>Item Name</th>
                        <th>Item ID</th>
                        <th>Warehouse</th>
                        <th className="col-numeric">Qty</th>
                        <th className="col-numeric">Min Stock</th>
                        <th>Unit</th>
                        <th className="col-numeric">Avg Cost</th>
                        <th className="col-numeric">Total Value</th>
                        <th aria-label="Actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-0">
                            <EmptyState title="No items found" description={search ? `No results for "${search}"` : undefined} />
                          </td>
                        </tr>
                      ) : (
                        paged.map(item => (
                          <tr key={item.id}>
                            <td>
                              <div
                                className={cn('w-2.5 h-2.5 rounded-full mx-auto', stockLevelColor(item))}
                                title={item.qty === 0 ? 'Out of stock' : item.qty <= item.minStock ? 'Low stock' : 'In stock'}
                                aria-label={item.qty === 0 ? 'Out of stock' : item.qty <= item.minStock ? 'Low stock' : 'In stock'}
                              />
                            </td>
                            <td>
                              <div className="font-500 text-slate-800">{item.itemName}</div>
                              <div className="text-2xs text-slate-400">{item.itemType === 'material' ? 'Raw Material' : 'Finished Good'}</div>
                            </td>
                            <td className="font-mono text-xs text-slate-500">{item.itemId}</td>
                            <td>
                              <span className="badge border border-slate-200 bg-slate-50 text-slate-600 text-2xs">
                                {item.warehouseId}
                              </span>
                            </td>
                            <td className={cn(
                              'col-numeric font-700 font-mono',
                              item.qty === 0       ? 'text-error-700' :
                              item.qty <= item.minStock ? 'text-warning-700' : 'text-slate-900'
                            )}>
                              {item.qty.toLocaleString()}
                            </td>
                            <td className="col-numeric font-mono text-slate-500">{item.minStock.toLocaleString()}</td>
                            <td className="text-slate-500 text-xs">{item.unit}</td>
                            <td className="col-numeric font-mono text-slate-600">{formatBDT(item.avgCost)}</td>
                            <td className="col-numeric font-mono font-600 text-slate-900">{formatBDT(item.totalValue)}</td>
                            <td>
                              <button
                                onClick={() => setAdjItem(item.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-500 cursor-pointer transition-colors whitespace-nowrap"
                              >
                                Adjust
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {tPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={tPages}
                    onPageChange={setPage}
                    totalItems={items.length}
                    pageSize={PAGE_SIZE}
                  />
                )}
              </TabPanel>
            );
          })}
        </div>
      </Tabs>

      {/* Stock Adjustment Modal */}
      <Modal
        open={Boolean(adjItem)}
        onClose={() => setAdjItem(null)}
        title={`Adjust Stock — ${selectedAdj?.itemName ?? ''}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAdjItem(null)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={adjSaving}
              disabled={!adjForm.qty}
              onClick={handleAdjustment}
            >
              Apply Adjustment
            </Button>
          </>
        }
      >
        {selectedAdj && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Current Stock</span>
              <span className="font-700 font-mono text-slate-900">{selectedAdj.qty} {selectedAdj.unit}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['add', 'subtract'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setAdjForm(v => ({ ...v, type }))}
                    className={cn(
                      'py-2 px-3 text-sm font-500 rounded-lg border transition-all cursor-pointer',
                      adjForm.type === type
                        ? type === 'add'
                          ? 'bg-success-50 border-success-300 text-success-700'
                          : 'bg-error-50 border-error-300 text-error-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {type === 'add' ? '+ Add Stock' : '− Remove Stock'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="adj-qty">
                Quantity ({selectedAdj.unit})
              </label>
              <input
                id="adj-qty"
                type="number"
                min="1"
                className="form-input text-center font-mono text-lg font-600"
                value={adjForm.qty}
                onChange={e => setAdjForm(v => ({ ...v, qty: e.target.value }))}
                placeholder="0"
              />
              {adjForm.qty && (
                <p className="form-helper text-center">
                  New qty: <strong className="font-mono">
                    {adjForm.type === 'add'
                      ? selectedAdj.qty + parseInt(adjForm.qty)
                      : Math.max(0, selectedAdj.qty - parseInt(adjForm.qty))}
                  </strong> {selectedAdj.unit}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="adj-reason">Reason</label>
              <select
                id="adj-reason"
                className="form-select"
                value={adjForm.reason}
                onChange={e => setAdjForm(v => ({ ...v, reason: e.target.value }))}
              >
                <option value="">Select reason…</option>
                <option value="Physical count correction">Physical count correction</option>
                <option value="Damage / loss">Damage / loss</option>
                <option value="Return from production">Return from production</option>
                <option value="Initial stock entry">Initial stock entry</option>
                <option value="Write-off">Write-off</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
