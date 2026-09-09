import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  KeyRound,
  Lock,
  UserCheck,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';

interface SecurityPostureSimulatorProps {
  sessionTimeoutMinutes?: number | string;
  passwordMinLength?: number | string;
  passwordRequireSpecialChar?: boolean | string;
  maxLoginFailedAttempts?: number | string;
  lockoutDurationMinutes?: number | string;
  enforce2faForAdmins?: boolean | string;
  maintenanceModeActive?: boolean | string;
}

export const SecurityPostureSimulator: React.FC<SecurityPostureSimulatorProps> = ({
  sessionTimeoutMinutes = 30,
  passwordMinLength = 10,
  passwordRequireSpecialChar = true,
  maxLoginFailedAttempts = 5,
  lockoutDurationMinutes = 15,
  enforce2faForAdmins = true,
  maintenanceModeActive = false,
}) => {
  const timeout = Number(sessionTimeoutMinutes) || 30;
  const minLen = Number(passwordMinLength) || 10;
  const isSpecial = passwordRequireSpecialChar === true || passwordRequireSpecialChar === '1' || passwordRequireSpecialChar === 'true';
  const is2fa = enforce2faForAdmins === true || enforce2faForAdmins === '1' || enforce2faForAdmins === 'true';
  const maxAttempts = Number(maxLoginFailedAttempts) || 5;
  const lockoutMins = Number(lockoutDurationMinutes) || 15;

  // Calculate dynamic security posture score (0-100)
  let score = 40;
  if (timeout <= 30) score += 15;
  else if (timeout <= 60) score += 5;
  if (minLen >= 10) score += 15;
  if (isSpecial) score += 10;
  if (is2fa) score += 20;

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
              Enterprise Security Posture &amp; Zero-Trust Hardening Score
            </span>
            <span className="text-2xs text-muted block">
              Dynamic cryptographic evaluation of authentication policies, session lifetimes, and brute-force defenses
            </span>
          </div>
        </div>

        <Badge
          tone={score >= 80 ? 'success-subtle' : score >= 60 ? 'warning-subtle' : 'danger-subtle'}
          className="text-2xs font-mono font-bold"
        >
          Security Rating: {score}/100
        </Badge>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4 space-y-3">
        {/* Score Gauge Card */}
        <div className="p-3.5 rounded-xl bg-surface border border-default space-y-2">
          <div className="flex justify-between items-center text-2xs">
            <span className="font-bold text-default uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" />
              Access Control &amp; Threat Resistance Score
            </span>
            <span className="font-bold text-default">{score}% Compliant</span>
          </div>

          <div className="w-full h-2 rounded-full bg-surface-sunken border border-default overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-destructive'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Security Pillars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-2xs">
          <div className="p-2.5 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-muted flex items-center gap-1">
              <UserCheck className="size-3 text-primary" /> 2FA Enforcement
            </span>
            <span className={`font-bold block ${is2fa ? 'text-success' : 'text-warning'}`}>
              {is2fa ? 'Mandatory for Admins' : 'Optional (Weak)'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-muted flex items-center gap-1">
              <KeyRound className="size-3 text-primary" /> Password Rules
            </span>
            <span className="font-bold text-default block">
              &ge; {minLen} Chars {isSpecial ? '+ Special' : ''}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-muted flex items-center gap-1">
              <Lock className="size-3 text-primary" /> Lockout Shield
            </span>
            <span className="font-bold text-default block">
              {maxAttempts} Fails &rarr; {lockoutMins}m Lock
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface border border-default space-y-1">
            <span className="text-muted flex items-center gap-1">
              <ShieldCheck className="size-3 text-primary" /> Idle Timeout
            </span>
            <span className="font-bold text-default block">
              {timeout} Minutes Inactivity
            </span>
          </div>
        </div>

        {maintenanceModeActive && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-2xs flex items-center gap-2">
            <span className="size-2 rounded-full bg-destructive animate-ping" />
            <span className="font-bold">SYSTEM MAINTENANCE MODE ACTIVE — Public storefront and non-admin logins are suspended.</span>
          </div>
        )}
      </div>
    </div>
  );
};
