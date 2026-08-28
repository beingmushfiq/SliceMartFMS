import { useState } from 'react';
import {
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
  User as UserIcon,
  Bell,
  Check,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth/authStore';
import { cn } from '../../lib/utils';
import type { NotificationItem } from '../../types/api/notifications';

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
  const { user, tenant, branches, activeBranch, switchBranch, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
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
  };

  const markSingleRead = (id: number) => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="size-4 text-success shrink-0" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="size-4 text-warning shrink-0" aria-hidden="true" />;
      default:
        return <Info className="size-4 text-info shrink-0" aria-hidden="true" />;
    }
  };

  return (
    <header className="sticky top-0 z-(--z-sticky) flex h-16 w-full items-center justify-between border-b border-default bg-surface/90 px-(--page-padding-mobile) sm:px-(--page-header-px) backdrop-blur-md transition-token-colors">
      {/* Left side: Hamburger + Tenant info */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-sm p-2 text-muted hover:bg-surface-sunken hover:text-default transition-token-colors lg:hidden focus-visible:ring-focus"
          aria-label="Toggle Navigation"
        >
          <Menu className="size-5" />
        </button>

        {tenant && (
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-sm bg-primary-subtle text-primary font-bold text-xs uppercase">
              {tenant.name.slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold text-default">{tenant.name}</span>
              <span className="ml-2 rounded-md bg-surface-sunken border border-default px-1.5 py-0.5 text-2xs font-mono font-medium text-muted">
                {tenant.currency_code}
              </span>
            </div>
          </div>
        )}

        {/* Branch Selector Dropdown */}
        {branches && branches.length > 1 && (
          <div className="relative ml-2">
            <button
              type="button"
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className="flex items-center gap-1.5 rounded-sm border border-default bg-surface-raised px-2.5 py-1.5 text-xs text-default hover:bg-surface-sunken transition-token-colors focus-visible:ring-focus"
            >
              <Building2 className="size-3.5 text-muted" aria-hidden="true" />
              <span>{activeBranch?.name ?? 'Select Branch'}</span>
              <ChevronDown className="size-3 text-muted" aria-hidden="true" />
            </button>

            {isBranchMenuOpen && (
              <div className="absolute left-0 mt-2 w-52 rounded-(--popover-radius) border border-default bg-surface-raised p-1 shadow-overlay z-(--z-popover) animate-fade-in">
                <div className="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted">
                  Switch Branch
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
                      'flex w-full items-center justify-between rounded-xs px-2.5 py-1.5 text-left text-xs transition-token-colors focus-visible:ring-focus',
                      activeBranch?.id === b.id
                        ? 'bg-primary-subtle text-primary font-semibold'
                        : 'text-default hover:bg-surface-sunken'
                    )}
                  >
                    <span>{b.name}</span>
                    {b.is_head_office && (
                      <span className="text-2xs text-muted uppercase font-bold">HQ</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Notifications + Theme toggle + User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
            className="relative rounded-sm p-2 text-muted hover:bg-surface-sunken hover:text-default transition-token-colors focus-visible:ring-focus"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-danger"></span>
              </span>
            )}
          </button>

          {isNotifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-(--popover-radius) border border-default bg-surface-raised shadow-overlay z-(--z-popover) overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between border-b border-default px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-default">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-danger-subtle text-danger border border-danger px-2 py-0.5 text-2xs font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-2xs font-medium text-primary hover:underline flex items-center gap-1 focus-visible:ring-focus rounded-md"
                  >
                    <Check className="size-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-default">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markSingleRead(notif.id)}
                      className={cn(
                        'p-3.5 text-left transition-token-colors cursor-pointer hover:bg-surface-sunken',
                        !notif.read_at ? 'bg-primary-subtle/40' : 'opacity-70'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{getSeverityIcon(notif.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-default">{notif.title_key}</p>
                          <p className="text-2xs text-muted mt-0.5 line-clamp-2">
                            {notif.body_key}
                          </p>
                          <span className="text-2xs text-subtle mt-1 block font-mono">
                            {new Date(notif.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
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
          className="rounded-sm p-2 text-muted hover:bg-surface-sunken hover:text-default transition-token-colors focus-visible:ring-focus"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-sm p-1.5 hover:bg-surface-sunken transition-token-colors focus-visible:ring-focus"
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-surface-sunken border border-default text-default">
              <UserIcon className="size-3.5 text-muted" />
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-medium text-default leading-tight">{user?.name ?? 'User'}</div>
              <div className="text-2xs text-muted truncate max-w-30">{user?.email}</div>
            </div>
            <ChevronDown className="hidden size-3 text-muted sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-(--popover-radius) border border-default bg-surface-raised p-1.5 shadow-overlay z-(--z-popover) animate-fade-in">
              <div className="border-b border-default px-3 py-2">
                <p className="text-xs font-semibold text-default">{user?.name}</p>
                <p className="text-2xs text-muted truncate">{user?.email}</p>
              </div>

              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    void logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-left text-xs text-danger hover:bg-danger-subtle transition-token-colors focus-visible:ring-focus"
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
