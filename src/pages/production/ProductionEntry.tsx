// ─────────────────────────────────────────────────────────────
// PRODUCTION ENTRY — Fast daily production logging
// Optimized for speed — minimum clicks
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { CheckCircle, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Feedback';
import { calcPct, formatDate, cn } from '../../lib/utils';
import { QuickAddEmployeeModal, QuickAddButton } from '../../components/modals/QuickEntryModals';

export default function ProductionEntry() {
  const productionOrders       = useAppStore(s => s.productionOrders);
  const updateProductionOrder  = useAppStore(s => s.updateProductionOrder);
  const employees              = useAppStore(s => s.employees);

  // Today's active orders
  const todayOrders = productionOrders.filter(
    po => po.status === 'in_production' || po.status === 'ready' || po.status === 'qc_pending'
  );

  const [selectedOrderId, setSelectedOrderId] = useState(todayOrders[0]?.id ?? '');
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [entryForm, setEntryForm] = useState({
    employeeId: '',
    targetQty:  '',
    producedQty: '',
    defectiveQty: '0',
    reworkQty:  '0',
    notes: '',
  });
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  const selectedOrder = productionOrders.find(po => po.id === selectedOrderId);

  const handleSave = () => {
    if (!selectedOrderId || !entryForm.employeeId || !entryForm.producedQty) {
      setError('Please select an order, employee, and enter produced quantity.');
      return;
    }
    setError('');
    setSaving(true);

    setTimeout(() => {
      if (selectedOrder) {
        const produced   = parseInt(entryForm.producedQty) || 0;
        const defective  = parseInt(entryForm.defectiveQty) || 0;
        const rework     = parseInt(entryForm.reworkQty) || 0;
        updateProductionOrder(selectedOrderId, {
          producedQty: selectedOrder.producedQty + produced,
          failedQty:   selectedOrder.failedQty   + defective,
          reworkQty:   selectedOrder.reworkQty   + rework,
          status: produced > 0 ? 'in_production' : selectedOrder.status,
        });
      }
      setSaving(false);
      setSaved(true);
      setEntryForm(v => ({ ...v, producedQty: '', defectiveQty: '0', reworkQty: '0', notes: '' }));
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  const produced   = parseInt(entryForm.producedQty) || 0;
  const defective  = parseInt(entryForm.defectiveQty) || 0;
  const rework     = parseInt(entryForm.reworkQty) || 0;
  const target     = parseInt(entryForm.targetQty) || selectedOrder?.targetQty || 0;
  const achievement = calcPct(produced, target);

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-700 text-slate-900">Production Entry</h1>
        <p className="text-sm text-slate-500 mt-0.5">Log daily production — fast entry for floor workers</p>
      </div>

      {saved && (
        <Alert variant="success" className="mb-4">
          <strong>Entry saved successfully.</strong> Stock and performance records updated.
        </Alert>
      )}
      {error && (
        <Alert variant="error" className="mb-4">{error}</Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Order selector */}
        <div className="space-y-3">
          <h2 className="section-title">Select Order</h2>
          {todayOrders.length === 0 ? (
            <div className="card p-5 text-center">
              <p className="text-sm text-slate-400">No active orders today</p>
            </div>
          ) : (
            todayOrders.map(po => (
              <button
                key={po.id}
                onClick={() => setSelectedOrderId(po.id)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border transition-all duration-150 cursor-pointer',
                  selectedOrderId === po.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-600 text-blue-600">{po.orderNo}</span>
                  <StatusBadge status={po.status} />
                </div>
                <p className="font-500 text-sm text-slate-800">{po.model}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{po.productName}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Produced</span>
                  <span className="font-mono font-600 text-slate-900">{po.producedQty} / {po.targetQty}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right — Entry form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="section-title">
                  {selectedOrder ? `${selectedOrder.orderNo} — ${selectedOrder.model}` : 'Entry Form'}
                </h2>
                {selectedOrder && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target: {selectedOrder.targetQty} pcs · Date: {formatDate(selectedOrder.productionDate)}
                  </p>
                )}
              </div>
            </div>

            <div className="card-body space-y-5">
              {/* Employee */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label form-label-required" htmlFor="entry-emp">
                    <Users className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                    Employee / Worker
                  </label>
                  <QuickAddButton label="Worker" onClick={() => setShowAddEmp(true)} />
                </div>
                <select
                  id="entry-emp"
                  className="form-select"
                  value={entryForm.employeeId}
                  onChange={e => setEntryForm(v => ({ ...v, employeeId: e.target.value }))}
                >
                  <option value="">Select employee…</option>
                  {employees.filter(e => e.department === 'Production' && e.status === 'active').map(e => (
                    <option key={e.id} value={e.id}>{e.name} — {e.designation}</option>
                  ))}
                </select>
              </div>

              {/* Quantities — big, easy to tap */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="entry-target">
                    Target (pcs)
                  </label>
                  <input
                    id="entry-target"
                    type="number"
                    min="0"
                    className="form-input text-lg font-600 font-mono text-center"
                    value={entryForm.targetQty || selectedOrder?.targetQty || ''}
                    onChange={e => setEntryForm(v => ({ ...v, targetQty: e.target.value }))}
                    placeholder="50"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="entry-produced">
                    Produced (pcs)
                  </label>
                  <input
                    id="entry-produced"
                    type="number"
                    min="0"
                    className="form-input text-2xl font-700 font-mono text-center border-2 border-blue-300 focus:border-blue-500"
                    value={entryForm.producedQty}
                    onChange={e => setEntryForm(v => ({ ...v, producedQty: e.target.value }))}
                    placeholder="48"
                    autoFocus
                  />
                  {produced > 0 && target > 0 && (
                    <p className="form-helper text-center font-600">
                      <span className={cn(
                        achievement >= 90 ? 'text-success-600' :
                        achievement >= 70 ? 'text-warning-600' : 'text-error-600'
                      )}>
                        {achievement}% achievement
                      </span>
                    </p>
                  )}
                </div>

                <div className="grid grid-rows-2 gap-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="entry-defective">Defective</label>
                    <input
                      id="entry-defective"
                      type="number"
                      min="0"
                      className="form-input font-mono text-center text-error-700"
                      value={entryForm.defectiveQty}
                      onChange={e => setEntryForm(v => ({ ...v, defectiveQty: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="entry-rework">Rework</label>
                    <input
                      id="entry-rework"
                      type="number"
                      min="0"
                      className="form-input font-mono text-center text-warning-700"
                      value={entryForm.reworkQty}
                      onChange={e => setEntryForm(v => ({ ...v, reworkQty: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Live preview */}
              {produced > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-700 font-mono text-slate-900">{produced}</div>
                    <div className="text-2xs text-slate-400 font-600 uppercase tracking-wide">Produced</div>
                  </div>
                  <div>
                    <div className="text-2xl font-700 font-mono text-error-600">{defective}</div>
                    <div className="text-2xs text-slate-400 font-600 uppercase tracking-wide">Defective</div>
                  </div>
                  <div>
                    <div className="text-2xl font-700 font-mono text-warning-600">{rework}</div>
                    <div className="text-2xs text-slate-400 font-600 uppercase tracking-wide">Rework</div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="form-group">
                <label className="form-label" htmlFor="entry-notes">Notes (optional)</label>
                <textarea
                  id="entry-notes"
                  className="form-textarea"
                  placeholder="Any issues, delays or observations…"
                  value={entryForm.notes}
                  onChange={e => setEntryForm(v => ({ ...v, notes: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Save */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={saving}
                onClick={handleSave}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Save Production Entry
              </Button>

              <p className="text-xs text-slate-400 text-center">
                After saving: inventory, employee performance, and QC queue will be updated automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Employee Modal */}
      <QuickAddEmployeeModal
        isOpen={showAddEmp}
        onClose={() => setShowAddEmp(false)}
        onCreated={(emp) => setEntryForm(v => ({ ...v, employeeId: emp.id }))}
      />
    </div>
  );
}
