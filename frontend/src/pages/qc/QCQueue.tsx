// ─────────────────────────────────────────────────────────────
// QC QUEUE — Quality Control inspection workflow
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { ShieldCheck, XCircle, CheckCircle, RotateCcw, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Feedback';
import { KPICard } from '../../components/ui/KPICard';
import { Tabs, TabList, TabTrigger, TabPanel } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { cn, formatDate } from '../../lib/utils';
import type { QCStatus } from '../../types';

export default function QCQueue() {
  const qcRecords       = useAppStore(s => s.qcRecords);
  const updateQCRecord  = useAppStore(s => s.updateQCRecord);
  const addNotification = useAppStore(s => s.addNotification);

  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [inspectForm, setInspectForm] = useState({
    passedQty:  '',
    failedQty:  '0',
    reworkQty:  '0',
    inspectionNotes: '',
    defectCodes: [] as string[],
  });
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  const selected = qcRecords.find(q => q.id === selectedId);

  const pending   = qcRecords.filter(q => q.status === 'pending');
  const passed    = qcRecords.filter(q => q.status === 'passed');
  const failed    = qcRecords.filter(q => q.status === 'failed');
  const rework    = qcRecords.filter(q => q.status === 'rework' || q.status === 'retested');

  const handleInspect = (result: 'pass' | 'fail' | 'rework') => {
    if (!selectedId || !inspectForm.passedQty) return;
    setSaving(true);

    const status: QCStatus =
      result === 'pass' ? 'passed' :
      result === 'fail' ? 'failed' : 'rework';

    setTimeout(() => {
      updateQCRecord(selectedId, {
        status,
        passedQty:        parseInt(inspectForm.passedQty),
        failedQty:        parseInt(inspectForm.failedQty) || 0,
        reworkQty:        parseInt(inspectForm.reworkQty) || 0,
        inspectionNotes:  inspectForm.inspectionNotes,
        inspectedAt:      new Date().toISOString(),
        inspectedBy:      'QC Officer',
        defects:          inspectForm.defectCodes.map(code => ({
          code, description: code, qty: parseInt(inspectForm.failedQty) || 0
        })),
      });

      if (result === 'fail') {
        addNotification({
          type: 'qc_failure',
          priority: 'high',
          title: `QC Failed — ${selected?.productName}`,
          message: `${inspectForm.failedQty} units failed quality inspection. Immediate action required.`,
          isRead: false,
          relatedModule: 'qc',
          relatedId: selectedId,
        });
      }

      setSaving(false);
      setSaved(true);
      setSelectedId(null);
      setInspectForm({ passedQty: '', failedQty: '0', reworkQty: '0', inspectionNotes: '', defectCodes: [] });
      setTimeout(() => setSaved(false), 3000);
    }, 700);
  };

  const DEFECT_CODES = [
    'EL-001 — Wiring fault',
    'EL-002 — Thermostat failure',
    'BO-001 — Body crack',
    'BO-002 — Paint defect',
    'AS-001 — Assembly misalign',
    'AS-002 — Screw missing',
    'HT-001 — Heat coil broken',
    'HT-002 — Uneven heat',
  ];

  const QCCard = ({ qc }: { qc: typeof qcRecords[0] }) => (
    <div
      onClick={() => { if (qc.status === 'pending') setSelectedId(qc.id); }}
      className={cn(
        'p-4 rounded-lg border transition-all duration-150',
        qc.status === 'pending'
          ? 'border-warning-200 bg-warning-50 cursor-pointer hover:border-warning-300 hover:bg-warning-100'
          : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-mono text-xs font-600 text-blue-600">{qc.qcNo}</span>
          {qc.status === 'pending' && (
            <span className="ml-2 text-2xs bg-warning-100 text-warning-700 px-1.5 py-0.5 rounded-full font-600">
              ACTION REQUIRED
            </span>
          )}
        </div>
        <StatusBadge status={qc.status} />
      </div>
      <p className="font-500 text-sm text-slate-800">{qc.productName}</p>
      <p className="text-xs text-slate-400 mt-0.5">{qc.orderNo} · {formatDate(qc.inspectionDate || qc.createdAt)}</p>

      <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <div className="font-700 font-mono text-slate-900">{qc.inspectedQty}</div>
          <div className="text-slate-400 font-500">Inspected</div>
        </div>
        <div>
          <div className="font-700 font-mono text-success-600">{qc.passedQty}</div>
          <div className="text-slate-400 font-500">Passed</div>
        </div>
        <div>
          <div className={cn('font-700 font-mono', qc.failedQty > 0 ? 'text-error-600' : 'text-slate-400')}>{qc.failedQty}</div>
          <div className="text-slate-400 font-500">Failed</div>
        </div>
        <div>
          <div className={cn('font-700 font-mono', qc.reworkQty > 0 ? 'text-warning-600' : 'text-slate-400')}>{qc.reworkQty}</div>
          <div className="text-slate-400 font-500">Rework</div>
        </div>
      </div>

      {qc.status === 'pending' && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">Click to inspect</span>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-700 text-slate-900">Quality Control</h1>
          <p className="text-sm text-slate-500 mt-0.5">Inspect, pass, fail or send to rework</p>
        </div>
      </div>

      {saved && <Alert variant="success">QC inspection saved. Records updated.</Alert>}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Pending Inspection" value={pending.length} alert={pending.length > 0 ? 'warning' : undefined} />
        <KPICard label="Passed"             value={passed.length}  alert="success" />
        <KPICard label="Failed"             value={failed.length}  alert={failed.length > 0 ? 'error' : undefined} />
        <KPICard label="In Rework"          value={rework.length} />
      </div>

      {/* QC Queue */}
      <Tabs defaultTab="pending">
        <TabList>
          <TabTrigger id="pending" count={pending.length}>Pending</TabTrigger>
          <TabTrigger id="passed"  count={passed.length}>Passed</TabTrigger>
          <TabTrigger id="failed"  count={failed.length}>Failed</TabTrigger>
          <TabTrigger id="rework"  count={rework.length}>Rework</TabTrigger>
        </TabList>

        <div className="mt-4 space-y-3">
          <TabPanel id="pending">
            {pending.length === 0 ? (
              <div className="card p-8 text-center">
                <ShieldCheck className="w-10 h-10 text-success-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-slate-500 font-500">All inspections complete</p>
                <p className="text-xs text-slate-400 mt-1">No pending QC items at this time.</p>
              </div>
            ) : (
              pending.map(qc => <QCCard key={qc.id} qc={qc} />)
            )}
          </TabPanel>
          <TabPanel id="passed">{passed.map(qc => <QCCard key={qc.id} qc={qc} />)}</TabPanel>
          <TabPanel id="failed">{failed.map(qc => <QCCard key={qc.id} qc={qc} />)}</TabPanel>
          <TabPanel id="rework">{rework.map(qc => <QCCard key={qc.id} qc={qc} />)}</TabPanel>
        </div>
      </Tabs>

      {/* Inspect Modal */}
      <Modal
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={`QC Inspection — ${selected?.qcNo}`}
        size="md"
        footer={
          <div className="flex items-center gap-2 w-full">
            <Button variant="danger"   size="sm" loading={saving} onClick={() => handleInspect('fail')}
              leftIcon={<XCircle className="w-3.5 h-3.5" />}>
              Reject
            </Button>
            <Button variant="warning"  size="sm" loading={saving} onClick={() => handleInspect('rework')}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Send to Rework
            </Button>
            <div className="flex-1" />
            <Button variant="success"  size="sm" loading={saving}
              disabled={!inspectForm.passedQty}
              onClick={() => handleInspect('pass')}
              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}>
              Pass Inspection
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-600 text-slate-800">{selected.productName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{selected.orderNo} · Batch: {selected.batchNo}</p>
              <div className="mt-2 text-sm">
                <span className="text-slate-500">Total to inspect: </span>
                <span className="font-700 font-mono text-slate-900">{selected.inspectedQty} pcs</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'qc-passed', label: 'Passed',   key: 'passedQty',  color: 'text-success-700', required: true },
                { id: 'qc-failed', label: 'Failed',   key: 'failedQty',  color: 'text-error-700',   required: false },
                { id: 'qc-rework', label: 'Rework',   key: 'reworkQty',  color: 'text-warning-700', required: false },
              ].map(field => (
                <div key={field.key} className="form-group">
                  <label className={cn('form-label', field.required && 'form-label-required')} htmlFor={field.id}>
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    type="number"
                    min="0"
                    max={selected.inspectedQty}
                    className={cn('form-input font-mono text-center font-600', field.color)}
                    value={inspectForm[field.key as keyof typeof inspectForm] as string}
                    onChange={e => setInspectForm(v => ({ ...v, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            {/* Defect codes */}
            <div className="form-group">
              <label className="form-label">Defect Codes</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                {DEFECT_CODES.map(code => (
                  <label key={code} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={inspectForm.defectCodes.includes(code)}
                      onChange={e => {
                        setInspectForm(v => ({
                          ...v,
                          defectCodes: e.target.checked
                            ? [...v.defectCodes, code]
                            : v.defectCodes.filter(c => c !== code),
                        }));
                      }}
                      className="w-3 h-3"
                    />
                    {code}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="qc-notes">Inspection Notes</label>
              <textarea
                id="qc-notes"
                className="form-textarea"
                placeholder="Describe findings, issues, observations…"
                value={inspectForm.inspectionNotes}
                onChange={e => setInspectForm(v => ({ ...v, inspectionNotes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
