import React from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
  const isImpersonating = localStorage.getItem('is_impersonating') === 'true';
  const tenantName = localStorage.getItem('impersonated_tenant_name') || 'Tenant';
  const tenantId = localStorage.getItem('impersonated_tenant_id');

  if (!isImpersonating) return null;

  const handleExit = () => {
    localStorage.removeItem('is_impersonating');
    localStorage.removeItem('impersonated_tenant_name');
    localStorage.removeItem('impersonated_tenant_id');
    localStorage.removeItem('impersonator_email');
    window.location.href = tenantId ? `/platform/tenants/${tenantId}` : '/platform/tenants';
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-300 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
        <span>
          <strong>IMPERSONATION ACTIVE:</strong> You are currently viewing workspace as{' '}
          <strong>{tenantName}</strong> (Super Admin Session).
        </span>
      </div>

      <button
        type="button"
        onClick={handleExit}
        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1 text-[11px] font-bold text-zinc-950 hover:bg-amber-400 transition-all cursor-pointer shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Exit to Master SaaS Admin</span>
      </button>
    </div>
  );
};
