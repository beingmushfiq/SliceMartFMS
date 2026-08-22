import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import type { ReducedMotionConfig } from 'framer-motion';

import './styles/index.css';
import App from './App';
import { bootFail, bootStep } from './app/boot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installGlobalErrorHandlers } from './lib/observability/logger';
import { registerServiceWorker } from './registerSW';
import { prefersReducedMotion } from './lib/motion/tokens';

/* The module graph has executed. Second real milestone on the boot rail. */
bootStep('scripts');

/* §8.4: global error handlers must be installed before React mounts so they
   catch errors from the boot path and from event handlers/timers outside the
   React call stack. Idempotent — safe to call once. */
installGlobalErrorHandlers();

/* §7.6 rule 1 — reduced motion is resolved once, globally, at the provider
   level. The pre-paint script in index.html has already reconciled the stored
   user preference with the OS setting and written the result to
   <html data-reduced-motion>. We read that once here; individual components
   never re-check.

   'always' | 'never', deliberately not Framer's 'user'. 'user' would delegate
   the decision back to `matchMedia`, which §7.6 rule 2 forbids: a stored
   preference must override the OS in BOTH directions, including a user who
   explicitly opts *in* to motion on a device that requests less of it. */
const reducedMotion: ReducedMotionConfig = prefersReducedMotion() ? 'always' : 'never';

const container = document.getElementById('root');

if (!container) {
  /* The mount point is missing, which means index.html was tampered with or a
     proxy mangled the response. There is no React to render an error with, so
     the boot loader becomes the error surface. */
  bootFail('The application could not start. Please reload the page.');
} else {
  createRoot(container).render(
    <StrictMode>
      <MotionConfig reducedMotion={reducedMotion}>
        <LazyMotion features={domAnimation}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </LazyMotion>
      </MotionConfig>
    </StrictMode>
  );

  /* Registered after mount, never before. A service worker that installs while
     the shell is still booting competes for the same connection budget. */
  registerServiceWorker();
}
