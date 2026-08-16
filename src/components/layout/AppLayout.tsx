// ─────────────────────────────────────────────────────────────
// APP LAYOUT — Main responsive shell wrapping sidebar + header + bottom nav
// ─────────────────────────────────────────────────────────────

import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { PWAInstallBanner } from '../ui/PWAInstallBanner';
import { ErrorBoundary } from '../ErrorBoundary';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.12, ease: 'easeIn' as const } },
};

export function AppLayout() {
  const collapsed = useAppStore(s => s.sidebarCollapsed);
  const location  = useLocation();
  const outlet    = useOutlet();

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col">
      {/* Skip link for keyboard accessibility */}
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50">
        Skip to main content
      </a>

      {/* Sidebar (Fixed on Desktop, Slide-over Drawer on Mobile) */}
      <Sidebar />

      {/* Main Content Container */}
      <div
        className={cn(
          'min-h-screen flex-1 flex flex-col transition-[margin] duration-300 ease-in-out',
          // Desktop margins:
          collapsed ? 'md:ml-16' : 'md:ml-64',
          // Mobile margin reset:
          'ml-0'
        )}
      >
        {/* Top Header */}
        <Header />

        {/* Dynamic Page content */}
        <main
          id="main-content"
          className="flex-1 p-3.5 sm:p-5 lg:p-6 pb-20 md:pb-6 overflow-x-hidden"
        >
          <ErrorBoundary>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <BottomNav />

      {/* PWA Install & Offline Banner */}
      <PWAInstallBanner />
    </div>
  );
}
