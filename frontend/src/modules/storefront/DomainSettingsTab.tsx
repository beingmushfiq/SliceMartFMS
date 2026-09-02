import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  Check,
  Sparkles,
  Server,
  Lock
} from 'lucide-react';
import { api } from '../../lib/api/client';
import type { TenantDomainRecord } from '../../types/api/domains';

export const DomainSettingsTab: React.FC = () => {
  const [domains, setDomains] = useState<TenantDomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Domain Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Verification & Action States
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedInstructionDomain, setSelectedInstructionDomain] = useState<TenantDomainRecord | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<TenantDomainRecord[]>('/storefront/domains');
      if (Array.isArray(res.data)) {
        setDomains(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load domains');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadInitialDomains = async () => {
      try {
        const res = await api.get<TenantDomainRecord[]>('/storefront/domains');
        if (isMounted && Array.isArray(res.data)) {
          setDomains(res.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load domains');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    void loadInitialDomains();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    try {
      setIsSubmitting(true);
      setAddError(null);
      const res = await api.post<TenantDomainRecord>(
        '/storefront/domains',
        { domain: newDomain.trim(), type: 'custom_alias' }
      );

      if (res.data) {
        setShowAddModal(false);
        setNewDomain('');
        setSuccessMsg('Custom domain registered. Please configure your DNS.');
        setSelectedInstructionDomain(res.data);
        await fetchDomains();
      }
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDomain = async (id: number) => {
    try {
      setVerifyingId(id);
      setError(null);
      const res = await api.post<TenantDomainRecord>(
        `/storefront/domains/${id}/verify`
      );

      if (res.data) {
        setSuccessMsg('Domain verified successfully!');
        await fetchDomains();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'DNS verification failed. Check DNS records.');
      await fetchDomains();
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      setSettingPrimaryId(id);
      setError(null);
      const res = await api.post<{ success: boolean; message: string }>(
        `/storefront/domains/${id}/set-primary`
      );

      if (res.data) {
        setSuccessMsg('Primary domain updated.');
        await fetchDomains();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set primary domain');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const handleDeleteDomain = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this custom domain?')) return;

    try {
      setDeletingId(id);
      setError(null);
      await api.delete(`/storefront/domains/${id}`);
      setSuccessMsg('Custom domain removed.');
      await fetchDomains();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain');
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const primaryDomain = domains.find((d) => d.is_primary);

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between text-sm shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between text-sm shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 font-bold text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {/* Header & Primary Domain Status Banner */}
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Live Storefront Routing
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Globe className="w-7 h-7 text-indigo-400" />
              Storefront Custom Domains
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl">
              Connect your branded custom domain (e.g.{' '}
              <span className="text-indigo-300 font-mono font-medium">slicemart.tech</span>) or use your default platform
              subdomain. All domains feature automated edge SSL certificate provisioning and global Anycast routing.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-indigo-500/25 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Custom Domain
            </button>
            <button
              onClick={fetchDomains}
              disabled={loading}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
              title="Refresh domains"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Active Canonical Domain Status */}
        {primaryDomain && (
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Active Canonical Storefront URL</div>
                <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  https://{primaryDomain.domain}
                  <a
                    href={`https://${primaryDomain.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-indigo-300 inline-flex items-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified & Live
              </span>
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Edge SSL Active
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Domain Cards List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Connected Storefront Hostnames</h3>
            <p className="text-slate-500 text-xs mt-0.5">Manage domain verification, primary routing, and DNS configuration.</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {domains.length} {domains.length === 1 ? 'Domain' : 'Domains'} Registered
          </span>
        </div>

        {loading && domains.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Checking registered domains...</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">No custom domains configured yet.</p>
            <p className="text-xs text-slate-400 mt-1">Add your branded domain to personalize your storefront web address.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {domains.map((dom) => (
              <div key={dom.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-base font-mono">{dom.domain}</span>

                    {dom.is_primary && (
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-xs font-bold tracking-wide">
                        ● Primary Domain
                      </span>
                    )}

                    {dom.type === 'platform_subdomain' ? (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                        Platform Default
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-xs font-medium">
                        Custom Domain
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    {/* Verification Status */}
                    <span className="flex items-center gap-1">
                      Status:
                      {dom.verification_status === 'verified' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                      ) : dom.verification_status === 'pending' ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending DNS Propagation
                        </span>
                      ) : (
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          DNS Check Failed
                        </span>
                      )}
                    </span>

                    <span>•</span>

                    {/* SSL Status */}
                    <span className="flex items-center gap-1">
                      SSL:
                      {dom.ssl_status === 'active' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-emerald-600" />
                          Active (Cloudflare)
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Provisioning</span>
                      )}
                    </span>

                    {dom.verified_at && (
                      <>
                        <span>•</span>
                        <span>Verified: {new Date(dom.verified_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {dom.type !== 'platform_subdomain' && (
                    <button
                      onClick={() => setSelectedInstructionDomain(dom)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Server className="w-3.5 h-3.5" />
                      DNS Instructions
                    </button>
                  )}

                  {dom.verification_status !== 'verified' && (
                    <button
                      onClick={() => handleVerifyDomain(dom.id)}
                      disabled={verifyingId === dom.id}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === dom.id ? 'animate-spin' : ''}`} />
                      {verifyingId === dom.id ? 'Verifying...' : 'Verify DNS'}
                    </button>
                  )}

                  {dom.verification_status === 'verified' && !dom.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(dom.id)}
                      disabled={settingPrimaryId === dom.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {settingPrimaryId === dom.id ? 'Setting...' : 'Set as Primary'}
                    </button>
                  )}

                  {dom.type !== 'platform_subdomain' && (
                    <button
                      onClick={() => handleDeleteDomain(dom.id)}
                      disabled={deletingId === dom.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove domain"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DNS Configuration Instructions Modal */}
      {selectedInstructionDomain && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">DNS Configuration Instructions</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedInstructionDomain.domain}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInstructionDomain(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              <p className="text-slate-600 text-xs leading-relaxed">
                Log in to your domain registrar or DNS provider (e.g.{' '}
                <span className="font-semibold text-slate-800">Cloudflare, GoDaddy, Namecheap, Route53</span>) and add the
                following DNS records:
              </p>

              {/* TXT Verification Record */}
              {selectedInstructionDomain.dns_records_expected?.txt_record && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      1. Ownership Verification Record (TXT)
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-xs font-semibold rounded">
                      TXT Record
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">Host / Name:</span>
                      <div className="mt-1 flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 font-mono font-bold text-slate-800">
                        <span className="truncate">{selectedInstructionDomain.dns_records_expected.txt_record.host}</span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              selectedInstructionDomain.dns_records_expected!.txt_record!.host,
                              'txt_host'
                            )
                          }
                          className="text-slate-400 hover:text-indigo-600 ml-2"
                        >
                          {copiedKey === 'txt_host' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block">Value / Content:</span>
                      <div className="mt-1 flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 font-mono font-bold text-slate-800">
                        <span className="truncate">{selectedInstructionDomain.dns_records_expected.txt_record.value}</span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              selectedInstructionDomain.dns_records_expected!.txt_record!.value,
                              'txt_value'
                            )
                          }
                          className="text-slate-400 hover:text-indigo-600 ml-2"
                        >
                          {copiedKey === 'txt_value' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CNAME Routing Record */}
              {selectedInstructionDomain.dns_records_expected?.cname_record && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      2. Traffic Routing Record (CNAME)
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-xs font-semibold rounded">
                      CNAME Record
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">Host / Subdomain:</span>
                      <div className="mt-1 flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 font-mono font-bold text-slate-800">
                        <span className="truncate">{selectedInstructionDomain.dns_records_expected.cname_record.host}</span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              selectedInstructionDomain.dns_records_expected!.cname_record!.host,
                              'cname_host'
                            )
                          }
                          className="text-slate-400 hover:text-indigo-600 ml-2"
                        >
                          {copiedKey === 'cname_host' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium block">Points To / Target:</span>
                      <div className="mt-1 flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 font-mono font-bold text-slate-800">
                        <span className="truncate">{selectedInstructionDomain.dns_records_expected.cname_record.value}</span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              selectedInstructionDomain.dns_records_expected!.cname_record!.value,
                              'cname_value'
                            )
                          }
                          className="text-slate-400 hover:text-indigo-600 ml-2"
                        >
                          {copiedKey === 'cname_value' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>DNS changes typically take 1 to 15 minutes to propagate worldwide.</span>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedInstructionDomain(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedInstructionDomain.id;
                  setSelectedInstructionDomain(null);
                  handleVerifyDomain(id);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Check DNS & Verify Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Connect Custom Domain</h3>
                  <p className="text-xs text-slate-500">Add a custom domain or subdomain for your storefront</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDomain} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Domain Name (FQDN)
                </label>
                <input
                  type="text"
                  placeholder="e.g. slicemart.tech or shop.slicemart.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono outline-hidden"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Enter your domain without http:// or https:// (e.g.{' '}
                  <span className="font-mono text-slate-700">slicemart.tech</span>)
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-indigo-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Automatic Cloudflare Edge SSL
                </div>
                <p className="text-slate-600">
                  Once verified, a dedicated SSL certificate will be issued automatically for your domain with HTTPS
                  redirection.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newDomain.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isSubmitting ? 'Registering...' : 'Add Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
