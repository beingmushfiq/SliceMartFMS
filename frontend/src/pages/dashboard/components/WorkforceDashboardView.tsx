import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  Receipt,
  Award,
  ArrowRight,
  UserCheck,
  Calendar,
  Briefcase,
} from 'lucide-react';

interface WorkerItem {
  initials: string;
  name: string;
  output: string;
  rate: number;
  badge: string;
  color: string;
  department?: string;
  shift?: string;
}

interface WorkforceDashboardViewProps {
  onOpenWorker?: (worker: WorkerItem) => void;
}

export const WorkforceDashboardView: React.FC<WorkforceDashboardViewProps> = ({ onOpenWorker }) => {
  const workers: WorkerItem[] = [
    {
      initials: 'MA',
      name: 'Abdur Rahman',
      department: 'Assembly Line 1',
      output: '125k pcs',
      rate: 94,
      badge: 'Senior Master',
      color: 'bg-emerald-500',
      shift: 'Morning Shift',
    },
    {
      initials: 'MK',
      name: 'Karim Ullah',
      department: 'Line 2 — Wiring',
      output: '92k pcs',
      rate: 89,
      badge: 'Production Tech',
      color: 'bg-amber-500',
      shift: 'Morning Shift',
    },
    {
      initials: 'RB',
      name: 'Begum Rokeya',
      department: 'Packaging & Seal',
      output: '105k pcs',
      rate: 81,
      badge: 'Assembly Lead',
      color: 'bg-orange-500',
      shift: 'Morning Shift',
    },
    {
      initials: 'SH',
      name: 'Shahidul Islam',
      department: 'QC Inspection',
      output: '88k pcs',
      rate: 96,
      badge: 'QA Specialist',
      color: 'bg-teal-500',
      shift: 'Morning Shift',
    },
  ];

  const departmentDistribution = [
    { name: 'Factory Production Floor', count: 18, percent: 56, color: 'bg-indigo-500' },
    { name: 'Warehouse & Storekeeping', count: 5, percent: 16, color: 'bg-amber-500' },
    { name: 'Quality Control & Testing', count: 4, percent: 12, color: 'bg-cyan-500' },
    { name: 'Commercial, Retail & POS', count: 5, percent: 16, color: 'bg-blue-500' },
  ];

  const recentClockIns = [
    { name: 'Abdur Rahman', time: '07:48 AM', status: 'ON TIME', line: 'Line 01' },
    { name: 'Begum Rokeya', time: '07:52 AM', status: 'ON TIME', line: 'Packaging' },
    { name: 'Karim Ullah', time: '08:04 AM', status: 'LATE (4m)', line: 'Line 02' },
    { name: 'Shahidul Islam', time: '07:45 AM', status: 'ON TIME', line: 'QC Station' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & GREETING
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-default pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-default font-sans">
              Workforce & HR Command
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Morning Shift Operating (24/32 Clocked-In)
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Factory employee rosters, biometric attendance, piece-rate productivity & monthly payroll
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/hr?tab=attendance"
            className="flex items-center gap-1.5 rounded-xl border border-default bg-surface px-3 py-2 text-xs font-semibold text-default hover:bg-surface-sunken transition-all shadow-2xs"
          >
            <Clock className="size-3.5 text-muted" />
            <span>Attendance Log</span>
          </Link>
          <Link
            to="/hr?tab=employees"
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:from-blue-500 hover:to-indigo-500 transition-all"
          >
            <Users className="size-3.5" />
            <span>Staff Directory</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 6-KPI WORKFORCE STRIP
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: Total Headcount */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              TOTAL PERSONNEL
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              32 Staff
            </div>
            <span className="text-[10px] font-semibold text-muted">
              4 Departments
            </span>
          </div>
        </div>

        {/* KPI 2: Present Today */}
        <div className="rounded-2xl border-y border-r border-default border-l-4 border-l-emerald-500 bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              PRESENT TODAY
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <UserCheck className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              24 Clocked-In
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              75% Attendance Rate
            </span>
          </div>
        </div>

        {/* KPI 3: On Leave */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              ON LEAVE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              4 Staff
            </div>
            <span className="text-[10px] font-semibold text-muted">
              Approved Requests
            </span>
          </div>
        </div>

        {/* KPI 4: Shift Compliance */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              ON-TIME PUNCTUALITY
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              96%
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              1 Late Clock-In Today
            </span>
          </div>
        </div>

        {/* KPI 5: Top Rate Output */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              TOP PIECE RATE
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Award className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              125k pcs
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              Abdur Rahman (94%)
            </span>
          </div>
        </div>

        {/* KPI 6: Monthly Payroll */}
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              EST. PAYROLL
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Receipt className="size-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-default">
              ৳ 485k
            </div>
            <span className="text-[10px] font-semibold text-muted">
              August Cycle Open
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DEPARTMENT DISTRIBUTION & RECENT CLOCK-INS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Worker Performance Leaderboard */}
        <div className="lg:col-span-7 rounded-2xl border border-default bg-surface p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-default pb-3">
            <div>
              <h3 className="text-sm font-bold text-default">Worker Performance & Piece-Rate Ranking</h3>
              <p className="text-[11px] text-muted">Factory floor operator yields and efficiency rates</p>
            </div>
            <Link
              to="/hr?tab=performance"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {workers.map((w) => (
              <button
                type="button"
                key={w.name}
                onClick={() => onOpenWorker?.(w)}
                className="w-full text-left group rounded-xl border border-transparent hover:border-default hover:bg-surface-sunken/40 p-3 -mx-2 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-surface-sunken font-bold text-xs text-default border border-default">
                      {w.initials}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-default group-hover:text-primary transition-colors">
                        {w.name}
                      </span>
                      <span className="block text-[10px] text-muted">{w.department} • {w.shift}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-default">{w.rate}% Efficiency</span>
                    <span className="block text-[10px] font-mono text-muted">{w.output}</span>
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                  <div
                    className={`h-full rounded-full ${w.color}`}
                    style={{ width: `${w.rate}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right (5 cols): Department Headcount & Morning Clock-in */}
        <div className="lg:col-span-5 rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-default pb-3">
              <h3 className="text-sm font-bold text-default">Department Headcount</h3>
              <Briefcase className="size-4 text-muted" />
            </div>

            <div className="mt-3.5 space-y-2.5">
              {departmentDistribution.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-default font-medium truncate">{d.name}</span>
                    <span className="font-mono font-bold text-default">{d.count} staff</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                    <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-default">
              <h4 className="text-xs font-bold text-default mb-2">Morning Shift Clock-Ins</h4>
              <div className="space-y-1.5">
                {recentClockIns.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-surface-sunken/40">
                    <div>
                      <span className="font-semibold text-default">{item.name}</span>
                      <span className="text-[10px] text-muted block">{item.line}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-default font-semibold">{item.time}</span>
                      <span
                        className={`block text-[9px] font-bold ${
                          item.status.includes('LATE') ? 'text-amber-500' : 'text-emerald-500'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link
            to="/hr?tab=attendance"
            className="flex items-center justify-between text-xs font-semibold text-primary hover:underline pt-3 border-t border-default"
          >
            <span>Open Attendance Manager</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
