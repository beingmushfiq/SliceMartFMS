// ═══════════════════════════════════════════════════════════════════════════
// USE GSAP — Lazy-loaded GSAP hook                  UI_SYSTEM.md §7, ADR-031
// ───────────────────────────────────────────────────────────────────────────
// GSAP is code-split out of the critical bundle (§7.6 rule 6). It is imported
// dynamically on first use and cached for the session. Each route/component
// that uses GSAP creates a `gsap.context()` and reverts it on unmount, so
// animations never leak across route transitions.
//
// Reduced motion is read once from <html data-reduced-motion> (§7.6 rule 2)
// and sets GSAP's global duration to 0 when active.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './tokens';

let gsapModule: typeof import('gsap').default | null = null;
let gsapLoadPromise: Promise<typeof import('gsap').default> | null = null;

async function loadGsap() {
  if (gsapModule) return gsapModule;
  if (!gsapLoadPromise) {
    gsapLoadPromise = import('gsap').then((mod) => {
      gsapModule = mod.default;
      if (prefersReducedMotion()) {
        gsapModule.globalTimeline.duration(0);
      }
      return gsapModule;
    });
  }
  return gsapLoadPromise;
}

export function useGsap(
  callback: (gsap: typeof import('gsap').default, scope: HTMLElement | null) => void,
  deps: React.DependencyList
): React.RefObject<HTMLElement | null> {
  const scopeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = scopeRef.current;
    let ctx: gsap.Context | null = null;
    let cancelled = false;

    loadGsap().then((gsap) => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        callback(gsap, el);
      }, el ?? undefined);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scopeRef;
}
