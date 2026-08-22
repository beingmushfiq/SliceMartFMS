// ─────────────────────────────────────────────────────────────
// SERVICE WORKER REGISTRATION & PWA HOOKS
// ─────────────────────────────────────────────────────────────

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[App] ServiceWorker registration failed:', error);
        });
    });
  } else if ('serviceWorker' in navigator) {
    // Also register in dev preview mode if supported
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

// Global hook for beforeinstallprompt
let deferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event('pwa-install-available'));
  });
}

export function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) return Promise.resolve(false);
  deferredPrompt.prompt();
  return deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
    const installed = choiceResult.outcome === 'accepted';
    deferredPrompt = null;
    return installed;
  });
}

export function isPWAInstallable(): boolean {
  return Boolean(deferredPrompt);
}
