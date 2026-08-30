import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  User as UserIcon,
  Eye,
  CheckCircle2,
  X,
} from 'lucide-react';
import { api } from '../../lib/api/client';
import { Button } from '../ui/Button';
import { VersionDiffModal, type AuditLogEntry } from './VersionDiffModal';

interface EntityHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: number | string;
  entityTitle?: string;
}

export const EntityHistoryDrawer: React.FC<EntityHistoryDrawerProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLogForDiff, setSelectedLogForDiff] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    if (!isOpen || !entityType || !entityId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const cleanType = entityType.replace(/^App\\Models\\/, '').replace(/^App\\Modules\\[^\\]+\\Models\\/, '');
        const res = await api.get<{ data: AuditLogEntry[] }>(`/audit-logs/entity/${cleanType}/${entityId}`);
        setLogs(res.data.data ?? []);
      } catch (err) {
        console.error('Failed to load entity audit history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, entityType, entityId]);

  if (!isOpen) return null;

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('store')) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    if (act.includes('update') || act.includes('edit')) {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    if (act.includes('delete') || act.includes('destroy') || act.includes('void')) {
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
    if (act.includes('approve') || act.includes('verify')) {
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
    return 'bg-surface-sunken text-muted border-default';
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-fade-in flex justify-end">
        <div className="w-full max-w-xl bg-surface border-l border-default h-full shadow-2xl flex flex-col justify-between animate-slide-left">
          {/* Header */}
          <div className="p-5 border-b border-default flex items-center justify-between bg-surface-sunken">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
                <History className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-default">
                  {entityTitle || `${entityType} History`}
                </h3>
                <span className="font-mono text-[11px] text-muted block">
                  {entityType} #{entityId} • {logs.length} logged mutations
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:text-default hover:bg-surface transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Timeline Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl border border-default bg-surface-sunken p-8 text-center space-y-2">
                <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-default">Initial State Only</h4>
                <p className="text-xs text-muted">
                  No edit mutations or version differences recorded for this item yet.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-default">
                {logs.map((log, idx) => {
                  const changedCount = log.changed_fields?.length ?? 0;

                  return (
                    <div key={log.id || idx} className="relative space-y-2">
                      {/* Timeline Node Bullet */}
                      <div className="absolute -left-6 flex size-5 items-center justify-center rounded-full bg-surface border-2 border-emerald-500 text-[10px] font-bold text-emerald-500">
                        {logs.length - idx}
                      </div>

                      {/* Card Content */}
                      <div className="rounded-xl border border-default bg-surface-sunken p-4 space-y-3 shadow-2xs hover:border-primary/40 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getActionColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>

                          <span className="font-mono text-[10px] text-muted flex items-center gap-1">
                            <Clock className="size-3" />
                            {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex items-center gap-1.5 text-default font-medium">
                            <UserIcon className="size-3 text-muted" />
                            <span>{log.user?.name || (log.user_id ? `User #${log.user_id}` : 'System Task')}</span>
                          </div>

                          {changedCount > 0 && (
                            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {changedCount} fields changed
                            </span>
                          )}
                        </div>

                        {log.changed_fields && log.changed_fields.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            {log.changed_fields.slice(0, 4).map((f) => (
                              <span
                                key={f}
                                className="font-mono text-[9px] bg-surface text-muted px-1.5 py-0.5 rounded border border-default"
                              >
                                {f}
                              </span>
                            ))}
                            {log.changed_fields.length > 4 && (
                              <span className="text-[9px] text-muted">
                                +{log.changed_fields.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="pt-2 border-t border-default/60 flex justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedLogForDiff(log)}
                            className="text-[11px] h-7 px-2"
                          >
                            <Eye className="size-3 mr-1" />
                            <span>View Version Diff</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-default bg-surface flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close History Drawer
            </Button>
          </div>
        </div>
      </div>

      {/* Embedded Diff Modal */}
      {selectedLogForDiff && (
        <VersionDiffModal
          isOpen={!!selectedLogForDiff}
          onClose={() => setSelectedLogForDiff(null)}
          log={selectedLogForDiff}
        />
      )}
    </>
  );
};
