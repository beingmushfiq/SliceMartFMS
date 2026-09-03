import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
  Bell,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
  Search,
  Zap,
  User,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth/authStore';
import { cn } from '../../lib/utils';
import type { NotificationItem } from '../../types/api/notifications';
import { api } from '../../lib/api/client';

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    uuid: 'notif-1',
    user_id: 1,
    type: 'production.batch.qc_passed',
    channel: 'in_app',
    title_key: 'QC Inspection Passed',
    body_key: 'Batch BAT-202608-001 passed final quality audit (98.0% yield).',
    severity: 'success',
    action_url: '/production',
    sent_at: '2026-08-28T10:15:00Z',
    read_at: null,
    created_at: '2026-08-28T10:15:00Z',
  },
  {
    id: 2,
    uuid: 'notif-2',
    user_id: 1,
    type: 'inventory.stock.low_reorder',
    channel: 'in_app',
    title_key: 'Low Stock Reorder Alert',
    body_key: 'Cotton Yarn 30s is below safety stock threshold (50 kg remaining).',
    severity: 'warning',
    action_url: '/inventory',
    sent_at: '2026-08-28T09:30:00Z',
    read_at: null,
    created_at: '2026-08-28T09:30:00Z',
  },
  {
    id: 3,
    uuid: 'notif-3',
    user_id: 1,
    type: 'finance.period.closing_soon',
    channel: 'in_app',
    title_key: 'Fiscal Month Closing Reminder',
    body_key: 'August 2026 accounting period will lock in 3 business days.',
    severity: 'info',
    action_url: '/finance',
    sent_at: '2026-08-27T16:00:00Z',
    read_at: '2026-08-27T17:00:00Z',
    created_at: '2026-08-27T16:00:00Z',
  },
];

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const navigate = useNavigate();
  const { user, branches, activeBranch, switchBranch, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    let ignore = false;
    api.get<{ data: NotificationItem[] } | NotificationItem[]>('/notifications')
      .then((res) => {
        if (!ignore) {
          const raw = res.data as unknown;
          const list = Array.isArray(raw)
            ? (raw as NotificationItem[])
            : (((raw as Record<string, unknown>)?.data as NotificationItem[]) ?? []);
          if (list.length > 0) {
            setNotifications(list);
          }
        }
      })
      .catch(() => {
        // Fallback to rich sample notifications
      });

    return () => {
      ignore = true;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('ui.theme', next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const markAllAsRead = () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: now })));
    api.post('/notifications/read-all').catch(() => {});
  };

  const markSingleRead = (id: number) => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
    api.post(`/notifications/${id}/read`).catch(() => {});
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markSingleRead(notif.id);
    if (notif.action_url) {
      navigate(notif.action_url);
      setIsNotifMenuOpen(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="size-4 text-emerald-500 shrink-0" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="size-4 text-amber-500 shrink-0" aria-hidden="true" />;
      default:
        return <Info className="size-4 text-blue-500 shrink-0" aria-hidden="true" />;
    }
  };

  return (
    <header className="sticky top-0 z-(--z-sticky) flex h-16 w-full items-center justify-between border-b border-default bg-surface/95 px-4 sm:px-6 backdrop-blur-md transition-token-colors">
      {/* Left side: Hamburger + Factory Line Telemetry */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-muted hover:bg-surface-sunken hover:text-default transition-token-colors lg:hidden focus-visible:ring-focus"
          aria-label="Toggle Navigation"
        >
          <Menu className="size-5" />
        </button>

        {/* Branch Selector Dropdown */}
        {branches && branches.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-default bg-surface-raised px-3 py-1.5 text-xs text-default hover:bg-surface-sunken transition-token-colors focus-visible:ring-focus shadow-xs"
            >
              <Building2 className="size-3.5 text-primary" aria-hidden="true" />
              <span className="font-medium">{activeBranch?.name ?? 'Head Office'}</span>
              <ChevronDown className="size-3 text-muted" aria-hidden="true" />
            </button>

            {isBranchMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-default bg-surface-raised p-1.5 shadow-xl z-(--z-popover) animate-fade-in">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Operating Branch
                </div>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      void switchBranch(b.id);
                      setIsBranchMenuOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-token-colors focus-visible:ring-focus',
                      activeBranch?.id === b.id
                        ? 'bg-primary-subtle text-primary font-semibold'
                        : 'text-default hover:bg-surface-sunken'
                    )}
                  >
                    <span>{b.name}</span>
                    {b.is_head_office && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                        HQ
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Search + Notifications + Theme toggle + User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Bar / Command Launcher */}
        <button
          type="button"
          onClick={() => {
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
          }}
          className="hidden md:flex items-center gap-2 rounded-lg border border-default bg-surface-sunken px-3 py-1.5 text-xs text-muted hover:border-slate-400 transition-token-colors"
        >
          <Search className="size-3.5" />
          <span>Quick search...</span>
          <kbd className="rounded border border-default bg-surface px-1.5 py-0.5 text-[10px] font-mono text-muted font-semibold">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
            className="relative rounded-lg p-2 text-muted hover:bg-surface-sunken hover:text-default transition-token-colors focus-visible:ring-focus"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {isNotifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-default bg-surface-raised shadow-2xl z-(--z-popover) overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between border-b border-default px-4 py-3 bg-surface-sunken/40">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-default">Factory Telemetry & Alerts</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:ring-focus"
                  >
                    <Check className="size-3" />
                    Mark read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-default">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        'w-full p-3.5 text-left transition-token-colors cursor-pointer hover:bg-surface-sunken focus-visible:ring-focus outline-none',
                        !notif.read_at ? 'bg-primary-subtle/30' : 'opacity-70'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{getSeverityIcon(notif.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-default">{notif.title_key}</p>
                          <p className="text-[11px] text-muted mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.body_key}
                          </p>
                          <span className="text-[10px] text-muted mt-1 block font-mono">
                            {new Date(notif.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted hover:bg-surface-sunken hover:text-default transition-token-colors focus-visible:ring-focus"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-700" />}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-surface-sunken transition-token-colors focus-visible:ring-focus border border-transparent hover:border-default"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
              {user?.name && user.name.length > 0 ? user.name[0] : 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-semibold text-default leading-tight">{user?.name ?? 'Operator'}</div>
              <div className="text-[10px] text-muted truncate max-w-30">{user?.email}</div>
            </div>
            <ChevronDown className="hidden size-3 text-muted sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-default bg-surface-raised p-1.5 shadow-2xl z-(--z-popover) animate-fade-in">
              <div className="border-b border-default px-3 py-2.5">
                <p className="text-xs font-bold text-default">{user?.name}</p>
                <p className="text-[11px] text-muted truncate">{user?.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-400 border border-blue-500/20">
                  <Zap className="size-2.5" />
                  <span>Factory Operator</span>
                </div>
              </div>

              <div className="mt-1 space-y-0.5">
                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-default hover:bg-surface-sunken transition-token-colors focus-visible:ring-focus"
                >
                  <User className="size-3.5 text-primary" />
                  <span>Profile & Account</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    void logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-500/10 transition-token-colors focus-visible:ring-focus"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

