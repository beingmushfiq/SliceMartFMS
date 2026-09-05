import React from 'react';
import { Link } from 'react-router-dom';
import {
  Microscope,
  ClipboardCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sliders,
} from 'lucide-react';

export interface QcItem {
  id: string;
  orderNo: string;
  product: string;
  qty: number;
  status: string;
  failed?: number;
  rework?: number;
}

interface QcDashboardViewProps {
  qcList: QcItem[];
  onOpenQC: (item: QcItem) => void;
}

export const QcDashboardView: React.FC<QcDashboardViewProps> = ({ qcList, onOpenQC }) => {
  const parameters = [
    { name: 'Electrical Insulation & Earth Resistance', spec: '> 10 MΩ @ 500V', passRate: 100, samples: 48, status: 'PASSED' },
    { name: 'Thermal Cutoff & Heat Regulation (Bi-metal)', spec: '320°C ± 5°C', passRate: 97.5, samples: 48, status: 'PASSED' },
    { name: 'Toughened Glass Impact Resistance (30cm)', spec: 'Drop Test 500g @ 1m', passRate: 98.2, samples: 25, status: 'PASSED' },
    { name: 'Chassis Dimension & Screw Torque', spec: '2.5 N·m ± 0.2', passRate: 100, samples: 48, status: 'PASSED' },
    { name: 'Carton Packaging & Barcode Scannability', spec: 'GS1-128 Compliance', passRate: 99.1, samples: 48, status: 'PASSED' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & QC GREETING
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-default font-sans">
              Quality Assurance & Testing
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Standards ISO-9001
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Incoming material testing, in-process inspection & final batch quality sign-off
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/qc"
            className="flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-all shadow-2xs"
          >
            <Sliders className="size-3.5 text-muted" />
            <span>Parameters</span>
          </Link>
          <button
            type="button"
            disabled={!qcList[0]}
            onClick={() => {
              if (qcList[0]) onOpenQC(qcList[0]);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:from-cyan-500 hover:to-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardCheck className="size-3.5" />
            <span>Audit Active Batch</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 6-KPI QUALITY STRIP
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: Inspections Pending */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              PENDING AUDIT
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ClipboardCheck className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-500">
              1 Batch
            </div>
            <span className="text-[10px] font-semibold text-muted">
              PO-00125 • 48 pcs
            </span>
          </div>
        </div>

        {/* KPI 2: Passed Today */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              PASSED TODAY
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              40 pcs
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              PO-00124 Certified
            </span>
          </div>
        </div>

        {/* KPI 3: Defect Rate */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              DEFECT RATE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Microscope className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              2.5%
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Within 3% Target
            </span>
          </div>
        </div>

        {/* KPI 4: Rework in Queue */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              REWORK UNITS
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <RotateCcw className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              3 pcs
            </div>
            <span className="text-[10px] font-semibold text-muted">
              Thermal Calibration
            </span>
          </div>
        </div>

        {/* KPI 5: Wastage Recorded */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              SCRAP / WASTAGE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <XCircle className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              1 pc
            </div>
            <span className="text-[10px] font-semibold text-red-500">
              Toughened Glass Crack
            </span>
          </div>
        </div>

        {/* KPI 6: Overall Quality Compliance */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              QUALITY SCORE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              98.4%
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Grade A Factory Standard
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. INSPECTION QUEUE & PARAMETER COMPLIANCE MATRIX
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Inspection Queue */}
        <div className="lg:col-span-2 rounded-2xl border border-default bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-default">Batch Inspection Queue</h3>
              <p className="text-[11px] text-muted">Awaiting quality engineer sign-off before warehouse transfer</p>
            </div>
            <span className="rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold">
              3 Batches
            </span>
          </div>

          <div className="divide-y divide-default">
            {qcList.map((item) => {
              const isPending = item.status === 'PENDING';
              return (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-surface-sunken/40 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-default">{item.product}</span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          isPending
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted font-mono">
                      <span>Ref: {item.id}</span>
                      <span>•</span>
                      <span>Batch: {item.orderNo}</span>
                      <span>•</span>
                      <span>Qty: <strong>{item.qty} pcs</strong></span>
                      {item.failed && <span className="text-red-500">({item.failed} failed)</span>}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenQC(item)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                        isPending
                          ? 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-500/20'
                          : 'border border-default bg-surface text-default hover:bg-surface-sunken'
                      }`}
                    >
                      <ClipboardCheck className="size-3.5" />
                      <span>{isPending ? 'Audit Now' : 'View Audit'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            to="/qc"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-3 border-t border-default"
          >
            <span>Open Complete Quality Control Workspace</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Parameter Testing Compliance Matrix */}
        <div className="rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-default pb-2">
              <h3 className="text-sm font-bold text-default">Parameter Compliance</h3>
              <span className="text-[10px] text-muted uppercase font-semibold">Today's Tests</span>
            </div>

            <div className="space-y-3.5">
              {parameters.map((param) => (
                <div key={param.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-default truncate max-w-45">{param.name}</span>
                    <span className="font-mono text-emerald-500 font-bold">{param.passRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>Spec: {param.spec}</span>
                    <span>{param.samples} samples</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${param.passRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/qc"
            className="mt-4 flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-2 border-t border-default"
          >
            <span>Configure QC Checklists</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
