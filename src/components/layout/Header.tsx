// ─────────────────────────────────────────────────────────────
// HEADER — Top application bar (Fully Responsive)
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, Search, ChevronDown,
  Plus, Package, ShoppingCart, Factory,
  ArrowLeftRight, ClipboardList, Wallet,
  LogOut, Settings, X, Terminal,
} from 'lucide-react';
import { cn, timeAgo } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { ErrorLogInspectorModal } from '../ErrorBoundary';

const QUICK_ACTIONS = [
  { label: 'New Production Order', icon: <Factory className="w-3.5 h-3.5" />, to: '/production/orders' },
  { label: 'New Purchase',         icon: <ShoppingCart className="w-3.5 h-3.5" />, to: '/procurement/orders' },
  { label: 'New Sale',             icon: <ClipboardList className="w-3.5 h-3.5" />, to: '/sales/new' },
  { label: 'Add Product',          icon: <Package className="w-3.5 h-3.5" />, to: '/production/bom' },
  { label: 'Stock Transfer',       icon: <ArrowLeftRight className="w-3.5 h-3.5" />, to: '/warehouse/transfers' },
  { label: 'Add Expense',          icon: <Wallet className="w-3.5 h-3.5" />, to: '/finance/expenses' },
];

export function Header() {
  const navigate = useNavigate();
  const toggleSidebar = useAppStore(s => s.toggleSidebar);
  const toggleMobileSidebar = useAppStore(s => s.toggleMobileSidebar);
  const notifications = useAppStore(s => s.notifications);
  const unreadCount   = useAppStore(s => s.unreadCount);
  const markAsRead    = useAppStore(s => s.markAsRead);
  const markAllRead   = useAppStore(s => s.markAllRead);

  const [notifOpen,       setNotifOpen]       = useState(false);
  const [quickActOpen,    setQuickActOpen]     = useState(false);
  const [profileOpen,     setProfileOpen]      = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery,      setSearchQuery]       = useState('');
  const [diagnosticsOpen,  setDiagnosticsOpen]   = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const quickRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickActOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/inventory?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setMobileSearchOpen(false);
  };

  const recentNotifs = notifications.slice(0, 5);

  const priorityColor: Record<string, string> = {
    critical: 'bg-error-500',
    high:     'bg-warning-500',
    medium:   'bg-blue-500',
    low:      'bg-slate-400',
  };

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200
                       px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Left — Toggle & Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg">
        <button
          onClick={handleMenuClick}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600
                     hover:bg-slate-200/70 hover:text-slate-900 transition-colors duration-150 cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Global Search — hidden on mobile */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-sm relative">
          <label htmlFor="global-search" className="sr-only">Search</label>
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            id="global-search"
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products, orders, batches... (Enter)"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 text-slate-900 rounded-lg
                       border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
          />
        </form>

        {/* Factory Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-2xs font-600 text-emerald-700 tracking-wide uppercase">Operational</span>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">

        {/* Mobile Search Button (< md) */}
        <button
          onClick={() => setMobileSearchOpen(v => !v)}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-600
                     hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick Actions */}
        <div ref={quickRef} className="relative">
          <button
            onClick={() => setQuickActOpen(v => !v)}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-600
                       bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800
                       transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md active:scale-98"
            aria-haspopup="true"
            aria-expanded={quickActOpen}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Quick Add</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" aria-hidden="true" />
          </button>

          <AnimatePresence>
            {quickActOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200
                           rounded-xl shadow-xl py-1.5 z-50 overflow-hidden"
              >
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.label}
                    onClick={() => { navigate(action.to); setQuickActOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-500 text-slate-700
                               hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 cursor-pointer text-left"
                  >
                    <span className="text-slate-400" aria-hidden="true">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-600
                       hover:bg-slate-100 hover:text-slate-900 transition-colors duration-150 cursor-pointer"
            aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
            aria-haspopup="true"
            aria-expanded={notifOpen}
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-2xs
                               font-700 rounded-full flex items-center justify-center animate-pulse" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full mt-1.5 w-[calc(100vw-16px)] sm:w-96 bg-white
                           border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-700 text-slate-900 uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-2xs font-700 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-500 cursor-pointer transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {recentNotifs.length === 0 ? (
                    <li className="px-4 py-8 text-center text-xs text-slate-400">
                      All caught up! No unread notifications.
                    </li>
                  ) : (
                    recentNotifs.map(n => (
                      <li
                        key={n.id}
                        className={cn(
                          'px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors duration-150',
                          !n.isRead && 'bg-blue-50/30'
                        )}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.relatedModule) navigate(`/${n.relatedModule}`);
                          setNotifOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-1.5 shrink-0',
                            priorityColor[n.priority]
                          )} aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-xs leading-snug',
                              n.isRead ? 'text-slate-600 font-400' : 'text-slate-900 font-600'
                            )}>
                              {n.title}
                            </p>
                            <p className="text-2xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-2xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>

                {/* View all */}
                <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50">
                  <button
                    onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                    className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-600 cursor-pointer transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg
                       hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
            aria-haspopup="true"
            aria-expanded={profileOpen}
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-full bg-navy-900 border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-700 text-white">SR</span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-600 text-slate-900 leading-tight">Sohel Rana</p>
              <p className="text-2xs text-slate-400 leading-tight">Factory Manager</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:block" aria-hidden="true" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200
                           rounded-xl shadow-xl py-1.5 z-50 overflow-hidden"
              >
                <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-700 text-slate-900">Sohel Rana</p>
                  <p className="text-2xs text-slate-500 font-mono truncate">sohel@slicemart.com</p>
                </div>
                <button
                  onClick={() => { navigate('/admin/settings'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700
                             hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  Settings
                </button>
                <button
                  onClick={() => { setDiagnosticsOpen(true); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700
                             hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                  System Diagnostics
                </button>
                <div className="border-t border-slate-100 mt-1">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-error-600
                               hover:bg-error-50 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Search Overlay (< md) */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-0 right-0 p-3 bg-white border-b border-slate-200 shadow-md z-40"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="search"
                  autoFocus
                  placeholder="Search products, orders, items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Diagnostics & Error Log Inspector Modal */}
      <ErrorLogInspectorModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
      />
    </header>
  );
}
