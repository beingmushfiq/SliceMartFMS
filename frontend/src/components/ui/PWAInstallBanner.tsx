// ─────────────────────────────────────────────────────────────
// PWA INSTALL BANNER & OFFLINE DETECTOR
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, WifiOff, X, Sparkles } from 'lucide-react';
import { promptPWAInstall, isPWAInstallable } from '../../registerSW';
import { Button } from './Button';

export function PWAInstallBanner() {
  const [canInstall, setCanInstall] = useState(false);
  const [isOffline,   setIsOffline]   = useState(!navigator.onLine);
  const [dismissed,   setDismissed]   = useState(false);

  useEffect(() => {
    // Check if installable
    const handleInstallAvail = () => {
      setCanInstall(isPWAInstallable());
    };
    window.addEventListener('pwa-install-available', handleInstallAvail);

    // Online / Offline handlers
    const handleOnline  = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvail);
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    const accepted = await promptPWAInstall();
    if (accepted) {
      setCanInstall(false);
    }
  };

  return (
    <>
      {/* Offline Status Pill */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-error-600 text-white
                       rounded-full shadow-lg text-xs font-500 flex items-center gap-1.5"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Working Offline (Local Cached Data)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {canInstall && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-sm bg-navy-900 text-white
                       p-4 rounded-xl shadow-2xl border border-white/10 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-600 text-white leading-tight">Install Slice Mart FMS</p>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                Add to your home screen for quick offline access, full-screen view & faster factory operations.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="primary" size="xs" onClick={handleInstall} leftIcon={<Download className="w-3 h-3" />}>
                  Install App
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setDismissed(true)} className="text-slate-400 hover:text-white">
                  Maybe Later
                </Button>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 -mr-1 -mt-1"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
