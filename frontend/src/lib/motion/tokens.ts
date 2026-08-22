// ═══════════════════════════════════════════════════════════════════════════
// MOTION TOKENS — TypeScript mirror                       UI_SYSTEM.md §7.2
// ───────────────────────────────────────────────────────────────────────────
// §7.2 is binding: "Durations and easings are tokens. A developer never types
// a number." CSS honours that directly through `tokens.motion.css`.
//
// Framer Motion cannot. Verified against framer-motion v13.1.0: there is no
// CSS-variable resolution anywhere in its transition pipeline — a `var(...)`
// string passed as a `duration` or `ease` is not read, it is discarded. So the
// values below are a MIRROR of `tokens.motion.css`, not a second source.
//
// DRIFT RULE: these two files change together, in the same commit, always.
// The CSS file is the canonical statement; this file exists only because the
// animation library cannot read it.
//
// Durations are SECONDS here (Framer's unit) and milliseconds there (CSS's).
// ═══════════════════════════════════════════════════════════════════════════

/** Seconds. Mirrors `--motion-duration-*`. Hard ceiling 0.4s for anything that
 *  blocks interaction; only `deliberate` may exceed it (§7.2). */
export const duration = {
  instant: 0.08,
  fast: 0.15,
  base: 0.24,
  slow: 0.38,
  deliberate: 0.6,
} as const;

/** Cubic-bezier control points. Mirrors `--motion-ease-*`.
 *  `overshoot` is boot-loader and success-celebration only (§7.2). */
export const ease = {
  standard: [0.2, 0, 0, 1],
  entrance: [0.05, 0.7, 0.1, 1],
  exit: [0.3, 0, 0.8, 0.15],
  emphasis: [0.3, 0, 0, 1],
  overshoot: [0.34, 1.56, 0.64, 1],
} as const;

/** Pixels. Mirrors `--motion-distance-*`. */
export const distance = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
} as const;

/** Seconds. Mirrors `--motion-stagger`. Capped at the first 12 siblings (§7.4). */
export const stagger = 0.04;

/** Mirrors the craft constants of `tokens.motion.css`. */
export const craft = {
  pressScale: 0.98,
  hoverScale: 1.04,
  hoverLift: -1,
  modalScaleFrom: 0.98,
} as const;

/* ───────────────────────────────────────────────────────────────────────────
   Ready-made transitions for the pairing §7.2 mandates: entrances are slower
   than exits, entrance decelerates, exit accelerates. Exported so a component
   writes `transition={enterBase}` rather than assembling a duration and a
   curve and getting the pairing backwards.
   ─────────────────────────────────────────────────────────────────────────── */

export const enterBase = { duration: duration.base, ease: ease.entrance } as const;
export const exitFast = { duration: duration.fast, ease: ease.exit } as const;
export const enterFast = { duration: duration.fast, ease: ease.entrance } as const;
export const exitInstant = { duration: duration.instant, ease: ease.exit } as const;

/* ───────────────────────────────────────────────────────────────────────────
   Reduced motion — read, never decided here.

   The pre-paint script in index.html has already reconciled the stored user
   preference with the OS setting and written the result to
   `<html data-reduced-motion="true">`. Reading that attribute is therefore the
   single source of truth, and it is correct on the first frame. A component
   that calls `matchMedia` itself would disagree with the DOM whenever the
   stored preference overrides the OS (§7.6 rule 2).

   Only GSAP needs this: Framer Motion is configured once at the provider
   (§7.6 rule 1) and CSS collapses its own tokens.
   ─────────────────────────────────────────────────────────────────────────── */
export function prefersReducedMotion(): boolean {
  return document.documentElement.getAttribute('data-reduced-motion') === 'true';
}
