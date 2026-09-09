import React from 'react';
import {
  Users,
  Sparkles,
  Landmark,
  Calendar,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

interface PayrollShiftSimulatorProps {
  standardWorkingDays?: number | string;
  dailyStandardWorkHours?: number | string;
  overtimeRateMultiplier?: number | string;
  shiftAttendanceGraceMins?: number | string;
  monthlyDisbursementDay?: number | string;
  providentFundPercent?: number | string;
}

export const PayrollShiftSimulator: React.FC<PayrollShiftSimulatorProps> = ({
  standardWorkingDays = 6,
  dailyStandardWorkHours = 8,
  overtimeRateMultiplier = 1.5,
  shiftAttendanceGraceMins = 15,
  monthlyDisbursementDay = 5,
  providentFundPercent = 8,
}) => {
  const days = Number(standardWorkingDays) || 6;
  const hours = Number(dailyStandardWorkHours) || 8;
  const weeklyHours = days * hours;
  const ot = Number(overtimeRateMultiplier) || 1.5;
  const grace = Number(shiftAttendanceGraceMins) || 15;
  const pf = Number(providentFundPercent) || 8;

  return (
    <div className="rounded-xl border border-default bg-surface-sunken/60 overflow-hidden space-y-0 transition-all">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-surface border-b border-default flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-default block">
              Shift Attendance &amp; Payroll Compensation Simulator
            </span>
            <span className="text-2xs text-muted block">
              Bangladesh Labor Act 2006 shift hours, overtime calculations, and provident fund disbursement cycles
            </span>
          </div>
        </div>

        <Badge tone="primary-subtle" className="text-2xs">
          BD Labor Act Compliant
        </Badge>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* Working Hours & Shift Card */}
        <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Users className="size-3 text-primary" /> Shift Schedule &amp; Overtime Formula
            </span>
            <span className="text-2xs font-mono text-muted">Weekly Base: {weeklyHours} Hrs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Daily Standard</span>
              <span className="font-mono text-sm font-bold text-default block">
                {hours} Hours / Day
              </span>
              <span className="text-2xs text-muted block">{days} Days / Week</span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Overtime Pay Rate</span>
              <span className="font-mono text-sm font-bold text-primary block">
                {ot}x Base Hourly
              </span>
              <span className="text-2xs text-muted block">Statutory Double Rate for Holidays</span>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-sunken border border-default space-y-0.5">
              <span className="text-2xs text-muted block">Biometric Grace Window</span>
              <span className="font-mono text-sm font-bold text-success block">
                +{grace} Mins Late Buffer
              </span>
              <span className="text-2xs text-muted block">Grace before half-day deduction</span>
            </div>
          </div>
        </div>

        {/* Disbursement & Provident Fund Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-2xs text-muted block uppercase tracking-wider font-medium">
              Monthly Salary Payout Gate
            </span>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" />
              <span className="text-xs font-bold text-default">
                Day {monthlyDisbursementDay} of Every Month
              </span>
            </div>
            <span className="text-2xs text-muted block">
              Automated bank transfer advice generated on day {monthlyDisbursementDay}.
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-2xs text-muted block uppercase tracking-wider font-medium">
              Provident Fund Deductions
            </span>
            <div className="flex items-center gap-1.5">
              <Landmark className="size-3.5 text-success" />
              <span className="text-xs font-bold text-default">
                {pf}% Employee + {pf}% Employer Match
              </span>
            </div>
            <span className="text-2xs text-muted block">
              Direct automatic ledger posting into Trustee Account #20410.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
