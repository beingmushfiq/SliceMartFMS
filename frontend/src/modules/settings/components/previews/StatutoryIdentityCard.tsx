import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  ReceiptText,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

interface StatutoryIdentityCardProps {
  companyLegalName?: string;
  tradeLicenseNo?: string;
  taxIdentificationNumber?: string;
  rjscRegistrationNo?: string;
  factoryLicenseNo?: string;
  binBranchCode?: string;
}

export const StatutoryIdentityCard: React.FC<StatutoryIdentityCardProps> = ({
  companyLegalName = '',
  tradeLicenseNo = '',
  taxIdentificationNumber = '',
  rjscRegistrationNo = '',
  factoryLicenseNo = '',
  binBranchCode = '',
}) => {
  const [viewMode, setViewMode] = useState<'certificate' | 'masthead'>('certificate');

  const displayName = companyLegalName.trim() || 'ACME Industrial Corporation Ltd.';
  const cleanBin = (taxIdentificationNumber || '').replace(/\D/g, '');
  const isBin13Digit = cleanBin.length === 13;
  const binStatus = isBin13Digit ? 'valid' : cleanBin.length > 0 ? 'invalid' : 'empty';

  return (
    <div className="rounded-xl border border-default bg-surface-sunken/60 overflow-hidden space-y-0 transition-all">
      {/* Simulator Top Bar */}
      <div className="px-4 py-3 bg-surface border-b border-default flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-default block">
              Live Statutory Compliance Simulator
            </span>
            <span className="text-2xs text-muted block">
              Real-time visualization of regulatory registrations and official document headers
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-surface-sunken border border-default">
          <Button
            type="button"
            variant={viewMode === 'certificate' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('certificate')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            <ShieldCheck className="size-3 mr-1" />
            Statutory Certificate
          </Button>
          <Button
            type="button"
            variant={viewMode === 'masthead' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('masthead')}
            className="text-2xs px-2.5 py-1 h-auto"
          >
            <ReceiptText className="size-3 mr-1" />
            VAT 6.3 Masthead
          </Button>
        </div>
      </div>

      {/* Simulator Content Area */}
      <div className="p-4">
        {viewMode === 'certificate' ? (
          /* Certificate View */
          <div className="relative rounded-xl border-2 border-primary/20 bg-linear-to-br from-surface via-surface to-primary-subtle/10 p-4 sm:p-5 shadow-xs overflow-hidden">
            {/* Watermark seal */}
            <div className="absolute -right-6 -bottom-6 size-36 rounded-full border-8 border-primary/5 flex items-center justify-center pointer-events-none">
              <Landmark className="size-16 text-primary/5" />
            </div>

            <div className="relative z-10 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-default pb-3">
                <div className="space-y-0.5">
                  <span className="text-2xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Building2 className="size-3" />
                    Government of Bangladesh &middot; Statutory Domicile
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-default tracking-tight">
                    {displayName}
                  </h4>
                </div>
                <Badge
                  tone={
                    binStatus === 'valid'
                      ? 'success-subtle'
                      : binStatus === 'invalid'
                      ? 'warning-subtle'
                      : 'surface-sunken'
                  }
                  className="shrink-0 text-2xs"
                >
                  {binStatus === 'valid' ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> NBR 13-Digit Compliant
                    </span>
                  ) : binStatus === 'invalid' ? (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="size-3" /> BIN: {cleanBin.length}/13 Digits
                    </span>
                  ) : (
                    'Pending Regulatory Data'
                  )}
                </Badge>
              </div>

              {/* Statutory Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-surface border border-default space-y-1">
                  <span className="text-2xs text-muted block">NBR BIN / VAT Reg.</span>
                  <span className="font-mono text-xs font-bold text-default block truncate">
                    {taxIdentificationNumber || '—'}
                  </span>
                  <span className="text-2xs text-muted block truncate">
                    Branch: {binBranchCode || '0000'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface border border-default space-y-1">
                  <span className="text-2xs text-muted block">Trade License</span>
                  <span className="font-mono text-xs font-bold text-default block truncate">
                    {tradeLicenseNo || '—'}
                  </span>
                  <span className="text-2xs text-success flex items-center gap-1">
                    <FileCheck2 className="size-2.5" /> City Corporation
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface border border-default space-y-1">
                  <span className="text-2xs text-muted block">RJSC Incorporation</span>
                  <span className="font-mono text-xs font-bold text-default block truncate">
                    {rjscRegistrationNo || '—'}
                  </span>
                  <span className="text-2xs text-muted block truncate">Registrar of Joint Stock</span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface border border-default space-y-1">
                  <span className="text-2xs text-muted block">DIFE Factory License</span>
                  <span className="font-mono text-xs font-bold text-default block truncate">
                    {factoryLicenseNo || '—'}
                  </span>
                  <span className="text-2xs text-muted block truncate">Dept. of Inspection</span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface border border-default space-y-1 col-span-2 sm:col-span-2">
                  <span className="text-2xs text-muted block">Statutory Audit Standing</span>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-success animate-pulse" />
                    <span className="text-2xs font-medium text-default">
                      Active Manufacturing &amp; Commercial Entity
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Invoice Masthead View */
          <div className="rounded-xl border border-default bg-surface p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-default pb-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted">
                Official Commercial Invoice Header (Form VAT-6.3)
              </span>
              <span className="text-2xs font-mono text-muted">NBR Approved Specimen</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-1">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-default tracking-tight">
                  {displayName}
                </h4>
                <div className="font-mono text-2xs text-muted space-y-0.5">
                  <p>
                    <strong className="font-sans font-semibold text-default">BIN:</strong>{' '}
                    {taxIdentificationNumber || '000000000-0000'} |{' '}
                    <strong className="font-sans font-semibold text-default">Branch:</strong>{' '}
                    {binBranchCode || '0000'}
                  </p>
                  <p>
                    <strong className="font-sans font-semibold text-default">Trade Lic:</strong>{' '}
                    {tradeLicenseNo || 'TRAD/DSCC/000000/2026'} |{' '}
                    <strong className="font-sans font-semibold text-default">RJSC:</strong>{' '}
                    {rjscRegistrationNo || 'C-000000/2026'}
                  </p>
                  {factoryLicenseNo && (
                    <p>
                      <strong className="font-sans font-semibold text-default">DIFE Reg:</strong>{' '}
                      {factoryLicenseNo}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-dashed border-default bg-surface-sunken shrink-0 text-right space-y-0.5">
                <span className="text-2xs font-bold text-primary block uppercase tracking-wider">
                  Mushak 6.3
                </span>
                <span className="font-mono text-2xs text-muted block">Original Document</span>
                <span className="text-2xs text-success block font-medium">Auto-Stamped</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
